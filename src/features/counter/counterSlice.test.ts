import { configureStore } from "@reduxjs/toolkit"
import { describe, expect, it } from "vitest"
import counterReducer, {
  decrement,
  increment,
  incrementByAmount,
  reset,
  selectCount,
} from "./counterSlice"
import { store } from "../../app/store"

describe("counter store integration", () => {
  it("registers the counter reducer in the application store", () => {
    expect(selectCount(store.getState())).toBe(0)
  })

  it("dispatches counter actions without mutating previous state and resets to zero", () => {
    const testStore = configureStore({ reducer: { counter: counterReducer } })
    const previousState = testStore.getState()

    testStore.dispatch(increment())
    expect(selectCount(testStore.getState())).toBe(1)
    testStore.dispatch(incrementByAmount(5))
    expect(selectCount(testStore.getState())).toBe(6)
    testStore.dispatch(decrement())
    expect(selectCount(testStore.getState())).toBe(5)
    expect(previousState.counter.value).toBe(0)
    testStore.dispatch(reset())
    expect(selectCount(testStore.getState())).toBe(0)
  })
})
