import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { fetchCategoriesApi, fetchSystemsApi, createTicketApi, fetchKnowledgeArticlesApi } from '../../services/api';
import { db } from '../../db/dexieDb';
import { usePWA } from '../../context/PWAContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, TicketCategory, ITSystem, KnowledgeArticle } from '../../types';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Please describe the problem in more detail'),
  type: z.string(),
  categoryId: z.string().optional(),
  systemId: z.string().optional(),
  impact: z.string(),
  urgency: z.string(),
});

type TicketFormData = {
  title: string;
  description: string;
  type: string;
  categoryId?: string;
  systemId?: string;
  impact: string;
  urgency: string;
};

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose, onTicketCreated }) => {
  const { isOnline } = usePWA();
  const { user, token } = useAuth();
  const [categoriesList, setCategoriesList] = useState<TicketCategory[]>([]);
  const [systemsList, setSystemsList] = useState<ITSystem[]>([]);
  const [kbList, setKbList] = useState<KnowledgeArticle[]>([]);
  const [step, setStep] = useState<number>(1);
  const [suggestedKb, setSuggestedKb] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoriesApi().then((cats) => setCategoriesList(cats));
    fetchSystemsApi().then((sys) => setSystemsList(sys));
    fetchKnowledgeArticlesApi(token).then((articles) => setKbList(articles));
  }, [token]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'Incident',
      impact: 'Medium',
      urgency: 'Medium',
    },
  });

  const watchTitle = watch('title');

  // Intelligent Real-time KB auto-search as user types title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('title', val);
    if (val.length >= 3) {
      const filtered = kbList.filter(
        (a) => a.title.toLowerCase().includes(val.toLowerCase()) || a.body.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestedKb(filtered);
    } else {
      setSuggestedKb([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);

    try {
      const selectedCategory = categoriesList.find((c) => c.id === data.categoryId);
      const selectedSystem = systemsList.find((s) => s.id === data.systemId);

      if (!isOnline) {
        // Offline Submission: Store in Dexie IndexedDB
        const tempId = `TEMP-${Date.now()}`;
        await db.pendingTickets.add({
          tempId,
          title: data.title,
          description: data.description,
          type: data.type,
          categoryId: data.categoryId,
          categoryName: selectedCategory?.name,
          systemId: data.systemId,
          systemName: selectedSystem?.name,
          impact: data.impact,
          urgency: data.urgency,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
        });

        const pendingTicket: Ticket = {
          id: tempId,
          tempId,
          ticket_number: tempId,
          title: data.title,
          description: data.description,
          type: data.type,
          status: 'Pending Sync',
          priority: data.impact === 'Critical' || data.urgency === 'Critical' ? 'Critical' : 'Medium',
          impact: data.impact as any,
          urgency: data.urgency as any,
          reporter_id: 'usr-emp-1',
          category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : undefined,
          system: selectedSystem ? { id: selectedSystem.id, name: selectedSystem.name } : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isOfflinePending: true,
        };

        onTicketCreated(pendingTicket);
        setSuccessMessage('Ticket saved locally as offline draft! It will synchronize automatically when online.');
      } else {
        // Online API Submission
        const apiResult = await createTicketApi(
          {
            title: data.title,
            description: data.description,
            type: data.type,
            category_id: data.categoryId,
            system_id: data.systemId,
            impact: data.impact,
            urgency: data.urgency,
          },
          token
        );

        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const ticketNum = apiResult?.ticket_number || `TB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomDigits}`;
        const reporterId = user?.id || 'usr-emp-1';
        const reporterName = user?.name || 'Jane Doe';
        const reporterEmail = user?.email || 'employee@techbridge.internal';

        const createdTicket: Ticket = apiResult || {
          id: `t-${Date.now()}`,
          ticket_number: ticketNum,
          title: data.title,
          description: data.description,
          type: data.type,
          status: 'New',
          priority: data.impact === 'Critical' || data.urgency === 'Critical' ? 'Critical' : 'Medium',
          impact: data.impact as any,
          urgency: data.urgency as any,
          reporter_id: reporterId,
          reporter: {
            id: reporterId,
            name: reporterName,
            email: reporterEmail,
            department: user?.department || { name: 'Finance & Accounting' },
          },
          category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : undefined,
          system: selectedSystem ? { id: selectedSystem.id, name: selectedSystem.name } : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sla_due_at: new Date(Date.now() + 3600 * 1000 * 24).toISOString(),
          comments: [],
        };

        onTicketCreated(createdTicket);
        window.dispatchEvent(new CustomEvent('techbridge:notification-refresh'));
        setSuccessMessage(`Ticket #${ticketNum} successfully submitted to IT Support!`);
      }

      setTimeout(() => {
        setSuccessMessage(null);
        reset();
        setStep(1);
        setAttachments([]);
        onClose();
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[90vh]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-700 shadow-sm flex-shrink-0"
              title="Cancel and return"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span>Back</span>
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center leading-none truncate">
                Report Technical Problem
                {!isOnline && (
                  <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                    Offline
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400 leading-none mt-1">Simple Support Wizard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer flex-shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {successMessage ? (
            <div className="p-6 text-center space-y-3 my-auto">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-base font-bold text-white">Ticket Recorded!</h3>
              <p className="text-xs text-slate-300">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                {/* Simple Title / Problem Summary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">What problem are you having?</label>
                  <input
                    type="text"
                    placeholder="e.g. Cannot log in to VPN, ERP throwing 500 error, Printer jammed"
                    onChange={handleTitleChange}
                    value={watchTitle}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
                </div>

                {/* Real-time KB Article Suggestions */}
                {suggestedKb.length > 0 && (
                  <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center text-xs font-bold text-blue-300">
                      <HelpCircle className="w-4 h-4 mr-1.5 text-blue-400" /> Suggested Solution before submitting:
                    </div>
                    <div className="space-y-1.5">
                      {suggestedKb.map((kb) => (
                        <div key={kb.id} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-xs hover:border-blue-500/50 transition">
                          <p className="font-semibold text-slate-200">{kb.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{kb.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Please describe what happened</label>
                  <textarea
                    rows={3}
                    placeholder="Include error codes, steps to reproduce, or app names..."
                    {...register('description')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>}
                </div>

                {/* Category & System Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Category</label>
                    <select
                      {...register('categoryId')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Select Category --</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Affected System</label>
                    <select
                      {...register('systemId')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Select Application --</option>
                      {systemsList.map((sys) => (
                        <option key={sys.id} value={sys.id}>
                          {sys.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Impact & Urgency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">How many users affected?</label>
                    <select
                      {...register('impact')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="Low">Just me (Workaround available)</option>
                      <option value="Medium">Several team members</option>
                      <option value="High">Entire department</option>
                      <option value="Critical">Entire company outage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">Urgency Level</label>
                    <select
                      {...register('urgency')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                    >
                      <option value="Low">Low - Can wait</option>
                      <option value="Medium">Medium - Normal queue</option>
                      <option value="High">High - Blocking work</option>
                      <option value="Critical">Critical - Urgent incident</option>
                    </select>
                  </div>
                </div>

                {/* Camera & Screenshot Attachment Input */}
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 text-center bg-slate-950/40">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition border border-slate-700">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span>Take Photo</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg transition border border-slate-700">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Upload Screenshot</span>
                      <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {attachments.length > 0 && (
                    <p className="text-xs text-emerald-400 font-semibold">{attachments.length} attachment(s) selected.</p>
                  )}
                </div>
              </div>

              {/* Sticky Footer Bar with Submit Button */}
              <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-slate-950/95 backdrop-blur border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Ticket</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
