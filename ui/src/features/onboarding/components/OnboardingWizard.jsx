import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, ArrowRight, LogOut, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { selectUser } from "@/features/auth/authSelectors";
import { setUser, logout } from "@/features/auth/authSlice";
import {
  selectCurrentStep,
  selectTotalSteps,
  selectOnboardingData,
  selectOnboardingLoading,
  selectOnboardingError,
  selectOnboardingCompleted,
  selectOnboardingWorkspace,
} from "@/features/onboarding/onboardingSelectors";
import {
  nextStep,
  prevStep,
  updateData,
  clearError,
  hydrateForUser,
  persistLocal,
} from "@/features/onboarding/onboardingSlice";
import {
  updateProfileStep,
  createWorkspaceStep,
  fetchWorkspaces,
  completeOnboarding,
} from "@/features/onboarding/onboardingSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import ProgressIndicator from "./ProgressIndicator";
import WelcomeStep from "./WelcomeStep";
import ProfileStep from "./ProfileStep";
import WorkspaceStep from "./WorkspaceStep";
import PreferencesStep from "./PreferencesStep";
import CompleteStep from "./CompleteStep";

export default function OnboardingWizard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const currentStep = useSelector(selectCurrentStep);
  const totalSteps = useSelector(selectTotalSteps);
  const data = useSelector(selectOnboardingData);
  const loading = useSelector(selectOnboardingLoading);
  const serverError = useSelector(selectOnboardingError);
  const completed = useSelector(selectOnboardingCompleted);
  const createdWorkspace = useSelector(selectOnboardingWorkspace);

  const [fieldErrors, setFieldErrors] = useState({});
  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId) {
      dispatch(hydrateForUser(userId));
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (user?.name && !data.profile.name) dispatch(updateData({ profile: { name: user.name } }));
  }, [user?.name, data.profile.name, dispatch]);

  useEffect(() => {
    if (userId) dispatch(persistLocal(userId));
  }, [data, currentStep, userId, dispatch]);

  // If already completed, redirect to dashboard instead of showing last step
  useEffect(() => {
    if (completed) navigate("/dashboard", { replace: true });
  }, [completed, navigate]);

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!data.profile.name.trim()) errors.name = "Name is required";
      else if (data.profile.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
      else if (data.profile.name.trim().length > 50) errors.name = "Name must be at most 50 characters";
    }
    if (step === 2) {
      if (!data.workspace.name.trim()) errors.name = "Workspace name is required";
      else if (data.workspace.name.trim().length > 50) errors.name = "Workspace name must be at most 50 characters";
    }
    if (step === 3) {
      if (!data.preferences.useCase) errors.useCase = "Please select a use case";
      if (!data.preferences.teamSize) errors.teamSize = "Please select your team size";
    }
    return errors;
  };

  const handleNext = async () => {
    setFieldErrors({});
    if (serverError) dispatch(clearError());
    if ([1, 2, 3].includes(currentStep)) {
      const errors = validateStep(currentStep);
      if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    }
    if (currentStep === 1) {
      const trimmed = data.profile.name.trim();
      if (trimmed !== user?.name) {
        const res = await dispatch(updateProfileStep({ name: trimmed }));
        if (updateProfileStep.rejected.match(res)) return;
        dispatch(setUser({ ...user, name: trimmed }));
      }
    }
    if (currentStep === 2) {
      const trimmed = data.workspace.name.trim();
      const res = await dispatch(createWorkspaceStep({ name: trimmed }));
      if (createWorkspaceStep.rejected.match(res)) return;
    }
    if (currentStep === 4) {
      const uid = userId || user?._id || user?.id;
      const res = await dispatch(completeOnboarding({ userId: uid, data }));
      // Navigate even if save fails — don't block user on localStorage error
      if (completeOnboarding.fulfilled.match(res) || completeOnboarding.rejected.match(res)) {
        navigate("/dashboard", { replace: true });
      }
      return;
    }
    dispatch(nextStep());
  };

  const handleBack = () => {
    setFieldErrors({});
    if (serverError) dispatch(clearError());
    dispatch(prevStep());
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/signin", { replace: true });
  };

  if (completed) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#fbfcfe] p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin"/> Redirecting to dashboard…</div>
      </div>
    );
  }

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="min-h-screen bg-[#fbfcfe] flex flex-col">
      {/* Header */}
      <header className="h-[64px] border-b border-zinc-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-20">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 text-white grid place-items-center shadow-sm">
              <span className="text-[13px] font-semibold tracking-tight">◈</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight">Flow</span>
            <span className="hidden sm:inline-flex ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-white tracking-widest">ONBOARDING</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-6 px-2.5 rounded-full bg-zinc-900 text-white grid place-items-center text-xs font-medium">{currentStep + 1} / {totalSteps}</span>
              <span>{["Welcome","Profile","Workspace","Preferences","Done"][currentStep]}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl h-8 gap-1.5 text-zinc-500 hover:text-zinc-900">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-6 sm:py-10 px-4">
        <div className="max-w-[640px] mx-auto space-y-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 sm:p-5 space-y-3">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
            <Progress value={progressPercent} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/> Secure & private</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5"/> ~2 min</span>
            </div>
          </div>

          {serverError && (
            <Alert variant="destructive" className="rounded-2xl py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2 text-sm">{serverError}</AlertDescription>
            </Alert>
          )}

          <Card className="rounded-2xl border-zinc-200 shadow-sm overflow-hidden bg-white">
            <div className="h-1.5 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700" />
            <CardContent className="p-6 sm:p-8">
              {currentStep === 0 && <WelcomeStep user={user} onNext={handleNext} />}
              {currentStep === 1 && <ProfileStep user={user} data={data} onChange={(patch) => dispatch(updateData(patch))} fieldError={fieldErrors} />}
              {currentStep === 2 && <WorkspaceStep data={data} onChange={(patch) => dispatch(updateData(patch))} fieldError={fieldErrors} />}
              {currentStep === 3 && <PreferencesStep data={data} onChange={(patch) => dispatch(updateData(patch))} fieldError={fieldErrors} />}
              {currentStep === 4 && <CompleteStep workspace={createdWorkspace || { name: data.workspace.name }} preferences={data.preferences} onNext={handleNext} />}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handleBack} disabled={isFirst || loading} className={`rounded-xl h-10 px-5 ${isFirst ? "invisible" : ""}`}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {currentStep === 0 ? (
              <Button onClick={handleNext} className="ml-auto rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-6 shadow-sm">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={loading} className="ml-auto rounded-xl bg-zinc-900 hover:bg-zinc-800 h-10 px-6 min-w-32 shadow-sm">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLast ? "Go to dashboard" : "Continue"}
                {!loading && !isLast && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-zinc-500">You can change these later in Settings. Your data is stored securely.</p>
            <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5"><Sparkles className="h-3 w-3"/> Trusted by teams worldwide</p>
          </div>
        </div>
      </main>
    </div>
  );
}
