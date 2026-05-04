import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
  useDeferredValue,
} from 'react';
import { localDb } from '@/lib/localDb';
import { logAction } from '@/lib/auditLogger';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { cleanPhoneNumber, isValidPhoneNumber } from '@/lib/validation';
import { enqueueSyncOp } from '@/lib/syncQueue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  CalendarPlus,
  Settings2,
  Download,
  Upload,
  Lock,
  Filter,
  ArrowDownUp,
  User,
  ChevronRight,
  X,
  Phone,
  MessageSquare,
  Edit2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Customer, Visit, Action, CustomerWithVisits } from '../types';
import CustomerDetailModal from '@/components/CustomerDetailModal';

export default function Customers() {
  const { profile } = useBusinessProfile();
  const [customers, setCustomers] = useState<CustomerWithVisits[]>([]);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'revenue' | 'visits'
  >('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'returned'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New customer state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [note, setNote] = useState('');
  const [consentStatus, setConsentStatus] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithVisits | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (profile?.id) {
      loadCustomers();
    }
  }, [profile]);

  async function loadCustomers() {
    setLoading(true);
    const data = await localDb.getCustomers(profile.id, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    setCustomers(data as CustomerWithVisits[]);
    setLoading(false);
  }

  useEffect(() => {
    if (profile?.id) loadCustomers();
  }, [page, profile?.id]);

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    const user = localDb.getAuth();
    if (!user) return;

    if (
      !profile?.is_pro &&
      customers.length >= (profile?.customer_limit || 50)
    ) {
      toast.error(
        `Free plan limit reached (max ${profile?.customer_limit || 50} customers). Upgrade to Pro to add more.`
      );
      return;
    }

    // Use a clean phone number
    const cleanPhone = cleanPhoneNumber(phone);

    if (!isValidPhoneNumber(cleanPhone)) {
      toast.error('Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Check for duplicate in local DB first
    const existingLocal = await localDb.getCustomerByPhone(user.id, cleanPhone);
    if (existingLocal) {
      toast.error('This phone number already exists in your customers.');
      return;
    }

    // Also check Supabase if configured (for cross-device duplicates)
    if (isSupabaseConfigured() && supabase) {
      const { data: existingRemote } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', cleanPhone)
        .eq('business_id', profile.id)
        .limit(1);

      if (existingRemote && existingRemote.length > 0) {
        if (
          !confirm(
            'This phone number already exists in this business. Do you want to create a duplicate?'
          )
        ) {
          return;
        }
      }
    }

    const newCustomer = await localDb.addCustomer(user.id, {
      name,
      phone: cleanPhone,
      source,
      note,
      consent_status: consentStatus,
    });

    // Queue for sync to Supabase (works offline)
    if (isSupabaseConfigured()) {
      enqueueSyncOp('customers', 'insert', {
        business_id: profile.id,
        name,
        phone: cleanPhone,
        source,
        notes: note,
        consent_status: consentStatus ? 'given' : 'pending',
        opt_out: false,
        tags: [],
        review_status: 'not_asked',
        id: newCustomer.id,
      });
    }

    await logAction({
      business_id: profile.id,
      actor_type: 'owner',
      actor_name: localStorage.getItem('deskTracker_activeStaff') || 'Owner',
      action: 'customer_created',
      entity_type: 'customer',
      metadata: { name, phone: cleanPhone },
    });

    toast.success('Customer added!');
    setIsAdding(false);
    setName('');
    setPhone('');
    setSource('');
    setNote('');
    setConsentStatus(true);
    loadCustomers();
  }

  const handleExportCSV = async () => {
    if (!profile?.is_pro) {
      toast.error('Export is a Pro feature.');
      return;
    }
    const csvData = await localDb.exportToCSV(profile.id);
    if (!csvData) {
      toast.info('No customers to export.');
      return;
    }
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Customers exported successfully!');
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile?.is_pro) {
      toast.error('Import is a Pro feature.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const processData = async (data: Record<string, unknown>[]) => {
      let count = 0;
      const staffName =
        localStorage.getItem('deskTracker_activeStaff') || 'Admin Import';
      const currentList = await localDb.getCustomers(profile.id) as Record<string, unknown>[];

      data.forEach((row: Record<string, unknown>) => {
        // Flexible column matching
        const firstName = row['First Name'] || row['first_name'] || '';
        const lastName = row['Last Name'] || row['last_name'] || '';
        let n =
          row['Name'] ||
          row['name'] ||
          row['Customer Name'] ||
          row['customer'] ||
          '';
        if (!n && (firstName || lastName)) {
          n = `${firstName} ${lastName}`.trim();
        }
        const p =
          row['Phone'] ||
          row['phone'] ||
          row['Mobile'] ||
          row['Phone Number'] ||
          row['Phone 1'] ||
          row['phone_1'] ||
          '';

        if (n && p) {
          currentList.push({
            id:
              Date.now().toString() +
              '_' +
              Math.random().toString(36).substring(7),
            business_id: profile.id,
            name: String(n).trim(),
            phone: String(p).trim(),
            source: String(
              row['Source'] || row['source'] || 'CSV/Excel Import'
            ).trim(),
            consent_status: true,
            created_at: new Date().toISOString(),
            staff_name: staffName,
          });
          count++;
        }
      });

      if (count > 0) {
        localStorage.setItem(
          `customers_${profile.id}`,
          JSON.stringify(currentList)
        );
        toast.success(`Successfully imported ${count} customers!`);
        loadCustomers();
      } else {
        toast.error(
          'No valid customers found in file. Ensure there are Name and Phone columns.'
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
      const Papa = await import('papaparse');
      Papa.default.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: { data: unknown[] }) => {
          processData(results.data as Record<string, unknown>[]);
        },
        error: (error: { message: string }) => {
          toast.error(`Error parsing CSV: ${error.message}`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
          processData(json);
        } catch (error) {
          const err = error as Error;
          toast.error(`Error parsing Excel file: ${err.message}`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processedCustomers = React.useMemo(() => {
    let result = customers
      .map((c) => {
        const visits_revenue =
          c.visits?.reduce(
            (sum: number, v: Visit) =>
              sum + (parseFloat(v.bill_value?.toString() || '0') || 0),
            0
          ) || 0;
        return {
          ...c,
          total_revenue: visits_revenue,
        };
      })
      .filter(
        (c) =>
          c.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          c.phone.includes(deferredSearch)
      );

    if (filterBy === 'returned') {
      result = result.filter((c) => c.is_returned);
    }

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        case 'revenue':
          const revDiff = (b.total_revenue || 0) - (a.total_revenue || 0);
          return revDiff !== 0
            ? revDiff
            : new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime();
        case 'visits':
          const visDiff = (b.visits?.length || 0) - (a.visits?.length || 0);
          return visDiff !== 0
            ? visDiff
            : new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime();
        case 'newest':
        default:
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
      }
    });
  }, [customers, deferredSearch, sortBy, filterBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between bg-card p-4 sm:p-5 rounded-[24px] sm:rounded-2xl border shadow-sm">
        <h1 className="text-[22px] sm:text-2xl font-extrabold tracking-tight">
          Customers
        </h1>
        <div className="flex items-center gap-2">
          {/* We only show upload/download conditionally if needed, but per screenshot they look nice */}
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportData}
          />
          <Button
            variant="outline"
            size="icon"
            className="w-[38px] h-[38px] rounded-full bg-muted/50 border-none shrink-0 text-foreground"
            onClick={() => {
              if (profile?.is_pro) {
                fileInputRef.current?.click();
              } else {
                const event = { target: { files: [] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleImportData(event);
              }
            }}
            title="Import CSV/Excel"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="w-[38px] h-[38px] rounded-full bg-muted/50 border-none shrink-0 text-foreground"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger
              render={
                <Button
                  size="icon"
                  className="w-[38px] h-[38px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md sm:rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl">New Customer</DialogTitle>
              </DialogHeader>
              {!profile?.is_pro && customers.length >= 50 ? (
                <div className="py-8 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-destructive" />
                  </div>
                  <h3 className="text-xl font-bold">Customer Limit Reached</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    You have reached the limit of 50 customers on the free plan.
                    Upgrade to Pro to add unlimited customers.
                  </p>
                  <Button
                    className="w-full rounded-2xl h-12 border bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    onClick={() => (window.location.hash = '#settings')}
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddCustomer} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      required
                      className="rounded-2xl h-12"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      required
                      type="tel"
                      placeholder="e.g. 919876543210"
                      className="rounded-2xl h-12"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Source
                    </Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="h-12 rounded-2xl">
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {(
                          (profile?.customer_sources as string) ||
                          'Walk-in, Instagram, Referral, Google, Facebook, Other'
                        )
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((src) => (
                            <SelectItem
                              key={src}
                              value={src}
                              className="rounded-xl"
                            >
                              {src}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      Note (Optional)
                    </Label>
                    <Input
                      className="rounded-2xl h-12"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-3 pb-2">
                    <input
                      type="checkbox"
                      id="consent"
                      className="rounded border-gray-300 text-primary w-5 h-5 cursor-pointer accent-primary"
                      checked={consentStatus}
                      onChange={(e) => setConsentStatus(e.target.checked)}
                    />
                    <label
                      htmlFor="consent"
                      className="text-sm font-medium cursor-pointer leading-tight"
                    >
                      Customer agreed to receive WhatsApp follow-ups
                    </label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-2xl h-12 font-bold text-base mt-2"
                  >
                    Save Customer
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!profile?.is_pro && customers.length >= 40 && (
        <Card
          className={`rounded-[24px] overflow-hidden shadow-sm ${customers.length >= 50 ? 'border-destructive bg-destructive/10' : 'border-destructive/30 bg-destructive/5'}`}
        >
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" />
              {customers.length >= 50
                ? 'Customer Limit Reached'
                : `Approaching Customer Limit (${customers.length}/50)`}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {customers.length >= 50
                ? 'You have reached the 50 free customer limit. Upgrade your account to continue adding new customers and to unlock reports and exports.'
                : 'You are nearing the 50 free customer limit. Upgrade to Pro for unlimited customers, team tracking, and more.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <Button
              onClick={() => (window.location.hash = '#settings')}
              className="rounded-xl w-full"
              variant="destructive"
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-12 h-14 rounded-[24px] bg-card border-none shadow-sm text-base text-foreground"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
          />
          {isPending && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative shadow-sm rounded-[24px] px-4 py-3 flex items-center justify-between gap-2 bg-card h-14">
            <div className="flex items-center gap-2 pointer-events-none">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-[14px] font-semibold text-foreground">
                {filterBy === 'all' ? 'All' : 'Returned'}
              </span>
            </div>
            <select
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'returned')}
            >
              <option value="all">All</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div className="relative shadow-sm rounded-[24px] px-4 py-3 flex items-center justify-between gap-2 bg-card h-14">
            <div className="flex items-center gap-2 pointer-events-none">
              <ArrowDownUp className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-[14px] font-semibold text-foreground">
                {sortBy === 'newest'
                  ? 'Newest'
                  : sortBy === 'oldest'
                    ? 'Oldest'
                    : sortBy === 'revenue'
                      ? 'Top Value'
                      : 'Most Visits'}
              </span>
            </div>
            <select
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'revenue' | 'visits')}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest</option>
              <option value="revenue">Top Value</option>
              <option value="visits">Most Visits</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && processedCustomers.length === 0 && (
          <div className="text-center py-12 bg-card rounded-xl border shadow-sm mt-4">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium text-lg">No customers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
        {!loading && processedCustomers.length > 0 && (
          <>
            <div className="hidden sm:block overflow-x-auto bg-card rounded-2xl border shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Visits</th>
                    <th className="px-4 py-3 font-medium">Last Visit</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Total Value
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {processedCustomers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-muted/50 focus-within:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {c.name}
                            </p>
                            {c.is_returned && (
                              <span className="inline-block mt-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider dark:bg-emerald-500/20 dark:text-emerald-400">
                                Returned
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {c.phone}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>{c.visits?.length || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {c.visits?.length
                          ? format(
                              new Date(c.visits[0]?.visit_date),
                              'MMM d, yyyy'
                            )
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        ₹{c.total_revenue || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="sm:hidden flex flex-col gap-2 pb-6 mt-3">
              {processedCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="flex items-center justify-between p-3.5 bg-card rounded-2xl border shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] active:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[15px] truncate text-foreground leading-tight">
                          {c.name}
                        </p>
                        {c.is_returned && (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 dark:bg-emerald-500/20 dark:text-emerald-400">
                            Ret
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-0.5 truncate font-medium">
                        {c.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 ml-3">
                    <span className="text-foreground font-bold text-[15px] leading-tight">
                      ₹{c.total_revenue || 0}
                    </span>
                    <div className="flex items-center text-muted-foreground font-medium gap-1 mt-1">
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="text-[12px]">
                        {c.visits?.length || 0} visits
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {!loading && processedCustomers.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={processedCustomers.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={true}
          onClose={() => {
            setSelectedCustomer(null);
            loadCustomers();
          }}
        />
      )}
    </div>
  );
}
