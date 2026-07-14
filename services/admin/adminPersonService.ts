import type {
  AdminPerson,
  ApiPagedResult,
  PersonCreatePayload,
  PersonUpdatePayload,
  PersonListQuery,
  EntityStatus,
} from "@/types/admin.type";
import {
  adminGet,
  adminPost,
  adminPut,
  adminPutEmpty,
  buildFilterString,
} from "./adminApiClient";

export async function fetchAdminPersons(
  token: string,
  query: PersonListQuery = {}
): Promise<ApiPagedResult<AdminPerson>> {
  const { page = 0, size = 10, movieRole, entityStatus } = query;

  const filterString = buildFilterString({ movieRole, entityStatus });

  const params: Record<string, string | number | undefined> = {
    page,
    size,
    sort: "createdAt,desc",
  };

  if (filterString) {
    params.filter = filterString;
  }

  return adminGet<ApiPagedResult<AdminPerson>>(token, "/admin/persons", params);
}

export async function fetchPersonsByRoleForSelect(
  token: string,
  movieRole: "DIRECTOR" | "ACTOR"
): Promise<AdminPerson[]> {
  const result = await adminGet<ApiPagedResult<AdminPerson>>(
    token,
    "/admin/persons",
    { page: 0, size: 999, sort: "name,asc" }
  );
  return result.content.filter(
    (p) => !p.movieRole?.length || p.movieRole.includes(movieRole)
  );
}

export async function createPerson(
  token: string,
  payload: PersonCreatePayload
): Promise<AdminPerson> {
  return adminPost<AdminPerson>(token, "/admin/persons", payload);
}

export async function createPersonsBulk(
  token: string,
  payloads: PersonCreatePayload[]
): Promise<AdminPerson[]> {
  return adminPost<AdminPerson[]>(token, "/admin/persons/bulk", payloads);
}

export async function updatePerson(
  token: string,
  personId: number,
  payload: PersonUpdatePayload
): Promise<AdminPerson> {
  return adminPut<AdminPerson>(token, `/admin/persons/${personId}`, payload);
}

function activatePerson(token: string, personId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/persons/${personId}/activate`);
}

function inactivatePerson(token: string, personId: number): Promise<void> {
  return adminPutEmpty(token, `/admin/persons/${personId}/inactivate`);
}

export async function togglePersonStatus(
  token: string,
  personId: number,
  currentStatus: EntityStatus
): Promise<void> {
  if (currentStatus === "ACTIVE") {
    return inactivatePerson(token, personId);
  } else {
    return activatePerson(token, personId);
  }
}
