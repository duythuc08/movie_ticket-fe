import axios from "@/lib/axios";
import type { ApiPagedResult } from "@/types/admin.type";
import type { AdminReview, AdminReviewInteraction } from "@/types/admin.type";

const BASE_URL = "/admin/reviews";

export async function fetchAdminReviews(
  token: string,
  params: {
    page?: number;
    size?: number;
    status?: string;
    movieId?: number;
  }
): Promise<ApiPagedResult<AdminReview>> {
  let url = `${BASE_URL}?page=${params.page ?? 0}&size=${params.size ?? 10}`;
  if (params.status && params.status !== "ALL") {
    url += `&filter=reviewStatus:'${params.status}'`;
  }
  if (params.movieId) {
    url += `&filter=movies.movieId:${params.movieId}`; // Using spring-filter syntax
  }

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Không thể tải danh sách đánh giá");
  }

  return response.data.result;
}

export async function approveReview(token: string, reviewId: number): Promise<AdminReview> {
  const response = await axios.patch(`${BASE_URL}/${reviewId}/approve`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Không thể duyệt đánh giá");
  }
  return response.data.result;
}

export async function rejectReview(token: string, reviewId: number): Promise<AdminReview> {
  const response = await axios.patch(`${BASE_URL}/${reviewId}/reject`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Không thể từ chối đánh giá");
  }
  return response.data.result;
}

export async function hideReview(token: string, reviewId: number): Promise<AdminReview> {
  const response = await axios.patch(`${BASE_URL}/${reviewId}/hide`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Không thể ẩn đánh giá");
  }
  return response.data.result;
}

export async function fetchReviewInteractions(
  token: string,
  reviewId: number
): Promise<AdminReviewInteraction[]> {
  const response = await axios.get(`${BASE_URL}/${reviewId}/interactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Không thể lấy lượt tương tác");
  }
  return response.data.result;
}
