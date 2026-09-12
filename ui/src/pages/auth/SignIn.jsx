import AuthLayout from "@/layouts/AuthLayout";
import SignInForm from "@/features/auth/components/SignInForm";
import { Card, CardContent } from "@/components/ui/card";

export default function SignIn() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your Flow workspace to continue.">
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <SignInForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
