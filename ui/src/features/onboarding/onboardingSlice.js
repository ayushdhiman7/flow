import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { onboardingService, saveOnboardingLocal, loadOnboardingLocal } from "./onboardingService";

function getErrMessage(err, fallback) {
  if (err?.message) return err.message;
  if (err?.data?.error) return err.data.error;
  return fallback;
}

// hydrate from localStorage when slice initializes (per user)
function loadPersistedForUser(userId) {
  if (!userId) return null;
  return loadOnboardingLocal(userId);
}

export const updateProfileStep = createAsyncThunk(
  "onboarding/updateProfileStep",
  async ({ name }, { rejectWithValue }) => {
    try {
      const user = await onboardingService.updateProfile({ name });
      return { user };
    } catch (err) {
      return rejectWithValue({ message: getErrMessage(err, "Failed to update profile"), status: err.status, data: err.data });
    }
  }
);

export const createWorkspaceStep = createAsyncThunk(
  "onboarding/createWorkspaceStep",
  async ({ name }, { rejectWithValue }) => {
    try {
      const workspace = await onboardingService.createWorkspace({ name });
      return { workspace };
    } catch (err) {
      return rejectWithValue({ message: getErrMessage(err, "Failed to create workspace"), status: err.status, data: err.data, details: err.details });
    }
  }
);

export const fetchWorkspaces = createAsyncThunk(
  "onboarding/fetchWorkspaces",
  async (_, { rejectWithValue }) => {
    try {
      const workspaces = await onboardingService.getWorkspaces();
      return { workspaces };
    } catch (err) {
      return rejectWithValue({ message: getErrMessage(err, "Failed to fetch workspaces"), status: err.status });
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  "onboarding/completeOnboarding",
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const payload = { completed: true, completedAt: new Date().toISOString(), data, currentStep: 4 };
      saveOnboardingLocal(userId, payload);
      return payload;
    } catch (err) {
      return rejectWithValue({ message: getErrMessage(err, "Failed to complete onboarding") });
    }
  }
);

const STEPS = ["welcome", "profile", "workspace", "preferences", "complete"];
const TOTAL_STEPS = STEPS.length;

const initialState = {
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  steps: STEPS,
  data: {
    profile: { name: "" },
    workspace: { name: "" },
    preferences: { useCase: "", teamSize: "" },
  },
  loading: false,
  error: null,
  completed: false,
  workspace: null, // created workspace
  workspaces: [],
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setStep(state, action) {
      const next = action.payload;
      if (next >= 0 && next < state.totalSteps) state.currentStep = next;
    },
    nextStep(state) {
      if (state.currentStep < state.totalSteps - 1) state.currentStep += 1;
    },
    prevStep(state) {
      if (state.currentStep > 0) state.currentStep -= 1;
    },
    updateData(state, action) {
      // shallow merge for data sections: { profile: {...}, workspace: {...}, preferences: {...} }
      const patch = action.payload;
      if (patch.profile) state.data.profile = { ...state.data.profile, ...patch.profile };
      if (patch.workspace) state.data.workspace = { ...state.data.workspace, ...patch.workspace };
      if (patch.preferences) state.data.preferences = { ...state.data.preferences, ...patch.preferences };
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    hydrateForUser(state, action) {
      const userId = action.payload;
      const persisted = loadPersistedForUser(userId);
      if (persisted?.completed) {
        state.completed = true;
        if (persisted.data) state.data = { ...state.data, ...persisted.data };
        // do not restore last step - keep wizard ready for fresh start but mark completed for routing
        state.currentStep = 0;
      } else if (persisted?.data) {
        state.data = { ...state.data, ...persisted.data };
        if (typeof persisted.currentStep === "number") state.currentStep = persisted.currentStep;
      }
    },
    persistLocal(state, action) {
      const userId = action.payload;
      saveOnboardingLocal(userId, { completed: state.completed, data: state.data, currentStep: state.currentStep });
    },
    resetOnboarding(state) {
      // keep workspaces but reset steps
      state.currentStep = 0;
      state.data = {
        profile: { name: "" },
        workspace: { name: "" },
        preferences: { useCase: "", teamSize: "" },
      };
      state.error = null;
      state.loading = false;
      state.completed = false;
      state.workspace = null;
    },
    markCompletedLocal(state) {
      state.completed = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfileStep.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateProfileStep.fulfilled, (state) => { state.loading = false; })
      .addCase(updateProfileStep.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(createWorkspaceStep.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createWorkspaceStep.fulfilled, (state, action) => { state.loading = false; state.workspace = action.payload.workspace; })
      .addCase(createWorkspaceStep.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => { state.loading = false; state.workspaces = action.payload.workspaces; })
      .addCase(fetchWorkspaces.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; })

      .addCase(completeOnboarding.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(completeOnboarding.fulfilled, (state) => { state.loading = false; state.completed = true; state.error = null; })
      .addCase(completeOnboarding.rejected, (state, action) => { state.loading = false; state.error = action.payload?.message; });
  },
});

export const { setStep, nextStep, prevStep, updateData, setError, clearError, hydrateForUser, persistLocal, resetOnboarding, markCompletedLocal } = onboardingSlice.actions;
export default onboardingSlice.reducer;
