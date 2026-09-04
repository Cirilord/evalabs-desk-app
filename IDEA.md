# Local Automation Desktop App — Product & Technical Idea

## 1. Overview

This project is a cross-platform desktop application for organizing, configuring, and running small Python automations without requiring the end user to understand terminals, Python installations, virtual environments, package managers, command-line arguments, or dependency management.

The core problem is common in companies and personal workflows: people create or receive small Python scripts that automate repetitive tasks, but those scripts end up scattered across the desktop, Downloads folder, shared drives, or random project directories. Running them often requires technical knowledge such as installing Python, configuring PATH, creating virtual environments, installing dependencies, navigating directories, and executing commands in a shell.

The application should turn those scripts into simple, reusable desktop tools with graphical inputs and predictable outputs.

The main product principle is:

> Turn small Python scripts into organized, reusable desktop automations that anyone can run without touching a terminal.

The product must feel simple enough for a non-technical user while still giving technical users enough control to define inputs, edit code, manage packages, inspect logs, and configure advanced behavior.

---

## 2. Product Positioning

This is **not** an IDE.

This is **not** a workflow orchestration platform in the MVP.

This is **not** a web application.

This is **not** a replacement for Python development environments.

This is a local-first desktop application that sits between a Python script and a non-technical user.

The user should think in terms of **Automations**, not scripts, interpreters, commands, packages, or virtual environments.

Examples of automations:

- Merge monthly spreadsheets
- Rename invoice PDFs
- Resize product images
- Convert CSV files
- Process a folder of documents
- Generate a report
- Clean duplicated records
- Extract information from files
- Batch-convert media
- Organize downloaded files

The fact that an automation is implemented in Python should be mostly hidden from the execution experience.

---

## 3. Target Users

### Primary users

People who already use or receive small Python scripts for repetitive tasks but are not necessarily developers.

Examples:

- Finance teams
- Operations teams
- Administrative teams
- Marketing teams
- Analysts
- Back-office workers
- Support teams
- Small business owners
- Technical employees helping non-technical coworkers

### Secondary users

Developers or technical employees who create automations for themselves or coworkers and want a cleaner way to package, organize, and run them.

---

## 4. Main User Problem

Today a typical workflow looks like this:

1. A repetitive task exists.
2. Someone asks ChatGPT, Claude, Codex, or a developer to create a Python script.
3. The script works.
4. The user now needs to understand how to run it repeatedly.
5. They may need to install Python.
6. They may need to use a terminal.
7. They may need to install packages.
8. They may forget the command-line arguments.
9. The script becomes another `.py` file somewhere on the computer.
10. Months later, nobody remembers how it works.

The application should eliminate steps 5 through 10.

Desired workflow:

1. Create or obtain a Python automation.
2. Add it to the application.
3. Define its graphical inputs.
4. Define its output behavior.
5. Add required Python packages.
6. Run it from a simple graphical interface forever after.

---

## 5. Product Principles

### 5.1 Plug and play

The application must work for users who do not know how to install or configure Python.

If Python is required, the app should provide a clear action such as:

> Install Python

The application should then download, configure, validate, and manage the runtime internally.

The user should never need to:

- visit python.org
- configure PATH
- run `pip`
- run `python`
- create a virtual environment manually
- use a shell
- edit `requirements.txt`

### 5.2 Local-first

The MVP should require no account, backend, cloud service, or login.

Automations run locally on the user's machine and can access local files and folders selected by the user.

### 5.3 Non-technical execution experience

The main execution screen should look like a small utility application, not like a code editor.

The code should be available when needed, but it should not dominate the experience.

### 5.4 Technical details should be progressive

Common actions should be obvious.

Advanced settings should exist but remain out of the way.

### 5.5 One automation, one isolated environment

Every automation must have its own isolated Python environment so dependencies do not interfere with other automations or with the system Python installation.

### 5.6 Native protocol only

The application will **not** support arbitrary existing CLI scripts directly in the MVP.

Every automation must follow the application's native input/output contract.

If a user already has an existing Python script, they can ask an LLM to adapt it to the application's contract.

The app should make this adaptation easy by generating a ready-to-copy AI prompt describing the expected contract and configured inputs.

---

## 6. Terminology

### Workspace

A local container for the user's automations.

For the MVP, the app can start with one default local workspace automatically. No account or remote sync is required.

Future versions may support shared company workspaces.

### Automation

The main product entity.

An automation contains:

- metadata
- input schema
- Python source code
- output configuration / native output contract
- package dependencies
- Python runtime version
- isolated virtual environment
- execution history

An automation is currently backed by one Python entrypoint.

### Flow / Workflow

Reserved for a future feature where multiple automations or steps can be connected together.

Example:

```text
Read spreadsheet
      ↓
Clean records
      ↓
Generate PDF
      ↓
Send result
```

Do not model the MVP around workflows yet.

---

## 7. MVP Scope

The MVP should include only the features necessary to validate the core product experience.

### Required MVP features

1. Cross-platform desktop application
2. macOS support
3. Windows support
4. Linux support
5. Local workspace
6. Automation list
7. Create automation
8. Rename/delete automation
9. Edit automation metadata
10. Python runtime management
11. Per-automation isolated virtual environment
12. Package management through the UI
13. Visual input schema builder
14. Python code editor
15. Native JSON input protocol
16. Structured output protocol
17. stdout log capture
18. stderr/error capture
19. Run automation
20. Execution result display
21. Basic execution history
22. Generate/copy instructions for an LLM
23. Rebuild automation environment
24. Local persistence

### Explicitly excluded from MVP

Do **not** implement these yet:

- Node.js runtime
- browser/web application
- user accounts
- authentication
- cloud synchronization
- company workspaces
- team sharing
- permissions
- remote execution
- cron jobs
- scheduled automations
- workflow builder
- multi-step flows
- marketplace
- built-in LLM subscription
- collaborative editing
- remote package registry
- enterprise policies
- SSO
- audit logs
- organization management
- execution agents

