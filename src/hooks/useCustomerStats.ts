import { useMemo } from 'react';
import { subDays, isSameDay } from 'date-fns';
import { format } from 'date-fns';
import { safeDate } from '@/lib/utils';
import type {
  CustomerWithVisits,
  DashboardStats,
  ChartDataPoint,
} from '../types';

interface UseCustomerStatsParams {
  customers: CustomerWithVisits[];
}

/**
 * Calculates dashboard statistics from customer data.
 * Computes total customers, returning customers, total revenue, and recovered revenue.
 * 
 * @param params - Object containing customers array
 * @returns DashboardStats object with computed metrics
 * 
 * @example
 * const stats = useCustomerStats({ customers });
 * console.log(`Total: ${stats.totalCustomers}, Revenue: ₹${stats.revenue}`);
 */
export function useCustomerStats({
  customers,
}: UseCustomerStatsParams): DashboardStats {
  return useMemo(() => {
    let totalRevenue = 0;
    let returningCount = 0;
    let recoveredRevenue = 0;

    for (const c of customers) {
      if (c.is_returned) {
        returningCount++;
        recoveredRevenue += parseFloat(String(c.revenue_recovered)) || 0;
      }
      const visitsRevenue =
        c.visits?.reduce(
          (sum: number, v) => sum + (parseFloat(String(v.bill_value)) || 0),
          0
        ) || 0;
      totalRevenue += visitsRevenue;
    }

    return {
      totalCustomers: customers.length,
      returningCustomers: returningCount,
      revenue: totalRevenue,
      recoveredRevenue,
    };
  }, [customers]);
}

/**
 * Generates chart data for the last 7 days showing customer additions and revenue.
 * Aggregates customer creation dates and visit bill values by day.
 * 
 * @param customers - Array of customer records with visits
 * @returns Array of ChartDataPoint objects with date, name, customers count, and revenue
 * 
 * @example
 * const chartData = useRecentChartData(customers);
 * // Returns: [{ date: Date, name: 'Mon', customers: 5, revenue: 1500 }, ...]
 */
export function useRecentChartData(
  customers: CustomerWithVisits[]
): ChartDataPoint[] {
  return useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: d,
        name: format(d, 'EEE'),
        customers: 0,
        revenue: 0,
      };
    });

    for (const c of customers) {
      const createdDate = safeDate(c.created_at);
      if (createdDate) {
        const dayData = last7Days.find((d) => isSameDay(d.date, createdDate));
        if (dayData) {
          dayData.customers += 1;
        }
      }

      c.visits?.forEach((v) => {
        const visitDate = safeDate(v.visit_date);
        if (visitDate) {
          const vDayData = last7Days.find((d) => isSameDay(d.date, visitDate));
          if (vDayData) {
            vDayData.revenue += parseFloat(String(v.bill_value)) || 0;
          }
        }
      });
    }

    return last7Days;
  }, [customers]);
}
