export type Role = 'Employee' | 'Technician' | 'TeamLead' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  job_title?: string;
  department?: { id: string; name: string; code: string };
  team?: { id: string; name: string; code: string };
  avatar_url?: string;
}

export type TicketStatus =
  | 'New'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Reporter'
  | 'Waiting for Third Party'
  | 'Resolved'
  | 'Awaiting Confirmation'
  | 'Closed'
  | 'Escalated'
  | 'Reopened'
  | 'Pending Sync';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user?: { name: string; role: Role; avatar_url?: string };
  is_internal: boolean;
  body: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_public: boolean;
  created_at: string;
}

export interface TicketStatusHistory {
  id: string;
  changed_by?: { name: string };
  old_status?: string;
  new_status: string;
  notes?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  type: string;
  status: TicketStatus;
  priority: Priority;
  impact: Priority;
  urgency: Priority;
  reporter_id: string;
  reporter?: { id: string; name: string; email: string; department?: { name: string } };
  assigned_technician_id?: string;
  assignedTechnician?: { id: string; name: string; email: string };
  assigned_team_id?: string;
  assignedTeam?: { name: string };
  category_id?: string;
  category?: { id: string; name: string; icon?: string };
  system_id?: string;
  system?: { id: string; name: string; status?: string };
  created_at: string;
  updated_at: string;
  sla_due_at?: string;
  resolved_at?: string;
  closed_at?: string;
  root_cause?: string;
  resolution_summary?: string;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  statusHistories?: TicketStatusHistory[];
  satisfactionRating?: { rating: number; feedback?: string };
  isOfflinePending?: boolean;
  tempId?: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  body: string;
  category?: { name: string };
  author?: { name: string };
  views: number;
  helpful_count: number;
  unhelpful_count?: number;
  tags?: string[];
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  users_count?: number;
}

export interface ITSystem {
  id: string;
  name: string;
  code: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
}

export interface TicketCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: {
    ticket_id?: string;
    ticket_number?: string;
    actor_name?: string;
    priority?: string;
    old_status?: string;
    new_status?: string;
    is_internal?: boolean;
  };
  is_read: boolean;
  created_at: string;
}
