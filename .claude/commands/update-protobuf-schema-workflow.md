---
name: update-protobuf-schema-workflow
description: Workflow command scaffold for update-protobuf-schema-workflow in netron.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-protobuf-schema-workflow

Use this workflow when working on **update-protobuf-schema-workflow** in `netron`.

## Goal

Updates to protobuf schemas and their generated JS files, typically when updating model format support or regenerating code from .proto files.

## Common Files

- `source/*-proto.js`
- `source/*.js`
- `tools/protoc.js`
- `source/protobuf.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit one or more *-proto.js files in source/
- Edit corresponding implementation files (e.g., source/onnx.js, source/paddle.js, etc.)
- Edit or regenerate tools/protoc.js
- Edit source/protobuf.js

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.