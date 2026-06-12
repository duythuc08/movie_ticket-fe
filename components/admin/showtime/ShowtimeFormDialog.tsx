import { useEffect, useState, useCallback, useMemo } from "react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Clock as ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminShowtimeService } from "@/services/admin/adminShowtimeService";
import { fetchAdminMovies } from "@/services/admin/adminMovieService";
import { fetchAdminRooms } from "@/services/admin/adminRoomService";
import { fetchSeatsByRoom } from "@/services/admin/adminSeatService";
import { useAuth } from "@/context/AuthContext";
import { createShowtimeSchema, CreateShowtimeValues } from "@/lib/validations/admin/showtime.schema";
import { AdminFormDialog } from "@/components/admin/layout/AdminFormDialog";
import { SingleSelectWithSearch, SelectOption } from "@/components/shared";

import { TimePicker24h } from "@/components/shared/TimePicker24h";

const calculateExpectedEndTime = (startStr: string, dur: number) => {
  if (!startStr || dur === 0) return "";
  const startDate = new Date(startStr);
  if (isNaN(startDate.getTime())) return "";
  
  startDate.setMinutes(startDate.getMinutes() + dur + 15);
  
  const m = startDate.getMinutes();
  const remainder = m % 5;
  if (remainder !== 0) {
    startDate.setMinutes(m + (5 - remainder));
  }
  
  return startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + " (Đã cộng " + dur + "p phim + 15p dọn rạp)";
};

const parseDateTimeToDateAndTime = (isoString: string) => {
  if (!isoString) return { date: "", time: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "" };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const MM = String(d.getMinutes()).padStart(2, '0');
    return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
  } catch {
    return { date: "", time: "" };
  }
};

const combineDateAndTime = (dateStr: string, timeStr: string) => {
  if (!dateStr || !timeStr) return "";
  return `${dateStr}T${timeStr}:00`;
};

interface ShowtimeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialRoomId?: number;
  initialStartTime?: string;
  selectedDateStr?: string;
}

