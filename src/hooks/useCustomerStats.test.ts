import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomerStats } from './useCustomerStats';

describe('useCustomerStats', () => {
  it('should calculate total customers', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          { id: '1', name: 'Customer 1' },
          { id: '2', name: 'Customer 2' },
          { id: '3', name: 'Customer 3' },
        ] as any,
      })
    );

    expect(result.current.totalCustomers).toBe(3);
  });

  it('should count returning customers', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          { id: '1', is_returned: true },
          { id: '2', is_returned: false },
          { id: '3', is_returned: true },
        ] as any,
      })
    );

    expect(result.current.returningCustomers).toBe(2);
  });

  it('should calculate total revenue from visits', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          {
            id: '1',
            visits: [
              { bill_value: 100 },
              { bill_value: 200 },
            ],
          },
          {
            id: '2',
            visits: [
              { bill_value: 50 },
            ],
          },
        ] as any,
      })
    );

    expect(result.current.revenue).toBe(350);
  });

  it('should handle missing visits gracefully', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          { id: '1' },
          { id: '2', visits: undefined },
        ] as any,
      })
    );

    expect(result.current.revenue).toBe(0);
  });

  it('should calculate recovered revenue', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          { id: '1', is_returned: true, revenue_recovered: 500 },
          { id: '2', is_returned: true, revenue_recovered: 300 },
          { id: '3', is_returned: false },
        ] as any,
      })
    );

    expect(result.current.recoveredRevenue).toBe(800);
  });

  it('should handle non-numeric revenue values', () => {
    const { result } = renderHook(() =>
      useCustomerStats({
        customers: [
          { id: '1', is_returned: true, revenue_recovered: 'not a number' },
          { id: '2', is_returned: true, revenue_recovered: null },
          { id: '3', is_returned: true, revenue_recovered: 100 },
        ] as any,
      })
    );

    expect(result.current.recoveredRevenue).toBe(100);
  });
});