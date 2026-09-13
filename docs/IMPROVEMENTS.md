# Improvements

- Add an explicit **Update dependencies** action for automations. Libraries configured as `latest`
  are resolved into a pinned `requirements.txt` to keep runs reproducible; this action should
  intentionally refresh those resolved versions.
- Support private Python package indexes and authentication, so automations can install internal
  packages from registries such as Artifactory or GitHub Packages without exposing credentials.
- Add Node.js runners and their dependency management, allowing JavaScript and TypeScript
  automations to install packages independently from Python environments.
- Configure code signing for desktop releases: notarize macOS DMGs with an Apple Developer
  certificate and sign Windows installers to reduce Gatekeeper and SmartScreen warnings.
- Add automation backup and restore through JSON export and import, so users can safely migrate
  their workspace without requiring cloud synchronization.
- Improve failed-run recovery with actions to copy the error, open the automation editor, and run
  the automation again from its details.
- Replace the permissive `csp: null` production configuration with an explicit Content Security
  Policy that allows only the app's required resources and telemetry domains.
- Add an About screen with the installed app version, operating system, active runner, useful
  links, and a button to copy diagnostic information for support requests.
- Add the Tauri updater after the first stable release, using signed artifacts from GitHub
  Releases to notify users about and install new versions.