These may become future phases, but should not influence the MVP architecture more than necessary.

---

## 8. Technology Stack

### Desktop shell

**Tauri 2**

Reasons:

- cross-platform: macOS, Windows, Linux
- significantly lighter than bundling Chromium with Electron
- allows a React frontend
- provides access to native operating system capabilities
- good fit for filesystem and process-oriented desktop applications
- Rust backend provides a clear boundary between UI logic and system/runtime logic

### Frontend

Recommended:

- React
- TypeScript
- Vite

Potential UI libraries can be chosen later. The interface should remain minimal and desktop-oriented rather than SaaS-dashboard-oriented.

### Desktop/backend layer

Rust through Tauri commands.

Responsibilities include:

- workspace management
- file operations
- runtime management
- environment creation
- process spawning
- process lifecycle
- package installation
- execution coordination
- stdout/stderr collection
- result file handling
- OS integrations

### Python runtime/environment management

Use **uv** as the preferred environment/runtime tool.

`uv` should be treated as an implementation detail hidden from the end user.

Conceptually, the application still provides each automation with a normal isolated `.venv`.

`uv` can simplify:

- installing/managing Python versions
- creating virtual environments
- installing packages
- resolving packages
- rebuilding environments

The UI should never require the user to know what `uv` is.

---

## 9. Why `uv` Instead of Only `venv` + `pip`

The application needs to solve more than environment isolation.

Using Python's built-in `venv` alone still assumes a Python interpreter already exists on the machine.

The product must also manage the interpreter itself.

`uv` is useful because it can help the application manage Python installations and virtual environments from one tool.

Externally, the user sees:

```text
Python
Status: Ready
Version: Recommended
```

Internally, the app can use something like:

```text
uv python install <version>
uv venv <automation-dir>/.venv --python <version>
uv pip install ...
```

Exact commands and integration details should be verified during implementation.

The architecture should wrap this logic behind a `RuntimeManager` / `EnvironmentManager` abstraction so the implementation can change later without affecting the UI.

---

## 10. Python Runtime UX

The user should not manually configure Python during normal use.

### First launch / missing runtime

Example UI:

```text
Python is required to run automations.

Python
Not installed

[ Install Python ]
```

After clicking:

```text
Installing Python...

✓ Runtime downloaded
✓ Environment tools configured
✓ Installation validated

Python is ready.

[ Continue ]
```

### Settings

A global settings page can show:

```text
Python

Status
Ready

Default version
Recommended

Installed versions
3.x.x

[ Install another version ]
```

Advanced version management is optional for the first MVP implementation. Initially, supporting a single recommended Python version is acceptable.

The architecture should still avoid hard-coding assumptions that prevent multiple versions later.

---

## 11. Per-Automation Environment

Every automation owns its own `.venv`.

Conceptual layout:

```text
workspace/
  automations/
    <automation-id>/
      automation.json
      main.py
      .venv/
      runs/
```

Example:

```text
workspace/
  automations/
    6b6f0f36-.../
      automation.json
      main.py
      .venv/
      runs/
        <run-id>/
```

Important rule:

> `.venv` is disposable state.

The source of truth is the automation configuration.

The app must be able to delete and recreate the environment from configuration.

This enables a UI action such as:

```text
Environment
Python 3.x
5 packages

[ Rebuild environment ]
```

---

## 12. Package Management

Users should not edit a `requirements.txt` file manually.

Packages are managed through the automation settings UI.

Suggested interface:

```text
Packages

pandas           ×
openpyxl         ×
requests         ×

[ Add package...                ]
```

Typing a package name and pressing Enter adds it to the automation.

Potential future UX:

```text
Add package
[pandas                        ]

pandas
pandas-stubs
pandas-datareader
```

For the MVP, package registry autocomplete is optional.

A plain package-name input is enough.

### Package versions

The internal automation configuration should support version constraints even if the first UI does not expose advanced version controls.

Examples:

```text
pandas
pandas==2.3.2
pandas>=2.3
```

The application should persist the user-provided package specifier.

### Environment synchronization

When package configuration changes, the environment should be synchronized.

Potential states:

- Ready
- Installing packages
- Needs update
- Broken
- Rebuilding

Do not block all UI interaction while package installation runs.

---

## 13. Native Automation Protocol

The application supports only its own native contract.

This is deliberate.

A predictable contract makes it easier to:

- generate graphical forms
- generate AI instructions
- validate execution
- provide structured errors
- produce structured results
- evolve the SDK later
- support workflows later

---

## 14. Input Protocol

Inputs should be represented as a JSON object.

Do not rely on positional command-line arguments.

Example configured inputs:

```text
Input files        -> input_files
Remove duplicates  -> remove_duplicates
Output folder      -> output_folder
Report name        -> report_name
```

Runtime data:

```json
{
  "input_files": ["/Users/example/Desktop/january.xlsx", "/Users/example/Desktop/february.xlsx"],
  "remove_duplicates": true,
  "output_folder": "/Users/example/Desktop/reports",
  "report_name": "Q1 report"
}
```

### Preferred transport

The MVP can use one of two approaches:

1. JSON through stdin
2. JSON through a generated `input.json` path passed through an environment variable

The preferred initial design is **JSON through stdin**, because it is simple and avoids command-line escaping problems.

Example:

```text
App
  │
  └── stdin ──> Python process
               {
                 ...inputs
               }
```

The Python script can read it with:

```python
import json
import sys

inputs = json.load(sys.stdin)
```

The final implementation may later introduce a small SDK so users rarely write this boilerplate manually.

---

## 15. Input Types

Initial supported visual input types:

### Text

```json
{
  "type": "text"
}
```

### Number

```json
{
  "type": "number"
}
```

### Boolean

```json
{
  "type": "boolean"
}
```

### Select

```json
{
  "type": "select",
  "options": ["Option A", "Option B"]
}
```

### Date

```json
{
  "type": "date"
}
```

### File

