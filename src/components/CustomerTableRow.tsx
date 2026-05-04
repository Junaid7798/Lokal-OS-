import React, { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarPlus, ChevronRight } from 'lucide-react';

interface CustomerRowProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    source?: string;
    visits?: Array<{ visit_date: string; bill_value?: number }>;
    total_revenue?: number;
    is_returned?: boolean;
    created_at?: string;
  };
  onClick: () => void;
  style?: React.CSSProperties;
}

export const CustomerTableRow = memo(
  function CustomerTableRow({ customer, onClick, style }: CustomerRowProps) {
    const visitCount = customer.visits?.length || 0;

    const lastVisitDate = useMemo(() => {
      if (!customer.visits?.length) return null;
      const sorted = [...customer.visits].sort(
        (a, b) =>
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
      );
      return sorted[0]?.visit_date
        ? format(new Date(sorted[0].visit_date), 'MMM d, yyyy')
        : null;
    }, [customer.visits]);

    const totalRevenue = useMemo(() => {
      return (
        customer.total_revenue ??
        customer.visits?.reduce(
          (sum, v) => sum + (parseFloat(String(v.bill_value || '0')) || 0),
          0
        ) ??
        0
      );
    }, [customer.visits, customer.total_revenue]);

    return (
      <tr
        style={style}
        onClick={onClick}
        className="hover:bg-muted/50 focus-within:bg-muted/50 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{customer.name}</p>
              {customer.is_returned && (
                <span className="inline-block mt-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider dark:bg-emerald-500/20 dark:text-emerald-400">
                  Returned
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground font-medium">
          {customer.phone}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{visitCount}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground font-medium">
          {lastVisitDate || '-'}
        </td>
        <td className="px-4 py-3 text-right font-semibold text-foreground">
          ₹{totalRevenue}
        </td>
        <td className="px-4 py-3 text-right">
          <button className="h-8 w-8 text-muted-foreground hover:text-foreground flex items-center justify-center">
            <ChevronRight className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.customer.id === nextProps.customer.id &&
      prevProps.customer.name === nextProps.customer.name &&
      prevProps.customer.phone === nextProps.customer.phone &&
      prevProps.customer.is_returned === nextProps.customer.is_returned &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

CustomerTableRow.displayName = 'CustomerTableRow';

export const CustomerCard = memo(
  function CustomerCard({ customer, onClick, style }: CustomerRowProps) {
    const visitCount = customer.visits?.length || 0;

    const totalRevenue = useMemo(() => {
      return (
        customer.total_revenue ??
        customer.visits?.reduce(
          (sum, v) => sum + (parseFloat(String(v.bill_value || '0')) || 0),
          0
        ) ??
        0
      );
    }, [customer.visits, customer.total_revenue]);

    return (
      <div
        style={style}
        onClick={onClick}
        className="flex items-center justify-between p-3.5 bg-card rounded-2xl border shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] active:bg-muted/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[15px] truncate text-foreground leading-tight">
                {customer.name}
              </p>
              {customer.is_returned && (
                <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 dark:bg-emerald-500/20 dark:text-emerald-400">
                  Ret
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5 truncate font-medium">
              {customer.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 ml-3">
          <span className="text-foreground font-bold text-[15px] leading-tight">
            ₹{totalRevenue}
          </span>
          <div className="flex items-center text-muted-foreground font-medium gap-1 mt-1">
            <CalendarPlus className="w-3 h-3" />
            <span className="text-[12px]">{visitCount}</span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.customer.id === nextProps.customer.id &&
      prevProps.customer.name === nextProps.customer.name &&
      prevProps.customer.phone === nextProps.customer.phone &&
      prevProps.customer.is_returned === nextProps.customer.is_returned &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

CustomerCard.displayName = 'CustomerCard';
