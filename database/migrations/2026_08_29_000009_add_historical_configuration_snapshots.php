<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('catatan_berangkat', function (Blueprint $table): void {
            $table->json('aturan_poin_snapshot')->nullable()->after('target_tepat_waktu_saat_dicatat');
        });

        Schema::create('snapshot_pengaturan', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('effective_date');
            $table->json('school_days');
            $table->boolean('weekly_bonus_active');
            $table->string('weekly_bonus_name');
            $table->unsignedInteger('weekly_bonus_days');
            $table->unsignedInteger('weekly_bonus_points');
            $table->timestamps();

            $table->unique(['user_id', 'effective_date']);
            $table->index(['user_id', 'effective_date']);
        });

        $now = now();
        DB::table('pengaturan')->orderBy('user_id')->each(function (object $pengaturan) use ($now): void {
            $earliestRecordDate = DB::table('catatan_berangkat')
                ->join('anak', 'anak.id', '=', 'catatan_berangkat.anak_id')
                ->where('anak.user_id', $pengaturan->user_id)
                ->min('catatan_berangkat.tanggal_berangkat');
            $effectiveDate = $earliestRecordDate ?: $now->toDateString();

            DB::table('snapshot_pengaturan')->insert([
                'user_id'             => $pengaturan->user_id,
                'effective_date'      => $effectiveDate,
                'school_days'         => $pengaturan->school_days,
                'weekly_bonus_active' => $pengaturan->weekly_bonus_active,
                'weekly_bonus_name'   => $pengaturan->weekly_bonus_name,
                'weekly_bonus_days'   => $pengaturan->weekly_bonus_days,
                'weekly_bonus_points' => $pengaturan->weekly_bonus_points,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            $rules = DB::table('aturan_poin')
                ->where('user_id', $pengaturan->user_id)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('cutoff_time')
                ->get(['cutoff_time', 'poin'])
                ->map(fn (object $rule): array => ['cutoff_time' => $rule->cutoff_time, 'points' => (int) $rule->poin])
                ->all();

            if ([] !== $rules) {
                DB::table('catatan_berangkat')
                    ->join('anak', 'anak.id', '=', 'catatan_berangkat.anak_id')
                    ->where('anak.user_id', $pengaturan->user_id)
                    ->update(['aturan_poin_snapshot' => json_encode($rules)]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('snapshot_pengaturan');

        Schema::table('catatan_berangkat', function (Blueprint $table): void {
            $table->dropColumn('aturan_poin_snapshot');
        });
    }
};
