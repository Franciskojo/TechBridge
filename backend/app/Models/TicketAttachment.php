<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TicketAttachment extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'ticket_id',
        'comment_id',
        'uploaded_by_id',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function comment()
    {
        return $this->belongsTo(TicketComment::class, 'comment_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }
}
