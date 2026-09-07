# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Bundled uv

Download the `uv` sidecars before running or packaging the desktop app:

```bash
yarn download:uv
```

For local development, download only the current target when needed, for example:

```bash
yarn download:uv aarch64-apple-darwin
```

## Google Analytics

Set `VITE_GA_MEASUREMENT_ID` in `.env.local` to enable analytics locally. For release builds,
add the Measurement ID as the GitHub Actions secret `GA_MEASUREMENT_ID`. Telemetry is enabled by
default and can be disabled during onboarding or later in Settings.
