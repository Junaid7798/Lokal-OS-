import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlerts, useOccasions } from './useAlerts';
import type { CustomerWithVisits, Action, Visit } from '../types';

describe('useAlerts', () => {
  const createMockVisit = (overrides: Partial<Visit> = {}): Visit => ({
    id: 'v1',
    business_id: 'biz1',
    customer_id: '1',
    visit_date: new Date().toISOString(),
    service_category: 'Test Service',
    bill_value: 100,
    payment_status: 'Paid',
    payment_method: 'Cash',
    staff_name: 'Test Staff',
    notes: 'Test note',
    created_at: new Date().toISOString(),
    ...overrides,
  });

  const createMockCustomer = (overrides: Partial<CustomerWithVisits> = {}): CustomerWithVisits => ({
    id: '1',
    business_id: 'biz1',
    name: 'Test Customer',
    phone: '9876543210',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'Walk-in',
    consent_status: 'given',
    tags: [],
    notes: '',
    opt_out: false,
    review_status: 'not_asked',
    ...overrides,
  });

  const createMockAction = (overrides: Partial<Action> = {}): Action => ({
    id: '1',
    business_id: 'biz1',
    customer_id: '1',
    action_type: 'follow_up',
    created_at: new Date().toISOString(),
    ...overrides,
  });

  describe('alerts generation', () => {
    it('should return empty array when no customers', () => {
      const { result } = renderHook(() =>
        useAlerts({ customers: [], actions: [] })
      );
      expect(result.current).toEqual([]);
    });

    it('should not show "no customers added" alert when customers exist', () => {
      const customers = [
        createMockCustomer({ created_at: new Date().toISOString() }),
      ];
      const { result } = renderHook(() =>
        useAlerts({ customers, actions: [] })
      );
      
      const hasNoCustomersAlert = result.current.some(
        (a) => a.message.includes('No customers added today')
      );
      expect(hasNoCustomersAlert).toBe(false);
    });

    it('should show "no customers added" alert when no customers added today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const customers = [
        createMockCustomer({ created_at: yesterday.toISOString() }),
      ];
      const { result } = renderHook(() =>
        useAlerts({ customers, actions: [] })
      );
      
      const hasNoCustomersAlert = result.current.some(
        (a) => a.message.includes('No customers added today')
      );
      expect(hasNoCustomersAlert).toBe(true);
    });

    it('should count overdue follow-ups correctly', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      const customers = [
        createMockCustomer({
          id: '1',
          visits: [createMockVisit({ visit_date: fiveDaysAgo.toISOString(), customer_id: '1' })],
        }),
        createMockCustomer({
          id: '2',
          visits: [createMockVisit({ visit_date: fiveDaysAgo.toISOString(), customer_id: '2' })],
        }),
      ];
      
      const { result } = renderHook(() =>
        useAlerts({ customers, actions: [] })
      );
      
      const overdueAlert = result.current.find(
        (a) => a.type === 'High'
      );
      expect(overdueAlert?.message).toContain('2');
    });

    it('should not flag as overdue if follow-up exists', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      
      const customers = [
        createMockCustomer({
          id: '1',
          visits: [createMockVisit({ visit_date: fiveDaysAgo.toISOString(), customer_id: '1' })],
        }),
      ];
      
      const actions = [
        createMockAction({
          customer_id: '1',
          action_type: 'follow_up',
          created_at: new Date().toISOString(),
        }),
      ];
      
      const { result } = renderHook(() =>
        useAlerts({ customers, actions })
      );
      
      const overdueAlert = result.current.find(
        (a) => a.type === 'High'
      );
      expect(overdueAlert).toBeUndefined();
    });

    it('should count inactive customers not contacted in 30+ days', () => {
      const thirtyFiveDaysAgo = new Date();
      thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
      
      const customers = [
        createMockCustomer({
          id: '1',
          visits: [createMockVisit({ visit_date: thirtyFiveDaysAgo.toISOString(), customer_id: '1' })],
        }),
      ];
      
      const { result } = renderHook(() =>
        useAlerts({ customers, actions: [] })
      );
      
      const inactiveAlert = result.current.find(
        (a) => a.type === 'Medium'
      );
      expect(inactiveAlert?.message).toContain('1');
    });
  });

  describe('useOccasions', () => {
    it('should return customers with birthdays today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const birthday = new Date(year, today.getMonth(), today.getDate());
      
      const customers = [
        createMockCustomer({
          id: '1',
          birthday_date: birthday.toISOString(),
        }),
      ];
      
      const { result } = renderHook(() => useOccasions(customers));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].occasionType).toBe('birthday');
    });

    it('should return customers with anniversaries today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const anniversary = new Date(year, today.getMonth(), today.getDate());
      
      const customers = [
        createMockCustomer({
          id: '1',
          anniversary_date: anniversary.toISOString(),
        }),
      ];
      
      const { result } = renderHook(() => useOccasions(customers));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].occasionType).toBe('anniversary');
    });

    it('should return empty when no occasions today', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const customers = [
        createMockCustomer({
          id: '1',
          birthday_date: lastMonth.toISOString(),
          anniversary_date: lastMonth.toISOString(),
        }),
      ];
      
      const { result } = renderHook(() => useOccasions(customers));
      
      expect(result.current).toHaveLength(0);
    });

    it('should prioritize birthday over anniversary when both today', () => {
      const today = new Date();
      const year = today.getFullYear();
      const todayDate = new Date(year, today.getMonth(), today.getDate());
      
      const customers = [
        createMockCustomer({
          id: '1',
          birthday_date: todayDate.toISOString(),
          anniversary_date: todayDate.toISOString(),
        }),
      ];
      
      const { result } = renderHook(() => useOccasions(customers));
      
      expect(result.current).toHaveLength(1);
      expect(result.current[0].occasionType).toBe('birthday');
    });
  });
});