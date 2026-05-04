import { useMemo } from 'react';
import { differenceInDays, subDays } from 'date-fns';
import type { CustomerWithVisits, Visit } from '../types';

export interface RFMScore {
  recency: number;
  frequency: number;
  monetary: number;
  total: number;
}

export type CustomerSegment =
  | 'vip'
  | 'at_risk'
  | 'growing'
  | 'new'
  | 'dormant'
  | 'regular';

export interface CustomerAnalytics {
  rfm: RFMScore;
  segment: CustomerSegment;
  isAtRisk: boolean;
  daysSinceLastVisit: number;
  avgVisitValue: number;
  totalRevenue: number;
  visitCount: number;
  visitFrequency: number;
  predictedLTV: number;
}

const SEGMENT_THRESHOLDS = {
  VIP: { minScore: 75, minVisits: 5 },
  REGULAR: { minScore: 40 },
  AT_RISK: { daysInactive: 30 },
  GROWING: { visitGrowth: 0.2 },
  NEW: { daysSinceFirst: 30 },
  DORMANT: { daysInactive: 60 },
};

function calculateRecencyScore(lastVisitDate: string | null): number {
  if (!lastVisitDate) return 0;
  const days = differenceInDays(new Date(), new Date(lastVisitDate));
  if (days <= 7) return 100;
  if (days <= 14) return 80;
  if (days <= 30) return 60;
  if (days <= 45) return 40;
  if (days <= 60) return 20;
  return 0;
}

function calculateFrequencyScore(
  visits: Visit[],
  lookbackDays: number = 90
): number {
  if (!visits || visits.length === 0) return 0;

  const recentVisits = visits.filter((v) => {
    const visitDate = new Date(v.visit_date);
    return differenceInDays(new Date(), visitDate) <= lookbackDays;
  });

  const visitRate = recentVisits.length / (lookbackDays / 30);

  if (visitRate >= 4) return 100;
  if (visitRate >= 3) return 80;
  if (visitRate >= 2) return 60;
  if (visitRate >= 1) return 40;
  if (visitRate >= 0.5) return 20;
  return 10;
}

function calculateMonetaryScore(totalRevenue: number): number {
  if (totalRevenue >= 10000) return 100;
  if (totalRevenue >= 5000) return 80;
  if (totalRevenue >= 2000) return 60;
  if (totalRevenue >= 1000) return 40;
  if (totalRevenue >= 500) return 20;
  return 10;
}

function calculateSegment(
  rfm: RFMScore,
  visits: Visit[],
  daysSinceLastVisit: number,
  firstVisitDate: string | null
): CustomerSegment {
  const recentVisits = visits.filter((v) => {
    const days = differenceInDays(new Date(), new Date(v.visit_date));
    return days <= 30;
  });
  const previousPeriodVisits = visits.filter((v) => {
    const days = differenceInDays(new Date(), new Date(v.visit_date));
    return days > 30 && days <= 60;
  });

  const isGrowing = recentVisits.length > previousPeriodVisits.length * 1.2;
  const daysSinceFirst = firstVisitDate
    ? differenceInDays(new Date(), new Date(firstVisitDate))
    : 0;

  if (
    rfm.total >= SEGMENT_THRESHOLDS.VIP.minScore &&
    visits.length >= SEGMENT_THRESHOLDS.VIP.minVisits
  ) {
    return 'vip';
  }
  if (
    daysSinceLastVisit >= SEGMENT_THRESHOLDS.AT_RISK.daysInactive &&
    visits.length >= 2
  ) {
    return 'at_risk';
  }
  if (isGrowing && recentVisits.length >= 2) {
    return 'growing';
  }
  if (
    daysSinceFirst <= SEGMENT_THRESHOLDS.NEW.daysSinceFirst &&
    visits.length <= 3
  ) {
    return 'new';
  }
  if (daysSinceLastVisit >= SEGMENT_THRESHOLDS.DORMANT.daysInactive) {
    return 'dormant';
  }
  return 'regular';
}

