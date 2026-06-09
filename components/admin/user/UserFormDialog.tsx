import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectWithSearch } from "@/components/shared";
import { adminUserService } from "@/services/admin/adminUserService";
import { useAuth } from "@/context/AuthContext";
import {
  createUserSchema, updateUserSchema,
  type CreateUserValues, type UpdateUserValues,
} from "@/lib/validations/admin/user.schema";
import type { AdminUser } from "@/types/admin/user";

const ROLE_OPTIONS = [
  { value: "USER",  label: "USER — Người dùng thông thường" },
  { value: "ADMIN", label: "ADMIN — Quản trị viên" },
];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  user?: AdminUser | null;
}

export const UserFormDialog = ({ open, onOpenChange, onSuccess, user }: UserFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!user;

  const createDefaults: CreateUserValues = {
    username: "", password: "", firstname: "", lastname: "", phoneNumber: "", birthday: "",
  };

  const editDefaults: UpdateUserValues = useMemo(() => ({
    password:    "",
    firstname:   user?.firstname   ?? "",
    lastname:    user?.lastname    ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    birthday:    user?.birthday    ?? "",
    roles:       user?.roles.map((r) => r.name) ?? ["USER"],
  }), [user]);

  const handleCreate = async (values: CreateUserValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await adminUserService.createUser(token, values);
      toast.success("Tạo tài khoản thành công");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tạo tài khoản");
    } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async (values: UpdateUserValues) => {
    if (!token || !user) return;
    setIsSubmitting(true);
    try {
      await adminUserService.updateUser(token, user.userId, values);
      toast.success("Cập nhật tài khoản thành công");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật");
    } finally { setIsSubmitting(false); }
  };

  if (isEdit) {
    return (
      <AdminFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Chỉnh sửa tài khoản"
        subtitle={user.username}
        updatedAt={undefined}
        schema={updateUserSchema}
        defaultValues={editDefaults}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel="Cập nhật"
        maxWidth="max-w-lg"
      >
        {(form) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Họ</Label>
                <Input {...form.register("firstname")} placeholder="Nguyễn" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input {...form.register("lastname")} placeholder="Văn A" className="bg-background" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input {...form.register("phoneNumber")} placeholder="0901234567" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input type="date" {...form.register("birthday")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>
                Mật khẩu mới{" "}
                <span className="text-muted-foreground font-normal text-xs">(để trống = giữ nguyên)</span>
              </Label>
              <Input type="password" {...form.register("password")} placeholder="Tối thiểu 8 ký tự" className="bg-background" />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2 pt-2">
              <Label>Vai trò <span className="text-destructive">*</span></Label>
              <MultiSelectWithSearch
                options={ROLE_OPTIONS}
                selectedValues={form.watch("roles") ?? []}
                onChange={(vals) => form.setValue("roles", vals)}
                placeholder="Chọn vai trò..."
              />
            </div>
          </>
        )}
      </AdminFormDialog>
    );
  }

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo tài khoản mới"
      schema={createUserSchema}
      defaultValues={createDefaults}
      onSubmit={handleCreate}
      isSubmitting={isSubmitting}
      submitLabel="Tạo tài khoản"
      maxWidth="max-w-lg"
    >
      {(form) => (
        <>
          <div className="space-y-2">
            <Label>Email (Username) <span className="text-destructive">*</span></Label>
            <Input {...form.register("username")} type="email" placeholder="user@example.com" className="bg-background" />
            {form.formState.errors.username && (
              <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Mật khẩu <span className="text-destructive">*</span></Label>
            <Input type="password" {...form.register("password")} placeholder="Tối thiểu 8 ký tự" className="bg-background" />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Họ</Label>
              <Input {...form.register("firstname")} placeholder="Nguyễn" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Tên</Label>
              <Input {...form.register("lastname")} placeholder="Văn A" className="bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input {...form.register("phoneNumber")} placeholder="0901234567" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input type="date" {...form.register("birthday")} className="bg-background" />
            </div>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
};
