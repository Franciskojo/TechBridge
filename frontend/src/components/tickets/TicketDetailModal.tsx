import React, { useState } from 'react';
import { Ticket, Role, TicketComment, TicketStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { SlaTimer } from '../ui/SlaTimer';
import { EditTicketModal } from './EditTicketModal';
import {
  X,
  MessageSquare,
  Lock,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Star,
  Send,
  AlertTriangle,
  User,
  Building,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { convertTicketToKbApi, updateTicketStatusApi } from '../../services/api';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (updated: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, isOpen, onClose, onUpdateTicket, onDeleteTicket }) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');
  const [newComment, setNewComment] = useState<string>('');
  const [rootCause, setRootCause] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingFeedback, setRatingFeedback] = useState<string>('');
  const [kbConverted, setKbConverted] = useState<boolean>(false);

  if (!isOpen || !ticket || !user) return null;

  const isTechnicalStaff = ['Technician', 'TeamLead', 'Admin'].includes(role);
  const canEdit = true; // All authenticated users can edit tickets they can view
  const canDelete = isTechnicalStaff; // Technician, TeamLead, Admin can delete
  const publicComments = (ticket.comments || []).filter((c) => !c.is_internal);
  const privateNotes = (ticket.comments || []).filter((c) => c.is_internal);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj: TicketComment = {
      id: `c-${Date.now()}`,
      ticket_id: ticket.id,
      user_id: user.id,
      user: { name: user.name, role: role, avatar_url: user.avatar_url },
      is_internal: isTechnicalStaff && activeTab === 'internal',
      body: newComment,
      created_at: new Date().toISOString(),
    };

    const updatedComments = [...(ticket.comments || []), commentObj];
    const updatedTicket: Ticket = { ...ticket, comments: updatedComments, updated_at: new Date().toISOString() };

    onUpdateTicket(updatedTicket);
    window.dispatchEvent(new CustomEvent('techbridge:notification-refresh'));
    setNewComment('');
  };

  const updateStatusApi = async (status: TicketStatus, cause?: string, summary?: string) => {
    const token = localStorage.getItem('techbridge_token');
    try {
      const serverTicket = await updateTicketStatusApi(
        ticket.id,
        status,
        cause,
        summary,
        token
      );
      if (serverTicket && serverTicket.id) {
        onUpdateTicket({
          ...ticket,
          ...serverTicket,
          status: serverTicket.status || status,
          resolved_at: serverTicket.resolved_at || (status === 'Resolved' ? new Date().toISOString() : ticket.resolved_at),
          closed_at: serverTicket.closed_at || (status === 'Closed' ? new Date().toISOString() : ticket.closed_at),
        });
        window.dispatchEvent(new CustomEvent('techbridge:notification-refresh'));
      }
    } catch (e) {
      console.warn('Status update API failed:', e);
    }
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === 'Resolved') {
      setShowResolveModal(true);
      return;
    }

    const updatedTicket: Ticket = {
      ...ticket,
      status: newStatus,
      updated_at: new Date().toISOString(),
      closed_at: newStatus === 'Closed' ? new Date().toISOString() : ticket.closed_at,
    };
    onUpdateTicket(updatedTicket);
    window.dispatchEvent(new CustomEvent('techbridge:notification-refresh'));
    updateStatusApi(newStatus);
  };

  const confirmResolve = () => {
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'Resolved',
      root_cause: rootCause,
      resolution_summary: resolutionSummary,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onUpdateTicket(updatedTicket);
    window.dispatchEvent(new CustomEvent('techbridge:notification-refresh'));
    updateStatusApi('Resolved', rootCause, resolutionSummary);
    setShowResolveModal(false);
  };

  const handleAssignToMe = () => {
    const updatedTicket: Ticket = {
      ...ticket,
      assigned_technician_id: user.id,
      assignedTechnician: { id: user.id, name: user.name, email: user.email },
      status: ticket.status === 'New' ? 'Assigned' : ticket.status,
      updated_at: new Date().toISOString(),
    };
    onUpdateTicket(updatedTicket);
  };

  const handleConvertToKb = async () => {
    const success = await convertTicketToKbApi(ticket.id);
    if (success) {
      setKbConverted(true);
    }
  };

  const submitRating = () => {
    const updatedTicket: Ticket = {
      ...ticket,
      satisfactionRating: { rating: userRating, feedback: ratingFeedback },
    };
    onUpdateTicket(updatedTicket);
  };

  const handleDelete = () => {
    if (onDeleteTicket) {
      onDeleteTicket(ticket.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-4 sm:my-6 flex flex-col max-h-[90vh]">
        {/* Sticky Top Header Bar with Back Arrow */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Prominent Back Button */}
            <button
              onClick={onClose}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer border border-slate-700 shadow-sm flex-shrink-0"
              title="Return to Tickets List"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span>Back</span>
            </button>

            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 truncate">
              {ticket.ticket_number}
            </span>
            <div className="hidden sm:flex items-center space-x-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="hidden md:block">
              <SlaTimer dueAt={ticket.sla_due_at} status={ticket.status} />
            </div>
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                title="Edit Ticket"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-blue-300 hover:text-white bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete Ticket"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Close Ticket Modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {/* Left 2 Columns: Description & Comments Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">{ticket.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1 text-slate-500" /> {ticket.reporter?.name || 'Jane Doe'}</span>
                <span className="flex items-center"><Building className="w-3.5 h-3.5 mr-1 text-slate-500" /> {ticket.reporter?.department?.name || 'Finance'}</span>
                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> {new Date(ticket.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Description</h3>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Root Cause & Resolution Box (if resolved) */}
            {ticket.status === 'Resolved' && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Resolution Summary
                </div>
                {ticket.root_cause && <p className="text-xs text-slate-300"><strong>Root Cause:</strong> {ticket.root_cause}</p>}
                {ticket.resolution_summary && <p className="text-xs text-slate-300"><strong>Fix Applied:</strong> {ticket.resolution_summary}</p>}
              </div>
            )}

            {/* Satisfaction Rating Component for Reporter */}
            {ticket.status === 'Resolved' && role === 'Employee' && !ticket.satisfactionRating && (
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-blue-300">How was your IT support experience?</h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className={`p-1 transition ${userRating >= star ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
                {userRating > 0 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Optional feedback..."
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none flex-1"
                    />
                    <button
                      onClick={submitRating}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Public Comments vs Private Internal Notes Tabs */}
            <div className="space-y-4">
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab('public')}
                  className={`flex items-center space-x-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
                    activeTab === 'public'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Public Conversation ({publicComments.length})</span>
                </button>

                {isTechnicalStaff && (
                  <button
                    onClick={() => setActiveTab('internal')}
                    className={`flex items-center space-x-2 pb-2.5 px-3 text-xs font-bold border-b-2 transition ml-4 ${
                      activeTab === 'internal'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private Internal Notes ({privateNotes.length})</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Tech Only</span>
                  </button>
                )}
              </div>

              {/* Feed List */}
              <div className="space-y-3">
                {(activeTab === 'public' ? publicComments : privateNotes).map((c) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border ${
                      c.is_internal ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200 flex items-center">
                        {c.user?.name || 'Support Staff'}
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-normal px-1.5 py-0.5 rounded ml-2">
                          {c.user?.role}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}
              </div>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder={
                    activeTab === 'internal'
                      ? 'Add private technical note (hidden from reporter)...'
                      : 'Type a public response to reporter...'
                  }
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className={`flex items-center space-x-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white transition ${
                    activeTab === 'internal' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Ticket Control Panel & Metadata */}
          <div className="space-y-5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Control Panel</h3>

            {/* Quick Status Transition Dropdown */}
            {isTechnicalStaff && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Update Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="New">New</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting for Reporter">Waiting for Reporter</option>
                  <option value="Waiting for Third Party">Waiting for Third Party</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>
            )}

            {/* Technician Assignment */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Assigned Technician:</span>
              <p className="text-xs font-bold text-slate-200">
                {ticket.assignedTechnician ? ticket.assignedTechnician.name : 'Unassigned Queue'}
              </p>
              {isTechnicalStaff && !ticket.assignedTechnician && (
                <button
                  onClick={handleAssignToMe}
                  className="w-full flex items-center justify-center space-x-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold py-1.5 rounded-lg transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign to Me</span>
                </button>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
              <div><span className="text-slate-500">Category:</span> {ticket.category?.name || 'Uncategorized'}</div>
              <div><span className="text-slate-500">System:</span> {ticket.system?.name || 'N/A'}</div>
              <div><span className="text-slate-500">Impact:</span> {ticket.impact}</div>
              <div><span className="text-slate-500">Urgency:</span> {ticket.urgency}</div>
            </div>

            {/* Convert Resolution to Knowledge Article */}
            {isTechnicalStaff && ticket.status === 'Resolved' && (
              <div className="pt-3 border-t border-slate-800">
                {kbConverted ? (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Converted to KB Article!
                  </p>
                ) : (
                  <button
                    onClick={handleConvertToKb}
                    className="w-full flex items-center justify-center space-x-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-semibold py-2 rounded-lg transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Convert to KB Article</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Return Action */}
        <div className="sm:hidden p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 border border-slate-700 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Back to Tickets</span>
          </button>
        </div>

        {/* Modal for Root Cause Entry when resolving */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-bold text-white">Record Ticket Resolution</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Root Cause</label>
                <input
                  type="text"
                  placeholder="e.g. Memory leak on DB node, expired TLS cert"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Summary</label>
                <textarea
                  rows={3}
                  placeholder="Describe exact fix steps..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowResolveModal(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button onClick={confirmResolve} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                  Confirm Resolved
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Ticket Modal */}
      <EditTicketModal
        ticket={ticket}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updated) => {
          onUpdateTicket(updated);
          setShowEditModal(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Ticket?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              You are about to permanently delete{' '}
              <span className="font-mono font-bold text-rose-400">{ticket.ticket_number}</span> —{' '}
              <span className="font-semibold text-white">{ticket.title}</span>.
              All comments and history will be lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
