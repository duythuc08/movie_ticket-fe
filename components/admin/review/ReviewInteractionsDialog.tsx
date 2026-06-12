"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchReviewInteractions } from "@/services/admin/adminReviewService";
import type { AdminReview, AdminReviewInteraction } from "@/types/admin.type";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lượt tương tác</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-4">Đang tải...</div>
        ) : interactions.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">Không có tương tác nào.</div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4 mt-2">
              {interactions.map((interaction) => (
                <div key={interaction.interactionId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                      {interaction.avatarUrl ? (
                        <img src={interaction.avatarUrl} alt={interaction.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-white/50">{interaction.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{interaction.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(interaction.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div>
                    {interaction.interactionType === "LIKE" ? (
                      <div className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded text-xs font-semibold">
                        <ThumbsUp className="w-3 h-3" /> Thích
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-semibold">
                        <ThumbsDown className="w-3 h-3" /> Không thích
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
