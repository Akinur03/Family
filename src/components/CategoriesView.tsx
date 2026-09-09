import React from 'react';
import { Category, Transaction } from '../types';
import {
  Plus,
  Zap,
  Wifi,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Car,
  Wallet,
  Tag,
  Utensils,
  Plane,
  Coffee,
  Shield,
  Film,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  onOpenNewCategory: () => void;
}

const ICON_MAP: Record<string, any> = {
  Zap,
  Wifi,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Car,
  Wallet,
  Tag,
  Utensils,
  Plane,
  Coffee,
  Shield,
  Film,
  Dumbbell,
};

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  onOpenNewCategory,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Family Transaction Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System defaults and dynamic custom categories created by family members.
          </p>
        </div>

        <button
          id="btn-create-category-top"
          onClick={onOpenNewCategory}
          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const IconComponent = ICON_MAP[cat.icon] || Tag;
          const matchingTxs = transactions.filter(t => t.categoryId === cat.id);
          const totalSpent = matchingTxs.reduce((acc, t) => acc + t.amount, 0);
          const budget = cat.monthlyBudget || 0;
          const isOver = budget > 0 && totalSpent > budget;
          const percent = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 100) : 0;

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: cat.color || '#10b981' }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      cat.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {cat.type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* Progress & Budget info */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Logged Volume:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ${totalSpent.toFixed(2)} ({matchingTxs.length} items)
                  </span>
                </div>

                {budget > 0 && (
                  <>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: isOver ? '#ef4444' : cat.color || '#10b981',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Monthly Budget: ${budget.toFixed(0)}</span>
                      <span className={isOver ? 'text-rose-600 font-bold' : ''}>
                        {isOver ? 'Over budget' : `${percent}% used`}
                      </span>
                    </div>
                  </>
                )}

                {cat.isSystem && (
                  <div className="pt-1 text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Default Pre-defined Family Category</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
