<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPoin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenyesuaianPoinController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'amount'      => ['required', 'integer', 'not_in:0', 'between:-100000,100000'],
            'description' => ['required', 'string', 'max:200'],
        ]);
        $anak = $request->user()->anak;
        abort_unless($anak, 404);

        DB::transaction(function () use ($data, $anak): void {
            $saldo = (int) $anak->transaksiPoin()->lockForUpdate()->sum('amount');

            if ($saldo + (int) $data['amount'] < 0) {
                abort(422, 'Saldo tidak boleh menjadi negatif.');
            }

            TransaksiPoin::query()->create([
                'anak_id'       => $anak->id,
                'type'          => 'penyesuaian_manual',
                'amount'        => (int) $data['amount'],
                'description'   => $data['description'],
                'metadata_json' => ['oleh' => 'orang_tua'],
            ]);
        });

        return back()->with('success', 'Penyesuaian poin berhasil dicatat.');
    }
}
