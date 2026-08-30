<?php

namespace App\Services;

use App\Models\Anak;
use App\Models\TransaksiPoin;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LayananBonusMingguan
{
    public function __construct(private readonly LayananSnapshotPengaturan $snapshotPengaturan) {}

    public function proses(Anak $anak, ?CarbonImmutable $referensi = null, bool $strictBalance = false): void
    {
        $user = $anak->user->load('pengaturan');
        $timezone = $user->timezone ?: config('app.timezone');
        $referensi ??= CarbonImmutable::now($timezone);
        $akhirMingguTerakhir = $referensi->startOfWeek()->subDay()->endOfDay();
        $tanggalPertama = $anak->catatanBerangkat()
            ->whereDate('tanggal_berangkat', '<=', $akhirMingguTerakhir->toDateString())
            ->min('tanggal_berangkat');

        if (! $tanggalPertama) {
            return;
        }

        for ($awalMinggu = CarbonImmutable::parse($tanggalPertama, $timezone)->startOfWeek(); $awalMinggu->lessThanOrEqualTo($akhirMingguTerakhir->startOfWeek()); $awalMinggu = $awalMinggu->addWeek()) {
            $this->prosesMinggu($anak, $user, $awalMinggu, $strictBalance);
        }
    }

    private function prosesMinggu(Anak $anak, $user, CarbonImmutable $awalMinggu, bool $strictBalance): void
    {
        $akhirMinggu = $awalMinggu->endOfWeek();
        $konfigurasiBonus = $this->snapshotPengaturan->untukTanggal($user, $akhirMinggu);
        $weekKey = $awalMinggu->toDateString();
        $catatan = $anak->catatanBerangkat()
            ->whereBetween('tanggal_berangkat', [$weekKey, $akhirMinggu->toDateString()])
            ->get()
            ->keyBy(fn ($record): string => $record->tanggal_berangkat->toDateString());
        $pengecualian = $user->kalenderSekolah()
            ->whereBetween('date', [$weekKey, $akhirMinggu->toDateString()])
            ->pluck('date')
            ->map(fn ($date): string => (string) $date)
            ->all();
        $tepatWaktu = 0;

        foreach (range(0, 6) as $offset) {
            $tanggal = $awalMinggu->addDays($offset);
            $konfigurasiHari = $this->snapshotPengaturan->untukTanggal($user, $tanggal);
            $record = $catatan->get($tanggal->toDateString());

            if (\in_array($tanggal->dayOfWeekIso, $konfigurasiHari['school_days'], true)
                && ! \in_array($tanggal->toDateString(), $pengecualian, true)
                && $record
                && LayananPoin::sebelumAtauSama($record->jam_berangkat, $record->target_tepat_waktu_saat_dicatat)) {
                $tepatWaktu++;
            }
        }

        $bonusDiinginkan = $konfigurasiBonus['weekly_bonus_active'] && $tepatWaktu >= $konfigurasiBonus['weekly_bonus_days']
            ? $konfigurasiBonus['weekly_bonus_points']
            : 0;

        DB::transaction(function () use ($anak, $weekKey, $akhirMinggu, $konfigurasiBonus, $bonusDiinginkan, $strictBalance): void {
            $anak = Anak::query()->lockForUpdate()->findOrFail($anak->id);
            $bonusAwal = $anak->transaksiPoin()
                ->where('type', 'bonus_mingguan')
                ->whereDate('bonus_week_start', $weekKey)
                ->first();
            $penyesuaian = $anak->transaksiPoin()
                ->where('type', 'penyesuaian_bonus_mingguan')
                ->where('metadata_json->week_start', $weekKey)
                ->sum('amount');
            $bonusSaatIni = (int) ($bonusAwal?->amount ?? 0) + (int) $penyesuaian;
            $selisih = $bonusDiinginkan - $bonusSaatIni;

            if (! $bonusAwal && $bonusDiinginkan > 0) {
                TransaksiPoin::query()->create([
                    'anak_id' => $anak->id,
                    'type' => 'bonus_mingguan',
                    'amount' => $bonusDiinginkan,
                    'bonus_week_start' => $weekKey,
                    'description' => $konfigurasiBonus['weekly_bonus_name'],
                    'metadata_json' => ['week_start' => $weekKey, 'week_end' => $akhirMinggu->toDateString(), 'days' => $konfigurasiBonus['weekly_bonus_days']],
                    'created_at' => $akhirMinggu,
                ]);

                return;
            }

            if ($selisih === 0) {
                return;
            }

            if ($selisih < 0) {
                $saldo = (int) $anak->transaksiPoin()->lockForUpdate()->sum('amount');

                if ($saldo + $selisih < 0) {
                    if ($strictBalance) {
                        throw ValidationException::withMessages([
                            'jam_berangkat' => 'Catatan tidak dapat diubah karena pembatalan bonus akan membuat saldo poin menjadi negatif.',
                        ]);
                    }

                    return;
                }
            }

            TransaksiPoin::query()->create([
                'anak_id' => $anak->id,
                'type' => 'penyesuaian_bonus_mingguan',
                'amount' => $selisih,
                'description' => $selisih > 0 ? 'Pemulihan bonus mingguan' : 'Pembatalan bonus mingguan',
                'metadata_json' => ['week_start' => $weekKey, 'bonus_seharusnya' => $bonusDiinginkan],
            ]);
        });
    }
}
