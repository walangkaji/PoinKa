<?php

namespace App\Actions;

use App\Models\Anak;
use App\Models\CatatanBerangkat;
use App\Models\TransaksiPoin;
use App\Services\LayananPoin;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class CatatWaktuBerangkat
{
    public function __construct(private readonly LayananPoin $layananPoin)
    {
    }

    /**
     * @return array{status: string, record: CatatanBerangkat, points: int, balance: int, streak: int}
     */
    public function handle(Anak $anak): array
    {
        return DB::transaction(function () use ($anak): array {
            $anak     = Anak::query()->with(['user.pengaturan'])->lockForUpdate()->findOrFail($anak->id);
            $user     = $anak->user;
            $timezone = $user->timezone ?: config('app.timezone');
            $now      = CarbonImmutable::now($timezone);
            $tanggal  = $now->toDateString();

            $existing = $anak->catatanBerangkat()
                ->whereDate('tanggal_berangkat', $tanggal)
                ->first();

            if ($existing) {
                return $this->hasil($existing, 'already_recorded', $anak);
            }

            $pengaturan  = $user->pengaturan;
            $hariIni     = $now->dayOfWeekIso;
            $hariSekolah = $pengaturan?->school_days ?: [1, 2, 3, 4, 5];
            $kalender    = $user->kalenderSekolah()->whereDate('date', $tanggal)->first();

            if ($kalender || ! \in_array($hariIni, $hariSekolah, true)) {
                return [
                    'status'  => 'not_school_day',
                    'record'  => $existing,
                    'points'  => 0,
                    'balance' => $this->saldo($anak),
                    'streak'  => $this->hitungStreak($anak, $pengaturan?->on_time_target ?: '06:30:00'),
                ];
            }

            $jam            = $now->format('H:i:s');
            $target         = $pengaturan?->on_time_target ?: '06:30:00';
            $aturan         = $this->layananPoin->ambilAturanAktif($user->id);
            $poin           = $this->layananPoin->hitung($jam, $aturan);
            $aturanSnapshot = $this->layananPoin->snapshot($aturan);

            $record = $anak->catatanBerangkat()->create([
                'tanggal_berangkat'               => $tanggal,
                'jam_berangkat'                   => $jam,
                'sumber'                          => 'langsung',
                'target_tepat_waktu_saat_dicatat' => $target,
                'aturan_poin_snapshot'            => $aturanSnapshot,
                'poin_didapat'                    => $poin,
            ]);

            TransaksiPoin::query()->create([
                'anak_id'        => $anak->id,
                'type'           => 'poin_waktu_berangkat',
                'amount'         => $poin,
                'reference_type' => CatatanBerangkat::class,
                'reference_id'   => $record->id,
                'description'    => 'Poin waktu berangkat',
                'metadata_json'  => ['sumber' => 'langsung', 'target' => $target, 'aturan_poin' => $aturanSnapshot],
            ]);

            return $this->hasil($record, 'recorded', $anak->fresh());
        });
    }

    public function saldo(Anak $anak): int
    {
        return (int) $anak->transaksiPoin()->sum('amount');
    }

    public function hitungStreak(Anak $anak, string $target): int
    {
        $timezone    = $anak->user->timezone ?: config('app.timezone');
        $tanggal     = CarbonImmutable::now($timezone)->startOfDay();
        $hariIni     = $tanggal;
        $hariSekolah = $anak->user->pengaturan?->school_days ?: [1, 2, 3, 4, 5];
        $streak      = 0;

        while (true) {
            $adaPengecualian = $anak->user->kalenderSekolah()->whereDate('date', $tanggal->toDateString())->exists();

            if ($adaPengecualian || ! \in_array($tanggal->dayOfWeekIso, $hariSekolah, true)) {
                $tanggal = $tanggal->subDay();

                continue;
            }

            $record = $anak->catatanBerangkat()
                ->whereDate('tanggal_berangkat', $tanggal->toDateString())
                ->first();

            if (! $record && $tanggal->isSameDay($hariIni)) {
                $tanggal = $tanggal->subDay();

                continue;
            }

            $recordTarget = $record?->target_tepat_waktu_saat_dicatat ?: $target;

            if (! $record || ! LayananPoin::sebelumAtauSama($record->jam_berangkat, $recordTarget)) {
                break;
            }

            ++$streak;
            $tanggal = $tanggal->subDay();
        }

        return $streak;
    }

    /**
     * @return array{status: string, record: CatatanBerangkat, points: int, balance: int, streak: int}
     */
    private function hasil(CatatanBerangkat $record, string $status, Anak $anak): array
    {
        return [
            'status'  => $status,
            'record'  => $record,
            'points'  => (int) $record->poin_didapat,
            'balance' => $this->saldo($anak),
            'streak'  => $this->hitungStreak($anak, $record->target_tepat_waktu_saat_dicatat),
        ];
    }
}
