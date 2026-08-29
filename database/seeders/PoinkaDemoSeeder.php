<?php

namespace Database\Seeders;

use App\Models\Anak;
use App\Models\AturanPoin;
use App\Models\CatatanBerangkat;
use App\Models\Hadiah;
use App\Models\Pengaturan;
use App\Models\TransaksiPoin;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PoinkaDemoSeeder extends Seeder
{
    public function run(): void
    {
        $timezone = 'Asia/Jakarta';
        $now      = CarbonImmutable::now($timezone);

        DB::transaction(function () use ($now, $timezone): void {
            $user = User::query()->firstOrCreate(
                ['email' => 'aji@globaltesla.com'],
                [
                    'name'     => 'Aji',
                    'password' => Hash::make('bismillah'),
                    'timezone' => $timezone,
                ],
            );

            $anak = Anak::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['name' => 'Arshaka Aji Cakra', 'is_active' => true],
            );

            $pengaturan = Pengaturan::query()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'on_time_target'      => '06:30:00',
                    'school_days'         => [1, 2, 3, 4, 5],
                    'weekly_bonus_active' => true,
                    'weekly_bonus_name'   => 'Bonus konsisten',
                    'weekly_bonus_days'   => 5,
                    'weekly_bonus_points' => 5,
                ],
            );

            $aturan = [
                ['cutoff_time' => '06:15:00', 'poin' => 3, 'sort_order' => 1],
                ['cutoff_time' => '06:20:00', 'poin' => 2, 'sort_order' => 2],
                ['cutoff_time' => '06:30:00', 'poin' => 1, 'sort_order' => 3],
            ];

            foreach ($aturan as $rule) {
                AturanPoin::query()->firstOrCreate(
                    ['user_id' => $user->id, 'cutoff_time' => $rule['cutoff_time']],
                    $rule + ['is_active' => true],
                );
            }

            $this->seedRewards($user);

            $start      = $now->subMonth()->startOfDay();
            $end        = $now->subDay()->endOfDay();
            $schoolDays = collect($pengaturan->school_days ?: [1, 2, 3, 4, 5])->map(fn ($day): int => (int) $day);
            $records    = collect();
            $dayIndex   = 0;

            for ($date = $start; $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
                if (! $schoolDays->contains($date->dayOfWeekIso)) {
                    continue;
                }

                $time = match ($dayIndex % 5) {
                    0       => '06:12:00',
                    1       => '06:18:00',
                    2       => '06:27:00',
                    3       => '06:15:00',
                    default => '06:35:00',
                };
                $points = match (true) {
                    $time <= '06:15:00' => 3,
                    $time <= '06:20:00' => 2,
                    $time <= '06:30:00' => 1,
                    default             => 0,
                };
                $createdAt = $date->setTimeFromTimeString($time);

                $record = CatatanBerangkat::query()
                    ->where('anak_id', $anak->id)
                    ->whereDate('tanggal_berangkat', $date->toDateString())
                    ->first();

                if (! $record) {
                    $record = CatatanBerangkat::query()->create([
                        'anak_id'                         => $anak->id,
                        'tanggal_berangkat'               => $date->toDateString(),
                        'jam_berangkat'                   => $time,
                        'sumber'                          => 'manual',
                        'note'                            => 'Data contoh untuk riwayat poin',
                        'target_tepat_waktu_saat_dicatat' => '06:30:00',
                        'poin_didapat'                    => $points,
                        'created_at'                      => $createdAt,
                        'updated_at'                      => $createdAt,
                    ]);
                }

                TransaksiPoin::query()->firstOrCreate(
                    [
                        'anak_id'        => $anak->id,
                        'type'           => 'poin_waktu_berangkat',
                        'reference_type' => CatatanBerangkat::class,
                        'reference_id'   => $record->id,
                    ],
                    [
                        'amount'        => $record->poin_didapat,
                        'description'   => 'Poin waktu berangkat manual',
                        'metadata_json' => [
                            'sumber' => 'manual',
                            'target' => $record->target_tepat_waktu_saat_dicatat,
                        ],
                        'created_at' => $createdAt,
                    ],
                );

                $records->push($record);
                ++$dayIndex;
            }

            $this->seedWeeklyBonuses($anak, $records, $start, $end, $pengaturan);
        });
    }

    private function seedRewards(User $user): void
    {
        $rewards = [
            ['name' => 'nonton bioskop', 'description' => 'Waktu santai untuk menonton film pilihan.', 'poin_cost' => 10],
            ['name' => 'Es krim favorit', 'description' => 'Pilih rasa es krim favoritmu.', 'poin_cost' => 25],
            ['name' => 'Mainan kecil', 'description' => 'Hadiah kecil untuk usaha yang konsisten.', 'poin_cost' => 50],
            ['name' => 'tablet', 'description' => 'Tablet untuk belajar dan hiburan.', 'poin_cost' => 100],
            ['name' => 'Sepeda', 'description' => 'Sepeda baru untuk bergerak lebih aktif.', 'poin_cost' => 300],
        ];

        foreach ($rewards as $reward) {
            Hadiah::query()->updateOrCreate(
                ['user_id' => $user->id, 'name' => Str::title($reward['name'])],
                $reward + ['is_active' => true],
            );
        }
    }

    private function seedWeeklyBonuses(Anak $anak, $records, CarbonImmutable $start, CarbonImmutable $end, Pengaturan $pengaturan): void
    {
        $schoolDays           = collect($pengaturan->school_days ?: [1, 2, 3, 4, 5])->map(fn ($day): int => (int) $day);
        $weekStart            = $start->startOfWeek();
        $lastCompletedWeekEnd = $end->isSunday() ? $end->endOfDay() : $end->startOfWeek()->subDay()->endOfDay();
        $lastWeekStart        = $lastCompletedWeekEnd->startOfWeek();

        for ($week = $weekStart; $week->lessThanOrEqualTo($lastWeekStart); $week = $week->addWeek()) {
            $weekEnd     = $week->endOfWeek();
            $weekRecords = $records->filter(
                fn (CatatanBerangkat $record): bool => $record->tanggal_berangkat->between($week, $weekEnd)
                && $schoolDays->contains($record->tanggal_berangkat->dayOfWeekIso)
            );
            $onTimeCount = $weekRecords->filter(
                fn (CatatanBerangkat $record): bool => $record->jam_berangkat <= $record->target_tepat_waktu_saat_dicatat
            )->count();

            if ($onTimeCount < (int) $pengaturan->weekly_bonus_days) {
                continue;
            }

            $weekKey = $week->toDateString();
            $exists  = $anak->transaksiPoin()
                ->where('type', 'bonus_mingguan')
                ->where('metadata_json->week_start', $weekKey)
                ->exists();

            if ($exists) {
                continue;
            }

            TransaksiPoin::query()->create([
                'anak_id'          => $anak->id,
                'type'             => 'bonus_mingguan',
                'amount'           => $pengaturan->weekly_bonus_points,
                'bonus_week_start' => $weekKey,
                'description'      => $pengaturan->weekly_bonus_name,
                'metadata_json'    => [
                    'week_start' => $weekKey,
                    'week_end'   => $weekEnd->toDateString(),
                    'days'       => $pengaturan->weekly_bonus_days,
                ],
                'created_at' => $weekEnd->endOfDay(),
            ]);
        }
    }
}
