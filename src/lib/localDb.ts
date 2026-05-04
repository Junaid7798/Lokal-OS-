/**
 * Local database abstraction layer with dual storage support.
 * 
 * This module provides a unified API for data persistence, supporting both
 * IndexedDB (primary) and localStorage (fallback). It handles migration from
 * localStorage to IndexedDB automatically and maintains backward compatibility.
 * 
 * Key features:
 * - Automatic IndexedDB initialization with localStorage fallback
 * - Duplicate prevention on import operations
 * - Business-scoped data isolation via business_id
 * - Staff attribution for audit trail
 * 
 * @module localDb
 */

import { idb, migrateFromLocalStorage, STORES } from './indexedDb';
import type { StoreName } from './indexedDb';
import { isSupabaseConfigured } from './supabaseClient';
import { enqueueSyncOp } from './syncQueue';
import { generateSafeId } from './utils';

/** Tracks IndexedDB initialization state */
let isIndexedDBReady = false;
/** Prevents redundant migration attempts */
let migrationAttempted = false;

/**
 * Ensures IndexedDB is initialized before operations.
 * Attempts IndexedDB first, falls back to localStorage on failure.
 * Also triggers migration from localStorage if not already done.
 */
async function ensureIndexedDB(): Promise<void> {
  if (isIndexedDBReady) return;

  try {
    await idb.init();

    if (!migrationAttempted) {
      migrationAttempted = true;
      await migrateFromLocalStorage();
    }

    isIndexedDBReady = true;
  } catch (err) {
    console.error('IndexedDB init failed, falling back to localStorage:', err);
    throw err;
  }
}

/**
 * Generates unique identifier for new records.
 * Uses timestamp + random string to avoid ID collisions.
 *
 * @returns Unique ID string
 */
function generateId(): string {
  return generateSafeId();
}


/**
 * Retrieves current active staff name for attribution.
 * Checks session storage first, defaults to 'Owner' if not set.
 * 
 * @returns Staff name to attribute actions to
 */
function getStaffName(): string {
  return (
    (typeof localStorage !== 'undefined' &&
      localStorage.getItem('deskTracker_activeStaff')) ||
    'Owner'
  );
}

/**
 * Retrieves all records for a specific business.
 * 
 * @param storeName - Name of the IndexedDB store
 * @param businessId - Business identifier for filtering
 * @returns Array of matching records
 */
async function getAllByBusinessId<T>(
  storeName: string,
  businessId: string
): Promise<T[]> {
  try {
    await ensureIndexedDB();
    return await idb.getByIndex<T>(
      storeName as StoreName,
      'business_id',
      businessId
    );
  } catch {
    const fallbackKey = `${storeName}_${businessId}`;
    const data = localStorage.getItem(fallbackKey);
    return data ? JSON.parse(data) : [];
  }
}

/**
 * Gets a single record by ID.
 */
async function get<T>(storeName: string, id: string): Promise<T | undefined> {
  try {
    await ensureIndexedDB();
    return await idb.getOne(storeName as StoreName, id) as T | undefined;
  } catch {
    // Fallback to localStorage - search all business keys
    const keys = Object.keys(localStorage).filter(k => k.startsWith(storeName));
    for (const key of keys) {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const found = data.find((r: { id: string }) => r.id === id);
      if (found) return found as T;
    }
    return undefined;
  }
}

/**
 * Saves or updates a single record.
 */
async function putRec<T extends { id: string; business_id: string }>(
  storeName: string,
  record: T
): Promise<string> {
  try {
    await ensureIndexedDB();
    return await idb.put(storeName as StoreName, record);
  } catch {
    const fallbackKey = `${storeName}_${record.business_id}`;
    const list = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const index = list.findIndex((r: { id: string }) => r.id === record.id);
    if (index > -1) {
      list[index] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(fallbackKey, JSON.stringify(list));
    return record.id;
  }
}

/**
 * Deletes a record by ID.
 */
async function deleteRec(storeName: string, id: string): Promise<boolean> {
  try {
    await ensureIndexedDB();
    await idb.delete(storeName as StoreName, id);
    return true;
  } catch {
    // Fallback to localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith(storeName));
    for (const key of keys) {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const index = list.findIndex((r: { id: string }) => r.id === id);
      if (index > -1) {
        list.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(list));
        return true;
      }
    }
    return false;
  }
}

