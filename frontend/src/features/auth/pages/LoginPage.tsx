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
import { Eye, EyeOff, Lock, Mail, UserCheck, ShieldCheck, UserCog, X } from "lucide-react";
import { STAFF_MEMBERS } from "@/components/shared/StaffLoginModal";
import type { PageProps, PrimaryRole } from "@/types/common";
import { memberApi } from "@/services/api/memberApi";
import { memberStore } from "@/features/member/memberStore";

const loginSchema = z.object({
  email: z.string().min(1, "Email or Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage({}: PageProps) {
  const { loginAs } = useAuth();
  const go = useGo();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState<PrimaryRole>("MEMBER");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("front-desk");
  const [selectedMemberTier, setSelectedMemberTier] = useState<string>("Silver");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailCleared, setEmailCleared] = useState(false);
  const [passwordCleared, setPasswordCleared] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "rahul.sharma@example.com",
      password: "password123",
    },
  });

  const watchEmail = watch("email");
  const watchPassword = watch("password");

  const isDemoValue = (val: string | undefined) => {
    if (!val) return false;
    return [
      "rahul.sharma@example.com",
      "staff@championsclub.in",
      "admin@championsclub.in",
      "password123",
    ].includes(val.trim());
  };

  const handleEmailClick = () => {
    if (!emailCleared || isDemoValue(watchEmail)) {
      setValue("email", "");
      setEmailCleared(true);
    }
  };

  const handlePasswordClick = () => {
    if (!passwordCleared || isDemoValue(watchPassword)) {
      setValue("password", "");
      setPasswordCleared(true);
    }
  };

  const handleRoleChange = (role: PrimaryRole) => {
    setSelectedRole(role);
    setEmailCleared(false);
    setPasswordCleared(false);
    if (role === "MEMBER") {
      setValue("email", "rahul.sharma@example.com");
      setValue("password", "password123");
    } else if (role === "STAFF") {
      setValue("email", "staff@championsclub.in");
      setValue("password", "password123");
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const returnUrl = params.get("returnUrl");

    if (selectedRole === "MEMBER") {
      try {
        const res = await memberApi.login({
          login: values.email.trim(),
          password: values.password,
        });
        const memberName =
          res.fullName ||
          [res.firstName, res.lastName].filter(Boolean).join(" ") ||
          values.email.split("@")[0] ||
          "Member";
        const finalTier = res.tier || selectedMemberTier;
        loginAs("MEMBER", [], memberName, res.id, res.email || values.email.trim(), finalTier);
        memberStore.setProfileFromMemberDto({ ...res, tier: finalTier as any }, finalTier);
        toast.success("Welcome back!", `Signed in as ${memberName} (${finalTier} Member)`);
        go(returnUrl ? decodeURIComponent(returnUrl) : "/app");
      } catch (err) {
        console.warn("Backend member login failed, using local profile fallback", err);
        const fallbackName = values.email.split("@")[0] || "Member";
        loginAs("MEMBER", [], fallbackName, undefined, values.email.trim(), selectedMemberTier);
        memberStore.setProfileFromMemberDto(
          { fullName: fallbackName, email: values.email.trim(), tier: selectedMemberTier as any },
          selectedMemberTier
        );
        toast.success("Welcome back!", `Signed in as ${selectedMemberTier} Member`);
        go(returnUrl ? decodeURIComponent(returnUrl) : "/app");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Staff role
    setTimeout(() => {
      setIsLoading(false);
      const staffMember = STAFF_MEMBERS.find((s) => s.id === selectedStaffId) || STAFF_MEMBERS[0]!;
      loginAs("STAFF", staffMember.groups, staffMember.name);
      toast.success("Staff Terminal Authorized", `Signed in as ${staffMember.name} (${staffMember.roleTitle})`);
      go(returnUrl ? decodeURIComponent(returnUrl) : staffMember.home);
    }, 400);
  };


  const emailRegister = register("email");
  const passwordRegister = register("password");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-semibold text-chalk">Sign In</h2>
        <p className="mt-1 text-xs text-chalk/70">Enter your credentials to access your club account</p>
      </div>

      {/* Role Picker: [ Member | Staff ] */}
      <div>
        <label className="text-[12px] font-medium text-chalk/70 block mb-1.5">
          Select Login Type
        </label>
        <div className="grid grid-cols-2 gap-1 rounded-pill bg-chalk/8 p-1 border border-chalk/10">
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
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* If Member is chosen: Membership Tier */}
        {selectedRole === "MEMBER" && (
          <div className="rounded-[16px] border border-chalk/14 bg-court-700/60 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-chalk/70">Membership Tier</span>
              <span className="text-volt-400 font-semibold">{selectedMemberTier} Member</span>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-pill bg-chalk/8 p-1 border border-chalk/10 text-xs">
              {(["Silver", "Gold", "Platinum", "Junior"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedMemberTier(t)}
                  className={`rounded-pill py-1 text-center font-medium transition-all ${
                    selectedMemberTier === t
                      ? t === "Gold"
                        ? "bg-amber-400 text-ink-900 font-semibold shadow-sm"
                        : t === "Silver"
                        ? "bg-white text-ink-900 font-semibold shadow-sm"
                        : t === "Junior"
                        ? "bg-sky-400 text-ink-900 font-semibold shadow-sm"
                        : "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                      : "text-chalk/70 hover:text-chalk"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

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
          {...emailRegister}
          onClick={(e) => {
            emailRegister.onClick?.(e);
            handleEmailClick();
          }}
          onFocus={(e) => {
            emailRegister.onFocus?.(e);
            handleEmailClick();
          }}
          onChange={(e) => {
            setEmailCleared(true);
            emailRegister.onChange(e);
          }}
          rightElement={
            watchEmail ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setValue("email", "");
                  setEmailCleared(true);
                }}
                className="text-chalk/40 hover:text-chalk transition-colors p-1"
                tabIndex={-1}
                title="Clear field"
              >
                <X className="size-4" />
              </button>
            ) : null
          }
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          leftIcon={<Lock className="size-4" />}
          error={errors.password?.message}
          {...passwordRegister}
          onClick={(e) => {
            passwordRegister.onClick?.(e);
            handlePasswordClick();
          }}
          onFocus={(e) => {
            passwordRegister.onFocus?.(e);
            handlePasswordClick();
          }}
          onChange={(e) => {
            setPasswordCleared(true);
            passwordRegister.onChange(e);
          }}
          rightElement={
            <div className="flex items-center gap-1">
              {watchPassword ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setValue("password", "");
                    setPasswordCleared(true);
                  }}
                  className="text-chalk/40 hover:text-chalk transition-colors p-1"
                  tabIndex={-1}
                  title="Clear field"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-chalk/60 hover:text-chalk p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          }
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
          {selectedRole === "MEMBER" ? "Sign In as Member" : "Sign In as Staff"}
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
