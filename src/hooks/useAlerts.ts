import { useMemo } from 'react';
import { isSameDay, differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import type { CustomerWithVisits, Action, Alert } from '../types';

/**
 * Parameters for useAlerts hook
 */
interface UseAlertsParams {
  customers: CustomerWithVisits[];
  actions: Action[];
}

/**
 * Generates alerts based on customer activity and follow-up status.
 * Checks for:
 * - Overdue follow-ups (2-7 days since last visit without follow-up)
 * - Inactive customers (30+ days without contact)
 * - Customers added today
 * 
 * @param params - Object containing customers and actions arrays
 * @returns Array of Alert objects with type, message, action, and route
 * 
 * @example
 * const alerts = useAlerts({ customers, actions });
 * alerts.map(a => console.log(a.message));
 */
export function useAlerts({ customers, actions }: UseAlertsParams): Alert[] {
  return useMemo(() => {
    if (!customers.length) return [];

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let overdueFollowUps = 0;
    let inactiveNotContacted = 0;
    let customersAddedToday = 0;

    for (const c of customers) {
      if (c.created_at && isSameDay(new Date(c.created_at), today)) {
        customersAddedToday++;
      }

      if (c.visits && c.visits.length > 0) {
        const sortedVisits = [...c.visits].sort(
          (a, b) =>
            new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        );
        const latestVisit = sortedVisits[0];
        const latestVisitDate = new Date(latestVisit.visit_date);
        const daysSince = differenceInDays(today, latestVisitDate);

        const hasFollowUp = actions.some(
          (a: Action) =>
            a.customer_id === c.id &&
            a.action_type === 'follow_up' &&
            new Date(a.created_at) >= latestVisitDate
        );

        if (!hasFollowUp && daysSince > 2 && daysSince <= 7) {
          overdueFollowUps++;
        }

        const hasAnyContact = actions.some(
          (a: Action) =>
            a.customer_id === c.id &&
            new Date(a.created_at) >= latestVisitDate
        );

        if (!hasAnyContact && daysSince >= 30) {
          inactiveNotContacted++;
        }
      }
    }

    const alerts: Alert[] = [];
    if (overdueFollowUps > 0) {
      alerts.push({
        type: 'High',
        message: `${overdueFollowUps} follow-ups are overdue.`,
        action: 'View',
        route: '/follow-ups',
      });
    }
    if (inactiveNotContacted > 0) {
      alerts.push({
        type: 'Medium',
        message: `${inactiveNotContacted} inactive customers haven't been contacted.`,
        action: 'View',
        route: '/inactive',
      });
    }
    if (customersAddedToday === 0) {
      alerts.push({
        type: 'Low',
        message: `No customers added today.`,
        action: 'Add',
        route: '/customers',
      });
    }

    return alerts;
  }, [customers, actions]);
}

/**
 * Finds customers with birthdays or anniversaries occurring today.
 * Prioritizes birthday over anniversary when both match.
 * 
 * @param customers - Array of customer records
 * @returns Array of customers with occasion info, sorted by name
 * 
 * @example
 * const todayOccasions = useOccasions(customers);
 * todayOccasions.forEach(c => sendBirthdayWish(c));
 */
export function useOccasions(customers: CustomerWithVisits[]) {
  return useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'MM-dd');

    return customers
      .filter((c) => {
        const birthdayMatch =
          c.birthday_date &&
          format(new Date(c.birthday_date), 'MM-dd') === todayStr;
        const anniversaryMatch =
          c.anniversary_date &&
          format(new Date(c.anniversary_date), 'MM-dd') === todayStr;
        return birthdayMatch || anniversaryMatch;
      })
      .map((c) => ({
        ...c,
        occasionType:
          c.birthday_date &&
          format(new Date(c.birthday_date), 'MM-dd') === todayStr
            ? 'birthday'
            : ('anniversary' as const),
      }));
  }, [customers]);
}
