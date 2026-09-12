import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { forgotPassword, clearForgotPasswordState } from "@/features/auth/authSlice";
import { selectForgotPassword } from "@/features/auth/authSelectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordForm() {
  const dispatch = useDispatch();
  const { loading, error, success, message } = useSelector(selectForgotPassword);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");

  const validate = () => {
    if (!email.trim()) {
      setFieldError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("Enter a valid email address");
      return false;
    }
    setFieldError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(forgotPassword({ email: email.trim() }));
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError("");
    if (error) dispatch(clearForgotPasswordState());
  };

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-100 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="ml-2">
            {message || "If an account exists for that email, a reset link has been sent. Please check your inbox."}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link to="/signin">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Info about backend status */}
      <Alert className="bg-muted/50">
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2 text-xs leading-relaxed">
          We will attempt to contact the backend reset endpoint. If it is not yet implemented (404), you will see an informative message instead of a fake success.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={handleChange}
          aria-invalid={!!fieldError}
          autoComplete="email"
          autoFocus
        />
        {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
        <p className="text-xs text-muted-foreground">Enter your account email to receive a reset link.</p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Send reset link
      </Button>

      <div className="text-center">
        <Link to="/signin" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
