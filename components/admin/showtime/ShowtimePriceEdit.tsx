import { useState } from "react";
import { Check, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adminShowtimePriceService } from "@/services/admin/adminShowtimePriceService";
import { useAuth } from "@/context/AuthContext";
import { ShowtimePrice } from "@/types/admin/showtime";

interface ShowtimePriceEditProps {
  showTimeId: number;
  price: ShowtimePrice;
  onSuccess: () => void;
}

export const ShowtimePriceEdit = ({ showTimeId, price, onSuccess }: ShowtimePriceEditProps) => {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(price.price.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!token) return;
    const numValue = Number(editValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error("Giá tiền không hợp lệ");
      return;
    }

    setIsSaving(true);
    try {
      await adminShowtimePriceService.updateShowTimePrice(token, price.id, showTimeId, numValue);
      toast.success("Cập nhật giá thành công");
      setIsEditing(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi khi cập nhật giá");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(price.price.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input 
          type="number" 
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)} 
          className="w-24 h-8 text-sm"
          disabled={isSaving}
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleSave} disabled={isSaving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={handleCancel} disabled={isSaving}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span>{price.price.toLocaleString("vi-VN")} đ</span>
      <Button 
        size="icon" 
        variant="ghost" 
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
        onClick={() => setIsEditing(true)}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

