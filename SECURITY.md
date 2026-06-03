# Security

Do not include secrets or private issue content in bug reports. This Action treats
GitHub Issue title and body content as untrusted input.

The MVP must not interpolate Issue content into shell commands, mutate labels,
assignees, issue state, repository files, workflow checks, or pull requests.