function predictLTV(
  totalRevenue: number,
  visitCount: number,
  avgVisitValue: number,
  visitFrequency: number
): number {
  if (visitCount < 2 || avgVisitValue === 0) return totalRevenue * 1.5;

  const monthlyValue = avgVisitValue * visitFrequency;
  const estimatedMonthsActive = Math.min(visitCount / visitFrequency, 24);
  const predictedMonthlyValue =
    monthlyValue * Math.min(estimatedMonthsActive / 12, 1);

  return totalRevenue + predictedMonthlyValue * 12;
}

export function useCustomerAnalytics(
  customers: CustomerWithVisits[]
): Map<string, CustomerAnalytics> {
  return useMemo(() => {
    const analyticsMap = new Map<string, CustomerAnalytics>();

    customers.forEach((customer) => {
      const visits = customer.visits || [];

      if (visits.length === 0) {
        const now = new Date();
        analyticsMap.set(customer.id, {
          rfm: { recency: 100, frequency: 0, monetary: 0, total: 25 },
          segment: 'new',
          isAtRisk: false,
          daysSinceLastVisit: 0,
          avgVisitValue: 0,
          totalRevenue: 0,
          visitCount: 0,
          visitFrequency: 0,
          predictedLTV: 0,
        });
        return;
      }

      const sortedVisits = [...visits].sort(
        (a, b) =>
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      );

      const lastVisit = sortedVisits[0];
      const firstVisit = sortedVisits[sortedVisits.length - 1];

      const daysSinceLastVisit = differenceInDays(
        new Date(),
        new Date(lastVisit.visit_date)
      );
      const daysSinceFirst = differenceInDays(
        new Date(),
        new Date(firstVisit.visit_date)
      );

      const totalRevenue = visits.reduce(
        (sum, v) => sum + (parseFloat(v.bill_value?.toString() || '0') || 0),
        0
      );

      const avgVisitValue =
        visits.length > 0 ? totalRevenue / visits.length : 0;
      const visitFrequency =
        daysSinceFirst > 0 ? visits.length / (daysSinceFirst / 30) : 0;

      const recency = calculateRecencyScore(lastVisit.visit_date);
      const frequency = calculateFrequencyScore(visits);
      const monetary = calculateMonetaryScore(totalRevenue);

      const rfm: RFMScore = {
        recency,
        frequency,
        monetary,
        total: Math.round((recency + frequency + monetary) / 3),
      };

      const segment = calculateSegment(
        rfm,
        visits,
        daysSinceLastVisit,
        firstVisit.visit_date
      );

      const isAtRisk =
        segment === 'at_risk' || (segment === 'dormant' && visits.length >= 2);

      const predictedLTV = predictLTV(
        totalRevenue,
        visits.length,
        avgVisitValue,
        visitFrequency
      );

      analyticsMap.set(customer.id, {
        rfm,
        segment,
        isAtRisk,
        daysSinceLastVisit,
        avgVisitValue: Math.round(avgVisitValue),
        totalRevenue: Math.round(totalRevenue),
        visitCount: visits.length,
        visitFrequency: Math.round(visitFrequency * 10) / 10,
        predictedLTV: Math.round(predictedLTV),
      });
    });

    return analyticsMap;
  }, [customers]);
}

export function getSegmentLabel(segment: CustomerSegment): string {
  const labels: Record<CustomerSegment, string> = {
    vip: 'VIP',
    at_risk: 'At Risk',
    growing: 'Growing',
    new: 'New',
    dormant: 'Dormant',
    regular: 'Regular',
  };
  return labels[segment];
}

export function getSegmentColor(segment: CustomerSegment): string {
  const colors: Record<CustomerSegment, string> = {
    vip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    at_risk: 'bg-red-500/10 text-red-600 dark:text-red-400',
    growing: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dormant: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    regular: 'bg-primary/10 text-primary',
  };
  return colors[segment];
}
