<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transaksi_poin', function (Blueprint $table): void {
            $table->date('bonus_week_start')->nullable()->after('metadata_json');
            $table->unique(['anak_id', 'type', 'bonus_week_start'], 'transaksi_bonus_week_unique');
        });
    }

    public function down(): void
    {
        Schema::table('transaksi_poin', function (Blueprint $table): void {
            $table->dropUnique('transaksi_bonus_week_unique');
            $table->dropColumn('bonus_week_start');
        });
    }
};
