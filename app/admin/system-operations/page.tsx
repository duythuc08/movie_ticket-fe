"use client";

import { Film, Clock, CalendarDays, Percent, Ticket, Sparkles, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/shared";
import { SystemJobCard } from "@/components/admin/system-operations/SystemJobCard";
import type { JobRunResult } from "@/types/admin.type";
import {
  runMovieStatusUpdate,
  runShowTimeStatusUpdate,
  runEventStatusUpdate,
  runPromotionExpire,
  runOrderCleanup,
  runRecommendationTrain,
  runWeeklyEmails,
} from "@/services/admin/adminSystemOperationService";

export default function SystemOperationsPage() {
  const { token } = useAuth();

  function requireToken(): string {
    if (!token) throw new Error("Bạn cần đăng nhập lại");
    return token;
  }

  async function handleTrainRecommendation(): Promise<JobRunResult> {
    const result = await runRecommendationTrain(requireToken());
    const predictions = Number(result.nPredictionsWritten ?? 0);
    const users = Number(result.nUsersProcessed ?? 0);
    const seconds = result.batchElapsedSeconds;
    return {
      totalChanged: predictions,
      summary: `Đã xử lý ${users} người dùng, ghi ${predictions} gợi ý${
        seconds !== undefined ? ` trong ${seconds}s` : ""
      }`,
      changes: [],
    };
  }

  async function handleSendWeeklyEmails(): Promise<JobRunResult> {
    const result = await runWeeklyEmails(requireToken());
    const success = Number(result.success ?? 0);
    const skip = Number(result.skip ?? 0);
    const fail = Number(result.fail ?? 0);
    return {
      totalChanged: success,
      summary: `Đã gửi ${success} email, bỏ qua ${skip}, lỗi ${fail}`,
      changes: [],
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vận hành hệ thống"
        description="Trigger thủ công các tác vụ tự động của hệ thống mà không cần chờ lịch chạy nền"
      />

      <div className="grid grid-cols-1 gap-4">
        <SystemJobCard
          title="Cập nhật trạng thái phim"
          description="Chuyển phim Sắp chiếu → Đang chiếu khi đến ngày phát hành, và Đang chiếu → Ngừng chiếu khi hết suất chiếu tương lai"
          icon={<Film className="h-5 w-5" />}
          onRun={() => runMovieStatusUpdate(requireToken())}
        />

        <SystemJobCard
          title="Cập nhật trạng thái suất chiếu"
          description="Chuyển suất chiếu Đã lên lịch → Đang chiếu → Đã kết thúc theo thời gian thực, và đánh dấu suất đã bán hết ghế"
          icon={<Clock className="h-5 w-5" />}
          onRun={() => runShowTimeStatusUpdate(requireToken())}
        />

        <SystemJobCard
          title="Cập nhật trạng thái sự kiện"
          description="Chuyển sự kiện Sắp diễn ra → Đang diễn ra → Đã kết thúc dựa trên thời gian bắt đầu/kết thúc"
          icon={<CalendarDays className="h-5 w-5" />}
          onRun={() => runEventStatusUpdate(requireToken())}
        />

        <SystemJobCard
          title="Cập nhật khuyến mãi hết hạn"
          description="Chuyển các khuyến mãi đã quá thời gian kết thúc sang trạng thái Hết hạn"
          icon={<Percent className="h-5 w-5" />}
          onRun={() => runPromotionExpire(requireToken())}
        />

        <SystemJobCard
          title="Dọn dẹp đơn hàng hết hạn"
          description="Huỷ các đơn hàng chờ thanh toán quá hạn và giải phóng ghế đã giữ"
          icon={<Ticket className="h-5 w-5" />}
          onRun={() => runOrderCleanup(requireToken())}
        />

        <SystemJobCard
          title="Huấn luyện gợi ý phim (CF)"
          description="Chạy lại thuật toán gợi ý phim dựa trên lịch sử xem/thích của người dùng"
          icon={<Sparkles className="h-5 w-5" />}
          onRun={handleTrainRecommendation}
        />

        <SystemJobCard
          title="Gửi email gợi ý phim hàng tuần"
          description="Gửi ngay email gợi ý phim cho toàn bộ người dùng đã kích hoạt tài khoản, không cần chờ lịch thứ Hai 8h sáng"
          icon={<Mail className="h-5 w-5" />}
          onRun={handleSendWeeklyEmails}
        />
      </div>
    </div>
  );
}
