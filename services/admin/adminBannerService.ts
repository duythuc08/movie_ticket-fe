import type {
  AdminBanner,
  ApiPagedResult,
  BannerCreatePayload,
  AdminListQuery,
} from "@/types/admin.type";
import { adminGet, adminPost } from "./adminApiClient";

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
