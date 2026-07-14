import type {
  AdminBanner,
  ApiPagedResult,
  BannerCreatePayload,
  BannerUpdatePayload,
  AdminListQuery,
} from "@/types/admin.type";
import { adminGet, adminPost, adminPut, adminPutEmpty, adminDelete } from "./adminApiClient";

export async function fetchAdminBanners(
  token: string,
  query: AdminListQuery = {}
): Promise<ApiPagedResult<AdminBanner>> {
  const { page = 0, size = 10 } = query;

  return adminGet<ApiPagedResult<AdminBanner>>(token, "/admin/banners", {
    page,
    size,
    sort: "priority,asc",
  });
}

export async function createBanner(
  token: string,
  payload: BannerCreatePayload
): Promise<AdminBanner> {
  return adminPost<AdminBanner>(token, "/admin/banners", payload);
}

export async function createBannersBulk(
  token: string,
  payloads: BannerCreatePayload[]
): Promise<AdminBanner[]> {
  return adminPost<AdminBanner[]>(token, "/admin/banners/bulk", payloads);
}

export async function updateBanner(
  token: string,
  id: number,
  payload: BannerUpdatePayload
): Promise<AdminBanner> {
  return adminPut<AdminBanner>(token, `/admin/banners/${id}`, payload);
}

export async function deleteBanner(
  token: string,
  id: number
): Promise<void> {
  return adminDelete(token, `/admin/banners/${id}`);
}

export async function activateBanner(token: string, id: number): Promise<void> {
  return adminPutEmpty(token, `/admin/banners/${id}/active`);
}

export async function inactivateBanner(token: string, id: number): Promise<void> {
  return adminPutEmpty(token, `/admin/banners/${id}/inactive`);
}

export async function toggleBannerActive(
  token: string,
  id: number,
  currentActive: boolean
): Promise<void> {
  return currentActive ? inactivateBanner(token, id) : activateBanner(token, id);
}
