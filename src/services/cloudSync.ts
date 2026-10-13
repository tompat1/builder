import { computed, ref } from 'vue';

function getWorkerBase(): string {
  const configured = typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_CLOUDFLARE_WORKER_URL as string | undefined)
    : undefined;
  return (configured || 'https://builder-knowledge.thomasrynell.workers.dev').replace(/\/$/, '');
}

export type CloudSyncState = 'online' | 'syncing' | 'offline' | 'error';

export interface CloudflareHealthResponse {
  status?: string;
  ai?: boolean;
  accounts?: boolean;
}

const status = ref<CloudSyncState>('online');
const isOnline = ref(true);
const isCloudflareReady = ref(true);
const latencyMs = ref<number | null>(null);
const aiReady = ref<boolean | null>(true);
const dbReady = ref<boolean | null>(true);
const lastSyncedAt = ref<Date | null>(new Date());
const lastCheckedAt = ref<Date | null>(new Date());
const isVerifying = ref(false);
const errorMessage = ref<string | null>(null);

let pingInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

/**
 * Ping Cloudflare Worker health endpoint and record latency + capability status.
 */
export async function checkCloudflareHealth(): Promise<boolean> {
  if (typeof window !== 'undefined' && !window.navigator.onLine) {
    isOnline.value = false;
    status.value = 'offline';
    errorMessage.value = 'No internet connection';
    return false;
  }

  isVerifying.value = true;
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), 8000)
      : null;

    const response = await fetch(`${getWorkerBase()}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller?.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    latencyMs.value = Math.max(1, Math.round(end - start));
    lastCheckedAt.value = new Date();

    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as CloudflareHealthResponse;
      isOnline.value = true;
      isCloudflareReady.value = data.status === 'ok';
      aiReady.value = data.ai ?? true;
      dbReady.value = data.accounts ?? true;
      status.value = 'online';
      errorMessage.value = null;
      if (!lastSyncedAt.value) {
        lastSyncedAt.value = new Date();
      }
      return true;
    } else {
      isCloudflareReady.value = false;
      status.value = 'error';
      errorMessage.value = `Cloudflare HTTP ${response.status}`;
      return false;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    isCloudflareReady.value = false;
    status.value = 'offline';
    errorMessage.value = message;
    return false;
  } finally {
    isVerifying.value = false;
  }
}

/**
 * Mark sync in progress (e.g., when a house or design save is underway).
 */
export function markSyncStarted(): void {
  status.value = 'syncing';
}

/**
 * Mark sync complete and refresh synced timestamp.
 */
export function markSyncCompleted(success = true): void {
  if (success) {
    status.value = 'online';
    lastSyncedAt.value = new Date();
    errorMessage.value = null;
  } else {
    status.value = 'error';
  }
}

/**
 * Setup listeners for browser online/offline and cloud sync events.
 */
export function initCloudSync(intervalMs = 60000): () => void {
  if (isInitialized && typeof window !== 'undefined') {
    return () => {};
  }
  isInitialized = true;

  if (typeof window !== 'undefined') {
    const onOnline = () => {
      isOnline.value = true;
      void checkCloudflareHealth();
    };

    const onOffline = () => {
      isOnline.value = false;
      status.value = 'offline';
    };

    const onSyncEvent = (event: Event) => {
      const custom = event as CustomEvent<{ state?: 'syncing' | 'synced' | 'error' }>;
      if (custom.detail?.state === 'syncing') {
        markSyncStarted();
      } else if (custom.detail?.state === 'synced') {
        markSyncCompleted(true);
      } else if (custom.detail?.state === 'error') {
        markSyncCompleted(false);
      }
    };

    const onActiveHouseChanged = () => {
      markSyncCompleted(true);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('builder:cloud-sync', onSyncEvent);
    window.addEventListener('builder:house-active', onActiveHouseChanged);

    // Initial health check
    void checkCloudflareHealth();

    // Periodic ping
    if (intervalMs > 0) {
      pingInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        void checkCloudflareHealth();
      }, intervalMs);
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('builder:cloud-sync', onSyncEvent);
      window.removeEventListener('builder:house-active', onActiveHouseChanged);
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      isInitialized = false;
    };
  }

  return () => {};
}

export function useCloudSync() {
  return {
    status: computed(() => status.value),
    isOnline: computed(() => isOnline.value),
    isCloudflareReady: computed(() => isCloudflareReady.value),
    latencyMs: computed(() => latencyMs.value),
    aiReady: computed(() => aiReady.value),
    dbReady: computed(() => dbReady.value),
    lastSyncedAt: computed(() => lastSyncedAt.value),
    lastCheckedAt: computed(() => lastCheckedAt.value),
    isVerifying: computed(() => isVerifying.value),
    errorMessage: computed(() => errorMessage.value),
    checkHealth: checkCloudflareHealth,
    markSyncStarted,
    markSyncCompleted
  };
}

export function resetCloudSyncForTesting(): void {
  status.value = 'online';
  isOnline.value = true;
  isCloudflareReady.value = true;
  latencyMs.value = null;
  aiReady.value = true;
  dbReady.value = true;
  lastSyncedAt.value = new Date();
  lastCheckedAt.value = new Date();
  isVerifying.value = false;
  errorMessage.value = null;
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  isInitialized = false;
}
