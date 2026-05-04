/**
 * IndexedDB wrapper for local data persistence.
 * Provides async database operations with schema management and localStorage migration.
 */

const DB_NAME = 'lokalos_db';
const DB_VERSION = 1;

/** IndexedDB store names */
const STORES = {
  CUSTOMERS: 'customers',
  VISITS: 'visits',
  ACTIONS: 'actions',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  AUTOMATION_SEQUENCES: 'automation_sequences',
  AUTOMATION_JOBS: 'automation_jobs',
  LOCATIONS: 'locations',
  LOYALTY_RULES: 'loyalty_rules',
} as const;

/** Type for store name values */
type StoreName = (typeof STORES)[keyof typeof STORES];

/** Database schema definitions for each store */
interface DBSchema {
  customers: CustomerRecord;
  visits: VisitRecord;
  actions: ActionRecord;
  profile: ProfileRecord;
  settings: SettingsRecord;
  automation_sequences: AutomationSequenceRecord;
  automation_jobs: AutomationJobRecord;
  locations: LocationRecord;
  loyalty_rules: LoyaltyRuleRecord;
}

/** Customer record structure */
interface CustomerRecord {
  id: string;
  business_id: string;
  [key: string]: unknown;
}

/** Automation sequence record structure */
interface AutomationSequenceRecord {
  id: string;
  business_id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: AutomationStepRecord[];
}

/** Automation step record structure */
interface AutomationStepRecord {
  id: string;
  business_id: string;
  sequence_id: string;
  step_order: number;
  action_type: string;
  delay_days: number;
  message_template_id?: string;
  created_at: string;
  updated_at: string;
}

