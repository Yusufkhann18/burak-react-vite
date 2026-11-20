# Burak React

React + Redux + TypeScript, running with Vite. Migrated from burak-react-master.

```sh
npm install
npm run dev
```

## Backend

Run the [Burak backend](https://github.com/Yusufkhann18/Burak) with a MongoDB
connection before opening the catalog. Vite dev and preview forward `/api/*`
and `/uploads/*` to `http://localhost:3003`. Set `BURAK_BACKEND_URL` in
`.env.local` if the backend uses another address.

For a static frontend deployment, configure the web host to forward `/api/*`
to the backend with `/api` removed and `/uploads/*` with the path intact.
Alternatively, set `VITE_BURAK_API_BASE_URL` at build time to the URL of a
backend that permits requests from the frontend origin.

Entry: `src/index.tsx`. Page: `src/app/App.tsx`. Styles: `src/css/`.

Redux: `src/features/counter/counterSlice.ts` provides `increment`, `decrement`,
`incrementByAmount(number)`, and `reset`. Its reducer is registered as `counter`
in `src/app/store.ts`, with an initial value of `0`.
Use `useAppSelector(selectCount)` to read the count and
`useAppDispatch()` to dispatch these actions from a component.
The counter is an initial Redux example; it is not displayed on the HOME page
and its value resets when the page reloads.

```sh
npm run build
npm test
```