```json
{
  "type": "file"
}
```

### Multiple files

```json
{
  "type": "files"
}
```

### Folder

```json
{
  "type": "folder"
}
```

### Secret

Potentially supported later in the MVP if useful:

```json
{
  "type": "secret"
}
```

Secrets should eventually use OS secure storage rather than plain JSON files.

### Specialized file types

Image, audio, and video can be user-facing variants of `file` rather than separate runtime primitives.

Example:

```json
{
  "type": "file",
  "accept": ["image/png", "image/jpeg"]
}
```

The UI may label this input as "Image" while the protocol still sends an absolute file path.

---

## 16. Input Schema Configuration

Each input needs at least:

```text
id
label
type
required
```

Possible additional properties:

```text
description
defaultValue
placeholder
options
accept
multiple
```

Example:

```json
{
  "id": "remove_duplicates",
  "label": "Remove duplicates",
  "type": "boolean",
  "required": false,
  "defaultValue": true
}
```

### Variable IDs

Non-technical users should not need to manually create variable names.

The app should derive IDs from labels automatically.

Example:

```text
Input files
→ input_files

Customer Name
→ customer_name
```

The generated ID can live under an Advanced section if users need to edit it.

---

## 17. Output Protocol

Do not use stdout as the structured result channel.

stdout should remain available for normal logs because scripts and third-party libraries may print arbitrary output.

Recommended execution channels:

```text
Application
   │
   ├── stdin  ───────> JSON inputs
   │
   ├── stdout <──────> regular logs
   │
   ├── stderr <──────> warnings/errors
   │
   └── result file <-- structured result
```

For each execution, the application creates a temporary/run directory.

Example:

```text
runs/<run-id>/
  result.json
```

The app can pass the expected result path through an environment variable such as:

```text
AUTOMATION_RESULT_PATH=/.../runs/<run-id>/result.json
```

The automation writes a structured result to this file.

---

## 18. Result Types

Initial result types should remain intentionally small.

### Text

```json
{
  "type": "text",
  "value": "Processed 1,842 records."
}
```

### File

```json
{
  "type": "file",
  "path": "/Users/example/Desktop/report.xlsx",
  "message": "Report generated successfully."
}
```

### Files

```json
{
  "type": "files",
  "paths": ["/path/a.pdf", "/path/b.pdf"]
}
```

### Folder

```json
{
  "type": "folder",
  "path": "/Users/example/Desktop/output"
}
```

### JSON / structured data

```json
{
  "type": "json",
  "value": {
    "processed": 1842,
    "duplicates": 381
  }
}
```

### Table

Can be added later if needed.

Example future shape:

```json
{
  "type": "table",
  "columns": ["name", "email"],
  "rows": [["Alice", "alice@example.com"]]
}
```

The MVP does not need every possible result type.

---

## 19. Future Python SDK

The first version can expose the raw JSON contract directly.

Later, introduce a very small Python SDK to reduce boilerplate.

Potential API:

```python
from app_runtime import inputs, result, progress

data = inputs.read()

progress.update(20, "Reading spreadsheets")

# automation logic

result.file(
    output_path,
    message="Report generated successfully"
)
```

The SDK could also provide helpers for:

- accessing configured inputs
- sending progress updates
- returning outputs
- structured logs
- cancellation detection
- secrets
- temporary files

Do not make the SDK a blocker for the first working MVP.

---

## 20. Execution Lifecycle

Conceptual run lifecycle:

```text
User clicks Run
       │
       ▼
Validate input values
       │
       ▼
Check Python runtime
       │
       ▼
Check automation environment
       │
       ▼
Synchronize dependencies if required
       │
       ▼
Create run directory
       │
       ▼
Build JSON input object
       │
       ▼
Spawn automation Python process
       │
       ├── send JSON through stdin
       ├── stream stdout logs
       ├── stream stderr logs
       └── provide result path env variable
       │
       ▼
Wait for process exit
       │
       ├── exit code != 0 -> failure
       │
       └── exit code == 0
                  │
                  ▼
           read result.json
                  │
                  ▼
             render result
                  │
                  ▼
           persist run history
```

---

## 21. Execution Status

Recommended statuses:

```text
idle
preparing_environment
installing_dependencies
running
success
failed
cancelled
```

Future support:

```text
waiting
scheduled
```

Do not implement future statuses until necessary.

---

## 22. Process Management

Python scripts must run as separate OS processes.

Never execute user Python code inside the Tauri process itself.

The Rust layer should own the process lifecycle.

Responsibilities:

- spawn process
- pass environment variables
- write JSON to stdin
- stream stdout
- stream stderr
- detect exit code
- allow termination/cancellation
- ensure child processes are cleaned up when possible

Long-running Python scripts must not block the UI thread.

---

## 23. Local Data Model

A simple JSON-based persistence layer is sufficient for the MVP.

A database can be introduced later if it becomes useful.

Suggested automation manifest:

```json
{
  "id": "uuid",
  "name": "Merge spreadsheets",
  "description": "Merge multiple XLSX files into a single report.",
  "icon": "table",
  "createdAt": "2026-09-04T12:00:00Z",
  "updatedAt": "2026-09-04T12:00:00Z",
  "runtime": {
    "type": "python",
    "version": "recommended"
  },
  "entrypoint": "main.py",
  "packages": ["pandas", "openpyxl"],
  "inputs": [
    {
      "id": "input_files",
      "label": "Input files",
      "type": "files",
      "required": true
    },
    {
      "id": "remove_duplicates",
      "label": "Remove duplicates",
      "type": "boolean",
      "required": false,
      "defaultValue": true
    },
    {
      "id": "output_folder",
      "label": "Destination",
      "type": "folder",
      "required": true
    }
  ]
}
```

---

## 24. Run Data Model

Basic execution history should store metadata without becoming a full observability system.

Example:

