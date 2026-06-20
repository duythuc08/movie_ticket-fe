"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ThumbsUp, ThumbsDown, X, MessageSquareHeart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchReviewInteractions } from "@/services/admin/adminReviewService";
import type { AdminReview, AdminReviewInteraction } from "@/types/admin.type";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ReviewInteractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: AdminReview | null;
}

export function ReviewInteractionsDialog({
  open,
  onOpenChange,
  review,
}: ReviewInteractionsDialogProps) {
  const { token } = useAuth();
  const [interactions, setInteractions] = useState<AdminReviewInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && review && token) {
      setLoading(true);
      fetchReviewInteractions(token, review.reviewId)
        .then((data) => setInteractions(data))
        .catch(() => toast.error("Không thể tải danh sách tương tác"))
        .finally(() => setLoading(false));
    } else {
      setInteractions([]);
    }
  }, [open, review, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-admin="" className="max-w-md w-[95vw] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0 rounded-xl border border-border shadow-2xl [&>button]:hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <DialogHeader className="bg-muted/40 border-b border-border px-6 py-4 shrink-0 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-primary" />
                Lượt tương tác
              </DialogTitle>
            </div>
            <Button
              type="button" variant="ghost" size="icon"
              className="shrink-0 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X size={16} />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-background max-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-20 text-muted-foreground">Đang tải...</div>
            ) : interactions.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground border rounded-xl bg-muted/10">Không có tương tác nào.</div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.interactionId} className="flex items-center justify-between p-3 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {interaction.avatarUrl ? (
                          <img src={interaction.avatarUrl} alt={interaction.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-semibold text-muted-foreground">{interaction.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{interaction.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(interaction.createdAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4">
                      {interaction.interactionType === "LIKE" ? (
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                          <ThumbsUp className="w-3.5 h-3.5" /> Thích
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-md text-xs font-semibold">
                          <ThumbsDown className="w-3.5 h-3.5" /> Không thích
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
