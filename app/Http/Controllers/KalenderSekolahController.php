<?php

namespace App\Http\Controllers;

use App\Models\KalenderSekolah;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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

        $request->user()->kalenderSekolah()->updateOrCreate(
            ['date' => $data['date']],
            ['type' => $data['type'], 'description' => $data['description'] ?? null],
        );

        return back()->with('success', 'Tanggal khusus berhasil disimpan.');
    }

    public function destroy(Request $request, KalenderSekolah $kalenderSekolah): RedirectResponse
    {
        abort_unless($kalenderSekolah->user_id === $request->user()->id, 404);
        $timezone = $request->user()->timezone ?: config('app.timezone');

        if ($kalenderSekolah->date->isBefore(CarbonImmutable::now($timezone)->startOfDay())) {
            return back()->withErrors(['date' => 'Tanggal khusus yang sudah lewat tidak dapat diubah.']);
        }
        $kalenderSekolah->delete();

        return back()->with('success', 'Tanggal khusus dihapus.');
    }
}
