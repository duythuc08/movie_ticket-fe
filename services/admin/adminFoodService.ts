import { adminGet, adminPost, adminPut, adminPutEmpty } from "./adminApiClient";
import type { ApiPagedResult } from "@/types/admin.type";
import type { FoodType, FoodStatus } from "@/types/admin.type";

export interface AdminFood {
  foodId: number;
  cinemaId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isCombo: boolean;
  stockQuantity: number;
  foodType: FoodType;
  foodStatus: FoodStatus;
  entityStatus: "ACTIVE" | "INACTIVE";
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodRequest {
  cinemaId: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isCombo: boolean;
  stockQuantity: number;
  foodType: FoodType;
  foodStatus: FoodStatus;
}

export async function fetchFoodsByCinema(
  token: string,
  cinemaId: number,
  page: number = 0,
  size: number = 100
): Promise<ApiPagedResult<AdminFood>> {
  return adminGet<ApiPagedResult<AdminFood>>(token, "/admin/foods", {
    cinemaId,
    page,
    size,
  });
}

export async function createFood(
  token: string,
  request: FoodRequest
): Promise<AdminFood> {
  return adminPost<AdminFood>(token, `/admin/foods`, request);
}

export async function updateFood(
  token: string,
  id: number,
  request: FoodRequest
): Promise<AdminFood> {
  return adminPut<AdminFood>(token, `/admin/foods/${id}`, request);
}

export async function activateFood(token: string, id: number): Promise<void> {
  return adminPutEmpty(token, `/admin/foods/${id}/activate`);
}

export async function inactivateFood(token: string, id: number): Promise<void> {
  return adminPutEmpty(token, `/admin/foods/${id}/inactivate`);
}
