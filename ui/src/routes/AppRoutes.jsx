import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthInitialized, selectIsAuthenticated } from "@/features/auth/authSelectors";
import { selectOnboardingCompleted } from "@/features/onboarding/onboardingSelectors";
import { isOnboardingCompletedLocal } from "@/features/onboarding/onboardingService";
import { selectUser } from "@/features/auth/authSelectors";

import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import BoardPage from "@/pages/Board";
import NotesPage from "@/pages/Notes";
import ChatPage from "@/pages/Chat";
import AppLayout from "@/layouts/AppLayout";

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector(selectAuthInitialized);
  if (!initialized) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector(selectAuthInitialized);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
  const user = useSelector(selectUser);
  const uid = user?._id || user?.id;
  const completedSync = isAuthenticated && uid ? isOnboardingCompletedLocal(uid) : false;
  const completed = onboardingCompleted || completedSync;
  if (!initialized) return null;
  if (isAuthenticated) return <Navigate to={completed ? "/dashboard" : "/onboarding"} replace />;
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/calendar" element={<div className="p-8 text-center text-sm text-muted-foreground">Calendar — coming soon</div>} />
        <Route path="/settings" element={<div className="p-8 text-center text-sm text-muted-foreground">Settings — coming soon</div>} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const initialized = useSelector(selectAuthInitialized);
  const onboardingCompleted = useSelector(selectOnboardingCompleted);
  const user = useSelector(selectUser);
  const uid = user?._id || user?.id;
  const completedSync = isAuthenticated && uid ? isOnboardingCompletedLocal(uid) : false;
  const completed = onboardingCompleted || completedSync;
  if (!initialized) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <Navigate to={completed ? "/dashboard" : "/onboarding"} replace />;
}
