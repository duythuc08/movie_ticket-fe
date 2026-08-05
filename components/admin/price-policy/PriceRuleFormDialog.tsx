import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { MultiSelectWithSearch } from "@/components/shared";
import { TimePicker24h } from "@/components/shared/TimePicker24h";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { pricePolicyRuleBulkSchema, type PricePolicyRuleBulkValues } from "@/lib/validations/admin/pricePolicy.schema";
import { adminPricePolicyService } from "@/services/admin/adminPricePolicyService";
import type { DayOfWeekValue, Holiday } from "@/types/admin/pricePolicy";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";

const ROOM_TYPES = [
  { value: "TWO_D", label: "2D" },
  { value: "THREE_D", label: "3D" },
  { value: "IMAX", label: "IMAX" },
  { value: "PREMIUM", label: "Premium" },
];

const SEAT_TYPES = [
  { value: "STANDARD", label: "Thường" },
  { value: "VIP", label: "VIP" },
  { value: "COUPLE", label: "Đôi" },
];

const RULE_TYPES: { value: "WEEKDAY_LIST" | "HOLIDAY" | "DEFAULT"; label: string }[] = [
  { value: "DEFAULT", label: "Giá mặc định" },
  { value: "WEEKDAY_LIST", label: "Theo ngày trong tuần" },
  { value: "HOLIDAY", label: "Ngày lễ" },
];

const DAYS: { value: DayOfWeekValue; label: string }[] = [
  { value: "MONDAY", label: "T2" },
  { value: "TUESDAY", label: "T3" },
  { value: "WEDNESDAY", label: "T4" },
  { value: "THURSDAY", label: "T5" },
  { value: "FRIDAY", label: "T6" },
  { value: "SATURDAY", label: "T7" },
  { value: "SUNDAY", label: "CN" },
];

const emptyRow = () => ({
  roomType: "TWO_D" as const,
  seatType: "STANDARD" as const,
  ruleType: "DEFAULT" as const,
  startHour: "",
  endHour: "",
  basePrice: 0,
  weekdays: [] as DayOfWeekValue[],
  holidayIds: [] as number[],
});

interface PriceRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pricePolicyId: number;
  holidays: Holiday[];
}

export const PriceRuleFormDialog = ({
  open, onOpenChange, onSuccess, pricePolicyId, holidays,
}: PriceRuleFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeWindowByRow, setTimeWindowByRow] = useState<Record<string, boolean>>({});

  const holidayOptions = useMemo(
    () => holidays.map((h) => ({
      value: String(h.holidayId),
      label: `${h.name} (${h.dateFrom.split("-").reverse().join("/")} - ${h.dateTo.split("-").reverse().join("/")})`,
    })),
    [holidays]
  );

  const defaultValues: PricePolicyRuleBulkValues = useMemo(() => ({ rules: [emptyRow()] }), []);

  const onSubmit = async (values: PricePolicyRuleBulkValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await adminPricePolicyService.addRules(token, pricePolicyId, values.rules);
      toast.success("Thêm rule thành công");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi thêm rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm rule giá vé"
      subtitle="Có thể khai báo nhiều dòng rule cùng lúc"
      resetKey={open ? "open" : "closed"}
      schema={pricePolicyRuleBulkSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Lưu rule"
      maxWidth="max-w-4xl"
    >
      {(form) => (
        <PriceRuleFields
          form={form}
          holidayOptions={holidayOptions}
          timeWindowByRow={timeWindowByRow}
          setTimeWindowByRow={setTimeWindowByRow}
        />
      )}
    </AdminFormDialog>
  );
};

interface PriceRuleFieldsProps {
  form: UseFormReturn<PricePolicyRuleBulkValues>;
  holidayOptions: { value: string; label: string }[];
  timeWindowByRow: Record<string, boolean>;
  setTimeWindowByRow: Dispatch<SetStateAction<Record<string, boolean>>>;
}