```json
{
  "id": "run-uuid",
  "automationId": "automation-uuid",
  "startedAt": "2026-09-04T12:00:00Z",
  "finishedAt": "2026-09-04T12:00:04Z",
  "durationMs": 4231,
  "status": "success",
  "exitCode": 0,
  "inputs": {
    "remove_duplicates": true
  },
  "result": {
    "type": "file",
    "path": "/Users/example/Desktop/report.xlsx"
  }
}
```

Be careful about storing sensitive input values in history.

File paths may be useful, but secrets should never be stored in plain execution history.

---

## 25. Proposed Local Directory Structure

Exact operating-system application data paths will differ by platform and should use Tauri / OS conventions.

Conceptual structure:

```text
<AppData>/
  settings.json

  runtimes/
    python/
      ...

  workspaces/
    default/
      workspace.json

      automations/
        <automation-id>/
          automation.json
          main.py
          .venv/

          runs/
            <run-id>/
              stdout.log
              stderr.log
              result.json
              run.json
```

Possible future folders:

```text
  cache/
  downloads/
  sdk/
  logs/
```

---

## 26. UI / UX Direction

The application should feel more like a native productivity app than a SaaS dashboard.

Primary visual references:

- macOS Notes
- Finder
- Reminders
- Things
- other minimal desktop productivity applications

The design language can borrow from macOS even though the application must also support Windows and Linux.

The goal is not to perfectly imitate native macOS components.

The goal is:

- clean
- quiet
- minimal
- understandable
- low visual noise
- productivity-focused

Avoid:

- dashboard KPI cards
- large analytics panels
- unnecessary charts
- excessive gradients
- admin-panel aesthetics
- deeply nested navigation

---

## 27. Main Layout

Prefer a simple two-column layout.

```text
┌────────────────────────┬──────────────────────────────────────────┐
│                        │                                          │
│ Automations            │ Merge monthly spreadsheets               │
│                        │                                          │
│ Search                 │ Merge XLSX files and remove duplicates.  │
│ ───────────────────    │                                          │
│                        │ [ Run ]                                  │
│ Merge spreadsheets     │                                          │
│ Resize images          │ ───────────────────────────────────────  │
│ Rename invoices        │                                          │
│ Organize files         │ Inputs                                   │
│                        │                                          │
│                        │ Files                                    │
│                        │ [ Select files... ]                      │
│                        │                                          │
│                        │ Remove duplicates                        │
│                        │ [ ✓ ]                                    │
│                        │                                          │
│                        │ Destination                              │
│                        │ [ Select folder... ]                     │
│                        │                                          │
│ + New Automation       │                                          │
│ Settings               │                                          │
└────────────────────────┴──────────────────────────────────────────┘
```

The sidebar should primarily list automations.

Global Settings can live at the bottom.

Do not introduce a large hierarchy of sidebar menu -> submenu -> sub-submenu unless future complexity requires it.

---

## 28. Automation Detail Navigation

Within one automation, use a small number of tabs/sections.

Recommended structure:

```text
Merge spreadsheets

[ Run ]                         [...]

Run    Inputs    Code    Settings    History
──────────────────────────────────────────────
```

Possible naming alternatives:

```text
Run
Inputs
Code
Environment
History
```

`Settings` may contain both metadata and environment/package configuration initially.

Do not over-separate screens before needed.

---

## 29. Run Screen

The Run screen is the most important screen in the application.

This is where a non-technical user should spend most of their time.

Example:

```text
Run
────────────────────────────────────

Input files
[ Select files... ]

Remove duplicates
[ ✓ ]

Destination
[ Select folder... ]

                [ ▶ Run ]


Result
────────────────────────────────────

✓ Completed in 4.2s

Processed 18,421 rows.
Removed 381 duplicates.

report.xlsx

[ Open ] [ Show in folder ]
```

During execution:

```text
Running...

Processing spreadsheets...

[ Cancel ]
```

Logs can be collapsed by default and expanded when needed.

---

## 30. Inputs Editor

The inputs editor should feel like a form builder but remain extremely small.

Example:

```text
Inputs
────────────────────────────────────

Input files
Files
Required

Remove duplicates
Boolean
Default: Yes

Destination
Folder
Required

[ + Add input ]
```

Clicking an input opens its configuration.

Example:

```text
Label
[ Input files ]

Type
[ Multiple files ]

Required
[ ✓ ]

Advanced
  Variable ID
  [ input_files ]
```

Drag-and-drop reordering can be added later.

---

## 31. Code Screen

The application should include a code editor because technical users and AI-generated scripts need somewhere to live.

Suggested editor:

- Monaco Editor, or
- CodeMirror if a lighter integration is preferred

Example:

```text
Code
────────────────────────────────────

main.py

┌────────────────────────────────────┐
│ import json                        │
│ import sys                         │
│                                    │
│ inputs = json.load(sys.stdin)      │
│ ...                                │
└────────────────────────────────────┘

[ Copy AI instructions ]
```

The code editor is part of the automation but should not dominate the default experience.

---

## 32. Settings / Environment Screen

Example:

```text
Settings
────────────────────────────────────

General
Name
[ Merge spreadsheets ]

Description
[ Merge monthly XLSX files... ]

Python
Version
[ Recommended ]

Environment
Status: Ready

Packages
pandas       ×
openpyxl     ×

[ Add package... ]

[ Rebuild environment ]
```

Potential advanced options can be added later.

---

## 33. History Screen

Keep history minimal initially.

Example:

```text
History
────────────────────────────────────

Today
✓ 11:42   4.2s
✓ 10:18   4.0s
✕ 09:57   1.1s

Yesterday
✓ 17:24   5.8s
```

Selecting a run shows:

- timestamp
- duration
- status
- result
- logs
- error message

Do not build advanced filtering or observability for MVP.

---

## 34. Automation Creation Flow

Use a small wizard or guided setup.

### Step 1 — General

```text
Create automation

Name
[ Merge spreadsheets ]

Description
[ Merge monthly reports ]
```

### Step 2 — Inputs

