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
import { Eye, EyeOff, Lock, Mail, UserCheck, ShieldCheck, UserCog } from "lucide-react";
import { STAFF_MEMBERS } from "@/components/shared/StaffLoginModal";
import type { PageProps, PrimaryRole } from "@/types/common";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage({}: PageProps) {
  const { loginAs, loginWithCredentials } = useAuth();
  const go = useGo();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<PrimaryRole>("MEMBER");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("front-desk");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "rahul.sharma@example.com",
      password: "password123",
    },
  });

  const handleRoleChange = (role: PrimaryRole) => {
    setSelectedRole(role);
    if (role === "MEMBER") {
      setValue("email", "rahul.sharma@example.com");
    } else if (role === "STAFF") {
      setValue("email", "staff@championsclub.in");
    } else if (role === "ADMIN") {
      setValue("email", "admin@championsclub.in");
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      if (selectedRole === "MEMBER") {
        await loginWithCredentials(values.email, values.password);
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const returnUrl = params.get("returnUrl");
        toast.success("Welcome back!", "Your member account is ready.");
        go(returnUrl ? decodeURIComponent(returnUrl) : "/app/book");
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsLoading(false);

      const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
      const returnUrl = params.get("returnUrl");

      if (selectedRole === "ADMIN") {
        loginAs("ADMIN", [], "Vikramaditya (Admin)");
        toast.success("Admin Access Granted", `Signed in as Super Admin`);
        go(returnUrl ? decodeURIComponent(returnUrl) : "/owner");
      } else {
        // Staff login: resolve chosen staff member
        const staffMember = STAFF_MEMBERS.find((s) => s.id === selectedStaffId) || STAFF_MEMBERS[0]!;
        loginAs("STAFF", staffMember.groups, staffMember.name);
        toast.success("Staff Terminal Authorized", `Signed in as ${staffMember.name} (${staffMember.roleTitle})`);
        go(returnUrl ? decodeURIComponent(returnUrl) : staffMember.home);
      }
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error("Sign in failed", message || "Check your email/phone and password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold text-chalk">Sign In</h2>
        <p className="mt-1 text-xs text-chalk/70">Enter your credentials to access your club account</p>
      </div>

      {/* Role Picker: [ Member | Staff | Admin ] */}
      <div>
        <label className="text-[12px] font-medium text-chalk/70 block mb-1.5">
          Select Login Type
        </label>
        <div className="grid grid-cols-3 gap-1 rounded-pill bg-chalk/8 p-1 border border-chalk/10">
          <button
            type="button"
            onClick={() => handleRoleChange("MEMBER")}
            className={`rounded-pill py-1.5 text-center text-xs font-semibold transition-all ${
              selectedRole === "MEMBER"
                ? "bg-volt-400 text-ink-900 shadow-md"
                : "text-chalk/70 hover:text-chalk hover:bg-chalk/6"
            }`}
          >
            Member
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("STAFF")}
            className={`rounded-pill py-1.5 text-center text-xs font-semibold transition-all ${
              selectedRole === "STAFF"
                ? "bg-volt-400 text-ink-900 shadow-md"
                : "text-chalk/70 hover:text-chalk hover:bg-chalk/6"
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("ADMIN")}
            className={`rounded-pill py-1.5 text-center text-xs font-semibold transition-all ${
              selectedRole === "ADMIN"
                ? "bg-volt-400 text-ink-900 shadow-md"
                : "text-chalk/70 hover:text-chalk hover:bg-chalk/6"
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* If Staff is chosen: ask which staff member */}
        {selectedRole === "STAFF" && (
          <div className="rounded-[16px] border border-volt-400/30 bg-court-700/60 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-volt-300">
              <UserCog className="size-4" />
              <span>Which staff member should log in?</span>
            </div>
            <Select
              options={STAFF_MEMBERS.map((s) => ({
                value: s.id,
                label: `${s.name} · ${s.roleTitle} (${s.badge})`,
              }))}
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            />
            <p className="text-[11px] text-chalk/60">
              Assigned terminal:{" "}
              <span className="font-mono text-volt-400">
                {STAFF_MEMBERS.find((s) => s.id === selectedStaffId)?.home}
              </span>
            </p>
          </div>
        )}

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
          {selectedRole === "MEMBER"
            ? "Sign In as Member"
            : selectedRole === "ADMIN"
            ? "Sign In as Admin"
            : "Sign In as Staff"}
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
