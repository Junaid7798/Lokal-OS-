import { useMemo } from 'react';
import {
  differenceInDays,
  subDays,
  eachDayOfInterval,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import type { Visit, Customer, CustomerWithVisits } from '../types';

export interface RevenueMetrics {
  totalRevenue: number;
  avgOrderValue: number;
  totalVisits: number;
  uniqueCustomers: number;
  revenueGrowth: number;
  visitGrowth: number;
  newCustomers: number;
  returningCustomers: number;
  recoveryRate: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  visits: number;
  customers: number;
}

export interface RevenueForecast {
  nextWeek: number[];
  projectedMonthly: number;
  confidence: number;
}

export interface DayOfWeekMetrics {
  day: string;
  revenue: number;
  visits: number;
  avgValue: number;
}

export interface SourceMetrics {
  source: string;
  customers: number;
  revenue: number;
  percentage: number;
}

export interface ServiceMetrics {
  category: string;
  visits: number;
  revenue: number;
  avgValue: number;
  trend: 'up' | 'down' | 'stable';
}

export function useRevenueAnalytics(
  visits: Visit[],
  customers: CustomerWithVisits[]
): {
  metrics: RevenueMetrics;
  trends: RevenueTrend[];
  forecast: RevenueForecast;
  dayOfWeekMetrics: DayOfWeekMetrics[];
  sourceMetrics: SourceMetrics[];
  serviceMetrics: ServiceMetrics[];
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

    const totalRevenue = recentVisits.reduce(
      (sum, v) => sum + (parseFloat(v.bill_value?.toString() || '0') || 0),
      0
    );

    const previousRevenue = previousVisits.reduce(
      (sum, v) => sum + (parseFloat(v.bill_value?.toString() || '0') || 0),
      0
    );

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const visitGrowth =
      previousVisits.length > 0
        ? ((recentVisits.length - previousVisits.length) /
            previousVisits.length) *
          100
        : 0;

    const recentCustomerIds = new Set(recentVisits.map((v) => v.customer_id));
    const previousCustomerIds = new Set(
      previousVisits.map((v) => v.customer_id)
    );

    const newCustomers = [...recentCustomerIds].filter(
      (id) => !previousCustomerIds.has(id)
    ).length;
    const returningCustomers = [...recentCustomerIds].filter((id) =>
      previousCustomerIds.has(id)
    ).length;

    const recoveredCustomers = customers.filter(
      (c) => c.is_returned && recentVisits.some((v) => v.customer_id === c.id)
    ).length;
    const atRiskCustomers = customers.filter((c) => {
      const lastVisit = c.visits?.[0];
      if (!lastVisit) return false;
      return differenceInDays(now, new Date(lastVisit.visit_date)) >= 30;
    }).length;

    const recoveryRate =
      atRiskCustomers > 0 ? (recoveredCustomers / atRiskCustomers) * 100 : 0;

    const metrics: RevenueMetrics = {
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue:
        recentVisits.length > 0
          ? Math.round(totalRevenue / recentVisits.length)
          : 0,
      totalVisits: recentVisits.length,
      uniqueCustomers: recentCustomerIds.size,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      visitGrowth: Math.round(visitGrowth * 10) / 10,
      newCustomers,
      returningCustomers,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
    };

    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const trends: RevenueTrend[] = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayVisits = recentVisits.filter((v) => {
        const visitDate = new Date(v.visit_date);
        return visitDate >= dayStart && visitDate <= dayEnd;
      });
      const dayRevenue = dayVisits.reduce(
        (sum, v) => sum + (parseFloat(v.bill_value?.toString() || '0') || 0),
        0
      );
      const dayCustomers = new Set(dayVisits.map((v) => v.customer_id)).size;

      return {
        date: format(day, 'MMM dd'),
        revenue: Math.round(dayRevenue),
        visits: dayVisits.length,
        customers: dayCustomers,
      };
    });

    const lastWeekRevenue = trends
      .slice(-7)
      .reduce((sum, t) => sum + t.revenue, 0);
    const prevWeekRevenue = trends
      .slice(-14, -7)
      .reduce((sum, t) => sum + t.revenue, 0);
    const weeklyGrowth =
      prevWeekRevenue > 0
        ? (lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue
        : 0;

    const projectedMonthly = Math.round(lastWeekRevenue * 4);
    const confidence = Math.min(
      95,
      Math.max(50, 100 - Math.abs(weeklyGrowth) * 20)
    );

    const forecast: RevenueForecast = {
      nextWeek: trends.slice(-7).map((t) => t.revenue),
      projectedMonthly,
      confidence: Math.round(confidence),
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMetrics: Map<string, { revenue: number; visits: number }> =
      new Map();

    recentVisits.forEach((v) => {
      const dayName = dayNames[new Date(v.visit_date).getDay()];
      const existing = dayMetrics.get(dayName) || { revenue: 0, visits: 0 };
      dayMetrics.set(dayName, {
        revenue:
          existing.revenue + (parseFloat(v.bill_value?.toString() || '0') || 0),
        visits: existing.visits + 1,
      });
    });

    const dayOfWeekMetrics: DayOfWeekMetrics[] = dayNames.map((day) => {
      const data = dayMetrics.get(day) || { revenue: 0, visits: 0 };
      return {
        day,
        revenue: Math.round(data.revenue),
        visits: data.visits,
        avgValue: data.visits > 0 ? Math.round(data.revenue / data.visits) : 0,
      };
    });

    const sourceCounts: Map<string, number> = new Map();
    const sourceRevenue: Map<string, number> = new Map();

    recentVisits.forEach((v) => {
      const customer = customers.find((c) => c.id === v.customer_id);
      const source = customer?.source || 'Unknown';
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
      sourceRevenue.set(
        source,
        (sourceRevenue.get(source) || 0) +
          (parseFloat(v.bill_value?.toString() || '0') || 0)
      );
    });

    const totalSourceCustomers = [...sourceCounts.values()].reduce(
      (a, b) => a + b,
      0
    );

    const sourceMetrics: SourceMetrics[] = [...sourceCounts.entries()]
      .map(([source, count]) => ({
        source,
        customers: count,
        revenue: Math.round(sourceRevenue.get(source) || 0),
        percentage: Math.round((count / totalSourceCustomers) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const serviceCounts: Map<string, number> = new Map();
    const serviceRevenue: Map<string, number> = new Map();
    const prevServiceCounts: Map<string, number> = new Map();

    recentVisits.forEach((v) => {
      const category = v.service_category || 'Other';
      serviceCounts.set(category, (serviceCounts.get(category) || 0) + 1);
      serviceRevenue.set(
        category,
        (serviceRevenue.get(category) || 0) +
          (parseFloat(v.bill_value?.toString() || '0') || 0)
      );
    });

    previousVisits.forEach((v) => {
      const category = v.service_category || 'Other';
      prevServiceCounts.set(
        category,
        (prevServiceCounts.get(category) || 0) + 1
      );
    });

    const serviceMetrics: ServiceMetrics[] = [...serviceCounts.entries()]
      .map(([category, count]) => {
        const currentRevenue = serviceRevenue.get(category) || 0;
        const prevCount = prevServiceCounts.get(category) || 0;
        const trend: 'up' | 'down' | 'stable' =
          prevCount === 0
            ? 'up'
            : count > prevCount * 1.1
              ? 'up'
              : count < prevCount * 0.9
                ? 'down'
                : 'stable';

        return {
          category,
          visits: count,
          revenue: Math.round(currentRevenue),
          avgValue: Math.round(currentRevenue / count),
          trend,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      metrics,
      trends,
      forecast,
      dayOfWeekMetrics,
      sourceMetrics,
      serviceMetrics,
    };
  }, [visits, customers]);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
