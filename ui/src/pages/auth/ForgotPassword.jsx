import AuthLayout from "@/layouts/AuthLayout";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { Card, CardContent } from "@/components/ui/card";

export default function ForgotPassword() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="No worries. Enter your email and we will send you instructions to reset it."
    >
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
