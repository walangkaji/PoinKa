<?php

namespace App\Http\Controllers;

use App\Actions\CatatWaktuBerangkat;
use App\Models\User;
use App\Services\LayananBonusMingguan;
use App\Services\LayananPoin;
use App\Services\LayananSnapshotPengaturan;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatistikController extends Controller
{
    public function index(Request $request, CatatWaktuBerangkat $catat, LayananBonusMingguan $bonus, LayananSnapshotPengaturan $snapshotPengaturan): Response|RedirectResponse
    {
        $user = $request->user()->load(['anak', 'pengaturan']);

        if (! $user->anak) {
            return redirect()->route('onboarding');
        }

        $bonus->proses($user->anak);

        $now = CarbonImmutable::now($user->timezone ?: config('app.timezone'));
        $current = $this->weekData($user, $now->startOfWeek(), $now, $snapshotPengaturan);
        $previous = $this->weekData($user, $now->startOfWeek()->subWeek(), $now->startOfWeek()->subSecond(), $snapshotPengaturan);

        return Inertia::render('Statistik', [
            'summary' => [
                ...$current['summary'],
                'streak' => $catat->hitungStreak($user->anak),
            ],
            'previousSummary' => $previous['summary'],
            'chart' => $current['chart'],
            'records' => $current['records'],
        ]);
    }

    /**
     * @return array{summary: array<string, mixed>, chart: array<int, array<string, mixed>>, records: array<int, array<string, mixed>>}
     */
    private function weekData(User $user, CarbonImmutable $start, CarbonImmutable $reference, LayananSnapshotPengaturan $snapshotPengaturan): array
    {
        $end = $start->endOfWeek();
        $target = $user->pengaturan?->on_time_target ?: '06:30:00';
        $records = $user->anak->catatanBerangkat()
            ->whereBetween('tanggal_berangkat', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->keyBy(fn ($record): string => $record->tanggal_berangkat->toDateString());
        $calendarDates = $user->kalenderSekolah()
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->pluck('date')
            ->map(fn ($date): string => (string) $date)
            ->all();
        $validDates = collect(range(0, 6))
            ->map(fn (int $offset): CarbonImmutable => $start->addDays($offset))
            ->filter(fn (CarbonImmutable $date): bool => \in_array($date->dayOfWeekIso, $snapshotPengaturan->untukTanggal($user, $date)['school_days'], true))
            ->reject(fn (CarbonImmutable $date): bool => \in_array($date->toDateString(), $calendarDates, true))
            ->filter(fn (CarbonImmutable $date): bool => $date->lessThanOrEqualTo($reference))
            ->values();
        $validDateKeys = $validDates->map(fn (CarbonImmutable $date): string => $date->toDateString())->all();
        $validRecords = $records->filter(fn ($record): bool => \in_array($record->tanggal_berangkat->toDateString(), $validDateKeys, true))->values();
        $onTimeCount = $validRecords->filter(fn ($record): bool => LayananPoin::sebelumAtauSama($record->jam_berangkat, $record->target_tepat_waktu_saat_dicatat ?: $target))->count();
        $averageMinutes = $validRecords->isEmpty() ? null : (int) round($validRecords->avg(function ($record): int {
            [$hour, $minute] = array_map('intval', explode(':', substr($record->jam_berangkat, 0, 5)));

            return ($hour * 60) + $minute;
        }));

        return [
            'summary' => [
                'onTimeCount' => $onTimeCount,
                'schoolDayCount' => $validDates->count(),
                'onTimePercentage' => $validDates->count() ? (int) round(($onTimeCount / $validDates->count()) * 100) : 0,
                'points' => (int) $validRecords->sum('poin_didapat'),
                'averageTime' => $averageMinutes === null ? null : \sprintf('%02d:%02d', intdiv($averageMinutes, 60), $averageMinutes % 60),
            ],
            'chart' => collect(range(0, 6))->map(function (int $offset) use ($user, $start, $reference, $calendarDates, $records, $target, $snapshotPengaturan): array {
                $date = $start->addDays($offset);
                $key = $date->toDateString();
                $isSchoolDay = \in_array($date->dayOfWeekIso, $snapshotPengaturan->untukTanggal($user, $date)['school_days'], true)
                    && ! \in_array($key, $calendarDates, true)
                    && $date->lessThanOrEqualTo($reference);
                $record = $isSchoolDay ? $records->get($key) : null;

                return [
                    'label' => $date->locale('id')->translatedFormat('D'),
                    'date' => $date->locale('id')->translatedFormat('d F'),
                    'points' => $record?->poin_didapat ?? 0,
                    'onTime' => $record ? LayananPoin::sebelumAtauSama($record->jam_berangkat, $record->target_tepat_waktu_saat_dicatat ?: $target) : null,
                    'hasRecord' => (bool) $record,
                    'isSchoolDay' => $isSchoolDay,
                ];
            })->values()->all(),
            'records' => $validRecords->sortBy('tanggal_berangkat')->map(fn ($record): array => [
                'date' => $record->tanggal_berangkat->locale('id')->translatedFormat('l, d F Y'),
                'time' => substr($record->jam_berangkat, 0, 5),
                'points' => $record->poin_didapat,
                'onTime' => LayananPoin::sebelumAtauSama($record->jam_berangkat, $record->target_tepat_waktu_saat_dicatat ?: $target),
            ])->values()->all(),
        ];
    }
}
