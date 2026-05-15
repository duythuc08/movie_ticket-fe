import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/components/booking/utils/booking.utils";
import type { FoodProduct } from "@/types";

interface FoodMenuItemProps {
  product: FoodProduct;
  quantity: number;
  onUpdateQuantity: (productId: number, delta: number) => void;
}

export function FoodMenuItem({ product, quantity, onUpdateQuantity }: FoodMenuItemProps) {
  return (
    <div className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 hover:border-primary/30">
      <img
        src={product.img}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-border"
      />
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold mb-1 text-card-foreground">{product.name}</h2>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.desc}</p>
        <p className="text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={() => onUpdateQuantity(product.id, -1)}
          className="w-8 h-8 rounded-full border border-border bg-secondary text-foreground flex items-center justify-center cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-base font-bold min-w-[20px] text-center">{quantity || 0}</span>
        <button
          onClick={() => onUpdateQuantity(product.id, 1)}
          className="w-8 h-8 rounded-full border border-border bg-secondary text-foreground flex items-center justify-center cursor-pointer transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
