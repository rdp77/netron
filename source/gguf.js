
import * as base from './base.js';

const gguf = {};

gguf.ModelFactory = class {

    match(context) {
        const reader = gguf.Reader.open(context.stream);
        if (reader) {
            context.type = 'gguf';
            context.target = reader;
        }
    }

    async open(context) {
        const target = context.target;
        target.read();
        return new gguf.Model(target);
    }
};

gguf.Model = class {

    constructor(target) {
        this.format = target.format;
        this.metadata = new Map();
        const layers = new Map();
        for (const [name, tensor] of target.tensors) {
            const [key, param] = name.match(/^(.*)\.(.*?)$/).slice(1);
            if (!layers.has(key)) {
                layers.set(key, { name: key, type: 'weights', metadata: new Map(), weights: new Map() });
            }
            const layer = layers.get(key);
            layer.weights.set(param, tensor);
        }
        const metadata = new Map();
        let architecture = '?';
        for (const [name, value] of target.metadata) {
            switch (name) {
                case 'general.name': this.name = value; break;
                case 'general.architecture': architecture = value; break;
                case 'general.description': this.description = value; break;
                case 'general.author': this.metadata.set('author', value); break;
                case 'general.license': this.metadata.set('license', value); break;
                case 'general.file_type':
                case 'general.quantization_version':
                    break;
                default:
                    metadata.set(name, value);
                    break;
            }
        }
        const tokenizer = { type: 'tokenizer', metadata: new Map(), layers: [] };
        const model = { type: architecture, metadata: new Map(), layers: Array.from(layers.values()) };
        for (const [name, value] of metadata) {
            if (name.startsWith('tokenizer.')) {
                const [, param] = name.match(/^(.*)\.(.*?)$/).slice(1);
                tokenizer.metadata.set(param, value);
            } else if (architecture && name.startsWith(`${architecture}.`)) {
                model.metadata.set(name, value);
            } else {
                this.metadata.set(name, value);
            }
        }
        const graph = { layers: [ model ] };
        if (tokenizer.metadata.size > 0) {
            graph.layers.push(tokenizer);
        }
        this.graphs = [ new gguf.Graph(graph) ];
    }
};

gguf.Graph = class {

    constructor(graph) {
        this.name = graph.type;
        this.nodes = [];
        this.inputs = [];
        this.outputs = [];
        for (const layer of graph.layers) {
            const node = new gguf.Node(layer);
            this.nodes.push(node);
        }
    }
};

gguf.Argument = class {

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
};

gguf.Value = class {

    constructor(name, tensor) {
        this.name = name;
        this.type = tensor.type;
        this.quantization = tensor.quantization;
        this.initializer = tensor;
    }
};

gguf.Node = class {

    constructor(layer) {
        this.type = Array.isArray(layer.layers) && layer.layers.length > 0 ? new gguf.Graph(layer) : { name: layer.type };
        this.name = layer.name || '';
        this.inputs = [];
        this.outputs = [];
        this.attributes = [];
        if (layer.weights) {
            for (const [name, weight] of layer.weights) {
                const tensor = new gguf.Tensor(weight);
                const value = new gguf.Value(weight.name, tensor);
                const argument = new gguf.Argument(name, [ value ]);
                this.inputs.push(argument);
            }
        }
        if (layer.metadata) {
            for (const [name, value] of layer.metadata) {
                const attribute = new gguf.Attribute(name, value);
                this.attributes.push(attribute);
            }
        }
    }
};

gguf.Attribute = class {

    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
};

gguf.TensorType = class {

    constructor(dataType, shape) {
        this.dataType = dataType;
        this.shape = shape;
    }

    toString() {
        return (this.dataType || '?') + this.shape.toString();
    }
};

gguf.TensorShape = class {

    constructor(dimensions) {
        this.dimensions = dimensions;
    }

    toString() {
        return `[${this.dimensions.map((dimension) => dimension.toString()).join(',')}]`;
    }
};

