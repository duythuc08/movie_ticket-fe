import { apiFetch } from "@/lib/fetchApi";

const BASE_URL = "/reviews";

export interface ReviewResponse {
  reviewId: number;
  userId: string;
  fullName: string;
  username: string;
  movieId: number;
  movieName: string;
  rating: number;
  comment: string | null;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  likedByMe: boolean;
  dislikedByMe: boolean;
}

export interface MovieReviewPageResponse {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  content: ReviewResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  last: boolean;
}

export class ApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export async function fetchReviewsByMovie(
  movieId: number,
  page: number = 0,
  size: number = 10,
  rating?: number
): Promise<MovieReviewPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (rating != null) params.set("rating", String(rating));
  const response = await apiFetch(`${BASE_URL}/movie/${movieId}?${params.toString()}`);
  const data = await response.json();
  if (data.code !== 0) {
    throw new ApiError(data.message || "Lỗi tải bình luận", data.code);
  }
  return data.result;
}

export async function createReview(movieId: number, rating: number, comment?: string | null): Promise<ReviewResponse> {
  const response = await apiFetch(BASE_URL, {
    method: "POST",
    body: JSON.stringify({ movieId, rating, comment }),
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new ApiError(data.message || "Lỗi gửi bình luận", data.code);
  }
  return data.result;
}

export async function updateReview(reviewId: number, movieId: number, rating: number, comment?: string | null): Promise<ReviewResponse> {
  const response = await apiFetch(`${BASE_URL}/${reviewId}`, {
    method: "PUT",
    body: JSON.stringify({ movieId, rating, comment }),
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new ApiError(data.message || "Lỗi cập nhật bình luận", data.code);
  }
  return data.result;
}

export async function toggleInteraction(reviewId: number, type: "LIKE" | "DISLIKE"): Promise<void> {
  const response = await apiFetch(`${BASE_URL}/${reviewId}/interactions/${type}`, {
    method: "POST",
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new ApiError(data.message || "Lỗi tương tác", data.code);
  }
}
