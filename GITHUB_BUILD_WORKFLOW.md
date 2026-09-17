# GitHub → Windows EXE Installer Workflow

## 1. Upload the project to GitHub

Create a new GitHub repository, then upload all files in this project.

The important workflow file is:

`.github/workflows/build-windows.yml`

## 2. Automatic build

The GitHub Action runs on:

- Manual trigger from GitHub Actions
- Every Git tag beginning with `v`, such as `v1.0.0`

The build process is:

```text
GitHub Repository
       ↓
Checkout source
       ↓
Install Node.js 22
       ↓
npm install
       ↓
npm run build
       ↓
electron-builder
       ↓
Windows NSIS Installer (.exe)
       ↓
GitHub Actions Artifact
```

## 3. Build manually from GitHub

After pushing the project:

1. Open the repository on GitHub.
2. Click **Actions**.
3. Select **Build Windows EXE Installer**.
4. Click **Run workflow**.
5. Wait for the Windows build to finish.
6. Open the completed workflow run.
7. Under **Artifacts**, download:
   `Task-Folder-Monitor-Windows-Installer`
8. The ZIP artifact contains the `.exe` installer.

## 4. Create a versioned release

For a public release, create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow then:

```text
v1.0.0
  ↓
Build Windows EXE
  ↓
Upload installer
  ↓
Create GitHub Release
  ↓
Attach .exe to the Release
```

Example future versions:

```text
v1.0.0
v1.1.0
v1.2.0
v2.0.0
```

## 5. Installer behavior

The generated installer is an NSIS installer with:

- Normal Windows installation wizard
- Installation-directory selection
- Start Menu shortcut
- Desktop shortcut
- x64 Windows target

The installed application can read local folders because it is an Electron desktop application.

## 6. Important GitHub setting

If GitHub Actions are disabled for the repository, go to:

Repository → Settings → Actions → General

and allow GitHub Actions to run.

## 7. Local build

If you want to build the EXE on your own Windows computer:

```bash
npm install
npm run dist
```

The installer will be created inside:

```text
release/
```

## 8. Recommended release process

For normal development:

```text
Edit React/Electron app
        ↓
Test locally
        ↓
git push
        ↓
Run workflow manually
        ↓
Download EXE artifact
```

For a finished version:

```text
Finish changes
    ↓
git commit
    ↓
git tag v1.0.0
    ↓
git push origin v1.0.0
    ↓
GitHub builds installer
    ↓
GitHub Release is created
    ↓
Download .exe
```

## 9. Future improvements

The workflow can later be extended with:

- Code signing certificate
- Automatic versioning
- Auto-update
- GitHub Releases update channel
- Windows ARM64 build
- Portable `.exe` build
- Application icon
- Installer branding
