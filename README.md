# Burak React

React + Redux + TypeScript, running with Vite. Migrated from burak-react-master.

```sh
npm install
npm run dev
```

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
