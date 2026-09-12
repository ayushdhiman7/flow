import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeAuth } from "@/features/auth/authSlice";
import { selectAuthInitialized, selectUser } from "@/features/auth/authSelectors";
import { hydrateForUser } from "@/features/onboarding/onboardingSlice";
import AppRoutes from "@/routes/AppRoutes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

export default function App() {
  const dispatch = useDispatch();
  const initialized = useSelector(selectAuthInitialized);
  const user = useSelector(selectUser);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    const uid = user?._id || user?.id;
    if (uid) dispatch(hydrateForUser(uid));
  }, [dispatch, user]);

  if (!initialized) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
