<?php

namespace App\Services;

use App\Models\Pengaturan;
use App\Models\SnapshotPengaturan;
use App\Models\User;
use Carbon\CarbonImmutable;

class LayananSnapshotPengaturan
{
    /**
     * @return array{school_days: array<int, int>, weekly_bonus_active: bool, weekly_bonus_name: string, weekly_bonus_days: int, weekly_bonus_points: int}
     */
    public function untukTanggal(User $user, CarbonImmutable $date): array
    {
        $snapshot = $user->snapshotPengaturan()
            ->whereDate('effective_date', '<=', $date->toDateString())
            ->latest('effective_date')
            ->first();

        return $this->data($snapshot ?: $user->pengaturan);
    }

    public function simpan(User $user, CarbonImmutable $effectiveDate): void
    {
        $pengaturan = $user->pengaturan;

        SnapshotPengaturan::query()->updateOrCreate(
            ['user_id' => $user->id, 'effective_date' => $effectiveDate->toDateString()],
            $this->data($pengaturan),
        );
    }

    /**
     * @return array{school_days: array<int, int>, weekly_bonus_active: bool, weekly_bonus_name: string, weekly_bonus_days: int, weekly_bonus_points: int}
     */
    private function data(Pengaturan|SnapshotPengaturan|null $pengaturan): array
    {
        return [
            'school_days'         => array_values(array_map('intval', $pengaturan?->school_days ?: [1, 2, 3, 4, 5])),
            'weekly_bonus_active' => (bool) ($pengaturan?->weekly_bonus_active ?? true),
            'weekly_bonus_name'   => (string) ($pengaturan?->weekly_bonus_name ?: 'Bonus konsisten'),
            'weekly_bonus_days'   => (int) ($pengaturan?->weekly_bonus_days ?: 5),
            'weekly_bonus_points' => (int) ($pengaturan?->weekly_bonus_points ?: 5),
        ];
    }
}