```text
What information does this automation need?

[ + Text ]
[ + Number ]
[ + File ]
[ + Files ]
[ + Folder ]
[ + Boolean ]
[ + Select ]
[ + Date ]
```

### Step 3 — Code

Options can include:

```text
How do you want to add the code?

[ Paste/write Python code ]
[ Copy instructions for an AI ]
```

There is no need to integrate an LLM directly in the MVP.

### Step 4 — Packages

```text
Packages

[ Add package... ]
```

### Step 5 — Test

Run the automation once using the configured form.

If successful:

```text
✓ Automation is ready
```

This wizard can be simplified further during implementation if necessary.

---

## 35. AI-Assisted Script Creation Without Built-In AI

One important MVP feature is the ability to generate a prompt the user can copy into ChatGPT, Claude, Codex, or another LLM.

The app already knows:

- automation name
- description
- input schema
- native protocol
- result protocol
- configured packages

Therefore it can generate precise instructions automatically.

Example generated prompt:

```text
Create a Python script for a desktop automation application.

The script receives a JSON object through stdin.

Configured inputs:

- input_files: array of absolute file paths
- remove_duplicates: boolean
- output_folder: absolute folder path

The script may write normal logs to stdout.
Errors may be written to stderr.

The environment variable AUTOMATION_RESULT_PATH contains the absolute path where the script must write its final result as JSON.

Supported result format example:

{
  "type": "file",
  "path": "/absolute/path/to/file.xlsx",
  "message": "Report generated successfully"
}

Implement the requested automation while following this contract exactly.
```

The generated prompt should include user-provided intent/description when available.

### Existing script adaptation

The same feature solves compatibility with existing scripts.

The user can paste an existing script into an LLM together with the generated contract and ask the LLM to adapt it.

Because of this, the MVP does **not** need a separate compatibility mode for arbitrary CLI scripts.

---

## 36. Future Built-In AI

Built-in AI is deliberately postponed.

Possible future experience:

```text
Describe what you want to automate:

[ Take all XLSX files in a folder, merge them,
  remove duplicated CPF rows, and save a result. ]

[ Create automation ]
```

The LLM could generate:

- input schema
- Python code
- package list
- description
- output behavior

Possible pricing models later:

### BYOK

Users provide their own OpenAI/Anthropic/etc. API key.

Advantages:

- no inference cost for the product
- useful before paid AI plans exist

### Subscription / credits

The product pays for inference and includes monthly AI usage.

This can become part of a Pro subscription.

Potential future AI features:

- create automation
- adapt existing scripts
- explain failures
- fix errors
- detect missing packages
- generate inputs from code
- modify an existing automation
- add a new input
- refactor code to native protocol

Do not implement this in the MVP.

---

## 37. Error Handling UX

Errors must be understandable to both technical and non-technical users.

Bad UX:

```text
Process exited with code 1
```

Better UX:

```text
Automation failed

The Python script stopped before completing.

[ Show technical details ]
```

Expanded technical details:

```text
ModuleNotFoundError: No module named 'openpyxl'
```

Potential smart detection:

```text
This automation may be missing the package "openpyxl".

[ Add package ]
```

AI-based automatic error repair can come later.

---

## 38. Logs

Capture stdout and stderr separately.

The UI should show a combined human-readable log view if useful but preserve both channels internally.

Example:

```text
Logs

11:42:01  Reading files...
11:42:02  Loaded 18,421 rows
11:42:04  Finished
```

Technical raw mode can be optional.

Logs should also be saved with each run for debugging.

---

## 39. Cancellation

Users should be able to stop a running automation.

Minimum behavior:

```text
[ Cancel ]
```

The Rust process manager should terminate the Python child process.

Process-tree cleanup across macOS, Linux, and Windows may require platform-specific handling, especially if the Python script launches child processes.

Basic cancellation of the main Python process is enough for the first implementation, but process ownership should be designed carefully.

---

## 40. Security Model for MVP

The MVP is local-first and executes Python code intentionally added by the local user.

The security expectation is therefore similar to manually executing a local Python script.

Important:

> The MVP is **not** a sandbox for untrusted code.

The application should communicate this clearly if users attempt to run code they did not create or trust.

Avoid falsely presenting the environment as secure isolation.

A Python `.venv` isolates dependencies, not operating-system permissions.

Python code can still:

- access files available to the user
- make network requests
- execute other processes
- delete files
- read environment variables

Future shared/team versions will require a significantly stronger security model.

---

## 41. Future Enterprise Security Considerations

When company workspaces and script sharing are introduced, the product effectively becomes a corporate code-distribution/execution platform.

Future requirements may include:

- immutable automation versions
- script signing
- publisher identity
- approval workflows
- execution permissions
- edit permissions
- audit logs
- rollback
- secrets management
- filesystem policies
- network policies
- package policies
- trusted publishers
- organization controls
- SSO
- device management

Do not implement these now, but avoid architecture that assumes all automations will forever be private and local.

---

## 42. Future Product Evolution

### Phase 1 — Personal local automations

```text
Desktop app
Local workspace
Python
Inputs
Packages
Run
History
```

### Phase 2 — Better automation authoring

```text
Python SDK
Progress reporting
AI prompt improvements
Import/adapt helpers
Better package detection
```

### Phase 3 — Built-in AI

```text
Describe task
       ↓
AI generates input schema + Python + packages
       ↓
Automation ready
```

### Phase 4 — Scheduling

```text
Automation
   ↓
Run manually
or
Run on schedule
```

Cron/scheduling is intentionally postponed because it introduces background execution concerns across operating systems.

### Phase 5 — Workflows

```text
Automation A
     ↓
Automation B
     ↓
Automation C
```

Outputs become inputs for later steps.

At this point the word **Workflow** becomes meaningful.

### Phase 6 — Team workspaces

```text
Company workspace
   ├── Developers / creators
   └── Operators / runners
```

Potential permissions:

- run only
- view configuration
- view code
- edit
- publish
- admin

### Phase 7 — Enterprise

