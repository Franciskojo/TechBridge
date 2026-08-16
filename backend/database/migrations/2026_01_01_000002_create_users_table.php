<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['Employee', 'Technician', 'TeamLead', 'Admin'])->default('Employee');
            $table->uuid('department_id')->nullable();
            $table->uuid('team_id')->nullable();
            $table->string('job_title')->nullable();
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
            $table->json('push_subscription')->nullable();
            $table->string('status')->default('active');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
