<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('penukaran_hadiah', function (Blueprint $table): void {
            $table->string('status', 20)->default('active')->after('idempotency_key');
            $table->timestamp('cancelled_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('penukaran_hadiah', function (Blueprint $table): void {
            $table->dropColumn(['status', 'cancelled_at']);
        });
    }
};
