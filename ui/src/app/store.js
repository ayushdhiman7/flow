import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import onboardingReducer from "@/features/onboarding/onboardingSlice";
import workspaceReducer from "@/features/workspace/workspaceSlice";
import boardReducer from "@/features/board/boardSlice";
import notesReducer from "@/features/notes/notesSlice";
import chatReducer from "@/features/chat/chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    workspace: workspaceReducer,
    board: boardReducer,
    notes: notesReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: import.meta.env.DEV,
});
