import { adminDelete, adminGet, adminPost, adminPut } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { PricePolicy, PricePolicyRule } from "@/types/admin/pricePolicy";
import type { PricePolicyValues } from "@/lib/validations/admin/pricePolicy.schema";
import type { PriceRuleRowValues } from "@/lib/validations/admin/pricePolicy.schema";

type PricePolicyPayload = Omit<PricePolicyValues, "effectiveTo"> & { effectiveTo?: string };

export const adminPricePolicyService = {
  getPricePolicies: (token: string, page = 0, size = 10, filter?: string) =>
    adminGet<ApiPagedResult<PricePolicy>>(token, "/admin/price-policies", {
      page, size, sort: "createdAt,desc", filter,
    }),

  getPricePolicyById: (token: string, id: number) =>
    adminGet<PricePolicy>(token, `/admin/price-policies/${id}`),

  createPricePolicy: (token: string, data: PricePolicyPayload) =>
    adminPost<PricePolicy>(token, "/admin/price-policies", data),

  updatePricePolicy: (token: string, id: number, data: PricePolicyPayload) =>
    adminPut<PricePolicy>(token, `/admin/price-policies/${id}`, data),

  deletePricePolicy: (token: string, id: number) =>
    adminDelete(token, `/admin/price-policies/${id}`),

  getRules: (token: string, policyId: number) =>
    adminGet<PricePolicyRule[]>(token, `/admin/price-policies/${policyId}/rules`),

  addRules: (token: string, policyId: number, rules: PriceRuleRowValues[]) =>
    adminPost<PricePolicyRule[]>(token, `/admin/price-policies/${policyId}/rules`, {
      rules: rules.map((r) => ({
        ...r,
        startHour: r.startHour || null,
        endHour: r.endHour || null,
      })),
    }),

  deleteRule: (token: string, policyId: number, ruleId: number) =>
    adminDelete(token, `/admin/price-policies/${policyId}/rules/${ruleId}`),
};
