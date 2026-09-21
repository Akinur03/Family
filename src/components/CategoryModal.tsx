import React, { useState } from 'react';
import { api } from '../services/api';
import { Category } from '../types';
import {
  X,
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
  AlertCircle,
} from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: Category) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Zap', icon: Zap, label: 'Utilities' },
  { name: 'Wifi', icon: Wifi, label: 'Internet' },
  { name: 'Home', icon: Home, label: 'Family Cost' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Groceries' },
  { name: 'HeartPulse', icon: HeartPulse, label: 'Health' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Education' },
  { name: 'Car', icon: Car, label: 'Transport' },
  { name: 'Utensils', icon: Utensils, label: 'Dining' },
  { name: 'Coffee', icon: Coffee, label: 'Casual' },
  { name: 'Plane', icon: Plane, label: 'Travel' },
  { name: 'Film', icon: Film, label: 'Entertainment' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'Shield', icon: Shield, label: 'Insurance' },
  { name: 'Wallet', icon: Wallet, label: 'Income' },
  { name: 'Tag', icon: Tag, label: 'General' },
];

const COLOR_PRESETS = [
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
  '#e11d48', // rose
  '#f97316', // orange
  '#14b8a6', // teal
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#10b981');
  const [description, setDescription] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const newCat = await api.createCategory({
        name: name.trim(),
        type,
        icon,
        color,
        description: description.trim(),
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : 0,
      });
      onCategoryCreated(newCat);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setMonthlyBudget('');
      setIcon('Tag');
      setColor('#10b981');
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Create New Category
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add a customized expense or income category for your family.
            </p>
          </div>
          <button
            id="btn-close-cat-modal"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Type */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category Name *
            </label>
            <input
              id="input-cat-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lawn Care, Pet Supplies, Streaming Apps"
              className="w-full min-h-[42px] sm:min-h-0 px-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type
              </label>
              <select
                id="select-cat-type"
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="expense">Expense Category</option>
                <option value="income">Income Category</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Monthly Budget (USD)
              </label>
              <input
                id="input-cat-budget"
                type="number"
                min="0"
                step="10"
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(e.target.value)}
                placeholder="e.g. 250"
                className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Color Tag
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_PRESETS.map(hex => (
                <button
                  type="button"
                  key={hex}
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full transition-transform min-h-[28px] min-w-[28px] ${
                    color === hex ? 'scale-125 ring-2 ring-offset-2 ring-slate-900 dark:ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: hex }}
                  aria-label={`Select color ${hex}`}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
              {AVAILABLE_ICONS.map(item => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => setIcon(item.name)}
                    className={`min-h-[46px] flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <IconComponent className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <input
              id="input-cat-desc"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What belongs in this category?"
              className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-cat"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 sm:py-2 text-sm sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-cat"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2.5 sm:py-2 text-sm sm:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
