<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Ticket;
use App\Models\AuditLog;
use App\Services\TicketService;

class SyncController extends Controller
{
    /**
     * Batch sync offline ticket drafts from IndexedDB.
     * Uses sync_id for idempotency to prevent duplicate creation.
     */
    public function batchSync(Request $request)
    {
        $validated = $request->validate([
            'tickets' => 'required|array|max:50',
            'tickets.*.temp_id' => 'required|string|max:255',
            'tickets.*.title' => 'required|string|max:255',
            'tickets.*.description' => 'required|string|max:10000',
            'tickets.*.type' => 'nullable|string',
            'tickets.*.category_id' => 'nullable|uuid',
            'tickets.*.system_id' => 'nullable|uuid',
            'tickets.*.impact' => 'nullable|in:Low,Medium,High,Critical',
            'tickets.*.urgency' => 'nullable|in:Low,Medium,High,Critical',
        ]);

        $results = [];
        $user = $request->user();

        foreach ($validated['tickets'] as $draft) {
            // Check idempotency: if sync_id already exists, return existing ticket
            $existing = Ticket::where('sync_id', $draft['temp_id'])->first();
            if ($existing) {
                $results[] = [
                    'temp_id' => $draft['temp_id'],
                    'status' => 'already_synced',
                    'ticket_number' => $existing->ticket_number,
                    'id' => $existing->id,
                ];
                continue;
            }

            $impact = $draft['impact'] ?? 'Medium';
            $urgency = $draft['urgency'] ?? 'Medium';
            $priority = TicketService::calculatePriority($impact, $urgency);
            $slaHours = TicketService::getSlaHours($priority);

            $ticket = Ticket::create([
                'title' => $draft['title'],
                'description' => $draft['description'],
                'type' => $draft['type'] ?? 'General Support Request',
                'reporter_id' => $user->id,
                'category_id' => $draft['category_id'] ?? null,
                'system_id' => $draft['system_id'] ?? null,
                'impact' => $impact,
                'urgency' => $urgency,
                'sync_id' => $draft['temp_id'],
                'sla_due_at' => now()->addHours($slaHours),
                'first_response_due_at' => now()->addHours(TicketService::getFirstResponseHours($slaHours)),
            ]);

            AuditLog::create([
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'action' => 'OFFLINE_TICKET_SYNCED',
                'resource_type' => 'Ticket',
                'resource_id' => (string) $ticket->id,
                'new_values' => ['ticket_number' => $ticket->ticket_number, 'temp_id' => $draft['temp_id']],
                'ip_address' => $request->ip(),
            ]);

            $results[] = [
                'temp_id' => $draft['temp_id'],
                'status' => 'synced',
                'ticket_number' => $ticket->ticket_number,
                'id' => $ticket->id,
            ];
        }

        return response()->json(['synced' => $results]);
    }
}
