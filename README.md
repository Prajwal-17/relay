# Getting Started

### Stack

- Electron JS
- Vite
- React
- Better-sqlite3
- Drizzle

### Installation

Clone Repo

```bash
$ git clone https://github.com/Prajwal-17/pos.git
```

Install dependencies

```bash
$ pnpm install
```

### Devlopment

```bash
$ pnpm dev
```

### Build

```bash
# Windows
$ pnpm run build:win

# Linux
$ pnpm run build:linux

```

The packaged app will be in `dist/` folder.

### DB Paths

- **LINUX** - `/home/prajwal/.config/<dbfolder>/<dbname>.db`
- **WINDOWS** - `C:\Users\<username>\AppData\Roaming\<appfolder>\<dbname>.db`

### Docs & References

##### Electron Auto-update

- https://www.electron.build/configuration

- https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6

- Basic Example - https://github.com/iffy/electron-updater-example/blob/master/main.js

- Example - https://github.com/iffy/electron-updater-example/blob/master/main.js
