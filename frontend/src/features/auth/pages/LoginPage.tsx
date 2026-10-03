import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLink, useGo } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import type { PageProps } from "@/types/common";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage({}: PageProps) {
  const { loginAs } = useAuth();
  const go = useGo();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "rahul.sharma@example.com",
      password: "password123",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginAs("MEMBER");
      toast.success("Welcome back!", `Signed in as ${values.email}`);
      go("/app");
    }, 600);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold text-chalk">Sign In</h2>
        <p className="mt-1 text-xs text-chalk/70">Enter your credentials to access your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email or Phone Number"
          placeholder="name@example.com or +91 98765..."
          leftIcon={<Mail className="size-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Password"
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
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-chalk/80">
            <input type="checkbox" className="rounded border-line bg-chalk/10 text-volt-400 focus:ring-volt-400" />
            <span>Remember me</span>
          </label>
          <AppLink to="/forgot-password" className="text-volt-400 hover:underline">
            Forgot password?
          </AppLink>
        </div>

        <Button type="submit" variant="primary" loading={isLoading} className="mt-2 w-full">
          Sign In
        </Button>
      </form>

      <p className="text-center text-xs text-chalk/70 mt-1">
        Don't have an account?{" "}
        <AppLink to="/register" className="font-medium text-volt-400 hover:underline">
          Create account
        </AppLink>
      </p>
    </div>
  );
}
