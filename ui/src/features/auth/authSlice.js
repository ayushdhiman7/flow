import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "./authService";

// Helper to extract error message
function getErrMessage(err, fallback = "Something went wrong") {
  if (err?.message) return err.message;
  if (err?.data?.error) return err.data.error;
  return fallback;
}

export const signUp = createAsyncThunk(
  "auth/signUp",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.signUp({ name, email, password });
      return data; // { user, accessToken }
    } catch (err) {
      return rejectWithValue({
        message: getErrMessage(err, "Registration failed"),
        status: err.status || 0,
        data: err.data,
        details: err.details,
      });
    }
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authService.signIn({ email, password });
      return data;
    } catch (err) {
      return rejectWithValue({
        message: getErrMessage(err, "Sign in failed"),
        status: err.status || 0,
        data: err.data,
        details: err.details,
      });
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (err) {
      // Even if backend fails, we still clear client state, but report error
      return rejectWithValue({
        message: getErrMessage(err, "Logout failed"),
        status: err.status || 0,
      });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await authService.forgotPassword({ email });
      return data;
    } catch (err) {
      return rejectWithValue({
        message: getErrMessage(err, "Failed to send reset link"),
        status: err.status || 0,
        data: err.data,
      });
    }
  }
);

export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      // First try to get current user via /me (cookie auth)
      const user = await authService.getMe();
      return { user };
    } catch (err) {
      // If 401, try refresh once then retry /me
      if (err.status === 401) {
        try {
          const refreshData = await authService.refresh();
          const user = await authService.getMe();
          return { user, accessToken: refreshData.accessToken || null };
        } catch (refreshErr) {
          // refresh failed => unauthenticated
          return rejectWithValue({
            message: refreshErr.message || "Session expired",
            status: refreshErr.status,
          });
        }
      }
      // Other errors (network, 500) -> treat as unauthenticated for now but preserve error
      return rejectWithValue({
        message: getErrMessage(err, "Failed to initialize auth"),
        status: err.status || 0,
      });
    }
  }
);

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  initialized: false,
  forgotPassword: {
    loading: false,
    error: null,
    success: false,
    message: null,
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearForgotPasswordState(state) {
      state.forgotPassword = { loading: false, error: null, success: false, message: null };
    },
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    // signUp
    builder
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        // Backend automatically authenticates on register (sets cookies + returns user)
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      });

    // signIn
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Invalid credentials";
      });

    // logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Even if API failed, clear client state
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null; // don't keep logout error as auth error
      });

    // forgotPassword
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.forgotPassword.loading = true;
        state.forgotPassword.error = null;
        state.forgotPassword.success = false;
        state.forgotPassword.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPassword.loading = false;
        state.forgotPassword.success = true;
        state.forgotPassword.message = action.payload?.message || "If an account exists, a reset link has been sent.";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPassword.loading = false;
        state.forgotPassword.error = action.payload?.message || "Failed to send reset link";
        // Handle case where backend has no forgot-password endpoint (404)
        if (action.payload?.status === 404) {
          state.forgotPassword.error = "Password reset is not available yet. Please contact support.";
        }
      });

    // initializeAuth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        if (action.payload.accessToken) state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.initialized = true;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.initialized = true;
        // Don't set error for "not authenticated" initial state as blocking error
        state.error = null;
      });
  },
});

export const { clearError, clearForgotPasswordState, setUser } = authSlice.actions;
export default authSlice.reducer;
