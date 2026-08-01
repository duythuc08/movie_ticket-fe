export interface JobChangeItem {
  entityName: string;
  fromStatus: string;
  toStatus: string;
  note?: string | null;
}

export interface JobRunResult {
  totalChanged: number;
  summary: string;
  changes: JobChangeItem[];
}

export type SystemJobKey =
  | "movie-status"
  | "showtime-status"
  | "event-status"
  | "promotion-expire"
  | "order-cleanup"
  | "recommendation-train"
  | "weekly-emails";
