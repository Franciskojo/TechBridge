<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class KnowledgeArticle extends Model
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
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->title) . '-' . Str::random(5);
            }
        });
    }

    protected $fillable = [
        'title',
        'slug',
        'category_id',
        'author_id',
        'body',
        'tags',
        'status',
        'views',
        'helpful_count',
        'unhelpful_count',
        'source_ticket_id',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category()
    {
        return $this->belongsTo(TicketCategory::class, 'category_id');
    }
}
