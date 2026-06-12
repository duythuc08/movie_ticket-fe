export interface AdminReview {
  reviewId: number;
  userId: string;
  fullName: string;
  username: string;
  movieId: number;
  movieTitle: string;
  rating: number;
  comment: string;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewInteraction {
  interactionId: number;
  userId: string;
  fullName: string;
  avatarUrl: string;
  interactionType: "LIKE" | "DISLIKE";
  createdAt: string;
}
