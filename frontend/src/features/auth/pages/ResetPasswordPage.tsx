import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLink, useGo } from "@/app/router/links";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { PageProps } from "@/types/common";

const resetSchema = z.object({
  code: z.string().min(4, "4-digit or 6-digit verification code required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage({}: PageProps) {
  const toast = useToast();
  const go = useGo();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      code: "789123",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: ResetFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      toast.success("Password Updated!", "You can now sign in with your new password");
    }, 700);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="rounded-full bg-success/16 p-4 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-chalk">Password Reset Complete</h2>
          <p className="mt-2 text-xs text-chalk/70 max-w-sm">
            Your password has been changed successfully. You can now log into your Champions Club account.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => go("/login")}
        >
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold text-chalk">Reset Password</h2>
        <p className="mt-1 text-xs text-chalk/70">
          Enter the verification code sent to your email along with your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Verification Code *"
          placeholder="e.g. 789123"
          leftIcon={<ShieldCheck className="size-4" />}
          error={errors.code?.message}
          {...register("code")}
        />

        <Input
          label="New Password *"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-chalk/60 hover:text-chalk"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        <Input
          label="Confirm New Password *"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" variant="primary" loading={isLoading} className="mt-2 w-full">
          Update Password
        </Button>
      </form>

      <p className="text-center text-xs text-chalk/70">
        Remembered password?{" "}
        <AppLink to="/login" className="font-medium text-volt-400 hover:underline">
          Back to Sign in
        </AppLink>
      </p>
    </div>
  );
}
