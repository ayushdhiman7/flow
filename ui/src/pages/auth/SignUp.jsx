import AuthLayout from "@/layouts/AuthLayout";
import SignUpForm from "@/features/auth/components/SignUpForm";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUp() {
  return (
    <AuthLayout title="Create your account" subtitle="Start organizing your work in Flow — it takes less than a minute.">
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <SignUpForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
