/**
 * Sync Queue for offline-first operations
 * 
 * Manages pending operations that need to be synced to Supabase
 * when the app comes back online or on a periodic interval.
 */

import { supabase } from './supabaseClient';

export type SyncOperation = {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
};

const SYNC_QUEUE_KEY = 'lokalos_sync_queue';
const MAX_RETRIES = 3;
const SYNC_INTERVAL_MS = 30000; // 30 seconds

let syncIntervalId: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getQueue(): SyncOperation[] {
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: SyncOperation[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueSyncOp(
  table: string,
  type: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
): void {
  const queue = getQueue();
  const operation: SyncOperation = {
    id: generateId(),
    table,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(operation);
  saveQueue(queue);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    drainSyncQueue();
  }
}

export async function drainSyncQueue(): Promise<void> {
  if (!supabase || isSyncing || !navigator.onLine) {
    return;
  }

  isSyncing = true;
  const queue = getQueue();
  
  if (queue.length === 0) {
    isSyncing = false;
    return;
  }

  const processedIds: string[] = [];

  for (const op of queue) {
    try {
      if (op.type === 'insert') {
        const { error } = await supabase
          .from(op.table)
          .insert(op.data);
        
        if (error) {
          console.warn(`[SyncQueue] Insert failed for ${op.table}:`, error);
          if (op.retries < MAX_RETRIES) {
            op.retries++;
            continue; // Keep in queue
          }
        } else {
          processedIds.push(op.id);
        }
      } else if (op.type === 'update') {
        const { error } = await supabase
          .from(op.table)
          .update(op.data)
          .eq('id', op.data.id);
        
        if (error) {
          console.warn(`[SyncQueue] Update failed for ${op.table}:`, error);
          if (op.retries < MAX_RETRIES) {
            op.retries++;
            continue;
          }
        } else {
          processedIds.push(op.id);
        }
      } else if (op.type === 'delete') {
        const { error } = await supabase
          .from(op.table)
          .delete()
          .eq('id', op.data.id);
        
        if (error) {
          console.warn(`[SyncQueue] Delete failed for ${op.table}:`, error);
          if (op.retries < MAX_RETRIES) {
            op.retries++;
            continue;
          }
        } else {
          processedIds.push(op.id);
        }
      }
    } catch (err) {
      console.warn(`[SyncQueue] Error syncing ${op.table}:`, err);
      op.retries++;
    }
  }

  // Remove successfully processed operations
  const remainingQueue = queue.filter(op => !processedIds.includes(op.id));
  saveQueue(remainingQueue);
  
  isSyncing = false;
  
  if (remainingQueue.length > 0 && navigator.onLine) {
    // Retry remaining after a short delay
    setTimeout(drainSyncQueue, 2000);
  }
}

export function startSyncInterval(): void {
  if (syncIntervalId) return;
  
  // Initial sync
  drainSyncQueue();
  
  // Periodic sync every 30 seconds
  syncIntervalId = setInterval(drainSyncQueue, SYNC_INTERVAL_MS);
}

export function stopSyncInterval(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

export function getQueueLength(): number {
  return getQueue().length;
}

// Setup event listeners for online/offline
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncQueue] Back online, starting sync...');
    drainSyncQueue();
  });

  window.addEventListener('offline', () => {
    console.log('[SyncQueue] Went offline');
  });

  // Start the sync interval when module is loaded
  startSyncInterval();
}