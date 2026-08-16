<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\KnowledgeArticle;
use App\Models\User;

class DashboardController extends Controller
{
    public function employee(Request $request)
    {
        $userId = $request->user()->id;
        $openTickets = Ticket::with(['category', 'system', 'assignedTechnician'])
            ->where('reporter_id', $userId)
            ->whereNotIn('status', ['Closed'])
            ->orderBy('created_at', 'desc')
            ->get();

        $actionRequired = Ticket::where('reporter_id', $userId)
            ->whereIn('status', ['Waiting for Reporter', 'Awaiting Confirmation'])
            ->count();

        $recentlyResolved = Ticket::where('reporter_id', $userId)
            ->whereIn('status', ['Resolved', 'Closed'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'open_tickets_count' => $openTickets->count(),
            'action_required_count' => $actionRequired,
            'open_tickets' => $openTickets,
            'recently_resolved' => $recentlyResolved,
        ]);
    }

    public function technician(Request $request)
    {
        $user = $request->user();
        
        $myAssigned = Ticket::with(['reporter.department', 'category', 'system'])
            ->where('assigned_technician_id', $user->id)
            ->whereNotIn('status', ['Closed'])
            ->get();

        $unassignedQueue = Ticket::with(['reporter.department', 'category', 'system'])
            ->whereNull('assigned_technician_id')
            ->whereNotIn('status', ['Closed'])
            ->get();

        $criticalTickets = Ticket::where('priority', 'Critical')
            ->whereNotIn('status', ['Closed'])
            ->count();

        $overdueCount = Ticket::where('sla_due_at', '<', now())
            ->whereNotIn('status', ['Resolved', 'Closed'])
            ->count();

        return response()->json([
            'assigned_count' => $myAssigned->count(),
            'unassigned_count' => $unassignedQueue->count(),
            'critical_count' => $criticalTickets,
            'overdue_count' => $overdueCount,
            'my_assigned_tickets' => $myAssigned,
            'unassigned_tickets' => $unassignedQueue,
        ]);
    }

    public function teamLead(Request $request)
    {
        $totalOpen = Ticket::whereNotIn('status', ['Closed'])->count();
        $criticalIncidents = Ticket::where('priority', 'Critical')->whereNotIn('status', ['Closed'])->get();
        $unassignedCount = Ticket::whereNull('assigned_technician_id')->whereNotIn('status', ['Closed'])->count();
        $overdueCount = Ticket::where('sla_due_at', '<', now())->whereNotIn('status', ['Resolved', 'Closed'])->count();

        $statusBreakdown = Ticket::selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $priorityBreakdown = Ticket::selectRaw('priority, count(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        return response()->json([
            'total_open' => $totalOpen,
            'critical_count' => $criticalIncidents->count(),
            'unassigned_count' => $unassignedCount,
            'overdue_count' => $overdueCount,
            'status_breakdown' => $statusBreakdown,
            'priority_breakdown' => $priorityBreakdown,
            'critical_incidents' => $criticalIncidents->load(['reporter', 'assignedTechnician', 'system']),
        ]);
    }

    public function admin(Request $request)
    {
        return response()->json([
            'total_users' => User::count(),
            'total_tickets' => Ticket::count(),
            'published_kb_articles' => KnowledgeArticle::where('status', 'published')->count(),
            'active_technicians' => User::whereIn('role', ['Technician', 'TeamLead'])->count(),
        ]);
    }
}
