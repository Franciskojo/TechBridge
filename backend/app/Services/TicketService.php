<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Centralized ticket business logic service.
 * Extracts shared logic from TicketController and SyncController to ensure consistency.
 */
class TicketService
{
    /**
     * Valid status transitions per role.
     * Maps: [current_status => [allowed_next_statuses]]
     */
    public const STATUS_TRANSITIONS = [
        'New'                     => ['Under Review', 'Assigned', 'Resolved', 'Closed'],
        'Under Review'            => ['Assigned', 'Waiting for Reporter', 'Resolved', 'Escalated', 'Closed'],
        'Assigned'                => ['In Progress', 'Under Review', 'Resolved', 'Escalated', 'Closed'],
        'In Progress'             => ['Waiting for Reporter', 'Waiting for Third Party', 'Resolved', 'Escalated', 'Closed'],
        'Waiting for Reporter'    => ['In Progress', 'Resolved', 'Closed'],
        'Waiting for Third Party' => ['In Progress', 'Resolved', 'Escalated', 'Closed'],
        'Resolved'                => ['Awaiting Confirmation', 'Reopened', 'Closed'],
        'Awaiting Confirmation'   => ['Closed', 'Reopened'],
        'Closed'                  => ['Reopened'],
        'Escalated'               => ['Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
        'Reopened'                => ['Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    ];

    /**
     * Roles allowed to perform each status transition category.
     */
    public const EMPLOYEE_ALLOWED_TRANSITIONS = [
        'Resolved'              => ['Reopened'],
        'Awaiting Confirmation' => ['Closed'],
    ];

    /**
     * Calculate ticket priority using impact × urgency matrix.
     * Ensures consistent priority logic across online and offline ticket creation.
     */
    public static function calculatePriority(string $impact, string $urgency): string
    {
        $matrix = [
            'Critical' => ['Critical' => 'Critical', 'High' => 'Critical', 'Medium' => 'High',     'Low' => 'High'],
            'High'     => ['Critical' => 'Critical', 'High' => 'High',     'Medium' => 'High',     'Low' => 'Medium'],
            'Medium'   => ['Critical' => 'High',     'High' => 'High',     'Medium' => 'Medium',   'Low' => 'Medium'],
            'Low'      => ['Critical' => 'High',     'High' => 'Medium',   'Medium' => 'Medium',   'Low' => 'Low'],
        ];

        return $matrix[$impact][$urgency] ?? 'Medium';
    }

    /**
     * Calculate SLA deadline hours based on priority.
     */
    public static function getSlaHours(string $priority): int
    {
        return match ($priority) {
            'Critical' => 2,
            'High'     => 8,
            'Medium'   => 24,
            default    => 48,
        };
    }

    /**
     * Calculate first response deadline hours based on SLA hours.
     */
    public static function getFirstResponseHours(int $slaHours): int
    {
        return max(1, (int) ($slaHours / 4));
    }

    /**
     * Validate a status transition for a given role.
     *
     * @return array{valid: bool, message: string}
     */
    public static function validateStatusTransition(string $currentStatus, string $newStatus, string $userRole): array
    {
        // Check if transition is valid at all
        $allowedTransitions = self::STATUS_TRANSITIONS[$currentStatus] ?? [];
        if (!in_array($newStatus, $allowedTransitions, true)) {
            return [
                'valid'   => false,
                'message' => "Invalid status transition: '{$currentStatus}' → '{$newStatus}'. Allowed transitions from '{$currentStatus}': " . implode(', ', $allowedTransitions) . '.',
            ];
        }

        // Check role-specific restrictions for Employees
        if ($userRole === 'Employee') {
            $employeeAllowed = self::EMPLOYEE_ALLOWED_TRANSITIONS[$currentStatus] ?? [];
            if (!in_array($newStatus, $employeeAllowed, true)) {
                return [
                    'valid'   => false,
                    'message' => 'Employees can only reopen resolved tickets or confirm closure of awaiting tickets.',
                ];
            }
        }

        return ['valid' => true, 'message' => 'OK'];
    }

    /**
     * Generate a collision-safe ticket number using an atomic DB sequence lock.
     * Format: TB-YYYY-NNNNNN  (e.g. TB-2026-000142)
     *
     * Uses SELECT ... FOR UPDATE on the ticket_sequences table so that two
     * concurrent requests serialize through the lock and each get a unique value.
     * This replaces the previous COUNT(*)+1 approach which had a race condition.
     */
    public static function generateTicketNumber(): string
    {
        $year = (int) date('Y');

        $seq = DB::transaction(function () use ($year) {
            // Lock the row for this year exclusively (inserts if first ticket of the year)
            $row = DB::table('ticket_sequences')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();

            if ($row) {
                $next = $row->last_value + 1;
                DB::table('ticket_sequences')
                    ->where('year', $year)
                    ->update(['last_value' => $next]);
            } else {
                $next = 1;
                DB::table('ticket_sequences')->insert([
                    'year'       => $year,
                    'last_value' => $next,
                ]);
            }

            return $next;
        });

        return 'TB-' . $year . '-' . str_pad((string) $seq, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Escape LIKE/ILIKE special characters to prevent pattern injection.
     */
    public static function escapeLikePattern(string $value): string
    {
        return str_replace(['%', '_', '\\'], ['\\%', '\\_', '\\\\'], $value);
    }
}
