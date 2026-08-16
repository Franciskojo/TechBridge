<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration 5: Add foreign key constraints and Sanctum personal_access_tokens.
 * 
 * Separated from table creation migrations to handle circular dependencies
 * (e.g. departments.lead_id → users.id and users.department_id → departments.id).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Create Sanctum personal access tokens table
        // Uses uuidMorphs because User primary keys are UUIDs (char 36), not integers
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Create password reset tokens table
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Create sessions table (for Sanctum stateful auth)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Create cache table (for rate limiting, KB vote deduplication)
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        // ── Foreign Key Constraints ────────────────────────────────────────
        
        // departments.lead_id → users.id (nullable, deferred via separate migration)
        Schema::table('departments', function (Blueprint $table) {
            $table->foreign('lead_id')->references('id')->on('users')->nullOnDelete();
        });

        // teams.lead_id → users.id
        Schema::table('teams', function (Blueprint $table) {
            $table->foreign('lead_id')->references('id')->on('users')->nullOnDelete();
        });

        // users → departments, teams
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            $table->foreign('team_id')->references('id')->on('teams')->nullOnDelete();
        });

        // systems.owner_team_id → teams.id
        Schema::table('systems', function (Blueprint $table) {
            $table->foreign('owner_team_id')->references('id')->on('teams')->nullOnDelete();
        });

        // tickets → users, teams, categories, systems
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreign('reporter_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('assigned_technician_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('assigned_team_id')->references('id')->on('teams')->nullOnDelete();
            $table->foreign('category_id')->references('id')->on('ticket_categories')->nullOnDelete();
            $table->foreign('system_id')->references('id')->on('systems')->nullOnDelete();
        });

        // ticket_comments.user_id → users.id
        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // ticket_attachments → users
        Schema::table('ticket_attachments', function (Blueprint $table) {
            $table->foreign('uploaded_by_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('comment_id')->references('id')->on('ticket_comments')->nullOnDelete();
        });

        // ticket_status_histories.changed_by_id → users.id
        Schema::table('ticket_status_histories', function (Blueprint $table) {
            $table->foreign('changed_by_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // knowledge_articles → categories, users, tickets
        Schema::table('knowledge_articles', function (Blueprint $table) {
            $table->foreign('category_id')->references('id')->on('ticket_categories')->nullOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('source_ticket_id')->references('id')->on('tickets')->nullOnDelete();
        });

        // satisfaction_ratings.user_id → users.id
        Schema::table('satisfaction_ratings', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // audit_logs.actor_id → users.id (nullable for system actions)
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Drop foreign keys in reverse order
        $tables = [
            'audit_logs' => ['actor_id'],
            'satisfaction_ratings' => ['user_id'],
            'knowledge_articles' => ['category_id', 'author_id', 'source_ticket_id'],
            'ticket_status_histories' => ['changed_by_id'],
            'ticket_attachments' => ['uploaded_by_id', 'comment_id'],
            'ticket_comments' => ['user_id'],
            'tickets' => ['reporter_id', 'assigned_technician_id', 'assigned_team_id', 'category_id', 'system_id'],
            'systems' => ['owner_team_id'],
            'users' => ['department_id', 'team_id'],
            'teams' => ['lead_id'],
            'departments' => ['lead_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns, $table) {
                    foreach ($columns as $col) {
                        $blueprint->dropForeign("{$table}_{$col}_foreign");
                    }
                });
            }
        }

        Schema::dropIfExists('cache_locks');
        Schema::dropIfExists('cache');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('personal_access_tokens');
    }
};