function PriceRuleFields({
  form,
  holidayOptions,
  timeWindowByRow,
  setTimeWindowByRow,
}: PriceRuleFieldsProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "rules" });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const ruleType = form.watch(`rules.${index}.ruleType`);
        const weekdays = form.watch(`rules.${index}.weekdays`) ?? [];
        const startHour = form.watch(`rules.${index}.startHour`);
        const endHour = form.watch(`rules.${index}.endHour`);
        const canUseTimeWindow = ruleType !== "DEFAULT";
        const showTimeWindow = canUseTimeWindow && (timeWindowByRow[field.id] || !!startHour || !!endHour);
        const errors = form.formState.errors.rules?.[index];

        return (
          <div key={field.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Dòng rule #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Loại phòng</Label>
                <Controller
                  name={`rules.${index}.roomType`}
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                      <SelectContent data-admin="">
                        {ROOM_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Loại ghế</Label>
                <Controller
                  name={`rules.${index}.seatType`}
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                      <SelectContent data-admin="">
                        {SEAT_TYPES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Giá</Label>
                <Controller
                  name={`rules.${index}.basePrice`}
                  control={form.control}
                  render={({ field: { onChange, value, ref } }) => (
                    <NumericFormat
                      getInputRef={ref}
                      customInput={Input}
                      className="bg-background h-9 text-sm"
                      thousandSeparator="."
                      decimalSeparator=","
                      suffix="đ"
                      allowNegative={false}
                      placeholder="0đ"
                      value={value === 0 ? "" : value}
                      onValueChange={(v) => onChange(v.floatValue ?? 0)}
                    />
                  )}
                />
                {errors?.basePrice && (
                  <p className="text-xs text-destructive">{errors.basePrice.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Loại rule</Label>
              <div className="flex gap-1.5">
                {RULE_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => {
                      form.setValue(`rules.${index}.ruleType`, rt.value, { shouldValidate: true });
                      if (rt.value !== "WEEKDAY_LIST") {
                        form.setValue(`rules.${index}.weekdays`, [], { shouldValidate: true });
                      }
                      if (rt.value !== "HOLIDAY") {
                        form.setValue(`rules.${index}.holidayIds`, [], { shouldValidate: true });
                      }
                      if (rt.value === "DEFAULT") {
                        setTimeWindowByRow((prev) => ({ ...prev, [field.id]: false }));
                        form.setValue(`rules.${index}.startHour`, "", { shouldValidate: true });
                        form.setValue(`rules.${index}.endHour`, "", { shouldValidate: true });
                      }
                    }}
                    className={cn(
                      "h-8 px-3 rounded-md border text-xs font-semibold transition-all",
                      ruleType === rt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/40"
                    )}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>

            {ruleType === "WEEKDAY_LIST" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Ngày áp dụng trong tuần <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((day) => {
                    const isSelected = weekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? weekdays.filter((value) => value !== day.value)
                            : [...weekdays, day.value];
                          form.setValue(`rules.${index}.weekdays`, next as DayOfWeekValue[], { shouldValidate: true });
                        }}
                        className={cn(
                          "h-9 w-14 rounded-md border text-xs font-semibold transition-all duration-200",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-95"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                {errors?.weekdays && (
                  <p className="text-xs text-destructive">{errors.weekdays.message as string}</p>
                )}
              </div>
            )}

            {ruleType === "HOLIDAY" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Chọn kỳ nghỉ áp dụng <span className="text-destructive">*</span></Label>
                <MultiSelectWithSearch
                  options={holidayOptions}
                  selectedValues={(form.watch(`rules.${index}.holidayIds`) ?? []).map(String)}
                  onChange={(vals) => form.setValue(`rules.${index}.holidayIds`, vals.map(Number), { shouldValidate: true })}
                  placeholder="Chọn kỳ nghỉ..."
                  searchPlaceholder="Tìm kỳ nghỉ..."
                />
                {errors?.holidayIds && (
                  <p className="text-xs text-destructive">{errors.holidayIds.message as string}</p>
                )}
              </div>
            )}

            {canUseTimeWindow && (
              <div className="border-t pt-3 border-border/60 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Giới hạn khung giờ</Label>
                    <p className="text-xs text-muted-foreground">Bật khi rule chỉ áp dụng trong một khoảng giờ cụ thể.</p>
                  </div>
                  <Switch
                    checked={showTimeWindow}
                    onCheckedChange={(checked) => {
                      setTimeWindowByRow((prev) => ({ ...prev, [field.id]: checked }));
                      if (!checked) {
                        form.setValue(`rules.${index}.startHour`, "", { shouldValidate: true });
                        form.setValue(`rules.${index}.endHour`, "", { shouldValidate: true });
                      }
                    }}
                  />
                </div>

                {showTimeWindow && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Giờ bắt đầu</Label>
                      <Controller
                        name={`rules.${index}.startHour`}
                        control={form.control}
                        render={({ field }) => (
                          <TimePicker24h value={field.value ?? ""} onChange={field.onChange} />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Giờ kết thúc</Label>
                      <Controller
                        name={`rules.${index}.endHour`}
                        control={form.control}
                        render={({ field }) => (
                          <TimePicker24h value={field.value ?? ""} onChange={field.onChange} />
                        )}
                      />
                      {errors?.endHour && (
                        <p className="text-xs text-destructive">{errors.endHour.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={() => append(emptyRow())}
      >
        <Plus className="h-4 w-4" /> Thêm dòng rule
      </Button>
    </div>
  );
}

