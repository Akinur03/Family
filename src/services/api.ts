import {
  User,
  Category,
  Transaction,
  FinancialSummaryReport,
} from '../types';

const TOKEN_KEY = 'kinfinance_auth_token';
const USER_KEY = 'kinfinance_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function getHeaders(isJson = true): HeadersInit {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // --- Auth ---
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || data.message || 'Login failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async register(params: {
    username: string;
    password: string;
    fullName: string;
    relationship: string;
    avatarUrl?: string;
  }): Promise<{ message: string; user: User; isPending: boolean; token?: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token) {
      authStorage.setToken(data.token);
      authStorage.setUser(data.user);
    }
    return data;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', { headers: getHeaders() });
      if (!res.ok) {
        authStorage.clear();
        return null;
      }
      const data = await res.json();
      authStorage.setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  },

  async switchDemoUser(username: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/demo-switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Switch failed');
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  // --- Users (Admin) ---
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users;
  },

  async updateUserStatus(userId: string, status: User['status'], rejectionReason?: string): Promise<User> {
    const res = await fetch(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, rejectionReason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user status');
    return data.user;
  },

  async updateUserRole(userId: string, role: User['role']): Promise<User> {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user role');
    return data.user;
  },

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    const data = await res.json();
    return data.categories;
  },

  async createCategory(params: Partial<Category>): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create category');
    return data.category;
  },

  // --- Upload Receipts ---
  async uploadReceipt(file: File): Promise<{ url: string; fileName: string; fileSize: number }> {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = authStorage.getToken();
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload receipt');
    return data;
  },

  async uploadReceiptBase64(base64Data: string, fileName?: string): Promise<{ url: string; fileName: string; fileSize: number }> {
    const res = await fetch('/api/upload/base64', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ base64Data, fileName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload receipt');
    return data;
  },

  // --- Transactions ---
  async getTransactions(params?: {
    status?: string;
    categoryId?: string;
    memberId?: string;
    type?: string;
    search?: string;
    personalOnly?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.categoryId) query.set('categoryId', params.categoryId);
    if (params?.memberId) query.set('memberId', params.memberId);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.personalOnly) query.set('personalOnly', 'true');
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const res = await fetch(`/api/transactions?${query.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    const data = await res.json();
    return data.transactions;
  },

  async createTransaction(txData: {
    title: string;
    amount: number;
    type: 'expense' | 'income';
    categoryId: string;
    date: string;
    notes?: string;
    receiptUrl?: string;
    receiptFileName?: string;
    receiptFileSize?: number;
  }): Promise<Transaction> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(txData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit transaction');
    return data.transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update transaction');
    return data.transaction;
  },

  async reviewTransaction(id: string, status: 'approved' | 'rejected', reviewNotes?: string): Promise<Transaction> {
    const res = await fetch(`/api/transactions/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, reviewNotes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to review transaction');
    return data.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete transaction');
    }
  },

  // --- Reports ---
  async getSummaryReport(): Promise<FinancialSummaryReport> {
    const res = await fetch('/api/reports/summary', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load financial report');
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    await fetch('/api/demo/reset', { method: 'POST', headers: getHeaders() });
  },
};
