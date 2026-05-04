import { useMemo } from 'react';
import { differenceInDays, subDays } from 'date-fns';
import type { Visit } from '../types';

export interface StaffMetrics {
  name: string;
  visitCount: number;
  revenue: number;
  avgBillValue: number;
  uniqueCustomers: number;
  growth: number;
  rank: number;
}

export interface StaffTrend {
  date: string;
  staff: string;
  visits: number;
  revenue: number;
}

export function useStaffMetrics(
  visits: Visit[],
  staffList: string[]
): {
  staffMetrics: StaffMetrics[];
  staffTrends: StaffTrend[];
} {
  return useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const recentVisits = visits.filter(
      (v) => new Date(v.visit_date) >= thirtyDaysAgo
    );
    const previousVisits = visits.filter((v) => {
      const date = new Date(v.visit_date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const staffMetricsMap = new Map<
      string,
      {
        recent: { count: number; revenue: number; customers: Set<string> };
        previous: { count: number; revenue: number };
        name: string;
      }
    >();

    staffList.forEach((name) => {
      staffMetricsMap.set(name.toLowerCase(), {
        recent: { count: 0, revenue: 0, customers: new Set() },
        previous: { count: 0, revenue: 0 },
        name,
      });
    });

    recentVisits.forEach((v) => {
      const staffName = (v.staff_name || 'Unknown').toLowerCase();
      const staff = staffMetricsMap.get(staffName);
      if (staff) {
        staff.recent.count++;
        staff.recent.revenue +=
          parseFloat(v.bill_value?.toString() || '0') || 0;
        staff.recent.customers.add(v.customer_id);
      } else {
        staffMetricsMap.set(staffName, {
          recent: {
            count: 1,
            revenue: parseFloat(v.bill_value?.toString() || '0') || 0,
            customers: new Set([v.customer_id]),
          },
          previous: { count: 0, revenue: 0 },
          name: v.staff_name || 'Unknown',
        });
      }
    });

    previousVisits.forEach((v) => {
      const staffName = (v.staff_name || 'Unknown').toLowerCase();
      const staff = staffMetricsMap.get(staffName);
      if (staff) {
        staff.previous.count++;
        staff.previous.revenue +=
          parseFloat(v.bill_value?.toString() || '0') || 0;
      }
    });

    const staffMetrics: StaffMetrics[] = [...staffMetricsMap.values()]
      .map((staff) => {
        const previousCount = staff.previous.count || 1;
        const growth =
          ((staff.recent.count - staff.previous.count) / previousCount) * 100;

        return {
          name: staff.name,
          visitCount: staff.recent.count,
          revenue: Math.round(staff.recent.revenue),
          avgBillValue:
            staff.recent.count > 0
              ? Math.round(staff.recent.revenue / staff.recent.count)
              : 0,
          uniqueCustomers: staff.recent.customers.size,
          growth: Math.round(growth * 10) / 10,
          rank: 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .map((staff, index) => ({ ...staff, rank: index + 1 }));

    const staffTrendsMap = new Map<
      string,
      Map<string, { visits: number; revenue: number }>
    >();

    recentVisits.forEach((v) => {
      const date = new Date(v.visit_date).toISOString().split('T')[0];
      const staffName = (v.staff_name || 'Unknown').toLowerCase();

      if (!staffTrendsMap.has(staffName)) {
        staffTrendsMap.set(staffName, new Map());
      }
      const staffMap = staffTrendsMap.get(staffName)!;
      const existing = staffMap.get(date) || { visits: 0, revenue: 0 };
      staffMap.set(date, {
        visits: existing.visits + 1,
        revenue:
          existing.revenue + (parseFloat(v.bill_value?.toString() || '0') || 0),
      });
    });

    const staffTrends: StaffTrend[] = [];
    staffTrendsMap.forEach((dateMap, staff) => {
      dateMap.forEach((data, date) => {
        staffTrends.push({
          date,
          staff,
          visits: data.visits,
          revenue: Math.round(data.revenue),
        });
      });
    });

    return { staffMetrics, staffTrends };
  }, [visits, staffList]);
}

export function getTopPerformers(
  metrics: StaffMetrics[],
  limit: number = 3
): StaffMetrics[] {
  return [...metrics].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function getMostImproved(
  metrics: StaffMetrics[],
  limit: number = 3
): StaffMetrics[] {
  return [...metrics].sort((a, b) => b.growth - a.growth).slice(0, limit);
}
