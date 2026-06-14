import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectWithSearch } from "@/components/shared";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { adminPromotionService } from "@/services/admin/adminPromotionService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { useAuth } from "@/context/AuthContext";
import { promotionSchema, type PromotionValues } from "@/lib/validations/admin/promotion.schema";
import type { AdminPromotion, DayOfWeekValue } from "@/types/admin/promotion";
import { cn } from "@/lib/utils";
import { HelpCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const toDateTimeLocal = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const DAYS: { value: DayOfWeekValue; label: string }[] = [
  { value: "MONDAY", label: "T2" },
  { value: "TUESDAY", label: "T3" },
  { value: "WEDNESDAY", label: "T4" },
  { value: "THURSDAY", label: "T5" },
  { value: "FRIDAY", label: "T6" },
  { value: "SATURDAY", label: "T7" },
  { value: "SUNDAY", label: "CN" },
];

interface PromotionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  promotion?: AdminPromotion | null;
}

export const PromotionFormDialog = ({
  open, onOpenChange, onSuccess, promotion,
}: PromotionFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movieOptions, setMovieOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (!token || !open) return;
    fetchAdminMovies(token, { size: 200 })
      .then((res) => setMovieOptions(res.content.map((m) => ({ value: String(m.movieId), label: m.title }))))
      .catch(() => { });
  }, [token, open]);

  const isEdit = !!promotion;

  const defaultValues: PromotionValues = useMemo(() => ({
    code: promotion?.code ?? "",
    name: promotion?.name ?? "",
    description: promotion?.description ?? "",
    type: promotion?.type ?? "PERCENTAGE",
    discountValue: promotion?.discountValue ?? 0,
    minOrderValue: promotion?.minOrderValue ?? null,
    maxDiscountAmount: promotion?.maxDiscountAmount ?? null,
    useLimit: promotion?.useLimit ?? null,
    startTime: toDateTimeLocal(promotion?.startTime ?? ""),
    endTime: toDateTimeLocal(promotion?.endTime ?? ""),
    applicableMovieIds: promotion?.applicableMovieIds ?? [],
    dayOfWeek: promotion?.dayOfWeek ?? [],
  }), [promotion]);

  const onSubmit = async (values: PromotionValues) => {
    if (!token) return;
    setIsSubmitting(true);
    const payload = {
      ...values,
      startTime: `${values.startTime}:00`,
      endTime: `${values.endTime}:00`,
    };
    try {
      if (isEdit) {
        await adminPromotionService.updatePromotion(token, promotion!.promotionId, payload);
        toast.success("Cập nhật khuyến mãi thành công");
      } else {
        await adminPromotionService.createPromotion(token, payload);
        toast.success("Tạo khuyến mãi thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi lưu khuyến mãi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
      subtitle={isEdit ? `#${promotion!.promotionId} — ${promotion!.code}` : undefined}
      updatedAt={promotion?.updatedAt}
      schema={promotionSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? "Cập nhật" : "Tạo khuyến mãi"}
      maxWidth="max-w-3xl"
    >
      {(form) => {
        const watchType = form.watch("type");
        const watchDays = form.watch("dayOfWeek") ?? [];
        const watchMovieIds = form.watch("applicableMovieIds") ?? [];

        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">Mã khuyến mãi <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    {...form.register("code")}
                    placeholder="VD: SUMMER2026"
                    className="bg-background uppercase tracking-wider pr-10"
                    onChange={(e) => form.setValue("code", e.target.value.toUpperCase())}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      const randomNum = Math.floor(100000 + Math.random() * 900000);
                      form.setValue("code", `INF-${randomNum}`, { shouldValidate: true });
                    }}
                    title="Tạo mã ngẫu nhiên"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">Tên khuyến mãi <span className="text-destructive">*</span></Label>
                <Input {...form.register("name")} placeholder="VD: Khuyến mãi hè 2026" className="bg-background" />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">Mô tả</Label>
              <Textarea {...form.register("description")} placeholder="Mô tả ngắn về khuyến mãi..." className="bg-background resize-none h-20" />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-border/60">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">Loại giảm <span className="text-destructive">*</span></Label>
                <Select value={watchType} onValueChange={(v) => form.setValue("type", v as PromotionValues["type"])}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent data-admin="">
                    <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Cố định (đ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">
                  Giá trị giảm <span className="text-destructive">*</span>
                  <span className="text-muted-foreground ml-1 font-normal text-xs">
                    {watchType === "PERCENTAGE" ? "(1–100%)" : "(đồng)"}
                  </span>
                </Label>
                <Input
                  type="number"
                  {...form.register("discountValue", { valueAsNumber: true })}
                  min={1}
                  max={watchType === "PERCENTAGE" ? 100 : undefined}
                  className="bg-background"
                />
                {form.formState.errors.discountValue && (
                  <p className="text-xs text-destructive">{form.formState.errors.discountValue.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Đơn hàng tối thiểu (đ)</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  {...form.register("minOrderValue", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Giảm tối đa (đ)</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  {...form.register("maxDiscountAmount", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                  className="bg-background h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Giới hạn lượt dùng</Label>
                <Input
                  type="number"
                  placeholder="Không giới hạn"
                  {...form.register("useLimit", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
                  className="bg-background h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-border/60">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">Thời gian bắt đầu <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" {...form.register("startTime")} className="bg-background" />
                {form.formState.errors.startTime && (
                  <p className="text-xs text-destructive">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 font-medium">Thời gian kết thúc <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" {...form.register("endTime")} className="bg-background" />
                {form.formState.errors.endTime && (
                  <p className="text-xs text-destructive">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4 border-t pt-4 border-border/60">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block pb-1 border-b border-border/40">
                Điều kiện áp dụng nâng cao
              </Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  Ngày áp dụng trong tuần <span className="font-normal">(Bỏ trống = Tất cả các ngày)</span>
                </Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((d) => {
                    const isSelected = watchDays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? watchDays.filter((x) => x !== d.value)
                            : [...watchDays, d.value];
                          form.setValue("dayOfWeek", next as DayOfWeekValue[]);
                        }}
                        className={cn(
                          "h-9 w-11 rounded-md border text-xs font-semibold transition-all duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-95"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-medium">
                  Danh sách phim áp dụng <span className="font-normal">(Bỏ trống = Áp dụng toàn bộ phim)</span>
                </Label>
                <MultiSelectWithSearch
                  options={movieOptions}
                  selectedValues={watchMovieIds.map(String)}
                  onChange={(vals) => form.setValue("applicableMovieIds", vals.map(Number))}
                  placeholder="Chọn các bộ phim được áp dụng..."
                  searchPlaceholder="Tìm kiếm tên phim..."
                />
              </div>
            </div>
          </div>
        );
      }}
    </AdminFormDialog>
  );
};