export const ShowtimeFormDialog = ({ open, onOpenChange, onSuccess, initialRoomId, initialStartTime, selectedDateStr }: ShowtimeFormDialogProps) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movieDuration, setMovieDuration] = useState<number>(0);
  
  const [movieOptions, setMovieOptions] = useState<SelectOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);
  const [movieDurations, setMovieDurations] = useState<Record<string, number>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const loadOptions = useCallback(async () => {
    if (!token || !open) return;
    setIsLoadingOptions(true);
    try {
      const [moviesRes, roomsRes] = await Promise.all([
        fetchAdminMovies(token, { size: 200 }),
        fetchAdminRooms(token, { size: 200, entityStatus: "ACTIVE" })
      ]);
      
      const mOptions = moviesRes.content.map(m => ({ value: String(m.movieId), label: m.title }));
      setMovieOptions(mOptions);
      
      const durations: Record<string, number> = {};
      moviesRes.content.forEach(m => durations[String(m.movieId)] = m.duration);
      setMovieDurations(durations);

      setRoomOptions(roomsRes.content.map(r => ({ value: String(r.roomId), label: `${r.cinemas?.name} - ${r.name}` })));
    } catch {
      toast.error("Không thể tải danh sách phim và phòng chiếu");
    } finally {
      setIsLoadingOptions(false);
    }
  }, [token, open]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const defaultDateStr = selectedDateStr || initialStartTime?.split("T")[0] || new Date().toISOString().split("T")[0];

  const defaultValues: CreateShowtimeValues = useMemo(() => {
    const timeOnly = initialStartTime ? initialStartTime.split("T")[1].substring(0,5) : "";
    return {
      movieId: 0,
      roomId: initialRoomId || 0,
      startTimes: [timeOnly ? combineDateAndTime(defaultDateStr, timeOnly) : ""],
      prices: [{ price: 0, seatType: "STANDARD" }]
    };
  }, [initialRoomId, initialStartTime, defaultDateStr]);

  const onSubmit = async (data: CreateShowtimeValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await adminShowtimeService.createShowtime(token, data);
      toast.success("Tạo suất chiếu thành công");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi tạo suất chiếu");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <AdminFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Tạo suất chiếu mới"
      schema={createShowtimeSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Lưu suất chiếu"
      maxWidth="max-w-3xl"
    >
      {(form) => {
        const watchMovieId = form.watch("movieId");
        const watchStartTimes = form.watch("startTimes") || [];
        const watchRoomId = form.watch("roomId");
        const dur = movieDurations[String(watchMovieId)] || 0;

        useEffect(() => {
          if (!token || !watchRoomId) return;
          let isMounted = true;
          
          fetchSeatsByRoom(token, watchRoomId).then(seats => {
            if (!isMounted) return;
            const uniqueTypes = Array.from(new Set(seats.map(s => s.seatType)));
            if (uniqueTypes.length > 0) {
              const currentPrices = form.getValues("prices") || [];
              const newPrices = uniqueTypes.map(type => {
                const existing = currentPrices.find(p => p.seatType === type);
                return { price: existing ? existing.price : 0, seatType: type };
              });
              form.setValue("prices", newPrices, { shouldValidate: true });
            }
          }).catch(err => {
            console.error("Lỗi tải ghế:", err);
          });

          return () => { isMounted = false; };
        }, [token, watchRoomId, form]);

        const { fields: priceFields, append: appendPrice, remove: removePrice } = useFieldArray({
          control: form.control,
          name: "prices"
        });

        const appendTime = (val: string) => form.setValue("startTimes", [...watchStartTimes, val], { shouldValidate: true });
        const removeTime = (idx: number) => {
          const newArr = [...watchStartTimes];
          newArr.splice(idx, 1);
          form.setValue("startTimes", newArr, { shouldValidate: true });
        };

        return (
          <>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Phim chiếu <span className="text-destructive">*</span></Label>
                <SingleSelectWithSearch
                  options={movieOptions}
                  value={watchMovieId ? String(watchMovieId) : ""}
                  onChange={(val) => form.setValue("movieId", Number(val))}
                  placeholder={isLoadingOptions ? "Đang tải..." : "Chọn phim..."}
                  disabled={isLoadingOptions}
                />
                {form.formState.errors.movieId && <p className="text-xs text-destructive">{form.formState.errors.movieId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phòng chiếu <span className="text-destructive">*</span></Label>
                <SingleSelectWithSearch
                  options={roomOptions}
                  value={form.watch("roomId") ? String(form.watch("roomId")) : ""}
                  onChange={(val) => form.setValue("roomId", Number(val))}
                  placeholder={isLoadingOptions ? "Đang tải..." : "Chọn phòng..."}
                  disabled={isLoadingOptions || !!initialRoomId}
                />
                {form.formState.errors.roomId && <p className="text-xs text-destructive">{form.formState.errors.roomId.message}</p>}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bảng giá</Label>
              </div>
              <div className="space-y-3">
                {priceFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end p-3 bg-muted/10 border border-border/60 rounded-xl">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Giá tiền</Label>
                      <Input className="h-9 bg-background shadow-sm" type="number" {...form.register(`prices.${index}.price`, { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Loại ghế</Label>
                      <select disabled className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm opacity-100 appearance-none" {...form.register(`prices.${index}.seatType`)}>
                        <option value="STANDARD">Thường (STANDARD)</option>
                        <option value="VIP">VIP</option>
                        <option value="COUPLE">Ghế Đôi (COUPLE)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              {form.formState.errors.prices && <p className="text-xs text-destructive">{form.formState.errors.prices.message}</p>}
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between pb-1 border-b border-border">
                <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lịch chiếu ngày {defaultDateStr}</Label>
              </div>
              
              <div className="space-y-4">
                {watchStartTimes.map((currentValue, index) => {
                  const { date, time } = parseDateTimeToDateAndTime(currentValue);
                  
                  return (
                    <div key={index} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3 relative group">
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-6 items-end">
                        <div className="space-y-2 relative">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5" /> Giờ chiếu
                          </Label>
                          <TimePicker24h 
                            value={time} 
                            onChange={(newTime) => {
                              form.setValue(`startTimes.${index}`, combineDateAndTime(defaultDateStr, newTime), { shouldValidate: true });
                            }} 
                          />
                        </div>
                        <div className="space-y-2 relative">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ClockIcon className="w-3.5 h-3.5" /> Giờ kết thúc (Dự kiến)
                          </Label>
                          <TimePicker24h 
                            value={calculateExpectedEndTime(currentValue, dur).split(" ")[0] || ""} 
                            onChange={() => {}}
                            disabled={true}
                          />
                        </div>
                        <div className="pb-1 flex items-center gap-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => appendTime("")} 
                            className="text-primary hover:bg-primary/10 hover:text-primary h-9 w-9"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeTime(index)} 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9"
                            disabled={watchStartTimes.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {form.formState.errors.startTimes && <p className="text-xs text-destructive">{form.formState.errors.startTimes.message}</p>}
            </div>
          </>
        );
      }}
    </AdminFormDialog>
  );
};

