import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLink, useGo } from "@/app/router/links";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { PageProps } from "@/types/common";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage({}: PageProps) {
  const toast = useToast();
  const go = useGo();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = (values: ForgotFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setUserEmail(values.email);
      setSubmitted(true);
      toast.info("Password Reset Link Sent", `Check ${values.email} for reset instructions`);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="rounded-full bg-volt-400/16 p-4 text-volt-400">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-chalk">Check Your Email</h2>
          <p className="mt-2 text-xs text-chalk/70 leading-relaxed max-w-sm">
            We have sent password recovery instructions and a 6-digit code to{" "}
            <span className="font-semibold text-chalk">{userEmail}</span>.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => go("/reset-password")}
        >
          Enter Reset Code & Set Password
        </Button>

        <AppLink to="/login" className="inline-flex items-center gap-1.5 text-xs text-chalk/70 hover:text-chalk">
          <ArrowLeft className="size-3.5" /> Back to Sign In
        </AppLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 text-volt-400 mb-1">
          <KeyRound className="size-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Account Recovery</span>
        </div>
        <h2 className="text-2xl font-semibold text-chalk">Forgot Password?</h2>
        <p className="mt-1 text-xs text-chalk/70">
          No worries. Enter your registered email and we'll send you a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Registered Email Address"
          placeholder="rahul@example.com"
          leftIcon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Button type="submit" variant="primary" loading={isLoading} className="mt-2 w-full">
          Send Recovery Link
        </Button>
      </form>

      <p className="text-center text-xs text-chalk/70">
        Remembered your password?{" "}
        <AppLink to="/login" className="font-medium text-volt-400 hover:underline">
          Back to Sign in
        </AppLink>
      </p>
    </div>
  );
}
