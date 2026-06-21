import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Profile } from "@/types/user";

type ProfileState = Profile | null;
const initialState: ProfileState = null;

const slice = createSlice({
  name: "profile",
  initialState: initialState as ProfileState,
  reducers: {
    setProfile(state, action: PayloadAction<Profile | null>) {
      return action.payload;
    },
    clearProfile(state) {
      return null;
    },
  },
});

export const { setProfile, clearProfile } = slice.actions;
export default slice.reducer;
