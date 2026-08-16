import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexieDb';
import { processOfflineSyncQueue } from '../services/syncEngine';

interface PWAContextType {
  isOnline: boolean;
  pendingSyncCount: number;
  installPrompt: any;
  triggerInstall: () => void;
  triggerManualSync: () => Promise<void>;
  hasUpdate: boolean;
  applyUpdate: () => void;
  syncNotification: string | null;
  clearSyncNotification: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Dexie live query for pending offline ticket count
  const pendingDrafts = useLiveQuery(() => db.pendingTickets.where('syncStatus').equals('pending').toArray(), []);
  const pendingSyncCount = pendingDrafts ? pendingDrafts.length : 0;

  // Active connectivity check — pings the backend to verify real reachability.
  // navigator.onLine alone is unreliable: it only detects local network presence,
  // not actual internet/server connectivity.
  // Uses a relative URL (/api/health) so the request goes through Vite's proxy
  // (same-origin), avoiding any CORS issues with direct cross-origin fetches.
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
      const healthUrl = apiBase.endsWith('/v1') ? apiBase.replace(/\/v1$/, '/health') : `${apiBase}/health`;
      const res = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Run an immediate check on mount
    checkConnectivity().then(setIsOnline);

    // Poll every 15 seconds to catch dropped connections
    const pollInterval = setInterval(async () => {
      const online = await checkConnectivity();
      setIsOnline(online);
    }, 15000);

    const handleOnline = async () => {
      // Browser says online — verify with a real ping before trusting it
      const reallyOnline = await checkConnectivity();
      setIsOnline(reallyOnline);
      if (reallyOnline) {
        processOfflineSyncQueue().then(({ syncedCount }) => {
          if (syncedCount > 0) {
            setSyncNotification(`Successfully synchronized ${syncedCount} offline ticket draft(s) with server!`);
          }
        });
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Native PWA install prompt handler
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Register Service Worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setSwRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true);
              }
            });
          }
        });
      }).catch((err) => console.log('SW Registration optional:', err));

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_BACKGROUND_SYNC') {
          triggerManualSync();
        }
      });
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const triggerInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      });
    }
  };

  const triggerManualSync = async () => {
    if (!navigator.onLine) {
      setSyncNotification('Unable to sync: Device is currently offline.');
      return;
    }
    const { syncedCount, errorsCount } = await processOfflineSyncQueue();
    if (syncedCount > 0) {
      setSyncNotification(`Synced ${syncedCount} offline ticket(s) with official ticket IDs!`);
    } else if (errorsCount > 0) {
      setSyncNotification(`Sync encountered ${errorsCount} error(s). Retrying...`);
    } else {
      setSyncNotification('All local tickets are already up to date!');
    }
  };

  const applyUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        pendingSyncCount,
        installPrompt,
        triggerInstall,
        triggerManualSync,
        hasUpdate,
        applyUpdate,
        syncNotification,
        clearSyncNotification: () => setSyncNotification(null),
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
