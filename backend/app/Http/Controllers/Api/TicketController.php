<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\TicketCategory;
use App\Models\TicketStatusHistory;
use App\Models\TicketAttachment;
use App\Models\AuditLog;
use App\Models\SatisfactionRating;
use App\Services\TicketService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Storage;

class TicketController extends Controller
{
    public function publicCategories()
    {
        return response()->json(TicketCategory::where('is_active', true)->get());
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(['reporter.department', 'assignedTechnician', 'category', 'system', 'assignedTeam']);

        // Role-based visibility enforcement
        if ($user->role === 'Employee') {
            $query->where('reporter_id', $user->id);
        } elseif ($user->role === 'Technician') {
            if ($request->get('filter') === 'assigned') {
                $query->where('assigned_technician_id', $user->id);
            } elseif ($request->get('filter') === 'unassigned') {
                $query->whereNull('assigned_technician_id');
            }
        }

        // Filtering
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('search')) {
            $escaped = TicketService::escapeLikePattern($request->search);
            $query->where(function ($q) use ($escaped) {
                $q->where('ticket_number', 'like', "%{$escaped}%")
                  ->orWhere('title', 'like', "%{$escaped}%")
                  ->orWhere('description', 'like', "%{$escaped}%");
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate(15);
        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:10000',
            'type' => 'nullable|string',
            'category_id' => 'nullable|uuid|exists:ticket_categories,id',
            'system_id' => 'nullable|uuid|exists:systems,id',
            'impact' => 'nullable|in:Low,Medium,High,Critical',
            'urgency' => 'nullable|in:Low,Medium,High,Critical',
            'sync_id' => 'nullable|string|max:255',
        ]);

        $impact = $validated['impact'] ?? 'Medium';
        $urgency = $validated['urgency'] ?? 'Medium';
        $priority = TicketService::calculatePriority($impact, $urgency);
        $slaHours = TicketService::getSlaHours($priority);

        $ticket = Ticket::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'] ?? 'General Support Request',
            'reporter_id' => $request->user()->id,
            'category_id' => $validated['category_id'] ?? null,
            'system_id' => $validated['system_id'] ?? null,
            'impact' => $impact,
            'urgency' => $urgency,
            'sla_due_at' => now()->addHours($slaHours),
            'first_response_due_at' => now()->addHours(TicketService::getFirstResponseHours($slaHours)),
            'sync_id' => $validated['sync_id'] ?? null,
        ]);

        AuditLog::create([
            'actor_id' => $request->user()->id,
            'actor_name' => $request->user()->name,
            'action' => 'TICKET_CREATED',
            'resource_type' => 'Ticket',
            'resource_id' => (string) $ticket->id,
            'new_values' => ['ticket_number' => $ticket->ticket_number, 'priority' => $ticket->priority],
            'ip_address' => $request->ip(),
        ]);

        // Notify Admins & TeamLeads about the new ticket
        $ticket->load('reporter');
        NotificationService::notifyTicketCreated($ticket);

        return response()->json($ticket->load(['reporter.department', 'category', 'system']), 201);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $ticket = Ticket::with([
            'reporter.department',
            'assignedTechnician',
            'assignedTeam',
            'category',
            'system',
            'comments.user',
            'attachments.uploadedBy',
            'statusHistories.changedBy',
            'satisfactionRating',
        ])->findOrFail($id);

        // Enforcement: Employees cannot view other employees' tickets
        if ($user->role === 'Employee' && $ticket->reporter_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized view access to this ticket.'], 403);
        }

        // Filter comments: Hide private internal notes for non-technical users
        if ($user->role === 'Employee') {
            $ticket->setRelation('comments', $ticket->comments->where('is_internal', false)->values());
        }

        return response()->json($ticket);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        // Only reporters can update their own tickets, or technicians/admins can update any
        if ($user->role === 'Employee' && $ticket->reporter_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your own tickets.'], 403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:10000',
            'type' => 'nullable|string',
            'category_id' => 'nullable|uuid|exists:ticket_categories,id',
            'system_id' => 'nullable|uuid|exists:systems,id',
            'impact' => 'nullable|in:Low,Medium,High,Critical',
            'urgency' => 'nullable|in:Low,Medium,High,Critical',
        ]);

        $oldValues = $ticket->only(array_keys($validated));
        $ticket->update(array_filter($validated, fn($v) => $v !== null));

        // Recalculate priority if impact/urgency changed
        if (isset($validated['impact']) || isset($validated['urgency'])) {
            $ticket->priority = TicketService::calculatePriority($ticket->impact, $ticket->urgency);
            $slaHours = TicketService::getSlaHours($ticket->priority);
            $ticket->sla_due_at = $ticket->created_at->addHours($slaHours);
            $ticket->save();
        }

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'TICKET_UPDATED',
            'resource_type' => 'Ticket',
            'resource_id' => (string) $ticket->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
        ]);

        return response()->json($ticket->load(['reporter.department', 'assignedTechnician', 'category', 'system']));
    }

    public function changeStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:New,Under Review,Assigned,In Progress,Waiting for Reporter,Waiting for Third Party,Resolved,Awaiting Confirmation,Closed,Escalated,Reopened',
            'notes' => 'nullable|string|max:2000',
            'root_cause' => 'nullable|string|max:5000',
            'resolution_summary' => 'nullable|string|max:5000',
        ]);

        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        // Validate status transition using the state machine
        $validation = TicketService::validateStatusTransition($ticket->status, $validated['status'], $user->role);
        if (!$validation['valid']) {
            return response()->json(['message' => $validation['message']], 422);
        }

        $oldStatus = $ticket->status;
        $ticket->status = $validated['status'];

        if ($validated['status'] === 'Resolved') {
            $ticket->resolved_at = now();
            if (!empty($validated['root_cause'])) $ticket->root_cause = $validated['root_cause'];
            if (!empty($validated['resolution_summary'])) $ticket->resolution_summary = $validated['resolution_summary'];
        } elseif ($validated['status'] === 'Closed') {
            $ticket->closed_at = now();
        } elseif ($validated['status'] === 'Reopened') {
            $ticket->resolved_at = null;
            $ticket->closed_at = null;
        }

        $ticket->save();

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'changed_by_id' => $user->id,
            'old_status' => $oldStatus,
            'new_status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'TICKET_STATUS_CHANGED',
            'resource_type' => 'Ticket',
            'resource_id' => (string) $ticket->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $validated['status']],
            'ip_address' => $request->ip(),
        ]);

        // Notify reporter & assigned technician about status change
        NotificationService::notifyStatusChanged($ticket, $oldStatus, $user);

        return response()->json($ticket->load(['assignedTechnician', 'reporter']));
    }

    public function assignTechnician(Request $request, $id)
    {
        $validated = $request->validate([
            'technician_id' => 'required|uuid|exists:users,id',
        ]);

        $user = $request->user();
        if ($user->role === 'Employee') {
            return response()->json(['message' => 'Unauthorized assignment action.'], 403);
        }

        $ticket = Ticket::findOrFail($id);
        $oldTechId = $ticket->assigned_technician_id;
        $ticket->assigned_technician_id = $validated['technician_id'];
        
        if ($ticket->status === 'New') {
            $ticket->status = 'Assigned';
        }
        $ticket->save();

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'TICKET_ASSIGNED',
            'resource_type' => 'Ticket',
            'resource_id' => (string) $ticket->id,
            'old_values' => ['assigned_technician_id' => $oldTechId],
            'new_values' => ['assigned_technician_id' => $validated['technician_id']],
            'ip_address' => $request->ip(),
        ]);

        // Notify the assigned technician
        NotificationService::notifyTicketAssigned($ticket, $user);

        return response()->json($ticket->load(['assignedTechnician']));
    }

    public function escalate(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:2000',
            'escalate_to_team_id' => 'nullable|uuid|exists:teams,id',
        ]);

        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        if ($user->role === 'Employee') {
            return response()->json(['message' => 'Unauthorized escalation action.'], 403);
        }

        $transition = TicketService::validateStatusTransition($ticket->status, 'Escalated', $user->role);
        if (!$transition['valid']) {
            return response()->json(['message' => $transition['message']], 422);
        }

        $oldStatus = $ticket->status;
        $ticket->status = 'Escalated';

        // Bump priority if not already Critical
        if ($ticket->priority !== 'Critical') {
            $priorities = ['Low' => 'Medium', 'Medium' => 'High', 'High' => 'Critical'];
            $ticket->priority = $priorities[$ticket->priority] ?? 'Critical';
            $slaHours = TicketService::getSlaHours($ticket->priority);
            $ticket->sla_due_at = now()->addHours($slaHours);
        }

        if (!empty($validated['escalate_to_team_id'])) {
            $ticket->assigned_team_id = $validated['escalate_to_team_id'];
        }

        $ticket->save();

        TicketStatusHistory::create([
            'ticket_id' => $ticket->id,
            'changed_by_id' => $user->id,
            'old_status' => $oldStatus,
            'new_status' => 'Escalated',
            'notes' => 'Escalation reason: ' . $validated['reason'],
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'TICKET_ESCALATED',
            'resource_type' => 'Ticket',
            'resource_id' => (string) $ticket->id,
            'old_values' => ['status' => $oldStatus, 'priority' => $ticket->getOriginal('priority')],
            'new_values' => ['status' => 'Escalated', 'priority' => $ticket->priority, 'reason' => $validated['reason']],
            'ip_address' => $request->ip(),
        ]);

        // Notify Admins, TeamLeads, assigned tech, and reporter about escalation
        NotificationService::notifyTicketEscalated($ticket, $user);

        return response()->json($ticket->load(['assignedTechnician', 'assignedTeam', 'reporter']));
    }

    public function uploadAttachment(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,csv,zip',
        ]);

        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        // Employees can only add attachments to their own tickets
        if ($user->role === 'Employee' && $ticket->reporter_id !== $user->id) {
            return response()->json(['message' => 'You can only add attachments to your own tickets.'], 403);
        }

        $file = $request->file('file');
        $path = $file->store('ticket-attachments/' . $ticket->id, 'public');

        $attachment = TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'uploaded_by_id' => $user->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'is_public' => $user->role === 'Employee',
        ]);

        AuditLog::create([
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'action' => 'ATTACHMENT_UPLOADED',
            'resource_type' => 'TicketAttachment',
            'resource_id' => (string) $attachment->id,
            'new_values' => ['ticket_id' => $ticket->id, 'file_name' => $attachment->file_name],
            'ip_address' => $request->ip(),
        ]);

        return response()->json($attachment->load('uploadedBy'), 201);
    }

    public function addComment(Request $request, $id)
    {
        $validated = $request->validate([
            'body' => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        // Employees can only comment on their own tickets
        if ($user->role === 'Employee' && $ticket->reporter_id !== $user->id) {
            return response()->json(['message' => 'You can only comment on your own tickets.'], 403);
        }

        $isInternal = $validated['is_internal'] ?? false;
        // Non-technical employees cannot create internal notes
        if ($user->role === 'Employee') {
            $isInternal = false;
        }

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'is_internal' => $isInternal,
            'body' => $validated['body'],
        ]);

        // Track first response time for SLA
        if (in_array($user->role, ['Technician', 'TeamLead', 'Admin']) && !$ticket->first_responded_at) {
            $ticket->first_responded_at = now();
            $ticket->save();
        }

        // Notify reporter & assigned technician about the new comment
        NotificationService::notifyCommentAdded($ticket, $comment, $user);

        return response()->json($comment->load('user'), 201);
    }

    public function rateResolution(Request $request, $id)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'feedback' => 'nullable|string|max:2000',
        ]);

        $ticket = Ticket::findOrFail($id);
        $user = $request->user();

        // Only the reporter can rate their own ticket
        if ($ticket->reporter_id !== $user->id) {
            return response()->json(['message' => 'Only the ticket reporter can rate the resolution.'], 403);
        }

        // Only resolved/closed tickets can be rated
        if (!in_array($ticket->status, ['Resolved', 'Awaiting Confirmation', 'Closed'])) {
            return response()->json(['message' => 'Ticket must be resolved or closed to rate.'], 422);
        }

        $rating = SatisfactionRating::updateOrCreate(
            ['ticket_id' => $ticket->id],
            [
                'user_id' => $user->id,
                'rating' => $validated['rating'],
                'feedback' => $validated['feedback'] ?? null,
            ]
        );

        return response()->json($rating, 200);
    }
}
