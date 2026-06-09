import { adminGet, adminPost, adminPut, adminPutEmpty } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { AdminUser, LoyaltyHistory } from "@/types/admin/user";
import type { CreateUserValues, UpdateUserValues } from "@/lib/validations/admin/user.schema";

export const adminUserService = {
  getUsers: (token: string, page = 0, size = 15, filter?: string) =>
    adminGet<ApiPagedResult<AdminUser>>(token, "/admin/users", {
      page, size, sort: "createdAt,desc", filter,
    }),

  getUserById: (token: string, userId: string) =>
    adminGet<AdminUser>(token, `/admin/users/${userId}`),

  createUser: (token: string, data: CreateUserValues) => {
    const payload = {
      ...data,
      birthday:    data.birthday    || undefined,
      phoneNumber: data.phoneNumber || undefined,
      firstname:   data.firstname   || undefined,
      lastname:    data.lastname    || undefined,
    };
    return adminPost<AdminUser>(token, "/admin/users", payload);
  },

  updateUser: (token: string, userId: string, data: UpdateUserValues) => {
    const payload = {
      ...data,
      password:    data.password    || undefined,
      birthday:    data.birthday    || undefined,
      phoneNumber: data.phoneNumber || undefined,
      firstname:   data.firstname   || undefined,
      lastname:    data.lastname    || undefined,
    };
    return adminPut<AdminUser>(token, `/admin/users/${userId}`, payload);
  },

  banUser: (token: string, userId: string) =>
    adminPutEmpty(token, `/admin/users/${userId}/banned`),

  activateUser: (token: string, userId: string) =>
    adminPutEmpty(token, `/admin/users/${userId}/activate`),

  inactivateUser: (token: string, userId: string) =>
    adminPutEmpty(token, `/admin/users/${userId}/inactivate`),

  getLoyaltyHistory: (token: string, userId: string, page = 0, size = 10) =>
    adminGet<ApiPagedResult<LoyaltyHistory>>(token, `/admin/users/${userId}/loyalty-history`, {
      page, size, sort: "createdAt,desc",
    }),
};
