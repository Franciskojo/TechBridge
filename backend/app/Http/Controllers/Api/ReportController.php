<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\SatisfactionRating;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Compute real report metrics from actual ticket data.
     */
    public function summary()
    {
        $byStatus = Ticket::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status');
        $byPriority = Ticket::selectRaw('priority, count(*) as count')->groupBy('priority')->pluck('count', 'priority');
        $byType = Ticket::selectRaw('type, count(*) as count')->groupBy('type')->pluck('count', 'type');

        // SLA compliance: % of resolved/closed tickets where resolved_at <= sla_due_at
        $resolvedTickets = Ticket::whereNotNull('resolved_at')->count();
        $slaCompliant = Ticket::whereNotNull('resolved_at')
            ->whereNotNull('sla_due_at')
            ->whereColumn('resolved_at', '<=', 'sla_due_at')
            ->count();
        $slaComplianceRate = $resolvedTickets > 0 ? round(($slaCompliant / $resolvedTickets) * 100, 1) : 0;

        // Average first response time in minutes
        $avgFirstResponseMinutes = Ticket::whereNotNull('first_responded_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, created_at, first_responded_at) / 60) as avg_minutes')
            ->value('avg_minutes');

        // Average resolution time in hours
        $avgResolutionHours = Ticket::whereNotNull('resolved_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, created_at, resolved_at) / 3600) as avg_hours')
            ->value('avg_hours');

        // Average satisfaction rating
        $avgSatisfaction = SatisfactionRating::avg('rating');

        // Monthly trend: tickets created per month for last 6 months
        $monthlyTrend = Ticket::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, count(*) as count")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderBy('month')
            ->pluck('count', 'month');

        return response()->json([
            'by_status' => $byStatus,
            'by_priority' => $byPriority,
            'by_type' => $byType,
            'sla_compliance_rate' => $slaComplianceRate,
            'avg_first_response_minutes' => round($avgFirstResponseMinutes ?? 0, 1),
            'avg_resolution_hours' => round($avgResolutionHours ?? 0, 1),
            'avg_satisfaction_rating' => round($avgSatisfaction ?? 0, 1),
            'monthly_trend' => $monthlyTrend,
            'total_tickets' => Ticket::count(),
            'open_tickets' => Ticket::whereNotIn('status', ['Closed', 'Resolved'])->count(),
        ]);
    }

    public function exportCsv()
    {
        // Use cursor() instead of get() to stream rows one-by-one and avoid
        // loading the entire ticket dataset into PHP memory at once.
        $tickets = Ticket::with(['reporter', 'assignedTechnician', 'category', 'system'])->cursor();

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=techbridge-tickets-export-" . date('Y-m-d') . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($tickets) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Ticket Number', 'Title', 'Reporter', 'Department', 'Type', 'Category', 'System',
                'Impact', 'Urgency', 'Priority', 'Status', 'Assigned Technician',
                'SLA Deadline', 'First Response At', 'Resolved At', 'Closed At', 'Created At',
            ]);

            foreach ($tickets as $t) {
                fputcsv($file, [
                    $t->ticket_number,
                    $t->title,
                    $t->reporter?->name ?? 'N/A',
                    $t->reporter?->department?->name ?? 'N/A',
                    $t->type,
                    $t->category?->name ?? 'N/A',
                    $t->system?->name ?? 'N/A',
                    $t->impact,
                    $t->urgency,
                    $t->priority,
                    $t->status,
                    $t->assignedTechnician?->name ?? 'Unassigned',
                    $t->sla_due_at?->toIso8601String() ?? '',
                    $t->first_responded_at?->toIso8601String() ?? '',
                    $t->resolved_at?->toIso8601String() ?? '',
                    $t->closed_at?->toIso8601String() ?? '',
                    $t->created_at->toIso8601String(),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
