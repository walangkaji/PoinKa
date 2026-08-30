<?php

namespace App\Http\Controllers;

use App\Models\Anak;
use App\Models\KalenderSekolah;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KalenderSekolahController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date'        => ['required', 'date', 'date_format:Y-m-d'],
            'type'        => ['required', 'in:libur,tidak_ada_sekolah,izin'],
            'description' => ['nullable', 'string', 'max:200'],
        ]);

        $timezone = $request->user()->timezone ?: config('app.timezone');

        if (CarbonImmutable::parse($data['date'], $timezone)->isBefore(CarbonImmutable::now($timezone)->startOfDay())) {
            return back()->withErrors(['date' => 'Tanggal khusus tidak boleh berada di masa lalu.']);
        }

        $today = CarbonImmutable::now($timezone)->toDateString();
        $locked = DB::transaction(function () use ($request, $data, $today): bool {
            $anak = Anak::query()->where('user_id', $request->user()->id)->lockForUpdate()->firstOrFail();

            if ($data['date'] === $today && $anak->catatanBerangkat()->whereDate('tanggal_berangkat', $today)->exists()) {
                return false;
            }

            $request->user()->kalenderSekolah()->updateOrCreate(
                ['date' => $data['date']],
                ['type' => $data['type'], 'description' => $data['description'] ?? null],
            );

            return true;
        });

        if (! $locked) {
            return back()->withErrors(['date' => 'Tanggal khusus hari ini tidak dapat diubah setelah catatan keberangkatan dibuat.']);
        }

        return back()->with('success', 'Tanggal khusus berhasil disimpan.');
    }

    public function destroy(Request $request, KalenderSekolah $kalenderSekolah): RedirectResponse
    {
        abort_unless($kalenderSekolah->user_id === $request->user()->id, 404);
        $timezone = $request->user()->timezone ?: config('app.timezone');

        if ($kalenderSekolah->date->isBefore(CarbonImmutable::now($timezone)->startOfDay())) {
            return back()->withErrors(['date' => 'Tanggal khusus yang sudah lewat tidak dapat diubah.']);
        }
        $today = CarbonImmutable::now($timezone)->toDateString();
        $locked = DB::transaction(function () use ($request, $kalenderSekolah, $today): bool {
            $anak = Anak::query()->where('user_id', $request->user()->id)->lockForUpdate()->firstOrFail();

            if ($kalenderSekolah->date->toDateString() === $today && $anak->catatanBerangkat()->whereDate('tanggal_berangkat', $today)->exists()) {
                return false;
            }

            KalenderSekolah::query()->lockForUpdate()->findOrFail($kalenderSekolah->id)->delete();

            return true;
        });

        if (! $locked) {
            return back()->withErrors(['date' => 'Tanggal khusus hari ini tidak dapat diubah setelah catatan keberangkatan dibuat.']);
        }

        return back()->with('success', 'Tanggal khusus dihapus.');
    }
}
