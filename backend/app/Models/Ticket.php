<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Services\TicketService;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
            if (empty($model->ticket_number)) {
                $model->ticket_number = TicketService::generateTicketNumber();
            }
            // Auto-calculate priority from impact × urgency if not already set
            if (empty($model->priority)) {
                $model->priority = TicketService::calculatePriority(
                    $model->impact ?? 'Medium',
                    $model->urgency ?? 'Medium'
                );
            }
            // Default status
            if (empty($model->status)) {
                $model->status = 'New';
            }
        });
    }

    /**
     * Removed 'priority' and 'status' from fillable to prevent mass-assignment abuse.
     * Priority is calculated server-side; status transitions go through changeStatus().
     */
    protected $fillable = [
        'ticket_number',
        'type',
        'title',
        'description',
        'reporter_id',
        'assigned_technician_id',
        'assigned_team_id',
        'category_id',
        'system_id',
        'impact',
        'urgency',
        'affected_users_count',
        'issue_started_at',
        'first_response_due_at',
        'sla_due_at',
        'first_responded_at',
        'resolved_at',
        'closed_at',
        'root_cause',
        'resolution_summary',
        'sync_id',
    ];

    protected $casts = [
        'issue_started_at' => 'datetime',
        'first_response_due_at' => 'datetime',
        'sla_due_at' => 'datetime',
        'first_responded_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignedTechnician()
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function assignedTeam()
    {
        return $this->belongsTo(Team::class, 'assigned_team_id');
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'category_id');
    }

    public function system()
    {
        return $this->belongsTo(ITSystem::class, 'system_id');
    }

    public function comments()
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at', 'asc');
    }

    public function attachments()
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(TicketStatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function satisfactionRating()
    {
        return $this->hasOne(SatisfactionRating::class);
    }

    /**
     * Check if this ticket's SLA deadline has been breached.
     */
    public function isSlaBreached(): bool
    {
        return $this->sla_due_at
            && !in_array($this->status, ['Resolved', 'Closed'])
            && now()->greaterThan($this->sla_due_at);
    }
}