/** Automation job record structure */
interface AutomationJobRecord {
  id: string;
  business_id: string;
  sequence_id: string;
  customer_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  next_step_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/** Visit record structure */
interface VisitRecord {
  id: string;
  business_id: string;
  customer_id: string;
  [key: string]: unknown;
}

/** Action log record structure */
interface ActionRecord {
  id: string;
  business_id: string;
  [key: string]: unknown;
}

/** Profile record structure */
interface ProfileRecord {
  id: string;
  [key: string]: unknown;
}

/** Settings record structure */
interface SettingsRecord {
  key: string;
  [key: string]: unknown;
}

/** Location record structure */
interface LocationRecord {
  id: string;
  business_id: string;
  name: string;
  address?: string;
  phone?: string;
  active: boolean;
  created_at: string;
}

/** Loyalty rule record structure */
interface LoyaltyRuleRecord {
  id: string;
  business_id: string;
  rule_name: string;
  visit_threshold: number;
  reward_text: string;
  active: boolean;
  created_at: string;
}

/**
 * Manages IndexedDB connections with async API.
 * Handles schema creation, migrations, and CRUD operations.
 */
class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initializes database connection and creates schema on first run.
   * Uses promise caching to prevent multiple simultaneous init calls.
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB open failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create customers store with indexes
        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, {
            keyPath: 'id',
          });
          customerStore.createIndex('business_id', 'business_id', { unique: false });
          customerStore.createIndex('phone', 'phone', { unique: false });
          customerStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create visits store with indexes
        if (!db.objectStoreNames.contains(STORES.VISITS)) {
          const visitStore = db.createObjectStore(STORES.VISITS, { keyPath: 'id' });
          visitStore.createIndex('business_id', 'business_id', { unique: false });
          visitStore.createIndex('customer_id', 'customer_id', { unique: false });
          visitStore.createIndex('visit_date', 'visit_date', { unique: false });
        }

        // Create actions store with indexes
        if (!db.objectStoreNames.contains(STORES.ACTIONS)) {
          const actionStore = db.createObjectStore(STORES.ACTIONS, { keyPath: 'id' });
          actionStore.createIndex('business_id', 'business_id', { unique: false });
          actionStore.createIndex('customer_id', 'customer_id', { unique: false });
          actionStore.createIndex('created_at', 'created_at', { unique: false });
        }

        // Create profile store
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        // Create automation_sequences store
        if (!db.objectStoreNames.contains(STORES.AUTOMATION_SEQUENCES)) {
          const seqStore = db.createObjectStore(STORES.AUTOMATION_SEQUENCES, { keyPath: 'id' });
          seqStore.createIndex('business_id', 'business_id', { unique: false });
          seqStore.createIndex('is_active', 'is_active', { unique: false });
        }

        // Create automation_jobs store
        if (!db.objectStoreNames.contains(STORES.AUTOMATION_JOBS)) {
          const jobStore = db.createObjectStore(STORES.AUTOMATION_JOBS, { keyPath: 'id' });
          jobStore.createIndex('business_id', 'business_id', { unique: false });
          jobStore.createIndex('customer_id', 'customer_id', { unique: false });
          jobStore.createIndex('status', 'status', { unique: false });
          jobStore.createIndex('next_step_at', 'next_step_at', { unique: false });
        }

        // Create locations store
        if (!db.objectStoreNames.contains(STORES.LOCATIONS)) {
          const locStore = db.createObjectStore(STORES.LOCATIONS, { keyPath: 'id' });
          locStore.createIndex('business_id', 'business_id', { unique: false });
          locStore.createIndex('active', 'active', { unique: false });
        }

        // Create loyalty_rules store
        if (!db.objectStoreNames.contains(STORES.LOYALTY_RULES)) {
          const lrStore = db.createObjectStore(STORES.LOYALTY_RULES, { keyPath: 'id' });
          lrStore.createIndex('business_id', 'business_id', { unique: false });
          lrStore.createIndex('active', 'active', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Gets object store for specified store name.
   * 
   * @param storeName - Name of the store
   * @param mode - Transaction mode (readonly or readwrite)
   * @returns Object store
   */
  private async getStore(
    storeName: StoreName,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /** Gets all records from a store */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** Gets all records matching an index value */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** Gets a single record by ID */
  async getOne<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** Inserts or updates a single record */
  async put<T extends { id: string }>(
    storeName: StoreName,
    data: T
  ): Promise<string> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(data.id);
      request.onerror = () => reject(request.error);
    });
  }

  /** Inserts or updates multiple records in a single transaction */
  async putMany<T extends { id: string }>(
    storeName: StoreName,
    dataList: T[]
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const transaction = store.transaction;
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      dataList.forEach((data) => store.put(data));
    });
  }

  /** Deletes a record by ID */
  async delete(storeName: StoreName, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Clears all records from a store */
  async clear(storeName: StoreName): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /** Counts records in a store */
  async count(storeName: StoreName): Promise<number> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

/** Singleton IndexedDB manager instance */
export const idb = new IndexedDBManager();

/**
 * Migrates data from legacy localStorage format to IndexedDB.
 * Preserves business_id from localStorage keys.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const keys = Object.keys(localStorage).filter(
    (k) =>
      k.startsWith('customers_') ||
      k.startsWith('visits_') ||
      k.startsWith('actions_') ||
      k === 'deskTracker_profile' ||
      k.startsWith('deskTracker_settings')
  );

  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (!data) continue;

      if (key.startsWith('customers_')) {
        const businessId = key.replace('customers_', '');
        const customers = JSON.parse(data);
        if (Array.isArray(customers)) {
          await idb.putMany(
            STORES.CUSTOMERS,
            customers.map((c: CustomerRecord) => ({
              ...c,
              business_id: businessId,
            }))
          );
        }
      } else if (key.startsWith('visits_')) {
        const businessId = key.replace('visits_', '');
        const visits = JSON.parse(data);
        if (Array.isArray(visits)) {
          await idb.putMany(
            STORES.VISITS,
            visits.map((v: VisitRecord) => ({ ...v, business_id: businessId }))
          );
        }
      } else if (key.startsWith('actions_')) {
        const businessId = key.replace('actions_', '');
        const actions = JSON.parse(data);
        if (Array.isArray(actions)) {
          await idb.putMany(
            STORES.ACTIONS,
            actions.map((a: ActionRecord) => ({
              ...a,
              business_id: businessId,
            }))
          );
        }
      } else if (key === 'deskTracker_profile') {
        const profile = JSON.parse(data);
        if (profile?.id) {
          await idb.put(STORES.PROFILE, profile);
        }
      } else if (key.startsWith('deskTracker_settings_')) {
        const settingsKey = key.replace('deskTracker_settings_', '');
        const settings = JSON.parse(data);
        await idb.put(STORES.SETTINGS, { key: settingsKey, ...settings });
      }
    } catch (err) {
      console.warn(`Failed to migrate ${key}:`, err);
    }
  }
}

export { STORES };
export type {
  StoreName,
  CustomerRecord,
  VisitRecord,
  ActionRecord,
  ProfileRecord,
  SettingsRecord,
};