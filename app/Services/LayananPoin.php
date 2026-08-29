<?php

namespace App\Services;

use App\Models\AturanPoin;
use Illuminate\Support\Collection;

class LayananPoin
{
    public static function sebelumAtauSama(string $waktu, string $batas): bool
    {
        return substr($waktu, 0, 5) <= substr($batas, 0, 5);
    }

    public function hitung(string $jamBerangkat, Collection $aturan): int
    {
        foreach ($aturan as $tingkatan) {
            if (self::sebelumAtauSama($jamBerangkat, (string) $tingkatan->cutoff_time)) {
                return (int) $tingkatan->poin;
            }
        }

        return 0;
    }

    /**
     * @return array<int, array{cutoff_time: string, points: int}>
     */
    public function snapshot(Collection $aturan): array
    {
        return $aturan->map(fn (AturanPoin $aturan): array => [
            'cutoff_time' => (string) $aturan->cutoff_time,
            'points'      => (int) $aturan->poin,
        ])->values()->all();
    }

    /**
     * @param array<int, array{cutoff_time: string, points: int}> $snapshot
     */
    public function hitungDariSnapshot(string $jamBerangkat, array $snapshot): int
    {
        foreach ($snapshot as $aturan) {
            if (self::sebelumAtauSama($jamBerangkat, $aturan['cutoff_time'])) {
                return $aturan['points'];
            }
        }

        return 0;
    }

    public function ambilAturanAktif(int $userId): Collection
    {
        return AturanPoin::query()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('cutoff_time')
            ->get();
    }
}
