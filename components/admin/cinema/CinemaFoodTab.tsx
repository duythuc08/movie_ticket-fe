"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, PackageOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  fetchFoodsByCinema,
  activateFood,
  inactivateFood,
  createFood,
  updateFood,
  type AdminFood,
  type FoodRequest
} from "@/services/admin/adminFoodService";
import { FoodFormDialog } from "./FoodFormDialog";
import type { FoodFormSchema } from "@/lib/validations/admin.schemas";
import { uploadFileAndGetUrl } from "@/services/admin/adminFileService";

interface CinemaFoodTabProps {
  cinemaId: number;
}

export function CinemaFoodTab({ cinemaId }: CinemaFoodTabProps) {
  const { token } = useAuth();
  const [foods, setFoods] = useState<AdminFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<AdminFood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFoods = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await fetchFoodsByCinema(token, cinemaId);
      setFoods(data.content);
    } catch {
      toast.error("Không thể tải danh sách Đồ ăn/Combo");
    } finally {
      setIsLoading(false);
    }
  }, [token, cinemaId]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  async function handleToggleStatus(food: AdminFood) {
    if (!token) return;
    try {
      if (food.entityStatus === "ACTIVE") {
        await inactivateFood(token, food.foodId);
        toast.success("Đã vô hiệu hóa món");
      } else {
        await activateFood(token, food.foodId);
        toast.success("Đã kích hoạt món");
      }
      loadFoods();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  }

  async function handleSubmit(data: FoodFormSchema) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      let finalImageUrl = data.imageUrl;
      if (data.imageFile) {
        finalImageUrl = await uploadFileAndGetUrl(token, data.imageFile);
      }

      const payload: FoodRequest = {
        cinemaId,
        ...data,
        description: data.description || "",
        imageUrl: finalImageUrl,
      };

      if (editingFood) {
        await updateFood(token, editingFood.foodId, payload);
        toast.success("Cập nhật thành công");
      } else {
        await createFood(token, payload);
        toast.success("Thêm mới thành công");
      }
      setIsDialogOpen(false);
      loadFoods();
    } catch {
      toast.error(editingFood ? "Lỗi khi cập nhật" : "Lỗi khi thêm mới");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold flex items-center gap-2">
            Danh sách Đồ ăn / Combo
            <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">{foods.length}</Badge>
          </h4>
          <p className="text-sm text-muted-foreground mt-1">Quản lý thực đơn và kho bán tại rạp này</p>
        </div>
        <Button onClick={() => { setEditingFood(null); setIsDialogOpen(true); }} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Thêm món mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : foods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
          <PackageOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Rạp này chưa có Đồ ăn/Combo nào</p>
          <Button variant="outline" onClick={() => { setEditingFood(null); setIsDialogOpen(true); }} className="mt-1 text-primary">
            Thêm món ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.map((food) => (
            <div key={food.foodId} className="flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
              <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                {food.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <PackageOpen className="w-8 h-8 opacity-20" />
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{food.name}</h5>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mr-2 -mt-1 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => { setEditingFood(food); setIsDialogOpen(true); }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase">{food.foodType}</Badge>
                  {food.isCombo && <Badge variant="default" className="text-[10px] uppercase bg-orange-500">Combo</Badge>}
                </div>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="font-bold text-sm text-green-600">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(food.price)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {food.entityStatus === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
                    </span>
                    <Switch
                      checked={food.entityStatus === "ACTIVE"}
                      onCheckedChange={() => handleToggleStatus(food)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FoodFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        food={editingFood}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
