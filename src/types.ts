export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'active' | 'rejected';
export type TransactionType = 'expense' | 'income';
export type TransactionStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  relationship: string;
  avatarUrl?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  description?: string;
  monthlyBudget?: number;
  isSystem?: boolean;
  createdBy?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userRole?: UserRole;
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptFileSize?: number;
  status: TransactionStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryReportItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
  budget?: number;
}

export interface MemberContributionItem {
  userId: string;
  userName: string;
  relationship: string;
  totalSpent: number;
  percentage: number;
  transactionCount: number;
}

export interface FinancialSummaryReport {
  totalApprovedExpenses: number;
  totalApprovedIncome: number;
  netSavings: number;
  pendingCount: number;
  pendingAmount: number;
  rejectedCount: number;
  categoryBreakdown: CategoryReportItem[];
  memberContributions: MemberContributionItem[];
  recentActivity: Transaction[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
