# Improvements

- Add an explicit **Update dependencies** action for automations. Libraries configured as `latest`
  are resolved into a pinned `requirements.txt` to keep runs reproducible; this action should
  intentionally refresh those resolved versions.
- Support private Python package indexes and authentication, so automations can install internal
  packages from registries such as Artifactory or GitHub Packages without exposing credentials.
- Add Node.js runners and their dependency management, allowing JavaScript and TypeScript
  automations to install packages independently from Python environments.
