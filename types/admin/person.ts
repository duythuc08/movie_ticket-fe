import type { EntityStatus, AdminListQuery } from "./common";

export type MovieRole = "DIRECTOR" | "ACTOR";

export interface AdminPerson {
  id: number;
  name: string;
  avatarUrl: string | null;
  movieRole: MovieRole;
  entityStatus: EntityStatus;
}

export interface PersonCreatePayload {
  name: string;
  avatarUrl?: string;
  movieRole: MovieRole;
}

export interface PersonListQuery extends AdminListQuery {
  movieRole?: MovieRole;
  entityStatus?: EntityStatus;
}

export interface PersonFormValues {
  name: string;
  avatarUrl: string;
  movieRole: MovieRole;
}
