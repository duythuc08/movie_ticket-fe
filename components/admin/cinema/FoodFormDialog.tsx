"use client";

import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { ImageUploadPreview } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { foodFormSchema, type FoodFormSchema } from "@/lib/validations/admin.schemas";
import type { AdminFood } from "@/services/admin/adminFoodService";
import { DollarSign, Utensils } from "lucide-react";
import { Controller } from "react-hook-form";

interface FoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food?: AdminFood | null;
  onSubmit: (data: FoodFormSchema) => Promise<void>;
  isSubmitting: boolean;
}

export function FoodFormDialog({
  open,
  onOpenChange,
  food,
  onSubmit,
  isSubmitting,
}: FoodFormDialogProps) {
  const isCreateMode = !food;

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isCreateMode ? "Thêm Đồ ăn / Combo" : "Chỉnh sửa Đồ ăn / Combo"}
      subtitle={!isCreateMode ? food.name : undefined}
      updatedAt={food?.updatedAt}
      resetKey={food?.foodId ?? "create"}
      schema={foodFormSchema}
      defaultValues={{
        name: food?.name ?? "",
        description: food?.description ?? "",
        price: food?.price ?? 0,
        imageUrl: food?.imageUrl ?? "",
        isCombo: food?.isCombo ?? false,
        stockQuantity: food?.stockQuantity ?? 100,
        foodType: food?.foodType ?? "SNACK",
        foodStatus: food?.foodStatus ?? "IN_STOCK",
      }}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isCreateMode ? "Tạo món" : "Lưu thay đổi"}
      maxWidth="max-w-4xl"
    >
      {(form) => (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
          <div className="space-y-5 mx-auto md:mx-0 w-full max-w-55 sticky top-0">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hình ảnh món</Label>
              <Controller
                name="imageFile"
                control={form.control}
                render={({ field }) => (
                  <div className="rounded-xl overflow-hidden border border-border/80 shadow-sm bg-muted/30 p-1.5">
                    <ImageUploadPreview
                      currentImageUrl={food?.imageUrl}
                      aspectRatio="poster"
                      onFileSelect={field.onChange}
                    />
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Loại món <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="foodType"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-9 bg-background">
                      <SelectValue placeholder="Chọn loại..." />
                    </SelectTrigger>
                    <SelectContent data-admin="">
                      <SelectItem value="COMBO">Combo</SelectItem>
                      <SelectItem value="POPCORN">Bắp (Popcorn)</SelectItem>
                      <SelectItem value="DRINK">Nước (Drink)</SelectItem>
                      <SelectItem value="SNACK">Đồ ăn vặt (Snack)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Trạng thái <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="foodStatus"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full h-9 bg-background">
                      <SelectValue placeholder="Chọn trạng thái..." />
                    </SelectTrigger>
                    <SelectContent data-admin="">
                      <SelectItem value="IN_STOCK">Còn hàng</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">Hết hàng</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-6 min-w-0 flex-1">
            <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-muted/10">
              <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1">
                <Utensils size={14} className="text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Thông tin cơ bản</h3>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-name" className="text-sm font-semibold">
                  Tên món <span className="text-destructive">*</span>
                </Label>
                <Input id="food-name" {...form.register("name")} placeholder="VD: Combo Bắp Nước Siêu To..." className="h-9" />
                {form.formState.errors.name && (
                  <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="food-desc" className="text-sm font-semibold">Mô tả chi tiết</Label>
                <Textarea
                  id="food-desc"
                  {...form.register("description")}
                  rows={3}
                  placeholder="Gồm 1 bắp lớn, 2 nước..."
                  className="resize-none"
                />
              </div>
            </div>

            <div className="space-y-4 border border-border/60 rounded-xl p-5 bg-muted/10">
              <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1">
                <DollarSign size={14} className="text-green-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Giá & Tồn kho</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="food-price" className="text-sm font-semibold">
                    Giá bán (VNĐ) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="food-price" type="number" {...form.register("price", { valueAsNumber: true })} className="h-9" />
                  {form.formState.errors.price && (
                    <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.price.message}</p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="food-stock" className="text-sm font-semibold">
                    Số lượng tồn <span className="text-destructive">*</span>
                  </Label>
                  <Input id="food-stock" type="number" {...form.register("stockQuantity", { valueAsNumber: true })} className="h-9" />
                  {form.formState.errors.stockQuantity && (
                    <p className="text-xs font-medium text-destructive mt-1">{form.formState.errors.stockQuantity.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-background mt-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Đây là gói Combo?</Label>
                  <p className="text-xs text-muted-foreground">Bật nếu món này bao gồm nhiều món nhỏ gộp lại.</p>
                </div>
                <Controller
                  name="isCombo"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminFormDialog>
  );
}
