import React, { memo, useMemo } from 'react';
import { format } from 'date-fns';
import type { Customer, Visit } from '@/types';

interface CustomerListItemProps {
  customer: Customer & { visits?: Visit[]; total_revenue?: number };
  onClick: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  style?: React.CSSProperties;
}

export const CustomerListItem = memo(
  function CustomerListItem({
    customer,
    onClick,
    onMessage,
    onEdit,
    style,
  }: CustomerListItemProps) {
    const stats = useMemo(() => {
      const visits = customer.visits || [];
      return {
        visitCount: visits.length,
        totalRevenue:
          customer.total_revenue ||
          visits.reduce((sum, v) => sum + (v.bill_value || 0), 0),
        lastVisit:
          visits.length > 0
            ? visits.sort(
                (a, b) =>
                  new Date(b.visit_date).getTime() -
                  new Date(a.visit_date).getTime()
              )[0]
            : null,
      };
    }, [customer.visits, customer.total_revenue]);

    const statusBadge = useMemo(() => {
      if (stats.visitCount === 0)
        return { label: 'New', color: 'bg-primary/10 text-primary' };
      if (stats.visitCount >= 10 || stats.totalRevenue >= 10000)
        return { label: 'VIP', color: 'bg-accent text-accent-foreground' };
      const daysSinceLast = stats.lastVisit
        ? Math.floor(
            (Date.now() - new Date(stats.lastVisit.visit_date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;
      if (daysSinceLast > 90)
        return { label: 'Dormant', color: 'bg-muted text-muted-foreground' };
      if (daysSinceLast > 60)
        return { label: 'At Risk', color: 'bg-warning/20 text-warning' };
      return { label: 'Active', color: 'bg-success/10 text-success' };
    }, [stats]);

    return (
      <div
        style={style}
        className="flex items-center gap-4 px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{customer.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${statusBadge.color}`}
            >
              {statusBadge.label}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{customer.phone}</span>
            {customer.source && (
              <>
                <span className="text-xs">•</span>
                <span className="text-xs">{customer.source}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-right text-sm">
          <div className="font-medium">
            ₹{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.visitCount} visits
          </div>
        </div>

        {stats.lastVisit && (
          <div className="text-right text-xs text-muted-foreground w-20">
            {format(new Date(stats.lastVisit.visit_date), 'MMM d')}
          </div>
        )}

        <div className="flex items-center gap-1">
          {onMessage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMessage();
              }}
              className="p-1.5 hover:bg-primary/10 rounded transition-colors"
              title="Send WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 hover:bg-primary/10 rounded transition-colors"
              title="Edit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.customer.id === next.customer.id &&
      prev.customer.name === next.customer.name &&
      prev.customer.phone === next.customer.phone &&
      prev.customer.source === next.customer.source &&
      prev.customer.updated_at === next.customer.updated_at &&
      prev.onClick === next.onClick &&
      prev.onMessage === next.onMessage &&
      prev.onEdit === next.onEdit
    );
  }
);

CustomerListItem.displayName = 'CustomerListItem';
