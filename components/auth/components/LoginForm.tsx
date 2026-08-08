"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifyEmailForm } from "@/components/auth/components/VerifyEmailForm";
import { loginUser } from "@/components/auth/service/auth.service";
import { useAuth } from "@/context/AuthContext";
import { AUTH_ROUTES, ERROR_MESSAGES } from "@/components/auth/constants/auth.constants";
import { decodeToken } from "@/components/auth/utils/auth.utils";
import { loginSchema } from "@/components/auth/schema";
import type { LoginFormState } from "@/components/auth/types";

type CompletedFields = Partial<Record<keyof LoginFormState, boolean>>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? AUTH_ROUTES.HOME;
  const reason = searchParams.get("reason");
  const { login } = useAuth();

  useEffect(() => {
    if (reason === "session-expired") {
      toast.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }, [reason]);

  const [completedFields, setCompletedFields] = useState<CompletedFields>({});
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error on typing
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompletedFields((prev) => ({ ...prev, [name]: value.trim() !== "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = loginSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await loginUser(form.email, form.password);

      if (result.authenticated && result.enabled && result.token) {
        login(result.token, result.refreshToken);
        const payload = decodeToken(result.token);
        const scope = String(payload?.scope ?? payload?.scope ?? "");
        const destination = scope.includes("ADMIN") ? "/admin" : from;
        router.replace(destination);
      } else if (result.authenticated && !result.enabled) {
        // Backend đã tự gửi lại OTP khi phát hiện tài khoản chưa xác thực (không cấp
        // token cho tới khi verify) — chỉ cần chuyển sang màn hình nhập mã.
        setShowVerify(true);
      } else {
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra server.");
      } else {
        setError((err as Error).message || ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name: keyof LoginFormState) =>
    `transition-colors duration-200 ${
      completedFields[name]
        ? "bg-white text-black border-white"
        : "bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15"
    } focus:border-primary focus:ring-1 focus:ring-primary h-11`;

  if (showVerify) {
    return (
      <VerifyEmailForm
        email={form.email}
        onClose={() => {
          setShowVerify(false);
          router.push(AUTH_ROUTES.LOGIN);
        }}
      />
    );
  }

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center text-white">
        <div className="absolute inset-0">
          <img src="/backgroundLogin.jpg" className="absolute inset-0 w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 w-full px-4 py-8">
          <div className="mx-auto max-w-md bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-6 py-8 sm:px-10 sm:py-10">
            <Link href={AUTH_ROUTES.HOME} className="flex justify-center gap-2 mb-2 items-center group">
              <Film className="w-8 h-8 text-primary group-hover:scale-105 transition-transform" />
              <span className="text-2xl tracking-widest font-semibold">INFINITY CINEMA</span>
            </Link>

            <h1 className="text-center text-xl font-medium tracking-wide mb-8 mt-2">Đăng Nhập</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm text-white/90 mb-1.5 block">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Nhập email..."
                  value={form.email}
                  onChange={handleChange}
                  required
                  onBlur={handleBlur}
                  className={inputClass("email")}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm text-white/90 mb-1.5 block">Mật khẩu</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={form.password}
                  onChange={handleChange}
                  required
                  onBlur={handleBlur}
                  className={inputClass("password")}
                />
              </div>

              <div className="flex items-center justify-between text-sm mt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none text-white/70">
                  <input type="checkbox" className="w-4 h-4 accent-primary rounded bg-white/10 border-white/20" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link href={AUTH_ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>

              {error && (
                <div className="text-sm text-red-400 text-center font-medium bg-red-500/10 py-2 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-md"
              >
                Đăng nhập
              </Button>

              <div className="mt-8 space-y-4 text-center text-sm text-white/70">
                <p>
                  Chưa có tài khoản?{" "}
                  <Link href={AUTH_ROUTES.SIGNUP} className="text-primary font-medium hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
                <p className="text-[11px] text-white/40 leading-relaxed max-w-xs mx-auto">
                  Trang này được bảo vệ bởi reCAPTCHA của Google.{" "}
                  <Link href="#" className="underline hover:text-white/70">Privacy Policy</Link>
                  {" "}và{" "}
                  <Link href="#" className="underline hover:text-white/70">Terms of Service</Link>
                  {" "}áp dụng.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-black/80 px-8 py-6 rounded-xl border border-white/10">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">Đang đăng nhập...</span>
          </div>
        </div>
      )}
    </>
  );
}
