import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword } from "@/features/auth/authSlice";
import { selectForgotPassword } from "@/features/auth/authSelectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const forgotSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export default function ForgotPasswordForm() {
  const dispatch = useDispatch();
  const { loading, error, success, message } = useSelector(selectForgotPassword);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    await dispatch(forgotPassword({ email: data.email.trim() }));
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
          {...register("email")}
          aria-invalid={!!errors.email}
          autoComplete="email"
          autoFocus
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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
