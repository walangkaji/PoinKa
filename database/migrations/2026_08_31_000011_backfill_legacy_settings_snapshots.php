<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('snapshot_pengaturan')
            ->where(function ($query): void {
                $query->whereNull('on_time_target')->orWhereNull('point_rules');
            })
            ->orderBy('id')
            ->each(function (object $snapshot): void {
                $nextSnapshotDate = DB::table('snapshot_pengaturan')
                    ->where('user_id', $snapshot->user_id)
                    ->where('effective_date', '>', $snapshot->effective_date)
                    ->orderBy('effective_date')
                    ->value('effective_date');

                $recordQuery = DB::table('catatan_berangkat')
                    ->join('anak', 'anak.id', '=', 'catatan_berangkat.anak_id')
                    ->where('anak.user_id', $snapshot->user_id)
                    ->whereDate('catatan_berangkat.tanggal_berangkat', '>=', $snapshot->effective_date);

                if ($nextSnapshotDate) {
                    $recordQuery->whereDate('catatan_berangkat.tanggal_berangkat', '<', $nextSnapshotDate);
                }

                $record = $recordQuery
                    ->orderBy('catatan_berangkat.tanggal_berangkat')
                    ->orderBy('catatan_berangkat.id')
                    ->first([
                        'catatan_berangkat.target_tepat_waktu_saat_dicatat',
                        'catatan_berangkat.aturan_poin_snapshot',
                    ]);
                $pengaturan = DB::table('pengaturan')->where('user_id', $snapshot->user_id)->first();
                $rules = $record?->aturan_poin_snapshot ? json_decode($record->aturan_poin_snapshot, true) : null;

                if (! $rules) {
                    $rules = DB::table('aturan_poin')
                        ->where('user_id', $snapshot->user_id)
                        ->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('cutoff_time')
                        ->get(['cutoff_time', 'poin'])
                        ->map(fn (object $rule): array => [
                            'cutoff_time' => $rule->cutoff_time,
                            'points' => (int) $rule->poin,
                        ])
                        ->all();
                }

                DB::table('snapshot_pengaturan')
                    ->where('id', $snapshot->id)
                    ->update([
                        'on_time_target' => $record?->target_tepat_waktu_saat_dicatat ?: ($pengaturan?->on_time_target ?: '06:30:00'),
                        'point_rules' => json_encode($rules),
                        'updated_at' => now(),
                    ]);
            });
    }

    public function down(): void {}
};
