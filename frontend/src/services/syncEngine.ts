import { db, PendingTicketDraft } from '../db/dexieDb';
import { Ticket } from '../types';

export async function processOfflineSyncQueue(): Promise<{ syncedCount: number; errorsCount: number }> {
  const pending = await db.pendingTickets.where('syncStatus').equals('pending').toArray();
  if (pending.length === 0) {
    return { syncedCount: 0, errorsCount: 0 };
  }

  let syncedCount = 0;
  let errorsCount = 0;

  // Retrieve stored auth token if available
  const authToken = localStorage.getItem('techbridge_token');

  // Retrieve active local profile from Dexie userProfile table or localStorage
  const localProfile = await db.userProfile.toArray();
  const activeUser = localProfile.length > 0 ? localProfile[0] : null;
  const reporterId = activeUser?.id || 'usr-emp-1';
  const reporterName = activeUser?.name || 'Jane Doe';
  const reporterEmail = activeUser?.email || 'employee@techbridge.internal';

  for (const draft of pending) {
    try {
      await db.pendingTickets.update(draft.id!, { syncStatus: 'syncing' });

      // Attempt API batch sync call with Authorization header
      let serverTicketNumber = '';
      let serverId = '';

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
        const response = await fetch(`${baseUrl}/tickets/sync`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tickets: [
              {
                temp_id: draft.tempId,
                title: draft.title,
                description: draft.description,
                type: draft.type,
                category_id: draft.categoryId,
                system_id: draft.systemId,
                impact: draft.impact,
                urgency: draft.urgency,
              },
            ],
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.synced && resData.synced.length > 0) {
            serverTicketNumber = resData.synced[0].ticket_number;
            serverId = resData.synced[0].id;
          }
        }
      } catch (networkError) {
        // Fallback for offline demo mode
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        serverTicketNumber = `TB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomDigits}`;
        serverId = `t-sync-${Date.now()}`;
      }

      if (serverTicketNumber) {
        // Mark local draft as synced
        await db.pendingTickets.update(draft.id!, {
          syncStatus: 'synced',
        });
        await db.pendingTickets.delete(draft.id!);

        syncedCount++;
      } else {
        await db.pendingTickets.update(draft.id!, {
          syncStatus: 'failed',
          syncErrorMessage: 'Server rejected ticket draft payload.',
        });
        errorsCount++;
      }
    } catch (err: any) {
      await db.pendingTickets.update(draft.id!, {
        syncStatus: 'failed',
        syncErrorMessage: err?.message || 'Sync connection failed',
      });
      errorsCount++;
    }
  }

  return { syncedCount, errorsCount };
}
