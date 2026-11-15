import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../../app/store"

export type CounterState = {
  value: number
}

const initialState: CounterState = { value: 0 }

const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment(state) {
      state.value += 1
    },
    decrement(state) {
      state.value -= 1
    },
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload
    },
    reset() {
      return initialState
    },
  },
})

export const { increment, decrement, incrementByAmount, reset } =
  counterSlice.actions
export const selectCount = (state: RootState) => state.counter.value
export default counterSlice.reducer