- SSO
- audit
- signed releases
- secrets
- organization policies
- managed devices
- on-premise / self-hosted control plane if needed

---

## 43. Potential Business Model Later

The MVP does not require monetization.

Potential future model:

### Free / Personal

- local automations
- Python runtime
- isolated environments
- unlimited local runs
- local history
- AI prompt generation
- possibly BYOK AI

### Pro

- built-in AI
- AI credits
- more advanced authoring tools
- scheduling
- sync/backup

### Team

- shared workspaces
- versioning
- permissions
- centralized automation distribution

### Enterprise

- SSO
- audit logs
- policies
- security controls
- organization administration
- private infrastructure options

Potential pricing principle:

> Charge creators/builders more readily than simple runners.

A future team plan should encourage companies to distribute useful automations broadly instead of making every employee seat expensive.

---

## 44. Suggested Rust/Tauri Architecture

Keep UI and desktop/system concerns clearly separated.

Conceptual architecture:

```text
React / TypeScript
       │
       │ Tauri commands/events
       ▼
Rust application layer
       │
       ├── WorkspaceService
       ├── AutomationService
       ├── RuntimeManager
       ├── EnvironmentManager
       ├── PackageManager
       ├── Runner
       ├── RunHistoryService
       └── FileSystemService
                    │
                    ▼
               Python process
```

### WorkspaceService

Responsibilities:

- discover/create default workspace
- load workspace metadata
- list automations

### AutomationService

Responsibilities:

- create automation
- update metadata
- delete automation
- read/write automation manifest
- read/write `main.py`

### RuntimeManager

Responsibilities:

- detect managed Python runtime
- install Python
- report runtime state
- later support multiple Python versions

### EnvironmentManager

Responsibilities:

- create `.venv`
- validate environment
- rebuild environment
- determine environment Python executable

### PackageManager

Responsibilities:

- synchronize configured packages
- add package
- remove package
- expose installation status/errors

### Runner

Responsibilities:

- validate environment
- create run directory
- spawn Python
- send inputs
- stream logs
- collect process exit
- read structured result
- cancel process

### RunHistoryService

Responsibilities:

- persist run metadata
- list runs
- load logs/results

---

## 45. Frontend Architecture

Possible structure:

```text
src/
  app/
  components/
  features/
    automations/
    inputs/
    code-editor/
    runner/
    history/
    settings/
    runtime/
  hooks/
  lib/
  types/
```

Feature-oriented organization is preferred over splitting everything purely by file type.

Potential screens:

```text
AutomationListView
AutomationRunView
AutomationInputsView
AutomationCodeView
AutomationSettingsView
AutomationHistoryView
GlobalSettingsView
```

---

## 46. Suggested Tauri Command Surface

Exact APIs can evolve, but a small interface may look conceptually like:

```text
workspace_get
automation_list
automation_get
automation_create
automation_update
automation_delete
automation_get_code
automation_save_code
runtime_get_status
runtime_install_python
environment_get_status
environment_rebuild
package_add
package_remove
automation_run
automation_cancel
run_list
run_get
```

Long-running tasks should prefer events/state updates rather than one giant blocking request where appropriate.

Example event categories:

```text
runtime-install-progress
environment-progress
run-started
run-log
run-error-log
run-finished
```

---

## 47. Automation State Model

An automation can conceptually have several independent states.

### Configuration state

```text
valid
invalid
```

### Environment state

```text
missing
preparing
ready
outdated
broken
```

### Run state

```text
idle
running
success
failed
cancelled
```

Keeping these concerns separate will make the UI easier to reason about.

---

## 48. Validation

Before running, validate:

- automation manifest exists
- entrypoint exists
- Python runtime is ready
- virtual environment is ready
- required inputs are present
- selected files/folders exist when required
- input values match basic schema constraints

Do not attempt to deeply validate arbitrary Python semantics before execution.

---

## 49. Cross-Platform Considerations

The application must support macOS, Windows, and Linux.

Avoid assumptions such as:

- `/Users/...`
- Windows drive letters
- `/tmp` always being the preferred temp location
- `/bin/sh`
- Finder-only actions

Use OS abstractions for:

- app data directories
- temporary directories
- file dialogs
- opening files
- revealing files in the platform file manager
- process spawning
- path construction

UI labels should also adapt where useful.

For example, internally the action may be `revealInFileManager`, while UI copy can eventually differ by platform.

---

## 50. macOS-Like Design Without Being macOS-Only

The product should use a calm, minimal visual language inspired by macOS productivity apps, but should not depend on Apple-only design patterns that become confusing on Windows/Linux.

Good ideas:

- sidebar navigation
- restrained borders
- compact toolbars
- lots of whitespace
- subtle separators
- minimal use of accent color
- simple typography
- lightweight dialogs
- contextual actions

Avoid trying to reproduce every AppKit component pixel-for-pixel.

The app should feel coherent on all three platforms.

---

## 51. Important Product Decision: No Compatibility Mode

Do not build support for arbitrary positional CLI arguments or legacy scripts in the MVP.

Only support the native protocol.

Reasoning:

- dramatically reduces runner complexity
- avoids an argument-mapping UI
- keeps all automations predictable
- makes AI prompt generation straightforward
- creates a stable future SDK contract
- makes workflows easier later

For an existing script, the recommended path is:

```text
Existing Python script
       ↓
Copy generated native-contract instructions
       ↓
Ask LLM to adapt script
       ↓
Paste adapted version into application
```

---

## 52. Important Product Decision: Python Only

The product architecture may eventually support multiple runtimes, but the MVP supports **Python only**.

Do not introduce Node.js abstractions into the UI prematurely.

Internally, it is still reasonable to keep `RuntimeManager` as an abstraction rather than writing tightly coupled one-off code everywhere.

For example:

```text
RuntimeManager
    └── PythonRuntime
```

Later:

```text
RuntimeManager
    ├── PythonRuntime
    └── NodeRuntime
```

But Node.js should not be visible or implemented in the MVP.

