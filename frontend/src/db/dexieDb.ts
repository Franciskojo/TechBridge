import Dexie, { Table } from 'dexie';

export interface PendingTicketDraft {
  id?: number;
  tempId: string;
  title: string;
  description: string;
  type: string;
  categoryId?: string;
  categoryName?: string;
  systemId?: string;
  systemName?: string;
  impact: string;
  urgency: string;
  createdAt: string;
  attachmentBlobs?: Array<{ name: string; size: number; mimeType: string; dataUrl: string }>;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  syncErrorMessage?: string;
}

export interface CachedTicketRecord {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  impact: string;
  urgency: string;
  reporter_name: string;
  category_name?: string;
  system_name?: string;
  assigned_technician_name?: string;
  created_at: string;
  sla_due_at?: string;
  updated_at: string;
}

export interface CachedKbArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  category_name?: string;
  views: number;
  helpful_count: number;
  updated_at: string;
}

export interface UserProfileRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  job_title?: string;
}

class TechBridgeDexieDB extends Dexie {
  pendingTickets!: Table<PendingTicketDraft, number>;
  cachedTickets!: Table<CachedTicketRecord, string>;
  cachedKbArticles!: Table<CachedKbArticle, string>;
  userProfile!: Table<UserProfileRecord, string>;

  constructor() {
    super('TechBridgeOfflineDB');
    this.version(1).stores({
      pendingTickets: '++id, tempId, syncStatus, createdAt',
      cachedTickets: 'id, ticket_number, status, priority, reporter_name, created_at',
      cachedKbArticles: 'id, slug, title, category_name',
      userProfile: 'id, email, role',
    });
  }
}

export const db = new TechBridgeDexieDB();
