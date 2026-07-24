import { apiFetch } from "@/lib/fetchApi";
import { AdminOrderSummaryResponse } from "@/types";

export interface DailyRevenueResponse {
    day: string;
    revenue: number;
    ordersCount: number;
}

export interface StatisticResponse {
    totalRevenue: number;
    totalOrders: number;
    dailyData: DailyRevenueResponse[];
}

export const adminStatisticService = {
    getMonthlyStatistics: async (token: string, year?: number, month?: number): Promise<StatisticResponse> => {
        let url = '/admin/statistics';
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await apiFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();
        return data.result;
    }
};
