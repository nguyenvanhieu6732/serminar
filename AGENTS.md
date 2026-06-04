# Project Rules

## RTK

Before running shell commands:

- Use `rtk git status`
- Use `rtk git diff`
- Use `rtk npm test`
- Use `rtk npm run build`

Never run:

- git status
- git diff
- npm test
- npm run build

unless RTK fails twice.

## Code Review

Ignore:

- dist/\*\*
- node_modules/\*\*
- coverage/\*\*

Review:

- src/\*\*
- **tests**/\*\*
- package.json
- package-lock.json

first.
