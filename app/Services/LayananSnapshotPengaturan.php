<?php

namespace App\Services;

use App\Models\Pengaturan;
use App\Models\SnapshotPengaturan;
use App\Models\User;
use Carbon\CarbonImmutable;

class LayananSnapshotPengaturan
{
    /**
     * @return array{on_time_target: string, point_rules: array<int, array{cutoff_time: string, points: int}>, school_days: array<int, int>, weekly_bonus_active: bool, weekly_bonus_name: string, weekly_bonus_days: int, weekly_bonus_points: int}
     */
    public function untukTanggal(User $user, CarbonImmutable $date): array
    {
        $snapshot = $user->snapshotPengaturan()
            ->whereDate('effective_date', '<=', $date->toDateString())
            ->latest('effective_date')
            ->first();

        return $this->data($snapshot ?: $user->pengaturan) + [
            'point_rules' => $snapshot?->point_rules ?? $this->aturanPoin($user),
        ];
    }

    public function simpan(User $user, CarbonImmutable $effectiveDate, bool $replace = false): void
    {
        $pengaturan = $user->pengaturan()->first();
        $attributes = ['user_id' => $user->id, 'effective_date' => $effectiveDate->toDateString()];
        $values = $this->data($pengaturan) + ['point_rules' => $this->aturanPoin($user)];
        $snapshot = SnapshotPengaturan::query()
            ->where('user_id', $user->id)
            ->whereDate('effective_date', $effectiveDate->toDateString())
            ->first();

        if ($snapshot && $replace) {
            $snapshot->update($values);

            return;
        }

        if (! $snapshot) {
            SnapshotPengaturan::query()->create($attributes + $values);
        }
    }

    /**
     * @return array{on_time_target: string, school_days: array<int, int>, weekly_bonus_active: bool, weekly_bonus_name: string, weekly_bonus_days: int, weekly_bonus_points: int}
     */
    private function data(Pengaturan|SnapshotPengaturan|null $pengaturan): array
    {
        return [
            'on_time_target' => (string) ($pengaturan?->on_time_target ?: '06:30:00'),
            'school_days' => array_values(array_map('intval', $pengaturan?->school_days ?: [1, 2, 3, 4, 5])),
            'weekly_bonus_active' => (bool) ($pengaturan?->weekly_bonus_active ?? true),
            'weekly_bonus_name' => (string) ($pengaturan?->weekly_bonus_name ?: 'Bonus konsisten'),
            'weekly_bonus_days' => (int) ($pengaturan?->weekly_bonus_days ?: 5),
            'weekly_bonus_points' => (int) ($pengaturan?->weekly_bonus_points ?: 5),
        ];
    }

    /**
     * @return array<int, array{cutoff_time: string, points: int}>
     */
    private function aturanPoin(User $user): array
    {
        return $user->aturanPoin()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('cutoff_time')
            ->get()
            ->map(fn ($aturan): array => [
                'cutoff_time' => (string) $aturan->cutoff_time,
                'points' => (int) $aturan->poin,
            ])
            ->values()
            ->all();
    }
}