gguf.Tensor = class {

    constructor(tensor) {
        const shape = new gguf.TensorShape(tensor.ne);
        this.type = new gguf.TensorType(tensor.dtype, shape);
        if (tensor.type !== gguf.QuantizationType.F32 && tensor.type !== gguf.QuantizationType.F16) {
            this.quantization = {
                type: gguf.Utility.enum(gguf.QuantizationType, tensor.type).toLowerCase()
            };
        }
        if (tensor.dtype === 'float32' || tensor.dtype === 'float16' ||
            tensor.dtype === 'int8' || tensor.dtype === 'int16' || tensor.dtype === 'int32') {
            this.encoding = '<';
            this._data = tensor.data;
        }
    }

    get values() {
        if (this._data) {
            return this._data.peek();
        }
        return null;
    }
};


gguf.Reader = class {

    static open(stream) {
        if (stream && stream.length > 4) {
            const signature = String.fromCharCode.apply(null, stream.peek(4));
            if (signature === 'GGUF') {
                return new gguf.Reader(stream);
            }
        }
        return null;
    }

    constructor(stream) {
        this.stream = stream;
        const QK_K = 256;
        gguf.Reader.GGML_QUANT_SIZES = gguf.Reader.GGML_QUANT_SIZES || new Map([
            [ gguf.QuantizationType.F32,  [ 1, 4, 'float32' ] ],
            [ gguf.QuantizationType.F16,  [ 1, 2, 'float16' ] ],
            [ gguf.QuantizationType.Q4_0, [ 32, 2 + 16, '' ] ],
            [ gguf.QuantizationType.Q4_1, [ 32, 2 + 2 + 16, '' ] ],
            [ gguf.QuantizationType.Q5_0, [ 32, 2 + 4 + 16, '' ] ],
            [ gguf.QuantizationType.Q5_1, [ 32, 2 + 2 + 4 + 16, '' ] ],
            [ gguf.QuantizationType.Q8_0, [ 32, 2 + 32, ''] ],
            [ gguf.QuantizationType.Q8_1, [ 32, 4 + 4 + 32, ''] ],
            [ gguf.QuantizationType.Q2_K, [ 256, 2 + 2 + Math.floor(QK_K / 16) + Math.floor(QK_K / 4), '' ] ],
            [ gguf.QuantizationType.Q3_K, [ 256, 2 + Math.floor(QK_K / 4) + Math.floor(QK_K / 8) + 12, '' ] ],
            [ gguf.QuantizationType.Q4_K, [ 256, 2 + 2 + Math.floor(QK_K / 2) + 12, '' ] ],
            [ gguf.QuantizationType.Q5_K, [ 256, 2 + 2 + Math.floor(QK_K / 2) + Math.floor(QK_K / 8) + 12, '' ] ],
            [ gguf.QuantizationType.Q6_K, [ 256, 2 + Math.floor(QK_K / 2) + Math.floor(QK_K / 4) + Math.floor(QK_K / 16), '' ] ],
            [ gguf.QuantizationType.Q8_K, [ 256, 4 + QK_K + Math.floor(QK_K / 8), '' ] ],
            [ gguf.QuantizationType.I8,   [ 1, 4, 'int8' ] ],
            [ gguf.QuantizationType.I16,  [ 1, 2, 'int16' ] ],
            [ gguf.QuantizationType.I32,  [ 1, 4, 'int32' ] ]
        ]);
    }

    read() {
        const reader = new gguf.StreamReader(this.stream);
        this.tensors = new Map();
        this.metadata = new Map();
        const context = {};
        context.header = {};
        context.header.magic = String.fromCharCode.apply(null, reader.read(4));
        context.header.version = reader.uint32();
        this.format = `GGUF v${context.header.version}`;
        if (context.header.version >= 2) {
            context.header.n_tensors = reader.uint64();
            context.header.n_kv = reader.uint64();
            for (let i = 0; i < context.header.n_kv; i++) {
                const entry = reader.entry();
                this.metadata.set(entry.name, entry.value);
            }
            const tensors = context.header.n_tensors;
            if (tensors > 0) {
                for (let i = 0; i < tensors; i++) {
                    const tensor = reader.tensor();
                    this.tensors.set(tensor.name, tensor);
                }
                context.alignment = this.metadata.get('general.alignment') || 32;
                const offset_pad = reader.position % context.alignment;
                if (offset_pad != 0) {
                    reader.skip(context.alignment - offset_pad);
                }
                context.offset = reader.position;
                if (context.offset < this.stream.length) {
                    for (const tensor of this.tensors.values()) {
                        reader.seek(context.offset + tensor.offset);
                        if (!gguf.Reader.GGML_QUANT_SIZES.has(tensor.type)) {
                            throw new gguf.Error(`Unsupported tensor quantization type '${tensor.type}'.`);
                        }
                        const [block_size, type_size, dtype] = gguf.Reader.GGML_QUANT_SIZES.get(tensor.type);
                        const n_elems = tensor.ne.reduce((a, b) => a * b, 1);
                        const n_bytes = Math.floor(n_elems * type_size / block_size);
                        tensor.dtype = dtype || '?';
                        tensor.data = reader.stream(n_bytes);
                    }
                }
            }
        }
        this.stream.seek(0);
        delete this.stream;
    }
};

