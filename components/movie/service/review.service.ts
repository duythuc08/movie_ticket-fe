import axios from "@/lib/axios";

const BASE_URL = "/reviews";

export interface ReviewResponse {
  reviewId: number;
  userId: string;
  fullName: string;
  username: string;
  movieId: number;
  movieName: string;
  rating: number;
  comment: string;
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

export async function fetchReviewsByMovie(
  movieId: number,
  page: number = 0,
  size: number = 10,
  rating?: number
): Promise<MovieReviewPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (rating != null) params.set("rating", String(rating));
  const response = await axios.get(`${BASE_URL}/movie/${movieId}?${params.toString()}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Lỗi tải bình luận");
  }
  return response.data.result;
}

export async function createReview(movieId: number, rating: number, comment: string): Promise<ReviewResponse> {
  const response = await axios.post(BASE_URL, { movieId, rating, comment });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Lỗi gửi bình luận");
  }
  return response.data.result;
}

export async function updateReview(reviewId: number, movieId: number, rating: number, comment: string): Promise<ReviewResponse> {
  const response = await axios.put(`${BASE_URL}/${reviewId}`, { movieId, rating, comment });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Lỗi cập nhật bình luận");
  }
  return response.data.result;
}

export async function toggleInteraction(reviewId: number, type: "LIKE" | "DISLIKE"): Promise<void> {
  const response = await axios.post(`${BASE_URL}/${reviewId}/interactions/${type}`);
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "Lỗi tương tác");
  }
}
