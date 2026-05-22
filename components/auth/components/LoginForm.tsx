"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifyEmailForm } from "@/components/auth/components/VerifyEmailForm";
import { loginUser, resendOTP } from "@/components/auth/service/auth.service";
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
  const { login } = useAuth();

  const [completedFields, setCompletedFields] = useState<CompletedFields>({});
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerify, setShowVerify] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

      if (result.authenticated && result.token) {
        if (result.enabled) {
          login(result.token);
          const payload = decodeToken(result.token);
          const scope = String(payload?.scope ?? payload?.scope ?? "");
          const destination = scope.includes("ADMIN") ? "/admin" : from;
          router.replace(destination);
        } else {
          await resendOTP(form.email);
          setShowVerify(true);
        }
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black text-white overflow-hidden">
      <div className="absolute inset-3">
        <img
          src="/backgroundLogin.jpg"
          alt="Cinema background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black" />
      </div>

      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-black/50 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        <Link href={AUTH_ROUTES.HOME} className="flex items-center justify-center gap-2 mb-8">
          <Film className="w-10 h-10 text-primary" />
          <span className="text-3xl tracking-wider">INFINITY CINEMA</span>
        </Link>

        <h2 className="text-center text-2xl font-medium mb-6">Đăng Nhập</h2>

        {error && (
          <div className="mb-4 p-3 text-sm text-primary bg-red-100/10 border border-red-500/30 rounded text-center">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Nhập email..."
              value={form.email}
              onChange={handleChange}
              required
              onBlur={handleBlur}
              className={`transition-all duration-300 ${
                completedFields.email
                  ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "bg-zinc-900 text-white border-zinc-700"
              } focus:border-primary focus:ring-1 focus:ring-primary`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu..."
              value={form.password}
              onChange={handleChange}
              required
              onBlur={handleBlur}
              className={`transition-all duration-300 ${
                completedFields.password
                  ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  : "bg-zinc-900 text-white border-zinc-700"
              } focus:border-primary focus:ring-1 focus:ring-primary`}
            />
          </div>

          <div className="flex items-center justify-between text-sm mt-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 accent-primary" />
              <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
            </label>
            <Link href={AUTH_ROUTES.FORGOT_PASSWORD} className="text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full h-10 mt-8 text-lg font-semibold bg-primary hover:bg-primary/90 transition cursor-pointer"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <div className="mt-12 space-y-5 text-center text-sm text-muted-foreground">
            <p>
              Chưa có tài khoản?{" "}
              <Link href={AUTH_ROUTES.SIGNUP} className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <p className="text-xs">Demo: admin@gmail.com / 123456</p>
            <p className="text-xs">
              Trang này được bảo vệ bởi reCAPTCHA của Google.{" "}
              <Link href="#" className="underline">Privacy Policy</Link>
              {" "}và{" "}
              <Link href="#" className="underline">Terms of Service</Link>
              {" "}áp dụng.
            </p>
          </div>
        </form>
      </div>

      {showVerify && (
        <VerifyEmailForm
          email={form.email}
          onClose={() => {
            setShowVerify(false);
            router.push(AUTH_ROUTES.LOGIN);
          }}
        />
      )}
    </div>
  );
}
