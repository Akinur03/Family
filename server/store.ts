import fs from 'fs';
import path from 'path';
import { User, Category, Transaction, FinancialSummaryReport } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Sample SVGs as data URIs for default realistic receipts so they look authentic even before manual uploads
const ELECTRICITY_RECEIPT_URL = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';
const INTERNET_RECEIPT_URL = 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80';
const GROCERY_RECEIPT_URL = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
const TUITION_RECEIPT_URL = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';

export interface DatabaseData {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  transactions: Transaction[];
}

function getDefaultCategories(): Category[] {
  return [
    {
      id: 'cat-util',
      name: 'Utility Bills',
      type: 'expense',
      icon: 'Zap',
      color: '#f59e0b', // amber
      description: 'Electricity (DESCO/DPDC), gas, water (WASA), and waste management',
      monthlyBudget: 12000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-internet',
      name: 'Internet Bills',
      type: 'expense',
      icon: 'Wifi',
      color: '#3b82f6', // blue
      description: 'Fiber broadband, 5G wireless and streaming bundles',
      monthlyBudget: 2500,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-family',
      name: 'Family Costs',
      type: 'expense',
      icon: 'Home',
      color: '#8b5cf6', // purple
      description: 'General home maintenance, furniture, and shared supplies',
      monthlyBudget: 35000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-groceries',
      name: 'Groceries & Food',
      type: 'expense',
      icon: 'ShoppingBag',
      color: '#10b981', // emerald
      description: 'Supermarket shopping, kacha bazar produce, and pantry restock',
      monthlyBudget: 28000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-health',
      name: 'Healthcare & Pharmacy',
      type: 'expense',
      icon: 'HeartPulse',
      color: '#ec4899', // pink
      description: 'Doctor visits, prescriptions, diagnostic tests, and medicine',
      monthlyBudget: 8000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-education',
      name: 'Education & Tuition',
      type: 'expense',
      icon: 'GraduationCap',
      color: '#06b6d4', // cyan
      description: 'School fees, coaching, university tuition, and textbooks',
      monthlyBudget: 25000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-transport',
      name: 'Transportation & Fuel',
      type: 'expense',
      icon: 'Car',
      color: '#64748b', // slate
      description: 'Octane, CNG, Metro rail card recharge, Uber, and maintenance',
      monthlyBudget: 10000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'cat-income',
      name: 'Family Income & Stipend',
      type: 'income',
      icon: 'Wallet',
      color: '#059669', // green
      description: 'Monthly salary deposits, bonuses, and family pool contributions',
      monthlyBudget: 150000,
      isSystem: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
}

function getDefaultUsers(): (User & { passwordHash: string })[] {
  return [
    {
      id: 'usr-admin',
      username: 'admin',
      passwordHash: 'admin123',
      fullName: 'Arthur Pendelton',
      role: 'admin',
      status: 'active',
      relationship: 'Family Head',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-01-01T08:00:00.000Z',
      approvedAt: '2026-01-01T08:00:00.000Z',
      approvedBy: 'System Root',
    },
    {
      id: 'usr-eleanor',
      username: 'eleanor',
      passwordHash: 'member123',
      fullName: 'Eleanor Pendelton',
      role: 'member',
      status: 'active',
      relationship: 'Spouse',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-01-02T10:00:00.000Z',
      approvedAt: '2026-01-02T11:00:00.000Z',
      approvedBy: 'Arthur Pendelton',
    },
    {
      id: 'usr-lucas',
      username: 'lucas',
      passwordHash: 'member123',
      fullName: 'Lucas Pendelton',
      role: 'member',
      status: 'active',
      relationship: 'Son (College)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-01-03T14:30:00.000Z',
      approvedAt: '2026-01-03T15:00:00.000Z',
      approvedBy: 'Arthur Pendelton',
    },
    {
      id: 'usr-chloe',
      username: 'chloe',
      passwordHash: 'member123',
      fullName: 'Chloe Pendelton',
      role: 'member',
      status: 'pending',
      relationship: 'Daughter (High School)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-09-08T09:15:00.000Z',
    },
  ];
}

function getDefaultTransactions(): Transaction[] {
  return [
    {
      id: 'tx-1',
      userId: 'usr-eleanor',
      userName: 'Eleanor Pendelton',
      userRole: 'member',
      title: 'DESCO Monthly Electricity Bill',
      amount: 4250.00,
      type: 'expense',
      categoryId: 'cat-util',
      categoryName: 'Utility Bills',
      categoryColor: '#f59e0b',
      categoryIcon: 'Zap',
      date: '2026-09-05',
      notes: 'Paid DESCO electricity bill for August cycle via bKash / online banking.',
      receiptUrl: ELECTRICITY_RECEIPT_URL,
      receiptFileName: 'august_electric_statement.pdf',
      receiptFileSize: 245000,
      status: 'approved',
      reviewedBy: 'usr-admin',
      reviewedByName: 'Arthur Pendelton',
      reviewedAt: '2026-09-06T10:12:00.000Z',
      reviewNotes: 'Verified against meter reading, looks accurate.',
      createdAt: '2026-09-05T19:20:00.000Z',
      updatedAt: '2026-09-06T10:12:00.000Z',
    },
    {
      id: 'tx-2',
      userId: 'usr-lucas',
      userName: 'Lucas Pendelton',
      userRole: 'member',
      title: 'Dot Internet Fiber Broadband & Mesh Bill',
      amount: 1850.00,
      type: 'expense',
      categoryId: 'cat-internet',
      categoryName: 'Internet Bills',
      categoryColor: '#3b82f6',
      categoryIcon: 'Wifi',
      date: '2026-09-06',
      notes: 'Monthly 50Mbps fiber optic broadband subscription for study and family work-from-home.',
      receiptUrl: INTERNET_RECEIPT_URL,
      receiptFileName: 'fiber_invoice_0906.jpg',
      receiptFileSize: 512000,
      status: 'approved',
      reviewedBy: 'usr-admin',
      reviewedByName: 'Arthur Pendelton',
      reviewedAt: '2026-09-07T08:30:00.000Z',
      reviewNotes: 'Standard autopay receipt approved.',
      createdAt: '2026-09-06T11:05:00.000Z',
      updatedAt: '2026-09-07T08:30:00.000Z',
    },
    {
      id: 'tx-3',
      userId: 'usr-eleanor',
      userName: 'Eleanor Pendelton',
      userRole: 'member',
      title: 'Weekly Supermarket & Bazar Family Groceries',
      amount: 7650.00,
      type: 'expense',
      categoryId: 'cat-groceries',
      categoryName: 'Groceries & Food',
      categoryColor: '#10b981',
      categoryIcon: 'ShoppingBag',
      date: '2026-09-07',
      notes: 'Shwapno & local bazar trip: fresh fish, beef, vegetables, rice, cooking oil and spices.',
      receiptUrl: GROCERY_RECEIPT_URL,
      receiptFileName: 'grocery_wf_receipt.jpg',
      receiptFileSize: 780000,
      status: 'pending',
      createdAt: '2026-09-07T16:45:00.000Z',
      updatedAt: '2026-09-07T16:45:00.000Z',
    },
    {
      id: 'tx-4',
      userId: 'usr-lucas',
      userName: 'Lucas Pendelton',
      userRole: 'member',
      title: 'University Engineering Lab Manuals & Course Books',
      amount: 4500.00,
      type: 'expense',
      categoryId: 'cat-education',
      categoryName: 'Education & Tuition',
      categoryColor: '#06b6d4',
      categoryIcon: 'GraduationCap',
      date: '2026-09-08',
      notes: 'Required engineering textbooks, calculator, and Nilkhet course materials for Fall semester.',
      receiptUrl: TUITION_RECEIPT_URL,
      receiptFileName: 'campus_bookstore_slip.png',
      receiptFileSize: 340000,
      status: 'pending',
      createdAt: '2026-09-08T14:10:00.000Z',
      updatedAt: '2026-09-08T14:10:00.000Z',
    },
    {
      id: 'tx-5',
      userId: 'usr-admin',
      userName: 'Arthur Pendelton',
      userRole: 'admin',
      title: 'Primary Monthly Salary Family Pool Deposit',
      amount: 95000.00,
      type: 'income',
      categoryId: 'cat-income',
      categoryName: 'Family Income & Stipend',
      categoryColor: '#059669',
      categoryIcon: 'Wallet',
      date: '2026-09-01',
      notes: 'Monthly executive salary credited to joint family expense vault via bank transfer.',
      status: 'approved',
      reviewedBy: 'usr-admin',
      reviewedByName: 'Arthur Pendelton',
      reviewedAt: '2026-09-01T09:00:00.000Z',
      reviewNotes: 'Admin verified deposit.',
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-09-01T09:00:00.000Z',
    },
    {
      id: 'tx-6',
      userId: 'usr-lucas',
      userName: 'Lucas Pendelton',
      userRole: 'member',
      title: 'Family Car Mobil 1 Engine Oil & Filter Change',
      amount: 3200.00,
      type: 'expense',
      categoryId: 'cat-transport',
      categoryName: 'Transportation & Fuel',
      categoryColor: '#64748b',
      categoryIcon: 'Car',
      date: '2026-09-04',
      notes: 'Tejgaon automobile workshop routine maintenance for family sedan.',
      status: 'rejected',
      reviewedBy: 'usr-admin',
      reviewedByName: 'Arthur Pendelton',
      reviewedAt: '2026-09-05T12:00:00.000Z',
      reviewNotes: 'Receipt was missing parts itemization. Please ask the workshop for the printed invoice.',
      createdAt: '2026-09-04T13:20:00.000Z',
      updatedAt: '2026-09-05T12:00:00.000Z',
    },
  ];
}

class Store {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to read db.json, initializing defaults', err);
    }

    const initial: DatabaseData = {
      users: getDefaultUsers(),
      categories: getDefaultCategories(),
      transactions: getDefaultTransactions(),
    };
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(data?: DatabaseData): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to disk', err);
    }
  }

  // --- Users ---
  public getUsers() {
    return this.data.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByUsername(username: string) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public registerUser(params: {
    username: string;
    passwordHash: string;
    fullName: string;
    relationship: string;
    avatarUrl?: string;
  }): { user: User; isAutoApproved: boolean } {
    const isFirstUser = this.data.users.length === 0;
    const newUser: User & { passwordHash: string } = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: params.username,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      role: isFirstUser ? 'admin' : 'member',
      status: isFirstUser ? 'active' : 'pending', // Default pending per requirements!
      relationship: params.relationship || 'Family Member',
      avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.fullName)}`,
      createdAt: new Date().toISOString(),
      ...(isFirstUser ? { approvedAt: new Date().toISOString(), approvedBy: 'Initial Root' } : {}),
    };

    this.data.users.push(newUser);
    this.saveToDisk();

    const { passwordHash, ...safeUser } = newUser;
    return { user: safeUser, isAutoApproved: isFirstUser };
  }

  public updateUserStatus(userId: string, status: User['status'], reviewerName?: string, rejectionReason?: string) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;

    user.status = status;
    if (status === 'active') {
      user.approvedAt = new Date().toISOString();
      user.approvedBy = reviewerName || 'Admin';
      delete user.rejectionReason;
    } else if (status === 'rejected') {
      user.rejectionReason = rejectionReason || 'Registration not approved by Family Head.';
    }
    this.saveToDisk();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public updateUserRole(userId: string, role: User['role']) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return null;
    user.role = role;
    this.saveToDisk();
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // --- Categories ---
  public getCategories() {
    return [...this.data.categories];
  }

  public addCategory(cat: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...cat,
    };
    this.data.categories.push(newCat);
    this.saveToDisk();
    return newCat;
  }

  // --- Transactions ---
  public getTransactions(filter?: {
    userId?: string;
    status?: string;
    categoryId?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    let result = [...this.data.transactions];

    if (filter?.userId) {
      result = result.filter(t => t.userId === filter.userId);
    }
    if (filter?.status && filter.status !== 'all') {
      result = result.filter(t => t.status === filter.status);
    }
    if (filter?.categoryId && filter.categoryId !== 'all') {
      result = result.filter(t => t.categoryId === filter.categoryId);
    }
    if (filter?.type && filter.type !== 'all') {
      result = result.filter(t => t.type === filter.type);
    }
    if (filter?.startDate) {
      result = result.filter(t => t.date >= filter.startDate!);
    }
    if (filter?.endDate) {
      result = result.filter(t => t.date <= filter.endDate!);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return result;
  }

  public getTransactionById(id: string) {
    return this.data.transactions.find(t => t.id === id);
  }

  public createTransaction(item: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Transaction {
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...item,
      status: 'pending', // Starts in pending review
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.transactions.push(newTx);
    this.saveToDisk();
    return newTx;
  }

  public updateTransaction(
    id: string,
    updates: Partial<Pick<Transaction, 'title' | 'amount' | 'type' | 'categoryId' | 'categoryName' | 'categoryColor' | 'categoryIcon' | 'date' | 'notes' | 'receiptUrl' | 'receiptFileName' | 'receiptFileSize'>>
  ): Transaction | null {
    const tx = this.data.transactions.find(t => t.id === id);
    if (!tx) return null;

    Object.assign(tx, updates, { updatedAt: new Date().toISOString() });
    this.saveToDisk();
    return tx;
  }

  public reviewTransaction(id: string, status: 'approved' | 'rejected', reviewerId: string, reviewerName: string, reviewNotes?: string): Transaction | null {
    const tx = this.data.transactions.find(t => t.id === id);
    if (!tx) return null;

    tx.status = status;
    tx.reviewedBy = reviewerId;
    tx.reviewedByName = reviewerName;
    tx.reviewedAt = new Date().toISOString();
    tx.reviewNotes = reviewNotes || '';
    tx.updatedAt = new Date().toISOString();

    this.saveToDisk();
    return tx;
  }

  public deleteTransaction(id: string): boolean {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.data.transactions.splice(index, 1);
    this.saveToDisk();
    return true;
  }

  // --- Consolidated Reports ---
  public getFinancialSummary(): FinancialSummaryReport {
    const approvedExpenses = this.data.transactions.filter(t => t.status === 'approved' && t.type === 'expense');
    const approvedIncome = this.data.transactions.filter(t => t.status === 'approved' && t.type === 'income');
    const pendingTxs = this.data.transactions.filter(t => t.status === 'pending');
    const rejectedTxs = this.data.transactions.filter(t => t.status === 'rejected');

    const totalApprovedExpenses = approvedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalApprovedIncome = approvedIncome.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalApprovedIncome - totalApprovedExpenses;

    const pendingCount = pendingTxs.length;
    const pendingAmount = pendingTxs.reduce((sum, t) => sum + t.amount, 0);
    const rejectedCount = rejectedTxs.length;

    // Category breakdown for approved expenses
    const catMap = new Map<string, { categoryName: string; icon: string; color: string; amount: number; count: number; budget?: number }>();
    this.data.categories
      .filter(c => c.type === 'expense')
      .forEach(c => {
        catMap.set(c.id, {
          categoryName: c.name,
          icon: c.icon,
          color: c.color,
          amount: 0,
          count: 0,
          budget: c.monthlyBudget,
        });
      });

    approvedExpenses.forEach(t => {
      const existing = catMap.get(t.categoryId) || {
        categoryName: t.categoryName,
        icon: t.categoryIcon,
        color: t.categoryColor,
        amount: 0,
        count: 0,
      };
      existing.amount += t.amount;
      existing.count += 1;
      catMap.set(t.categoryId, existing);
    });

    const categoryBreakdown = Array.from(catMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.categoryName,
        icon: data.icon,
        color: data.color,
        amount: Number(data.amount.toFixed(2)),
        percentage: totalApprovedExpenses > 0 ? Number(((data.amount / totalApprovedExpenses) * 100).toFixed(1)) : 0,
        count: data.count,
        budget: data.budget,
      }))
      .filter(c => c.amount > 0 || (c.budget && c.budget > 0))
      .sort((a, b) => b.amount - a.amount);

    // Member contributions (from approved expenses)
    const memberMap = new Map<string, { userName: string; relationship: string; totalSpent: number; count: number }>();
    this.data.users.forEach(u => {
      memberMap.set(u.id, {
        userName: u.fullName,
        relationship: u.relationship,
        totalSpent: 0,
        count: 0,
      });
    });

    approvedExpenses.forEach(t => {
      const m = memberMap.get(t.userId);
      if (m) {
        m.totalSpent += t.amount;
        m.count += 1;
      }
    });

    const memberContributions = Array.from(memberMap.entries())
      .map(([userId, m]) => ({
        userId,
        userName: m.userName,
        relationship: m.relationship,
        totalSpent: Number(m.totalSpent.toFixed(2)),
        percentage: totalApprovedExpenses > 0 ? Number(((m.totalSpent / totalApprovedExpenses) * 100).toFixed(1)) : 0,
        transactionCount: m.count,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const recentActivity = [...this.data.transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    return {
      totalApprovedExpenses: Number(totalApprovedExpenses.toFixed(2)),
      totalApprovedIncome: Number(totalApprovedIncome.toFixed(2)),
      netSavings: Number(netSavings.toFixed(2)),
      pendingCount,
      pendingAmount: Number(pendingAmount.toFixed(2)),
      rejectedCount,
      categoryBreakdown,
      memberContributions,
      recentActivity,
    };
  }

  public resetToDefaults(): void {
    this.data = {
      users: getDefaultUsers(),
      categories: getDefaultCategories(),
      transactions: getDefaultTransactions(),
    };
    this.saveToDisk();
  }
}

export const db = new Store();
