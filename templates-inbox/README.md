# Drop folder

Drop any `.html` prototype into this folder, then run:

```bash
npm run import
```

Each new file becomes a template in the hub (re-running is safe — already-imported
files are skipped). You can also import from anywhere:

```bash
npm run import -- "/path/to/some/folder"
npm run import -- "/path/to/one-file.html"
```

Files dropped here are git-ignored (only this README is committed).
