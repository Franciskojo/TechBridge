<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the ticket_sequences table used to generate collision-safe ticket
 * numbers via an atomic SELECT ... FOR UPDATE counter rather than a COUNT(*)+1
 * approach (which can produce duplicates under concurrent load).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_sequences', function (Blueprint $table) {
            $table->smallInteger('year')->primary();  // e.g. 2026
            $table->unsignedBigInteger('last_value')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_sequences');
    }
};
