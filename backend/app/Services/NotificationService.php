<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;

class NotificationService
{
    /**
     * Helper to create an in-app database notification and trigger a Web Push notification
     * if the recipient has registered a browser push subscription.
     */
    protected static function dispatch(User|string $recipient, string $type, string $title, string $body, array $data = []): Notification
    {
        $user = $recipient instanceof User ? $recipient : User::find($recipient);
        $userId = $user?->id ?? (is_string($recipient) ? $recipient : null);

        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        if ($user) {
            WebPushService::sendPush($user, $title, $body, $data);
        }

        return $notification;
    }

    /**
     * When a new ticket is created, notify all Admins and TeamLeads, plus sending confirmation to reporter.
     */
    public static function notifyTicketCreated(Ticket $ticket): void
    {
        $reporterName = $ticket->reporter?->name ?? 'A staff member';

        // 1. Notify Admins and TeamLeads (excluding reporter if reporter is an admin)
        $adminsAndLeads = User::whereIn('role', ['Admin', 'TeamLead'])
            ->where('id', '!=', $ticket->reporter_id)
            ->get();

        foreach ($adminsAndLeads as $user) {
            self::dispatch(
                $user,
                'ticket_created',
                'New Ticket Reported',
                "{$reporterName} submitted ticket {$ticket->ticket_number}: {$ticket->title}",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'actor_name' => $reporterName,
                    'priority' => $ticket->priority,
                ]
            );
        }

        // 2. Notify the reporting staff member (Confirmation)
        if ($ticket->reporter_id) {
            self::dispatch(
                $ticket->reporter_id,
                'ticket_created',
                'Ticket Submitted Successfully',
                "Your ticket {$ticket->ticket_number} ({$ticket->title}) has been logged and queued for IT Support.",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'priority' => $ticket->priority,
                ]
            );
        }
    }

    /**
     * When a ticket is assigned to a technician, notify that technician.
     */
    public static function notifyTicketAssigned(Ticket $ticket, User $actor): void
    {
        if (!$ticket->assigned_technician_id || $ticket->assigned_technician_id === $actor->id) {
            return;
        }

        self::dispatch(
            $ticket->assigned_technician_id,
            'ticket_assigned',
            'Ticket Assigned to You',
            "{$actor->name} assigned ticket {$ticket->ticket_number} to you: {$ticket->title}",
            [
                'ticket_id' => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'actor_name' => $actor->name,
                'priority' => $ticket->priority,
            ]
        );
    }

    /**
     * When a ticket status changes, notify the reporter and assigned technician.
     */
    public static function notifyStatusChanged(Ticket $ticket, string $oldStatus, User $actor): void
    {
        $recipientIds = collect();

        // Notify the reporter
        if ($ticket->reporter_id && $ticket->reporter_id !== $actor->id) {
            $recipientIds->push($ticket->reporter_id);
        }

        // Notify the assigned technician
        if ($ticket->assigned_technician_id && $ticket->assigned_technician_id !== $actor->id) {
            $recipientIds->push($ticket->assigned_technician_id);
        }

        $recipientIds = $recipientIds->unique();

        foreach ($recipientIds as $userId) {
            self::dispatch(
                $userId,
                'status_changed',
                'Ticket Status Updated',
                "{$actor->name} changed {$ticket->ticket_number} from \"{$oldStatus}\" to \"{$ticket->status}\"",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'actor_name' => $actor->name,
                    'old_status' => $oldStatus,
                    'new_status' => $ticket->status,
                ]
            );
        }
    }

    /**
     * When a comment is added, notify the reporter and assigned technician (excluding commenter).
     */
    public static function notifyCommentAdded(Ticket $ticket, TicketComment $comment, User $actor): void
    {
        $recipientIds = collect();

        // Notify the reporter (only for non-internal comments)
        if (!$comment->is_internal && $ticket->reporter_id && $ticket->reporter_id !== $actor->id) {
            $recipientIds->push($ticket->reporter_id);
        }

        // Notify the assigned technician
        if ($ticket->assigned_technician_id && $ticket->assigned_technician_id !== $actor->id) {
            $recipientIds->push($ticket->assigned_technician_id);
        }

        $recipientIds = $recipientIds->unique();

        $preview = mb_strlen($comment->body) > 80
            ? mb_substr($comment->body, 0, 80) . '…'
            : $comment->body;

        foreach ($recipientIds as $userId) {
            self::dispatch(
                $userId,
                'comment_added',
                'New Comment on Ticket',
                "{$actor->name} commented on {$ticket->ticket_number}: \"{$preview}\"",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'actor_name' => $actor->name,
                    'is_internal' => $comment->is_internal,
                ]
            );
        }
    }

    /**
     * When a ticket is escalated, notify all Admins, TeamLeads, and the assigned technician.
     */
    public static function notifyTicketEscalated(Ticket $ticket, User $actor): void
    {
        $recipientIds = User::whereIn('role', ['Admin', 'TeamLead'])
            ->where('id', '!=', $actor->id)
            ->pluck('id')
            ->toArray();

        // Also notify the assigned technician if different from actor
        if ($ticket->assigned_technician_id && $ticket->assigned_technician_id !== $actor->id) {
            $recipientIds[] = $ticket->assigned_technician_id;
        }

        // Also notify the reporter
        if ($ticket->reporter_id && $ticket->reporter_id !== $actor->id) {
            $recipientIds[] = $ticket->reporter_id;
        }

        $recipientIds = array_unique($recipientIds);

        foreach ($recipientIds as $userId) {
            self::dispatch(
                $userId,
                'ticket_escalated',
                'Ticket Escalated',
                "{$actor->name} escalated ticket {$ticket->ticket_number}: {$ticket->title}",
                [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'actor_name' => $actor->name,
                    'priority' => $ticket->priority,
                ]
            );
        }
    }
}
