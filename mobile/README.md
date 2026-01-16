# Mobile (Expo) — Run instructions

This project uses Expo. If you see an error like "Error: Cannot find module '<project>/expo'" when trying `npx run expo`, it is caused by using the wrong command.

Correct ways to run the app:

- Use npm script (recommended):

```powershell
cd mobile
npm start
```

- Or run the local `expo` binary via npx:

```powershell
cd mobile
npx expo start
```

- Or use the explicit npm run alias that was added:

```powershell
cd mobile
npm run expo
```

Why you saw the error
---------------------

`npx run expo` is not a valid pattern for `npx`. The `run` in `npx run expo` makes Node look for a local file called `expo` (e.g., `./expo`) and tries to require it, which results in the "Cannot find module .../expo" error. Use `npm run <script>` (npm), `yarn run <script>` (yarn) or `npx <pkg>` (npx) instead.
