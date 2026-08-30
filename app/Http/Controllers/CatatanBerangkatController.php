<?php

namespace App\Http\Controllers;

use App\Models\Anak;
use App\Models\CatatanBerangkat;
use App\Models\TransaksiPoin;
use App\Services\LayananBonusMingguan;
use App\Services\LayananPoin;
use App\Services\LayananSnapshotPengaturan;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CatatanBerangkatController extends Controller
{
    public function index(Request $request, LayananBonusMingguan $bonus, LayananSnapshotPengaturan $snapshotPengaturan): Response|RedirectResponse
    {
        $anak = $request->user()->anak;

        if (! $anak) {
            return redirect()->route('onboarding');
        }

        $bonus->proses($anak);
        $user = $request->user();
        $timezone = $user->timezone ?: config('app.timezone');

        $records = $anak->catatanBerangkat()
            ->latest('tanggal_berangkat')
            ->latest('jam_berangkat')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Catatan', [
            'records' => $records->getCollection()->map(fn (CatatanBerangkat $record): array => [
                'id' => $record->id,
                'date' => $record->tanggal_berangkat->locale('id')->translatedFormat('l, d F Y'),
                'time' => substr($record->jam_berangkat, 0, 5),
                'points' => $record->poin_didapat,
                'source' => $record->sumber,
                'note' => $record->note,
            ])->values()->all(),
            'pagination' => [
                'currentPage' => $records->currentPage(),
                'lastPage' => $records->lastPage(),
                'total' => $records->total(),
            ],
            'target' => substr($snapshotPengaturan->untukTanggal($user, CarbonImmutable::now($timezone))['on_time_target'], 0, 5),
            'balance' => (int) $anak->transaksiPoin()->sum('amount'),
            'today' => CarbonImmutable::now($timezone)->toDateString(),
        ]);
    }

    public function store(Request $request, LayananPoin $layananPoin, LayananBonusMingguan $bonus, LayananSnapshotPengaturan $snapshotPengaturan): RedirectResponse
    {
        $data = $request->validate([
            'tanggal_berangkat' => ['required', 'date', 'date_format:Y-m-d'],
            'jam_berangkat' => ['required', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $user = $request->user();
        $anak = $user->anak;

        abort_unless($anak, 404);

        $timezone = $user->timezone ?: config('app.timezone');
        $now = CarbonImmutable::now($timezone);
        $tanggal = CarbonImmutable::parse($data['tanggal_berangkat'], $timezone);

        if ($tanggal->isFuture()) {
            return back()->withErrors(['tanggal_berangkat' => 'Tanggal catatan tidak boleh setelah hari ini.']);
        }

        $createdAt = CarbonImmutable::createFromFormat('Y-m-d H:i', $data['tanggal_berangkat'].' '.$data['jam_berangkat'], $timezone);

        if ($tanggal->isSameDay($now) && $createdAt->isFuture()) {
            return back()->withErrors(['jam_berangkat' => 'Jam keberangkatan hari ini tidak boleh melewati waktu sekarang.']);
        }

        DB::transaction(function () use ($data, $anak, $createdAt, $layananPoin, $snapshotPengaturan, $tanggal, $user): void {
            $anak = Anak::query()->lockForUpdate()->findOrFail($anak->id);

            if ($anak->catatanBerangkat()->whereDate('tanggal_berangkat', $data['tanggal_berangkat'])->exists()) {
                throw ValidationException::withMessages([
                    'tanggal_berangkat' => 'Tanggal itu sudah memiliki catatan. Gunakan Edit untuk memperbaiki jamnya.',
                ]);
            }

            $konfigurasiTanggal = $snapshotPengaturan->untukTanggal($user, $tanggal);
            $hariSekolah = $konfigurasiTanggal['school_days'];
            $adaPengecualian = $user->kalenderSekolah()->whereDate('date', $tanggal->toDateString())->exists();

            if ($adaPengecualian || ! \in_array($tanggal->dayOfWeekIso, array_map('intval', $hariSekolah), true)) {
                throw ValidationException::withMessages([
                    'tanggal_berangkat' => 'Tanggal tersebut bukan hari sekolah sesuai pengaturan.',
                ]);
            }

            $jam = $data['jam_berangkat'].':00';
            $target = $konfigurasiTanggal['on_time_target'];
            $aturanSnapshot = $konfigurasiTanggal['point_rules'];
            $poin = $layananPoin->hitungDariSnapshot($jam, $aturanSnapshot);
            $record = $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $data['tanggal_berangkat'],
                'jam_berangkat' => $jam,
                'sumber' => 'manual',
                'note' => $data['note'] ?? null,
                'target_tepat_waktu_saat_dicatat' => $target,
                'aturan_poin_snapshot' => $aturanSnapshot,
                'poin_didapat' => $poin,
            ]);

            TransaksiPoin::query()->create([
                'anak_id' => $anak->id,
                'type' => 'poin_waktu_berangkat',
                'amount' => $poin,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Poin waktu berangkat manual',
                'metadata_json' => ['sumber' => 'manual', 'target' => $target, 'aturan_poin' => $aturanSnapshot],
                'created_at' => $createdAt,
            ]);
        });
        $bonus->proses($anak);

        return back()->with('success', 'Catatan manual berhasil disimpan.');
    }

    public function update(Request $request, CatatanBerangkat $catatanBerangkat, LayananPoin $layananPoin, LayananBonusMingguan $bonus): RedirectResponse
    {
        $data = $request->validate([
            'jam_berangkat' => ['required', 'date_format:H:i'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $anak = $request->user()->anak;

        abort_unless($anak && $catatanBerangkat->anak_id === $anak->id, 404);

        DB::transaction(function () use ($anak, $bonus, $data, $request, $catatanBerangkat, $layananPoin): void {
            $record = CatatanBerangkat::query()->lockForUpdate()->findOrFail($catatanBerangkat->id);
            $oldPoints = (int) $record->poin_didapat;
            $jam = $data['jam_berangkat'].':00';
            $note = $data['note'] ?? null;

            if ($record->jam_berangkat === $jam) {
                $record->update(['note' => $note]);

                return;
            }

            $target = $record->target_tepat_waktu_saat_dicatat;
            $aturanSnapshot = $record->aturan_poin_snapshot ?: $layananPoin->snapshot($layananPoin->ambilAturanAktif($request->user()->id));
            $newPoints = $layananPoin->hitungDariSnapshot($jam, $aturanSnapshot);

            $saldo = (int) $anak->transaksiPoin()->lockForUpdate()->sum('amount');

            if ($saldo + $newPoints - $oldPoints < 0) {
                throw ValidationException::withMessages([
                    'jam_berangkat' => 'Catatan tidak dapat diubah karena koreksi poin akan membuat saldo poin menjadi negatif.',
                ]);
            }

            $record->update(['jam_berangkat' => $jam, 'note' => $note, 'aturan_poin_snapshot' => $aturanSnapshot, 'poin_didapat' => $newPoints]);

            TransaksiPoin::query()->create([
                'anak_id' => $record->anak_id,
                'type' => 'penyesuaian_manual',
                'amount' => -$oldPoints,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Pembalik poin catatan sebelum koreksi',
                'metadata_json' => ['poin_lama' => $oldPoints],
            ]);
            TransaksiPoin::query()->create([
                'anak_id' => $record->anak_id,
                'type' => 'poin_waktu_berangkat',
                'amount' => $newPoints,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Poin waktu berangkat setelah koreksi',
                'metadata_json' => ['poin_lama' => $oldPoints, 'target' => $target, 'aturan_poin' => $aturanSnapshot],
            ]);

            $bonus->proses($anak, strictBalance: true);
        });

        return back()->with('success', 'Catatan berhasil diperbarui dan riwayat poin tetap tersimpan.');
    }
}
