// TechBridge API Service — REST client for backend endpoints
import { Ticket, KnowledgeArticle, User, Department, ITSystem, TicketCategory, AuditLogItem, AppNotification } from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api/v1') ? rawBaseUrl : `${rawBaseUrl}/api/v1`;

// ── Helper ─────────────────────────────────────────────────────────────────
function authHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const t = token || localStorage.getItem('techbridge_token');
  if (t) headers.Authorization = `Bearer ${t}`;
  return headers;
}

function jsonHeaders(token?: string | null): Record<string, string> {
  return { ...authHeaders(token), 'Content-Type': 'application/json' };
}

// ── Authenticated Tickets API ──────────────────────────────────────────────
export const fetchTicketsApi = async (
  _role: string,
  _currentUserId?: string,
  _currentUserEmail?: string
): Promise<Ticket[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    }
  } catch (e) {
    console.warn('Fetch tickets API failed:', e);
  }
  return [];
};

export const createTicketApi = async (
  ticketData: {
    title: string;
    description: string;
    type?: string;
    category_id?: string;
    system_id?: string;
    impact?: string;
    urgency?: string;
  },
  token?: string | null
): Promise<Ticket | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(ticketData),
    });
    if (res.ok) {
      const data = await res.json();
      return data.ticket || data.data || data;
    }
  } catch (e) {
    console.warn('Create ticket API failed:', e);
  }
  return null;
};

// ── Auth Endpoints ─────────────────────────────────────────────────────────
export const loginApi = async (email: string, password: string): Promise<{ user: User; token: string } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      return { user: data.user, token: data.token };
    }
  } catch (e) {
    console.warn('Login API failed:', e);
  }
  return null;
};

export const registerApi = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department_id?: string;
  job_title?: string;
  role?: string;
  admin_secret?: string;
}): Promise<{ user: User; token: string } | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const result = await res.json();
      return { user: result.user, token: result.token };
    }
  } catch (e) {
    console.warn('Register API failed:', e);
  }
  return null;
};

export const fetchMeApi = async (token: string): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(token),
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (e) {
    console.warn('Fetch me failed:', e);
  }
  return null;
};

export const logoutApi = async (token: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(token),
    });
  } catch (e) {
    console.warn('Logout API failed:', e);
  }
};

export const changePasswordApi = async (
  token: string,
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      }),
    });
    const data = await res.json();
    if (res.ok) return { success: true };
    return {
      success: false,
      error: data.message || data.errors?.new_password?.[0] || 'Failed to change password.',
    };
  } catch (e) {
    console.warn('Change password API failed:', e);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

// ── Reference Data & Resource Endpoints ────────────────────────────────────
export const fetchUsersCountApi = async (token?: string | null): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return data.total ?? data.data?.length ?? 0;
    }
  } catch (e) {
    console.warn('Fetch users count failed:', e);
  }
  return 0;
};

export const fetchSystemsApi = async (): Promise<ITSystem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/public/systems`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Fetch systems API failed:', e);
  }
  return [];
};

export const fetchCategoriesApi = async (): Promise<TicketCategory[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/public/categories`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Fetch categories API failed:', e);
  }
  return [];
};

export const fetchUsersListApi = async (token?: string | null): Promise<User[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    }
  } catch (e) {
    console.warn('Fetch users list API failed:', e);
  }
  return [];
};

export const fetchKnowledgeArticlesApi = async (token?: string | null): Promise<KnowledgeArticle[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/knowledge-articles`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    }
  } catch (e) {
    console.warn('Fetch knowledge articles API failed:', e);
  }
  return [];
};

export const fetchAuditLogsApi = async (token?: string | null): Promise<AuditLogItem[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/audit-logs`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    }
  } catch (e) {
    console.warn('Fetch audit logs API failed:', e);
  }
  return [];
};

export const fetchReportsSummaryApi = async (token?: string | null): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE_URL}/reports/summary`, { headers: authHeaders(token) });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Fetch reports summary API failed:', e);
  }
  return null;
};

// ── Notification Endpoints ─────────────────────────────────────────────────
export const fetchNotificationsApi = async (token?: string | null): Promise<AppNotification[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    }
  } catch (e) {
    console.warn('Fetch notifications API failed:', e);
  }
  return [];
};

export const fetchUnreadCountApi = async (token?: string | null): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers: authHeaders(token) });
    if (res.ok) {
      const data = await res.json();
      return data.count ?? 0;
    }
  } catch (e) {
    console.warn('Fetch unread count API failed:', e);
  }
  return 0;
};

export const markNotificationReadApi = async (id: string, token?: string | null): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders(token),
    });
    return res.ok;
  } catch (e) {
    console.warn('Mark notification read API failed:', e);
  }
  return false;
};

export const markAllNotificationsReadApi = async (token?: string | null): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return res.ok;
  } catch (e) {
    console.warn('Mark all notifications read API failed:', e);
  }
  return false;
};

export const savePushSubscriptionApi = async (subscription: any, token?: string | null): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/push-subscription`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ subscription }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Save push subscription API failed:', e);
  }
  return false;
};

export const convertTicketToKbApi = async (ticketId: string, token?: string | null): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/convert-to-kb`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    return res.ok;
  } catch (e) {
    console.warn('Convert ticket to KB API failed:', e);
  }
  return false;
};


