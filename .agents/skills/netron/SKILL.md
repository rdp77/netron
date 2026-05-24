```markdown
# netron Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and maintenance workflows for the **netron** repository—a JavaScript codebase for visualizing neural network models. You'll learn how to update schemas, add tests, manage metadata, bump dependencies, and follow the project's code style. This guide is ideal for contributors aiming for consistency and efficiency.

## Coding Conventions

- **File Naming:**  
  Use `camelCase` for JavaScript files.  
  Example:  
  ```
  source/onnxProto.js
  source/flatbuffers.js
  ```

- **Import Style:**  
  Use **relative imports**.  
  Example:  
  ```js
  import { Model } from './onnx.js';
  ```

- **Export Style:**  
  Use **named exports**.  
  Example:  
  ```js
  export function parseModel(buffer) { ... }
  export { parseModel };
  ```

- **Commit Messages:**  
  - Freeform, no strict prefix required.
  - Keep messages concise (average ~23 characters).

## Workflows

### Update Protobuf Schema Workflow
**Trigger:** When updating or regenerating protobuf schemas for supported model formats.  
**Command:** `/update-protobuf-schema`

1. Edit one or more `*-proto.js` files in `source/`.
2. Edit corresponding implementation files (e.g., `source/onnx.js`, `source/paddle.js`, etc.).
3. Edit or regenerate `tools/protoc.js`.
4. Edit `source/protobuf.js`.

**Example:**
```js
// source/onnxProto.js
export const TensorProto = { ... };
```

### Update Flatbuffers Schema Workflow
**Trigger:** When updating or regenerating flatbuffers schemas for supported model formats.  
**Command:** `/update-flatbuffers-schema`

1. Edit one or more `*-schema.js` files in `source/`.
2. Edit corresponding implementation files (e.g., `source/circle.js`, `source/onnx.js`, etc.).
3. Edit or regenerate `tools/flatc.js`.
4. Edit `source/flatbuffers.js`.

**Example:**
```js
// source/circleSchema.js
export const Model = { ... };
```

### Add Model Test File Workflow
**Trigger:** When adding support for a new model format or test case.  
**Command:** `/add-model-test-file`

1. Edit or create a `source/*.js` file for the model format.
2. Edit `test/models.json` to add the new test file.

**Example:**
```json
// test/models.json
[
  { "name": "NewModel", "file": "newModel.onnx" }
]
```

### Update Metadata JSON Workflow
**Trigger:** When updating operator or model metadata for a format.  
**Command:** `/update-metadata-json`

1. Edit `source/*-metadata.json`.

**Example:**
```json
// source/onnx-metadata.json
{
  "opType": "Conv",
  "attributes": [ ... ]
}
```

### Bump Version or Dependency Workflow
**Trigger:** When releasing a new version or updating a dependency.  
**Command:** `/bump-version`

1. Edit `package.json` to update the version or dependency.

**Example:**
```json
// package.json
{
  "version": "7.0.0",
  "dependencies": {
    "electron": "^25.0.0"
  }
}
```

### Single File Feature or Bugfix Workflow
**Trigger:** When fixing a bug or tweaking a feature in a specific file.  
**Command:** `/edit-file`

1. Edit a single `source/*.js` file.

**Example:**
```js
// source/onnx.js
export function parse(buffer) {
  // Bugfix: handle empty buffer
}
```

## Testing Patterns

- **Framework:** [Playwright](https://playwright.dev/)
- **Test File Pattern:** `*.spec.js` (e.g., `onnx.spec.js`)
- **Test Organization:**  
  Place test files alongside or near the code they test, using the `.spec.js` suffix.

**Example:**
```js
// test/onnx.spec.js
import { parseModel } from '../source/onnx.js';

test('should parse ONNX model', async () => {
  const model = await parseModel(buffer);
  expect(model).toBeDefined();
});
```

## Commands

| Command                     | Purpose                                                        |
|-----------------------------|----------------------------------------------------------------|
| /update-protobuf-schema     | Update or regenerate protobuf schemas and related files         |
| /update-flatbuffers-schema  | Update or regenerate flatbuffers schemas and related files      |
| /add-model-test-file        | Add a new model test file and update test registry             |
| /update-metadata-json       | Update metadata JSON for supported model formats                |
| /bump-version               | Bump package version or update a dependency in package.json     |
| /edit-file                  | Make a small feature change or bugfix in a single source file   |
```