/**
 * Saves or updates a single record.
 * Updates existing record if ID matches, otherwise adds new.
 * 
 * @param storeName - Store to save to
 * @param record - Record with id and business_id
 * @returns ID of saved record
 */
async function putRecord(
  storeName: string,
  record: { id: string; business_id: string }
): Promise<string> {
  try {
    await ensureIndexedDB();
    return await idb.put(storeName as StoreName, record);
  } catch {
    const fallbackKey = `${storeName}_${record.business_id}`;
    const list = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const index = list.findIndex((r: { id: string }) => r.id === record.id);
    if (index > -1) {
      list[index] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(fallbackKey, JSON.stringify(list));
    return record.id;
  }
}

/**
 * Saves multiple records efficiently with deduplication.
 * Merges incoming records with existing by ID.
 * 
 * @param storeName - Store to save to
 * @param records - Array of records with id and business_id
 */
async function putMultiple(
  storeName: string,
  records: { id: string; business_id: string }[]
): Promise<void> {
  if (records.length === 0) return;

  try {
    await ensureIndexedDB();
    const businessId = records[0].business_id;
    const existing = await idb.getByIndex(
      storeName as StoreName,
      'business_id',
      businessId
    );

    const existingMap = new Map(existing.map((r: { id: string }) => [r.id, r]));
    const merged = records.map((r) =>
      existingMap.has(r.id) ? { ...existingMap.get(r.id), ...r } : r
    );

    await idb.putMany(storeName as StoreName, merged);
  } catch {
    const fallbackKey = `${storeName}_${records[0].business_id}`;
    const list = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
    const existingMap = new Map(list.map((r: { id: string }) => [r.id, r]));
    records.forEach((r) => existingMap.set(r.id, r));
    localStorage.setItem(
      fallbackKey,
      JSON.stringify([...existingMap.values()])
    );
  }
}

/**
 * Local database API providing CRUD operations for all business data.
 * Supports customers, visits, actions with automatic staff attribution.
 */
export const localDb = {
  /**
   * Retrieves currently authenticated user.
   * 
   * @returns User object from localStorage or null
   */
  getAuth: () => {
    try {
      return JSON.parse(localStorage.getItem('local_user') || 'null');
    } catch {
      return null;
    }
  },

  /**
   * Sets authentication user in localStorage.
   * 
   * @param user - User object to store, or null to clear
   */
  setAuth: (user: unknown) => {
    if (user) {
      localStorage.setItem('local_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('local_user');
    }
  },

  /**
   * Retrieves business profile by user ID.
   * 
   * @param userId - User/business identifier
   * @returns Profile data or null
   */
  getProfile: async (userId: string) => {
    try {
      await ensureIndexedDB();
      return await idb.getOne(STORES.PROFILE, userId);
    } catch {
      const data = localStorage.getItem(`profile_${userId}`);
      return data ? JSON.parse(data) : null;
    }
  },

  /**
   * Saves business profile with given user ID as key.
   * 
   * @param userId - User/business identifier
   * @param data - Profile data to save
   */
  saveProfile: async (userId: string, data: unknown) => {
    const record = { ...(data as object), id: userId };
    try {
      await ensureIndexedDB();
      await idb.put(
        STORES.PROFILE,
        record as { id: string; [key: string]: unknown }
      );
    } catch {
      localStorage.setItem(`profile_${userId}`, JSON.stringify(record));
    }
  },

  /**
   * Retrieves all customers with their visit history.
   * Returns customers sorted by creation date (newest first).
   * 
   * @param userId - Business identifier
   * @returns Array of customers with visits
   */
  getCustomers: async (userId: string, options?: { limit?: number; offset?: number }) => {
    const customers = await getAllByBusinessId<Record<string, unknown>>(
      STORES.CUSTOMERS,
      userId
    );
    const visits = await getAllByBusinessId<Record<string, unknown>>(
      STORES.VISITS,
      userId
    );

    const visitsByCustomerId = new Map<string, unknown[]>();
    for (const visit of visits) {
      const cid = visit.customer_id as string;
      if (!visitsByCustomerId.has(cid)) {
        visitsByCustomerId.set(cid, []);
      }
      visitsByCustomerId.get(cid)!.push(visit);
    }

    const sorted = (customers
      .map((customer) => ({
        ...customer,
        visits: visitsByCustomerId.get(customer.id as string) || [],
      })) as Array<{ created_at?: string; visits?: unknown[] }>)
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

    const offset = options?.offset ?? 0;
    const limit = options?.limit;
    if (limit !== undefined) {
      return sorted.slice(offset, offset + limit);
    }
    return sorted;
  },

  /**
   * Find customer by phone number.
   * 
   * @param userId - Business identifier
   * @param phone - Phone number to search
   * @returns Customer record or null if not found
   */
  getCustomerByPhone: async (userId: string, phone: string) => {
    const customers = await getAllByBusinessId<Record<string, unknown>>(
      STORES.CUSTOMERS,
      userId
    );
    return customers.find((c) => c.phone === phone) || null;
  },

  /**
   * Adds new customer with auto-generated ID and timestamp.
   * 
   * @param userId - Business identifier
   * @param customer - Customer data to add
   * @returns Complete customer record with generated fields
   */
  addCustomer: async (userId: string, customer: Record<string, unknown>) => {
    const newCustomer = {
      ...customer,
      id: generateId(),
      business_id: userId,
      created_at: new Date().toISOString(),
      staff_name: getStaffName(),
    };

    await putRecord(
      STORES.CUSTOMERS,
      newCustomer as { id: string; business_id: string }
    );
    return newCustomer;
  },

  /**
   * Updates existing customer record with provided fields.
   * 
   * @param userId - Business identifier
   * @param customerId - Customer to update
   * @param updates - Fields to update
   * @returns Updated customer or null if not found
   */
  updateCustomer: async (
    userId: string,
    customerId: string,
    updates: Record<string, unknown>
  ) => {
    const customers = await getAllByBusinessId<Record<string, unknown>>(
      STORES.CUSTOMERS,
      userId
    );
    const index = customers.findIndex((c) => c.id === customerId);

    if (index > -1) {
      const updated = { ...customers[index], ...updates };
      await putRecord(
        STORES.CUSTOMERS,
        updated as { id: string; business_id: string }
      );
      return updated;
    }
    return null;
  },

  /**
   * Deletes a customer and queues for sync.
   * 
   * @param userId - Business identifier
   * @param customerId - Customer to delete
   * @returns true if deleted, false if not found
   */
  deleteCustomer: async (userId: string, customerId: string) => {
    const customers = await getAllByBusinessId<Record<string, unknown>>(
      STORES.CUSTOMERS,
      userId
    );
    const index = customers.findIndex((c) => c.id === customerId);

    if (index > -1) {
      // Remove from local DB
      await idb.delete(STORES.CUSTOMERS, customerId);
      
      // Queue for sync to Supabase
      if (isSupabaseConfigured()) {
        enqueueSyncOp('customers', 'delete', { id: customerId });
      }
      
      return true;
    }
    return false;
  },

  /**
   * Retrieves all visits for a business.
   * 
   * @param userId - Business identifier
   * @returns Array of visits
   */
  getVisits: async (userId: string) => {
    return getAllByBusinessId<Record<string, unknown>>(STORES.VISITS, userId);
  },

  /**
   * Adds new visit with auto-generated ID and timestamp.
   * 
   * @param userId - Business identifier
   * @param visit - Visit data to add
   * @returns Complete visit record with generated fields
   */
  addVisit: async (userId: string, visit: Record<string, unknown>) => {
    const newVisit = {
      ...visit,
      id: generateId(),
      business_id: userId,
      created_at: new Date().toISOString(),
      staff_name: getStaffName(),
    };

    await putRecord(
      STORES.VISITS,
      newVisit as { id: string; business_id: string }
    );
    return newVisit;
  },

  /**
   * Retrieves all action logs for a business.
   * 
   * @param userId - Business identifier
   * @returns Array of actions
   */
  getActions: async (userId: string) => {
    return getAllByBusinessId<Record<string, unknown>>(STORES.ACTIONS, userId);
  },

  /**
   * Logs a customer action (follow-up, whatsapp, etc.).
   * 
   * @param userId - Business identifier
   * @param customerId - Customer the action relates to
   * @param actionType - Type of action performed
   * @returns Created action record
   */
  addAction: async (userId: string, customerId: string, actionType: string) => {
    const newAction = {
      id: generateId(),
      business_id: userId,
      customer_id: customerId,
      action_type: actionType,
      created_at: new Date().toISOString(),
      staff_name: getStaffName(),
    };

    await putRecord(
      STORES.ACTIONS,
      newAction as { id: string; business_id: string }
    );
    return newAction;
  },

  /**
   * Exports customer data to CSV format.
   * 
   * @param userId - Business identifier
   * @returns CSV string or empty string if no customers
   */
  exportToCSV: async (userId: string) => {
    const customers = await localDb.getCustomers(userId);
    if (customers.length === 0) return '';

    const header = [
      'Name',
      'Phone',
      'Source',
      'Created At',
      'Staff Name',
      'Is Returned',
      'Revenue Recovered',
    ];
    const rows = (
      customers as Array<{
        name?: string;
        phone?: string;
        source?: string;
        created_at?: string;
        staff_name?: string;
        is_returned?: boolean;
        revenue_recovered?: string;
      }>
    ).map((c) => [
      `"${c.name || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.source || ''}"`,
      `"${c.created_at || ''}"`,
      `"${c.staff_name || ''}"`,
      `"${c.is_returned ? 'Yes' : 'No'}"`,
      `"${c.revenue_recovered || 0}"`,
    ]);
    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  /**
   * Imports customers from CSV, skipping duplicates by phone number.
   * 
   * @param userId - Business identifier
   * @param csvContent - CSV string to parse
   * @returns Number of new customers imported
   */
  importFromCSV: async (userId: string, csvContent: string) => {
    const lines = csvContent.split('\n');
    if (lines.length <= 1) return 0;

    const staffName = getStaffName();
    const customers = await getAllByBusinessId<Record<string, unknown>>(
      STORES.CUSTOMERS,
      userId
    );
    const existingPhones = new Set(customers.map((c) => c.phone));

    const newCustomers: {
      id: string;
      business_id: string;
      name: string;
      phone: string;
      source: string;
      consent_status: boolean;
      created_at: string;
      staff_name: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].replace(/"/g, '').trim();
        const phone = parts[1].replace(/"/g, '').trim();
        const source =
          parts.length > 2 ? parts[2].replace(/"/g, '').trim() : '';

        if (name && phone && !existingPhones.has(phone)) {
          existingPhones.add(phone);
          newCustomers.push({
            id: generateId(),
            business_id: userId,
            name,
            phone,
            source,
            consent_status: true,
            created_at: new Date().toISOString(),
            staff_name: staffName,
          });
        }
      }
    }

    if (newCustomers.length > 0) {
      await putMultiple(STORES.CUSTOMERS, newCustomers);
    }

    return newCustomers.length;
  },

  // ============================================================================
  // AUTOMATION SEQUENCES
  // ============================================================================

  /**
   * Creates a new automation sequence.
   */
  createAutomationSequence: async (sequence: {
    id?: string;
    business_id: string;
    name: string;
    trigger_type: string;
    is_active?: boolean;
    steps?: Array<{
      step_order: number;
      action_type: string;
      delay_days: number;
      message_template_id?: string;
    }>;
  }) => {
    await ensureIndexedDB();
    const now = new Date().toISOString();
    const id = sequence.id || generateId();
    
    const record = {
      id,
      business_id: sequence.business_id,
      name: sequence.name,
      trigger_type: sequence.trigger_type,
      is_active: sequence.is_active ?? true,
      created_at: now,
      updated_at: now,
      steps: sequence.steps?.map((s, idx) => ({
        id: generateId(),
        business_id: sequence.business_id,
        sequence_id: id,
        step_order: s.step_order ?? idx,
        action_type: s.action_type,
        delay_days: s.delay_days ?? 0,
        message_template_id: s.message_template_id,
        created_at: now,
        updated_at: now,
      })),
    };

    await putRec(STORES.AUTOMATION_SEQUENCES, record);
    await enqueueSyncOp('automation_sequences', 'insert' as const, record);
    
    return record;
  },

  /**
   * Gets all automation sequences for a business.
   */
  getAutomationSequences: async (businessId: string) => {
    await ensureIndexedDB();
    return getAllByBusinessId(STORES.AUTOMATION_SEQUENCES, businessId);
  },

  /**
   * Gets a single automation sequence by ID.
   */
  getAutomationSequence: async (id: string) => {
    await ensureIndexedDB();
    return get(STORES.AUTOMATION_SEQUENCES, id);
  },

  /**
   * Updates an automation sequence.
   */
  updateAutomationSequence: async (id: string, updates: Partial<{
    name: string;
    trigger_type: string;
    is_active: boolean;
    steps: Array<{
      id?: string;
      step_order: number;
      action_type: string;
      delay_days: number;
      message_template_id?: string;
    }>;
  }>) => {
    await ensureIndexedDB();
    const existing = await get<Record<string, unknown>>(STORES.AUTOMATION_SEQUENCES, id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const businessId = existing.business_id as string;
    const record = {
      ...existing,
      ...updates,
      updated_at: now,
      steps: updates.steps?.map((s, idx) => ({
        id: s.id || generateId(),
        business_id: businessId,
        sequence_id: id,
        step_order: s.step_order ?? idx,
        action_type: s.action_type,
        delay_days: s.delay_days ?? 0,
        message_template_id: s.message_template_id,
        created_at: now,
        updated_at: now,
      })),
    };

    await putRec(STORES.AUTOMATION_SEQUENCES, record as unknown as { id: string; business_id: string });
    await enqueueSyncOp('automation_sequences', 'update' as const, record);
    
    return record;
  },

  /**
   * Deletes an automation sequence.
   */
  deleteAutomationSequence: async (id: string) => {
    await ensureIndexedDB();
    const existing = await get(STORES.AUTOMATION_SEQUENCES, id);
    if (!existing) return false;

    await deleteRec(STORES.AUTOMATION_SEQUENCES, id);
    await enqueueSyncOp('automation_sequences', 'delete' as const, { id });
    
    return true;
  },

  // ============================================================================
  // AUTOMATION JOBS
  // ============================================================================

  /**
   * Gets pending automation jobs for a business.
   */
  getPendingAutomationJobs: async (businessId: string, limit = 50) => {
    await ensureIndexedDB();
    const jobs = await getAllByBusinessId<Record<string, unknown>>(STORES.AUTOMATION_JOBS, businessId);
    const now = new Date();
    
    return jobs
      .filter(j => j.status === 'pending' && j.next_step_at && new Date(j.next_step_at as string) <= now)
      .slice(0, limit) as unknown as Array<{
        id: string;
        business_id: string;
        sequence_id: string;
        customer_id: string;
        status: string;
        next_step_at?: string;
        completed_at?: string;
        error_message?: string;
        created_at: string;
        updated_at: string;
      }>;
  },

  /**
   * Gets all automation jobs for a business.
   */
  getAutomationJobs: async (businessId: string) => {
    await ensureIndexedDB();
    return getAllByBusinessId(STORES.AUTOMATION_JOBS, businessId);
  },

  /**
   * Creates an automation job.
   */
  createAutomationJob: async (job: {
    id?: string;
    business_id: string;
    sequence_id: string;
    customer_id: string;
    next_step_at?: string;
  }) => {
    await ensureIndexedDB();
    const now = new Date().toISOString();
    const id = job.id || generateId();
    
    const record = {
      id,
      business_id: job.business_id,
      sequence_id: job.sequence_id,
      customer_id: job.customer_id,
      status: 'pending',
      next_step_at: job.next_step_at || now,
      completed_at: null,
      error_message: null,
      created_at: now,
      updated_at: now,
    };

    await putRec(STORES.AUTOMATION_JOBS, record);
    await enqueueSyncOp('automation_jobs', 'insert' as const, record);
    
    return record;
  },

  /**
   * Updates an automation job status.
   */
  updateAutomationJob: async (id: string, updates: {
    status?: 'pending' | 'in_progress' | 'completed' | 'failed';
    next_step_at?: string;
    completed_at?: string;
    error_message?: string;
  }) => {
    await ensureIndexedDB();
    const existing = await get<Record<string, unknown>>(STORES.AUTOMATION_JOBS, id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const record = {
      ...existing,
      ...updates,
      updated_at: now,
    };

    await putRec(STORES.AUTOMATION_JOBS, record as unknown as { id: string; business_id: string });
    await enqueueSyncOp('automation_jobs', 'update' as const, record);
    
    return record;
  },

  /**
   * Gets job count by status for a business.
   */
  getAutomationJobCounts: async (businessId: string) => {
    await ensureIndexedDB();
    const jobs = await getAllByBusinessId<Record<string, unknown>>(STORES.AUTOMATION_JOBS, businessId);
    
    return {
      pending: jobs.filter(j => j.status === 'pending').length,
      in_progress: jobs.filter(j => j.status === 'in_progress').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  },

  // ============================================================================
  // LOCATIONS
  // ============================================================================

  /**
   * Gets all locations for a business.
   */
  getLocations: async (businessId: string) => {
    return getAllByBusinessId<Record<string, unknown>>(STORES.LOCATIONS, businessId);
  },

  /**
   * Adds a new location.
   */
  addLocation: async (businessId: string, location: { name: string; address?: string; phone?: string }) => {
    const record = {
      id: generateSafeId(),
      business_id: businessId,
      name: location.name,
      address: location.address || '',
      phone: location.phone || '',
      active: true,
      created_at: new Date().toISOString(),
    };
    await putRecord(STORES.LOCATIONS, record as { id: string; business_id: string });
    return record;
  },

  /**
   * Updates a location.
   */
  updateLocation: async (id: string, updates: Record<string, unknown>) => {
    const existing = await get<Record<string, unknown>>(STORES.LOCATIONS, id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await putRec(STORES.LOCATIONS, updated as { id: string; business_id: string });
    return updated;
  },

  // ============================================================================
  // LOYALTY RULES
  // ============================================================================

  /**
   * Gets all loyalty rules for a business.
   */
  getLoyaltyRules: async (businessId: string) => {
    return getAllByBusinessId<Record<string, unknown>>(STORES.LOYALTY_RULES, businessId);
  },

  /**
   * Adds a new loyalty rule.
   */
  addLoyaltyRule: async (businessId: string, rule: Record<string, unknown>) => {
    const record = {
      ...rule,
      id: generateSafeId(),
      business_id: businessId,
      active: true,
      created_at: new Date().toISOString(),
    };
    await putRecord(STORES.LOYALTY_RULES, record as { id: string; business_id: string });
    return record;
  },

  /**
   * Updates a loyalty rule.
   */
  updateLoyaltyRule: async (id: string, updates: Record<string, unknown>) => {
    const existing = await get<Record<string, unknown>>(STORES.LOYALTY_RULES, id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await putRec(STORES.LOYALTY_RULES, updated as { id: string; business_id: string });
    return updated;
  },
};