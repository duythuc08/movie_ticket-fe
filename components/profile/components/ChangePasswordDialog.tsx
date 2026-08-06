"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { changePasswordSchema } from "@/components/profile/schema";
import { getErrorMessage } from "@/lib/errors";
import { Eye, EyeOff, Lock, KeyRound, ShieldCheck, Check, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: Props) {
  const { token } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Password visibility states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Field errors state
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleClose = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = changePasswordSchema.safeParse({
      currentPassword: oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: typeof errors = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof typeof errors] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api-proxy/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok || data.code !== 1000) {
        throw new Error(getErrorMessage(data?.code, data?.message || "Đổi mật khẩu thất bại"));
      }

      toast.success("Đổi mật khẩu thành công");
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi đổi mật khẩu");
    } finally {
      setSaving(false);
    }
  };

  // Live password validation checks
  const isMinLength = newPassword.length >= 8;
  const hasLowerAndUpper = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 overflow-hidden">
        <form onSubmit={handleSave} className="space-y-6">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 animate-pulse">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">Đổi mật khẩu</DialogTitle>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Nhập mật khẩu hiện tại và mật khẩu mới để tăng cường bảo mật cho tài khoản của bạn.
              </p>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Old Password */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                Mật khẩu hiện tại <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                <Input
                  type={showOld ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                  }}
                  className={`pl-9 pr-10 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30 transition-all ${
                    errors.currentPassword ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/90 transition-colors"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                Mật khẩu mới <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới của bạn"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }}
                  className={`pl-9 pr-10 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30 transition-all ${
                    errors.newPassword ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/90 transition-colors"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.newPassword}
                </p>
              )}

              {/* Real-time Checklist */}
              {newPassword && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-[11px] space-y-2 mt-2 transition-all animate-in fade-in duration-200">
                  <p className="font-semibold text-muted-foreground/90">Yêu cầu độ mạnh mật khẩu:</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-2">
                      {isMinLength ? (
                        <Check size={13} className="text-emerald-500 stroke-[3px]" />
                      ) : (
                        <X size={13} className="text-muted-foreground/50" />
                      )}
                      <span className={isMinLength ? "text-emerald-600 font-medium" : "text-muted-foreground/80"}>
                        Tối thiểu 8 ký tự
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasLowerAndUpper ? (
                        <Check size={13} className="text-emerald-500 stroke-[3px]" />
                      ) : (
                        <X size={13} className="text-muted-foreground/50" />
                      )}
                      <span className={hasLowerAndUpper ? "text-emerald-600 font-medium" : "text-muted-foreground/80"}>
                        Có chữ hoa và chữ thường
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSpecialChar ? (
                        <Check size={13} className="text-emerald-500 stroke-[3px]" />
                      ) : (
                        <X size={13} className="text-muted-foreground/50" />
                      )}
                      <span className={hasSpecialChar ? "text-emerald-600 font-medium" : "text-muted-foreground/80"}>
                        Có ít nhất 1 ký tự đặc biệt
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                Xác nhận mật khẩu mới <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 group-focus-within:text-primary transition-colors" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Xác nhận lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  className={`pl-9 pr-10 h-10.5 rounded-xl border-border/80 focus-visible:ring-primary/30 transition-all ${
                    errors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground/90 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] font-semibold text-destructive mt-1 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 sm:flex-none rounded-xl border-border/80 hover:bg-muted/80 h-10 text-sm font-medium"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-md h-10 text-sm font-medium transition-all"
            >
              {saving ? "Đang lưu..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
