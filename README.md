# Task Folder Monitor — Electron Desktop App

This version is an Electron desktop application so it can work with real local Windows folders and files.

## What it does

- Main task table matching the supplied workflow.
- Task name is editable.
- Status choices:
  - In progress — light blue
  - In Vetting — light yellow
  - For Revision — dark blue
  - For Upload — purple
  - Completed — green
- Priority, deadline and notes are manually editable.
- Click a task to open the inspection screen.
- Select a real local source folder.
- Scans:
  - source root for `.ai`
  - `Links` for `.psd` / `.psb`
  - `Export` for `.jpg` / `.jpeg` / `.png`
  - `Fonts` for `.ttf` / `.otf` / `.woff` / `.woff2`
- Open buttons use the Windows default application, so `.ai` can open in Adobe Illustrator if Illustrator is the default handler.
- Rename files directly on disk.
- Select files and add a date.
- Exact date naming format:
  - Before: `20260511 - 2-Pack Soothe Changing Pad Covers (Cameo) Main_1A.ext`
  - After: `3-Pack Soothe (Wren) Swaddle Wraps (Glacier, Large) Listing_2 - 20260903.ext`
- Workfile location can be selected or set with drag/drop.
- Task data persists in localStorage.

## Run in development

Install Node.js LTS first, then:

```bash
npm install
npm run dev
```

## Build the React renderer

```bash
npm run build
```

## Package as a Windows installer

This source is ready for Electron packaging. The ZIP intentionally keeps the project editable. To produce an `.exe` installer, add Electron Forge or electron-builder and run its Windows packaging command.

## Important

Electron can access local folders because it is a desktop application. It still does not bypass Windows permissions. Files/folders that the current Windows account cannot access will not be readable.

The app does not move or restructure your `Links`, `Export`, or `Fonts` folders. Rename/date operations rename files inside their existing folders.
