import type { JobRunResult } from "@/types/admin.type";
import { adminPost } from "./adminApiClient";

export async function runMovieStatusUpdate(token: string): Promise<JobRunResult> {
  return adminPost<JobRunResult>(token, "/admin/system-operations/movie-status", {});
}

export async function runShowTimeStatusUpdate(token: string): Promise<JobRunResult> {
  return adminPost<JobRunResult>(token, "/admin/system-operations/showtime-status", {});
}

export async function runEventStatusUpdate(token: string): Promise<JobRunResult> {
  return adminPost<JobRunResult>(token, "/admin/system-operations/event-status", {});
}

export async function runPromotionExpire(token: string): Promise<JobRunResult> {
  return adminPost<JobRunResult>(token, "/admin/system-operations/promotion-expire", {});
}

export async function runOrderCleanup(token: string): Promise<JobRunResult> {
  return adminPost<JobRunResult>(token, "/admin/system-operations/order-cleanup", {});
}

export async function runRecommendationTrain(token: string): Promise<Record<string, unknown>> {
  return adminPost<Record<string, unknown>>(token, "/recommendations/refresh", {});
}

export async function runWeeklyEmails(token: string): Promise<Record<string, unknown>> {
  return adminPost<Record<string, unknown>>(token, "/recommendations/send-weekly-emails", {});
}
