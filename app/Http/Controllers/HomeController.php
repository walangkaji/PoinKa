<?php

namespace App\Http\Controllers;

use App\Actions\CatatWaktuBerangkat;
use App\Services\LayananBonusMingguan;
use App\Services\LayananPoin;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request, CatatWaktuBerangkat $catat, LayananBonusMingguan $bonus): Response|RedirectResponse
    {
        $user = $request->user()->load(['anak', 'pengaturan']);

        if (! $user->anak) {
            return redirect()->route('onboarding');
        }

        $anak     = $user->anak;
        $timezone = $user->timezone ?: config('app.timezone');
        $now      = CarbonImmutable::now($timezone);
        $bonus->proses($anak, $now);
        $target        = $user->pengaturan?->on_time_target ?: '06:30:00';
        $todayRecord   = $anak->catatanBerangkat()->whereDate('tanggal_berangkat', $now->toDateString())->first();
        $todayCalendar = $user->kalenderSekolah()->whereDate('date', $now->toDateString())->exists();
        $weekStart     = $now->startOfWeek();
        $weekEnd       = $now->endOfWeek();
        $records       = $anak->catatanBerangkat()->whereBetween('tanggal_berangkat', [$weekStart->toDateString(), $weekEnd->toDateString()])->get()->keyBy(fn ($record) => $record->tanggal_berangkat->toDateString());
        $schoolDays    = $user->pengaturan?->school_days ?: [1, 2, 3, 4, 5];

        $calendarDates = $user->kalenderSekolah()
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->pluck('date')
            ->map(fn ($date): string => (string) $date)
            ->all();

        $week = collect($schoolDays)->map(function (int $day) use ($weekStart, $now, $records, $target, $calendarDates): array {
            $date         = $weekStart->addDays($day - 1);
            $record       = $records->get($date->toDateString());
            $isToday      = $date->isSameDay($now);
            $isException  = \in_array($date->toDateString(), $calendarDates, true);
            $recordTarget = $record?->target_tepat_waktu_saat_dicatat ?: $target;

            return [
                'day'    => $date->locale('id')->translatedFormat('l'),
                'date'   => $date->format('d'),
                'time'   => $record?->jam_berangkat ? substr($record->jam_berangkat, 0, 5) : null,
                'points' => $record?->poin_didapat,
                'state'  => $isException ? 'exception' : ($isToday ? 'today' : ($date->isFuture() ? 'upcoming' : 'past')),
                'onTime' => $record ? LayananPoin::sebelumAtauSama($record->jam_berangkat, $recordTarget) : null,
            ];
        })->values()->all();

        $reward = $user->hadiah()->where('is_target', true)->where('is_active', true)->first();

        $pointRules = $user->aturanPoin()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('cutoff_time')
            ->get()
            ->map(fn ($rule): array => [
                'cutoffTime' => substr($rule->cutoff_time, 0, 5),
                'points'     => $rule->poin,
            ])
            ->values();

        if ($pointRules->isEmpty()) {
            $targetTime = substr($target, 0, 5);
            $pointRules = collect([
                ['cutoffTime' => '06:15', 'points' => 3],
                ['cutoffTime' => '06:20', 'points' => 2],
                ['cutoffTime' => $targetTime, 'points' => 1],
            ]);
        }

        return Inertia::render('Home', [
            'child'         => ['name' => $anak->name],
            'today'         => $now->locale('id')->translatedFormat('l, d F Y'),
            'currentTime'   => $now->format('H:i'),
            'targetTime'    => substr($target, 0, 5),
            'pointRules'    => $pointRules->all(),
            'balance'       => $catat->saldo($anak),
            'currentStreak' => $catat->hitungStreak($anak, $target),
            'todayRecord'   => $todayRecord ? [
                'time'   => substr($todayRecord->jam_berangkat, 0, 5),
                'points' => $todayRecord->poin_didapat,
                'source' => $todayRecord->sumber,
            ] : null,
            'canRecord' => ! $todayCalendar && \in_array($now->dayOfWeekIso, $schoolDays, true),
            'reward'    => $reward ? [
                'name'     => $reward->name,
                'imageUrl' => $reward->image ? '/storage/' . ltrim($reward->image, '/') : null,
                'current'  => $catat->saldo($anak),
                'cost'     => $reward->poin_cost,
            ] : null,
            'week' => $week,
        ]);
    }

    public function record(Request $request, CatatWaktuBerangkat $catat): RedirectResponse
    {
        $anak = $request->user()->anak;

        abort_unless($anak, 404);

        $result = $catat->handle($anak);

        return back()->with('record_result', [
            'status'  => $result['status'],
            'time'    => $result['record'] ? substr($result['record']->jam_berangkat, 0, 5) : null,
            'points'  => (int) $result['points'],
            'balance' => (int) $result['balance'],
        ]);
    }
}
