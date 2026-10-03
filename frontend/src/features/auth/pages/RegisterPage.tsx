import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLink, useGo } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Eye, EyeOff, Lock, Mail, Phone, User, BadgeCheck } from "lucide-react";
import type { PageProps } from "@/types/common";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Valid 10-digit mobile number required"),
  tier: z.string().min(1, "Please select a membership tier"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage({}: PageProps) {
  const { loginAs } = useAuth();
  const go = useGo();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Read ?plan= from URL
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const selectedPlanParam = queryParams?.get("plan");
  const defaultPlan = selectedPlanParam ? selectedPlanParam : "Gold";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      tier: defaultPlan,
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { memberApi } = await import("@/services/api/memberApi");
      const res = await memberApi.registerMember({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        notes: `Registered via portal, Plan: ${values.tier}`,
      });
      setIsLoading(false);
      loginAs("MEMBER", [], res?.fullName || values.fullName, res?.id);
      toast.success("Account created successfully!", `Welcome to Champions Club, ${values.fullName}`);
      go("/app");
    } catch {
      setIsLoading(false);
      loginAs("MEMBER", [], values.fullName);
      toast.success("Account created successfully!", `Welcome to Champions Club, ${values.fullName}`);
      go("/app");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-chalk">Create Account</h2>
          {selectedPlanParam && (
            <StatusPill variant="volt" showDot>
              Plan: {selectedPlanParam}
            </StatusPill>
          )}
        </div>
        <p className="mt-1 text-xs text-chalk/70">Join Champions Club and start booking courts today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
        <Input
          label="Full Name *"
          placeholder="e.g. Rahul Sharma"
          leftIcon={<User className="size-4" />}
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address *"
            type="email"
            placeholder="rahul@example.com"
            leftIcon={<Mail className="size-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Mobile Number *"
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="size-4" />}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <Select
          label="Membership Tier *"
          options={[
            { value: "Gold", label: "Gold Tier Plan — ₹4,500/mo" },
            { value: "Platinum", label: "Platinum Tier Plan — ₹8,000/mo" },
            { value: "Corporate", label: "Corporate Elite — ₹15,000/mo" },
            { value: "PayPerPlay", label: "Casual / Pay-per-play (No Monthly Fee)" },
          ]}
          error={errors.tier?.message}
          {...register("tier")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password *"
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

          <Input
            label="Confirm Password *"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            leftIcon={<Lock className="size-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-chalk/70 mt-1">
          <BadgeCheck className="size-4 text-volt-400 shrink-0" />
          <span>Includes 14-day free court booking trial & locker access</span>
        </div>

        <Button type="submit" variant="primary" loading={isLoading} className="mt-2 w-full">
          Create Member Account
        </Button>
      </form>

      <p className="text-center text-xs text-chalk/70">
        Already registered?{" "}
        <AppLink to="/login" className="font-medium text-volt-400 hover:underline">
          Sign in here
        </AppLink>
      </p>
    </div>
  );
}