---

## 53. Important Product Decision: Automation, Not Flow

Use **Automation** as the main entity name.

Reasons:

- understandable to non-technical users
- describes the user value rather than implementation
- works for one Python script today
- still works for richer functionality later

Reserve **Flow** or **Workflow** for future multi-step compositions.

Avoid using `Script` as the primary product-facing noun.

Code can still be described as the automation's Python script in technical/settings screens.

---

## 54. Suggested First Implementation Milestones

### Milestone 0 — Bootstrap

Goal: launch an empty Tauri + React application on the development machine.

Tasks:

- initialize Tauri 2 project
- React + TypeScript frontend
- establish formatting/linting
- basic application shell
- sidebar layout

### Milestone 1 — Local workspace and automations

Goal: create/list/edit local automation metadata.

Tasks:

- resolve app data path
- create default workspace
- define automation manifest types
- create automation
- list automations
- rename automation
- delete automation
- persist `automation.json`

No Python execution yet.

### Milestone 2 — Code editing

Goal: store Python code per automation.

Tasks:

- add code screen
- integrate Monaco or CodeMirror
- read/write `main.py`
- basic unsaved state handling

### Milestone 3 — Python runtime management

Goal: application can prepare Python without external manual installation.

Tasks:

- integrate `uv`
- detect/install managed Python
- expose installation progress to frontend
- validate interpreter
- global runtime settings/status

### Milestone 4 — Isolated environments

Goal: every automation has its own working `.venv`.

Tasks:

- create environment
- get environment status
- rebuild environment
- find venv Python executable cross-platform

### Milestone 5 — Package management

Goal: user can add/remove package specs through UI.

Tasks:

- package list in manifest
- add/remove package UI
- synchronize environment
- installation progress
- failure state

### Milestone 6 — Input builder

Goal: visually define automation inputs.

Tasks:

- input schema types
- input editor UI
- generate stable IDs
- required/default values
- run form generation
- file/folder pickers

### Milestone 7 — Runner

Goal: execute native Python automation.

Tasks:

- collect form input values
- serialize JSON
- create run directory
- create result path
- spawn venv Python
- pass JSON through stdin
- pass result-path environment variable
- capture stdout/stderr
- detect exit code
- show logs

### Milestone 8 — Structured results

Goal: display useful output after execution.

Tasks:

- read result JSON
- support text/file/files/folder/json
- open generated file
- reveal file/folder
- success/failure UI

### Milestone 9 — History

Goal: retain useful local execution information.

Tasks:

- persist run metadata
- persist logs
- history list
- run detail view

### Milestone 10 — AI instruction generator

Goal: make creating/adapting Python scripts with external LLMs easy.

Tasks:

- generate prompt from automation metadata
- include native protocol
- include input schema
- include result rules
- copy to clipboard

### Milestone 11 — Polish

Goal: make the MVP feel like a real productivity application.

Tasks:

- loading states
- error states
- keyboard shortcuts
- empty states
- clean macOS-inspired visual design
- Windows/Linux layout testing
- onboarding
- runtime installation UX

---

## 55. Suggested Initial Repository Structure

One possible starting point:

```text
project/
  src/
    app/
    components/
    features/
      automations/
      inputs/
      runner/
      runtime/
      packages/
      history/
      settings/
    lib/
    types/

  src-tauri/
    src/
      commands/
      services/
        workspace.rs
        automation.rs
        runtime.rs
        environment.rs
        packages.rs
        runner.rs
        history.rs
      models/
      errors/
      lib.rs
      main.rs

  docs/
    native-protocol.md
```

This is a suggestion, not a strict requirement.

Prefer clear modules and small services over prematurely sophisticated architecture.

---

## 56. Native Protocol Documentation Should Become a First-Class File

Early in implementation, create something like:

```text
docs/native-protocol.md
```

It should eventually become the stable specification that both humans and LLMs can follow.

It should define:

- how inputs are passed
- allowed input value shapes
- environment variables
- stdout/stderr semantics
- result file location
- result schema
- exit code semantics
- file path expectations
- future versioning strategy

Consider including a protocol version in the automation manifest later:

```json
{
  "protocolVersion": 1
}
```

This would make future changes safer.

---

## 57. Example Minimal Native Automation

Assuming stdin inputs and `AUTOMATION_RESULT_PATH`:

```python
import json
import os
import sys


def main():
    inputs = json.load(sys.stdin)

    name = inputs["name"]

    print(f"Processing {name}...")

    result = {
        "type": "text",
        "value": f"Hello, {name}!"
    }

    result_path = os.environ["AUTOMATION_RESULT_PATH"]

    with open(result_path, "w", encoding="utf-8") as file:
        json.dump(result, file)


if __name__ == "__main__":
    main()
```

This boilerplate can later be replaced by the SDK.

---

## 58. Example File Processing Automation

Configured schema:

```json
[
  {
    "id": "input_files",
    "label": "Input files",
    "type": "files",
    "required": true
  },
  {
    "id": "output_folder",
    "label": "Output folder",
    "type": "folder",
    "required": true
  }
]
```

Runtime input:

```json
{
  "input_files": ["/absolute/path/a.xlsx", "/absolute/path/b.xlsx"],
  "output_folder": "/absolute/path/output"
}
```

Result:

```json
{
  "type": "file",
  "path": "/absolute/path/output/merged.xlsx",
  "message": "Files merged successfully."
}
```

---

## 59. MVP Success Criteria

The MVP succeeds if a user can perform this sequence without opening a terminal:

```text
Install app
   ↓
Install managed Python from inside app
   ↓
Create automation
   ↓
Define graphical inputs
   ↓
Paste Python code
   ↓
Add Python packages by name
   ↓
Run automation
   ↓
See logs/result
   ↓
Close app
   ↓
Open it another day
   ↓
Run the same automation again immediately
```

The critical product question is:

> Is using this application meaningfully easier than keeping `.py` files around and remembering how to execute them?

