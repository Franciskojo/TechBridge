<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique();
            $table->enum('type', [
                'Incident', 'Service Request', 'Access Request', 
                'Bug Report', 'Feature Request', 'Data Correction', 
                'Security Concern', 'Problem Investigation', 'General Support Request'
            ])->default('General Support Request');
            
            $table->string('title');
            $table->text('description');
            
            $table->uuid('reporter_id');
            $table->uuid('assigned_technician_id')->nullable();
            $table->uuid('assigned_team_id')->nullable();
            $table->uuid('category_id')->nullable();
            $table->uuid('system_id')->nullable();
            
            $table->enum('impact', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            $table->enum('urgency', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            $table->enum('priority', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            
            $table->enum('status', [
                'New', 'Under Review', 'Assigned', 'In Progress', 
                'Waiting for Reporter', 'Waiting for Third Party', 
                'Resolved', 'Awaiting Confirmation', 'Closed', 'Escalated', 'Reopened'
            ])->default('New');
            
            $table->integer('affected_users_count')->default(1);
            $table->timestamp('issue_started_at')->nullable();
            $table->timestamp('first_response_due_at')->nullable();
            $table->timestamp('sla_due_at')->nullable();
            $table->timestamp('first_responded_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            $table->text('root_cause')->nullable();
            $table->text('resolution_summary')->nullable();
            $table->string('sync_id')->nullable()->index(); // Client IndexedDB sync correlation ID
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['status', 'priority']);
            $table->index('reporter_id');
            $table->index('assigned_technician_id');
        });

        Schema::create('ticket_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('user_id');
            $table->boolean('is_internal')->default(false); // false = Public comment, true = Private note
            $table->text('body');
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });

        Schema::create('ticket_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('comment_id')->nullable();
            $table->uuid('uploaded_by_id');
            $table->string('file_name');
            $table->string('file_path');
            $table->integer('file_size');
            $table->string('mime_type');
            $table->boolean('is_public')->default(true);
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });

        Schema::create('ticket_status_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id');
            $table->uuid('changed_by_id');
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });

        Schema::create('knowledge_articles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->uuid('category_id')->nullable();
            $table->uuid('author_id')->nullable();
            $table->text('body');
            $table->json('tags')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('published');
            $table->integer('views')->default(0);
            $table->integer('helpful_count')->default(0);
            $table->integer('unhelpful_count')->default(0);
            $table->uuid('source_ticket_id')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('actor_id')->nullable();
            $table->string('actor_name')->nullable();
            $table->string('action'); // e.g. TICKET_CREATED, TICKET_ESCALATED, LOGIN
            $table->string('resource_type');
            $table->string('resource_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('satisfaction_ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('ticket_id')->unique();
            $table->uuid('user_id');
            $table->integer('rating'); // 1 to 5 stars
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->foreign('ticket_id')->references('id')->on('tickets')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('satisfaction_ratings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('knowledge_articles');
        Schema::dropIfExists('ticket_status_histories');
        Schema::dropIfExists('ticket_attachments');
        Schema::dropIfExists('ticket_comments');
        Schema::dropIfExists('tickets');
    }
};
