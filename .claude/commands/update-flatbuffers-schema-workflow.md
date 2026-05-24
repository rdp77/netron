---
name: update-flatbuffers-schema-workflow
description: Workflow command scaffold for update-flatbuffers-schema-workflow in netron.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-flatbuffers-schema-workflow

Use this workflow when working on **update-flatbuffers-schema-workflow** in `netron`.

## Goal

Updates to flatbuffers schemas and their generated JS files, often for model format support or schema changes.

## Common Files

- `source/*-schema.js`
- `source/*.js`
- `tools/flatc.js`
- `source/flatbuffers.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit one or more *-schema.js files in source/
- Edit corresponding implementation files (e.g., source/circle.js, source/onnx.js, etc.)
- Edit or regenerate tools/flatc.js
- Edit source/flatbuffers.js

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.