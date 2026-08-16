import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Pencil } from 'lucide-react';
import { Ticket, Priority, TicketCategory, ITSystem } from '../../types';
import { fetchCategoriesApi, fetchSystemsApi } from '../../services/api';

const editSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description is too short'),
  type: z.string(),
  priority: z.string(),
  impact: z.string(),
  urgency: z.string(),
  categoryId: z.string().optional(),
  systemId: z.string().optional(),
});

type EditFormData = {
  title: string;
  description: string;
  type: string;
  priority: string;
  impact: string;
  urgency: string;
  categoryId?: string;
  systemId?: string;
};

interface EditTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Ticket) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, isOpen, onClose, onSave }) => {
  const [categoriesList, setCategoriesList] = useState<TicketCategory[]>([]);
  const [systemsList, setSystemsList] = useState<ITSystem[]>([]);

  useEffect(() => {
    fetchCategoriesApi().then((cats) => setCategoriesList(cats));
    fetchSystemsApi().then((sys) => setSystemsList(sys));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  // Populate form whenever ticket changes
  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title,
        description: ticket.description,
        type: ticket.type || 'Incident',
        priority: ticket.priority,
        impact: ticket.impact,
        urgency: ticket.urgency,
        categoryId: ticket.category?.id || '',
        systemId: ticket.system?.id || '',
      });
    }
  }, [ticket, reset]);

  if (!isOpen || !ticket) return null;

  const onSubmit = (data: EditFormData) => {
    const selectedCategory = categoriesList.find((c) => c.id === data.categoryId);
    const selectedSystem = systemsList.find((s) => s.id === data.systemId);

    const updated: Ticket = {
      ...ticket,
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority as Priority,
      impact: data.impact as Priority,
      urgency: data.urgency as Priority,
      category_id: data.categoryId,
      category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : ticket.category,
      system_id: data.systemId,
      system: selectedSystem ? { id: selectedSystem.id, name: selectedSystem.name } : ticket.system,
      updated_at: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
  const typeOptions = ['Incident', 'Service Request', 'Change Request', 'Problem'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Edit Ticket</h2>
              <p className="text-[11px] text-slate-400 font-mono">{ticket.ticket_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 transition"
              placeholder="Brief summary of the issue"
            />
            {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30 transition resize-none"
              placeholder="Detailed description of the issue..."
            />
            {errors.description && <p className="text-[11px] text-rose-400 mt-1">{errors.description.message}</p>}
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type</label>
              <select
                {...register('type')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
              <select
                {...register('priority')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Impact + Urgency row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Impact</label>
              <select
                {...register('impact')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Urgency</label>
              <select
                {...register('urgency')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category + System row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                {...register('categoryId')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                <option value="">— Select Category —</option>
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Affected System</label>
              <select
                {...register('systemId')}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 transition cursor-pointer"
              >
                <option value="">— Select System —</option>
                {systemsList.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