gguf.StreamReader = class extends base.StreamReader {

    constructor(stream) {
        super(stream);
    }

    string() {
        const size = this.uint64();
        const buffer = this.read(size);
        return String.fromCharCode.apply(null, buffer);
    }

    value(type) {
        switch (type) {
            case gguf.Type.UINT32: {
                return this.uint32();
            }
            case gguf.Type.INT32: {
                return this.int32();
            }
            case gguf.Type.FLOAT32: {
                return this.float32();
            }
            case gguf.Type.BOOL: {
                return this.byte() !== 0;
            }
            case gguf.Type.STRING: {
                return this.string();
            }
            case gguf.Type.ARRAY: {
                const type = this.uint32();
                const size = this.uint64();
                const value = new Array(size);
                for (let i = 0; i < size; i++) {
                    value[i] = this.value(type);
                }
                return value;
            }
            default: {
                throw new gguf.Error(`Unsupported GGUF type '${type}'.`);
            }
        }
    }

    entry() {
        const name = this.string();
        const type = this.uint32();
        const value = this.value(type);
        return { name: name, value: value, type: type };
    }

    tensor() {
        const tensor = {};
        tensor.name = this.string();
        const n_dims = this.uint32();
        tensor.ne = new Array(n_dims);
        for (let i = 0; i < n_dims; i++) {
            tensor.ne[i] = this.uint64();
        }
        tensor.type = this.uint32();
        tensor.offset = this.uint64();
        return tensor;
    }
};

gguf.Type = {
    UINT8: 0,
    INT8: 1,
    UINT16: 2,
    INT16: 3,
    UINT32: 4,
    INT32: 5,
    FLOAT32: 6,
    BOOL: 7,
    STRING: 8,
    ARRAY: 9,
    UINT64: 10,
    INT64: 11,
    FLOAT64: 12,
};

gguf.QuantizationType = {
    F32: 0,
    F16: 1,
    Q4_0: 2,
    Q4_1: 3,
    Q5_0: 6,
    Q5_1: 7,
    Q8_0: 8,
    Q8_1: 9,
    Q2_K: 10,
    Q3_K: 11,
    Q4_K: 12,
    Q5_K: 13,
    Q6_K: 14,
    Q8_K: 15,
    I8: 16,
    I16: 17,
    I32: 18,
};

gguf.Utility = class {

    static enum(type, value) {
        gguf.Utility._enums = gguf.Utility._enums || new Map();
        if (!gguf.Utility._enums.has(type)) {
            const entries = new Map(Object.entries(type).map(([key, value]) => [ value, key ]));
            gguf.Utility._enums.set(type, entries);
        }
        const entires = gguf.Utility._enums.get(type);
        if (entires.has(value)) {
            return entires.get(value);
        }
        return value;
    }
};

gguf.Error = class extends Error {

    constructor(message) {
        super(message);
        this.name = 'GGML Error';
    }
};

export const ModelFactory = gguf.ModelFactory;
