<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPoin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

    public function cancel(Request $request, TransaksiPoin $transaksiPoin): RedirectResponse
    {
        $anak = $request->user()->anak;
        abort_unless($anak && $transaksiPoin->anak_id === $anak->id && 'penyesuaian_manual' === $transaksiPoin->type && null === $transaksiPoin->reference_type, 404);

        $cancelled = DB::transaction(function () use ($anak, $transaksiPoin): bool {
            $adjustment = TransaksiPoin::query()->lockForUpdate()->findOrFail($transaksiPoin->id);
            abort_unless($adjustment->anak_id === $anak->id && 'penyesuaian_manual' === $adjustment->type && null === $adjustment->reference_type, 404);

            $alreadyCancelled = TransaksiPoin::query()
                ->where('anak_id', $anak->id)
                ->where('type', 'pembatalan_penyesuaian')
                ->where('reference_type', TransaksiPoin::class)
                ->where('reference_id', $adjustment->id)
                ->exists();

            if ($alreadyCancelled) {
                return false;
            }

            $reversalAmount = -$adjustment->amount;
            $saldo          = (int) $anak->transaksiPoin()->lockForUpdate()->sum('amount');

            if ($saldo + $reversalAmount < 0) {
                throw ValidationException::withMessages([
                    'adjustment' => 'Penyesuaian tidak dapat dibatalkan karena saldo saat ini tidak mencukupi.',
                ]);
            }

            TransaksiPoin::query()->create([
                'anak_id'        => $anak->id,
                'type'           => 'pembatalan_penyesuaian',
                'amount'         => $reversalAmount,
                'reference_type' => TransaksiPoin::class,
                'reference_id'   => $adjustment->id,
                'description'    => 'Pembatalan penyesuaian: ' . $adjustment->description,
                'metadata_json'  => [
                    'oleh'                     => 'orang_tua',
                    'membatalkan_transaksi_id' => $adjustment->id,
                ],
            ]);

            return true;
        });

        return back()->with('success', $cancelled ? 'Penyesuaian poin berhasil dibatalkan.' : 'Penyesuaian sudah dibatalkan sebelumnya.');
    }
}
