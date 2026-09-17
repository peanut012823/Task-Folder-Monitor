# Fix for "Dependencies lock file is not found"

The GitHub Actions workflow must NOT use `cache: npm` unless the repository contains `package-lock.json`.

This project has been corrected to remove `cache: npm`. The install step is simply:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 22

- name: Install dependencies
  run: npm install
```

## If GitHub still shows the same error

1. Open `.github/workflows/build-windows.yml` in the GitHub repository.
2. Make sure there is NO line containing `cache: npm`.
3. Commit the change.
4. Re-run the workflow.

The error occurs before `npm install`, so changing React/Electron code does not fix it.

## Repository layout

`package.json` and `.github` must be at the repository root:

```text
Task-Folder-Monitor/
├── package.json
├── vite.config.js
├── index.html
├── electron/
├── src/
└── .github/
    └── workflows/
        └── build-windows.yml
```

Do not put the actual project inside another nested folder unless the workflow is changed to use that folder as its working directory.
