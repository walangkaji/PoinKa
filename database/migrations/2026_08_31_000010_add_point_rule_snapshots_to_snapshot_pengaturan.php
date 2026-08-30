<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('snapshot_pengaturan', function (Blueprint $table): void {
            $table->time('on_time_target')->nullable()->after('effective_date');
            $table->json('point_rules')->nullable()->after('on_time_target');
        });
    }

    public function down(): void
    {
        Schema::table('snapshot_pengaturan', function (Blueprint $table): void {
            $table->dropColumn(['on_time_target', 'point_rules']);
        });
    }
};
