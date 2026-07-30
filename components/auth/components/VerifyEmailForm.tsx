"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyOTP, resendOTP } from "@/components/auth/service/auth.service";
import { OTP_RESEND_COOLDOWN } from "@/components/auth/constants/auth.constants";

interface VerifyEmailFormProps {
  email: string;
  onClose: () => void;
  /** Gọi khi xác thực OTP thành công thay vì onClose — dùng cho luồng cần chuyển bước tiếp
   * (VD quên mật khẩu chuyển sang đặt mật khẩu mới) thay vì đóng hẳn màn hình xác thực. */
  onVerified?: () => void;
}

export function VerifyEmailForm({ email, onClose, onVerified }: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setCode(newOtp.join(""));
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        setCode(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split("").forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      setCode(newOtp.join(""));
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setMessage("Vui lòng nhập đủ 6 số mã xác thực.");
      return;
    }
    
    setLoading(true);
    setMessage("");

    try {
      await verifyOTP(email, code);
      if (onVerified) {
        setMessage("Xác thực thành công!");
        setTimeout(() => onVerified(), 1000);
      } else {
        setMessage("Xác thực thành công! Đang chuyển về đăng nhập...");
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error("Verify email error:", error);
      setMessage("Mã xác thực không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOTP(email);
      setMessage("OTP mới đã được gửi đến email của bạn.");
      setResendCooldown(OTP_RESEND_COOLDOWN);
    } catch (error) {
      console.error("Resend OTP error:", error);
      setMessage("Không thể gửi lại OTP. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white">
      <div className="absolute inset-0">
        <img
          src="/backgroundLogin.jpg"
          alt="Cinema background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="relative z-10 w-full px-4 py-8">
        <div className="mx-auto max-w-md bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl px-6 py-8 sm:px-10 sm:py-10">
          <Link href="/" className="flex justify-center gap-2 mb-2 items-center group">
            <Film className="w-8 h-8 text-primary group-hover:scale-105 transition-transform" />
            <span className="text-2xl tracking-widest font-semibold">INFINITY CINEMA</span>
          </Link>

          <h1 className="text-center text-xl font-medium tracking-wide mb-2 mt-2">Xác Thực Email</h1>
          <p className="text-sm text-center mb-8 text-white/70">
            Vui lòng nhập mã OTP đã gửi đến{" "}
            <span className="text-white font-medium">{email}</span>
          </p>

          {message && (
            <div className={`mb-6 p-3 text-sm rounded-md text-center font-medium border ${
              message.includes("thành công") 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-primary/10 border-primary/30 text-primary"
            }`}>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-sm text-white/90 mb-3 block text-center">Mã xác thực 6 số</Label>
              <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold bg-white/10 text-white border border-white/20 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/50 focus:bg-white/15 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-md"
            >
              {loading ? "Đang xác thực..." : "Xác thực"}
            </Button>

            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/60">Không nhận được mã?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`font-medium ${
                    resendCooldown > 0 ? "text-white/40 cursor-not-allowed" : "text-primary hover:underline cursor-pointer"
                  }`}
                >
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại OTP"}
                </button>
              </div>

              <Button
                type="button"
                onClick={onClose}
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 transition-colors h-10 px-6"
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