If the answer is yes, the core product is validated enough to justify further work.

---

## 60. UX Success Criteria

A non-technical user should be able to understand these concepts without documentation:

- what an automation is
- how to run one
- where to choose a file/folder
- how to see the result
- whether an execution succeeded

A semi-technical user should be able to discover:

- where the Python code lives
- where packages are configured
- how to rebuild an environment
- where logs are shown

A technical user should be able to understand the native protocol from generated instructions/documentation.

---

## 61. Engineering Principles

1. Keep the MVP local-first.
2. Prefer predictable conventions over configuration flexibility.
3. Keep the Python protocol simple.
4. Keep virtual environments disposable.
5. Do not install packages globally.
6. Do not modify the system Python installation.
7. Do not require shell usage.
8. Do not block the UI during long operations.
9. Keep Tauri/Rust system responsibilities out of React components.
10. Keep React focused on application/UI state.
11. Treat process execution and filesystem operations as backend capabilities.
12. Handle paths with cross-platform APIs.
13. Store only necessary execution history.
14. Never pretend `.venv` is a security sandbox.
15. Avoid premature cloud architecture.
16. Avoid premature workflow abstractions.
17. Prefer an excellent Run experience over a feature-rich editor.

---

## 62. Open Technical Questions to Resolve During Implementation

These are implementation questions, not blockers to the product definition.

### Runtime distribution

- Should `uv` itself be bundled with the app or downloaded on demand?
- Where should managed Python installations live on each OS?
- What is the best update strategy for the default managed Python version?

### Package synchronization

- Should package installation happen immediately when a package is added or lazily before the next run?
- How should package versions be locked/reproduced?
- Should the manifest keep requested package specs while a generated lock file remains internal?

### Process cancellation

- What is the correct cross-platform strategy for terminating child process trees?

### Logs

- Should logs stream live through Tauri events?
- What retention policy should history/logs use?

### Code editing

- Monaco vs CodeMirror?
- Should there be a minimal file abstraction later, or strictly one `main.py` per automation for MVP?

Recommendation for MVP: keep **one `main.py`** only unless real examples immediately prove multiple source files are necessary.

### Result contract

- Should missing `result.json` after exit code 0 be considered success-with-no-result or a protocol error?

Recommended initial behavior: treat it as a protocol error unless the protocol explicitly adds a `none` result type.

---

## 63. Questions That Should NOT Block Initial Development

Do not delay the MVP while deciding:

- final product name
- logo
- pricing
- company workspace architecture
- cloud provider
- AI provider
- marketplace strategy
- enterprise deployment model
- workflow canvas design
- Node.js support

These can be addressed after the local Python experience works.

---

## 64. First Product Prototype to Build

The fastest meaningful vertical slice is:

### Example automation: Merge text files

Inputs:

- multiple files
- output folder

Packages:

- none

Python script:

- read all selected text files
- concatenate contents
- write `merged.txt`
- write structured file result

This validates:

- automation creation
- file picker
- folder picker
- native JSON input
- Python process execution
- virtual environment
- result path
- result rendering
- file opening/revealing

After that, build a second example with third-party dependencies, such as an XLSX automation using `openpyxl` or `pandas`, to validate package management.

---

## 65. Product Summary for Codex

Build a Tauri 2 desktop application using React + TypeScript for the UI and Rust for local system integration.

The product organizes small Python automations for non-technical users.

Each automation:

- has one `main.py`
- has a user-defined graphical input schema
- receives all input values as one JSON object
- runs in its own `.venv`
- has its own Python package list
- uses a Python runtime managed by the application, preferably through `uv`
- writes logs to stdout/stderr
- writes its structured result to a JSON file whose path is provided by the app
- keeps basic local execution history

The main UX is a minimal two-column desktop layout inspired by macOS Notes: automation list in the sidebar and automation details on the right.

The main sections for an automation should be approximately:

```text
Run | Inputs | Code | Settings | History
```

The Run screen is the primary product experience and should be optimized for non-technical users.

Do not build compatibility mode, Node.js, login, cloud, scheduling, workflows, sharing, or built-in AI yet.

Include a feature that generates a complete prompt describing the automation input schema and native protocol so users can ask an external LLM to create or adapt Python code for the application.

The initial goal is not to create a large automation platform. The initial goal is to make running small personal Python automations dramatically simpler than keeping scripts scattered around the computer and using a terminal.

---

## 66. Recommended Starting Instruction for an AI Coding Agent

When using this document as context for Codex or another coding agent, start with a small vertical slice instead of implementing the entire specification at once.

Suggested first instruction:

```text
Read idea.md and treat it as the product specification.

Start by creating the initial Tauri 2 + React + TypeScript project architecture for the MVP.

For the first iteration, implement only:

1. the macOS-Notes-inspired two-column shell,
2. a local default workspace,
3. persistent automation manifests,
4. create/list/select/rename/delete automation,
5. tabs for Run, Inputs, Code, Settings, and History,
6. placeholder content for tabs that are not implemented yet.

Keep Rust filesystem/workspace logic behind Tauri commands and keep React focused on UI/application state.

Do not implement Python runtime management or execution yet.

Before coding, briefly inspect the repository and propose the concrete file/module structure you will use. Then implement this first vertical slice and keep the project runnable.
```

After that slice works, proceed milestone by milestone rather than asking the coding agent to generate the full product in one pass.

---

# Final Product Vision

A user should eventually be able to open the application and see something like:

```text
Automations

Merge spreadsheets
Resize product images
Rename invoices
Generate monthly report
Organize downloads
```

They click one:

```text
Merge spreadsheets

Files
[ Select files... ]

Remove duplicates
[ ✓ ]

Destination
[ Select folder... ]

[ Run ]
```

The automation executes in an isolated, app-managed Python environment.

The user never opens a terminal.

They never manually install Python.

They never manually create a virtual environment.

They never run pip.

They never remember command-line flags.

They simply use the automation as a small desktop tool.

That experience is the product.
