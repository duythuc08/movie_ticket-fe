"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerifyEmailForm } from "@/components/auth/components/VerifyEmailForm";
import { registerUser } from "@/components/auth/service/auth.service";
import { registerSchema } from "@/components/auth/schema";
import type { SignupFormState } from "@/components/auth/types";

type CompletedFields = Partial<Record<keyof SignupFormState, boolean>>;

export function SignupForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "verify">("signup");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completedFields, setCompletedFields] = useState<CompletedFields>({});
  const [form, setForm] = useState<SignupFormState>({
    firstname: "",
    lastname: "",
    phoneNumber: "",
    birthday: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompletedFields((prev) => ({ ...prev, [name]: value.trim() !== "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = registerSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Thông tin đăng ký không hợp lệ");
      return;
    }

    let formattedDate = validation.data.birthday;
    if (formattedDate) {
      const dateObj = new Date(formattedDate);
      if (isNaN(dateObj.getTime())) {
        setError("Ngày sinh không hợp lệ!");
        return;
      }
      if (dateObj >= new Date()) {
        setError("Ngày sinh không được là ngày trong tương lai!");
        return;
      }
      formattedDate = dateObj.toISOString().split("T")[0];
    }

    setLoading(true);

    try {
      await registerUser({
        username: validation.data.email,
        password: validation.data.password,
        firstname: validation.data.firstname,
        lastname: validation.data.lastname,
        phoneNumber: validation.data.phoneNumber,
        birthday: formattedDate,
      });
      setMode("verify");
    } catch (err) {
      const castErr = err as Error & { code?: number };
      if (castErr.code === 1001) {
        setError("Email đã tồn tại. Vui lòng đăng nhập.");
      } else {
        setError(castErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name: keyof SignupFormState) =>
    `transition-colors duration-200 ${
      completedFields[name]
        ? "bg-white text-black border-white"
        : "bg-white/10 text-white border-white/20 hover:border-white/40 hover:bg-white/15"
    } focus:border-primary focus:ring-1 focus:ring-primary h-11`;

  if (mode === "verify") {
    return <VerifyEmailForm email={form.email} onClose={() => router.push("/login")} />;
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
            <Link href="/" className="flex justify-center gap-2 mb-2 items-center group">
              <Film className="w-8 h-8 text-primary group-hover:scale-105 transition-transform" />
              <span className="text-2xl tracking-widest font-semibold">INFINITY CINEMA</span>
            </Link>

            <h1 className="text-center text-xl font-medium tracking-wide mb-8 mt-2">Tạo Tài Khoản</h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-white/90 mb-1.5 block">Họ</Label>
                  <Input name="firstname" value={form.firstname} onChange={handleChange} onBlur={handleBlur} required placeholder="Nguyễn" className={inputClass("firstname")} />
                </div>
                <div>
                  <Label className="text-sm text-white/90 mb-1.5 block">Tên</Label>
                  <Input name="lastname" value={form.lastname} onChange={handleChange} onBlur={handleBlur} required placeholder="Văn A" className={inputClass("lastname")} />
                </div>
              </div>

              <div>
                <Label className="text-sm text-white/90 mb-1.5 block">Số điện thoại</Label>
                <Input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} required placeholder="0123456789" className={inputClass("phoneNumber")} />
              </div>

              <div>
                <Label className="text-sm text-white/90 mb-1.5 block">Ngày sinh</Label>
                <Input 
                  type="date" 
                  name="birthday" 
                  value={form.birthday} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  required 
                  className={`${inputClass("birthday")} ${!completedFields.birthday ? "[color-scheme:dark]" : ""}`} 
                />
              </div>

              <div>
                <Label className="text-sm text-white/90 mb-1.5 block">Email</Label>
                <Input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} required placeholder="example@email.com" className={inputClass("email")} />
              </div>

              <div>
                <Label className="text-sm text-white/90 mb-1.5 block">Mật khẩu</Label>
                <Input type="password" name="password" value={form.password} onChange={handleChange} onBlur={handleBlur} required placeholder="Ít nhất 8 ký tự" className={inputClass("password")} />
              </div>

              <div>
                <Label className="text-sm text-white/90 mb-1.5 block">Xác nhận mật khẩu</Label>
                <Input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} required placeholder="Nhập lại mật khẩu" className={inputClass("confirmPassword")} />
              </div>

              {error && <p className="text-sm text-red-400 text-center font-medium bg-red-500/10 py-2 rounded-md">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full h-12 mt-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-md">
                Đăng ký
              </Button>
            </form>

            <p className="mt-6 text-sm text-center text-white/70">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-black/80 px-8 py-6 rounded-xl border border-white/10">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-white text-sm font-medium">Đang xử lý...</span>
          </div>
        </div>
      )}
    </>
  );
}
