<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('penukaran_hadiah', function (Blueprint $table): void {
            $table->string('idempotency_key', 100)->nullable()->unique()->after('redeemed_at');
        });
    }

    public function down(): void
    {
        Schema::table('penukaran_hadiah', function (Blueprint $table): void {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn('idempotency_key');
        });
    }
};
