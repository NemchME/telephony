import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type MissedCallsStateType = {
    unseenCounter: number;
    callIds: string[];
}

const initialState: MissedCallsStateType = {
  unseenCounter: 0,
  callIds: [],
};

export const missedCallsSlice = createSlice({
    name: 'missedCalls',
    initialState,
    reducers: {
        addMissedCall(state, action: PayloadAction<{ callID: string }>) {
            const callID = action.payload.callID;
            state.unseenCounter += 1;
            if (!!callID) {
                state.callIds.push(callID);
            } 
        },
        isVisibledMissedCall(state){
            state.unseenCounter = 0;
        }
    }
})

export const missedCallsActions = missedCallsSlice.actions;
export const {addMissedCall, isVisibledMissedCall} = missedCallsSlice.actions;
export const missedCallsReducer = missedCallsSlice.reducer;