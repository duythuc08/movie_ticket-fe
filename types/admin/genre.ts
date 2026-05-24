import type { EntityStatus, AdminListQuery } from "./common";

export interface AdminGenre {
  genreId: number;
  name: string;
  description: string | null;
  entityStatus: EntityStatus;
}

export interface GenreCreatePayload {
  name: string;
  description?: string;
}

export interface GenreListQuery extends AdminListQuery {
  entityStatus?: EntityStatus;
}

export interface GenreFormValues {
  name: string;
  description: string;
}
