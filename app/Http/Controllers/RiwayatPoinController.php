<?php

namespace App\Http\Controllers;

use App\Models\TransaksiPoin;
use App\Services\LayananBonusMingguan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatPoinController extends Controller
{
    public function index(Request $request, LayananBonusMingguan $bonus): Response|RedirectResponse
    {
        $anak = $request->user()->anak;

        if (! $anak) {
            return redirect()->route('onboarding');
        }

        $bonus->proses($anak);

        $validator = Validator::make($request->all(), [
            'type' => ['nullable', 'in:all,poin_waktu_berangkat,bonus_mingguan,penyesuaian_manual,penyesuaian_bonus_mingguan,penukaran_hadiah,pembatalan_penukaran'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to'   => ['nullable', 'date_format:Y-m-d'],
        ]);
        $validator->after(function ($validator) use ($request): void {
            if ($request->filled('from') && $request->filled('to') && $request->input('from') > $request->input('to')) {
                $validator->errors()->add('to', 'Tanggal akhir tidak boleh sebelum tanggal mulai.');
            }
        });
        $filters             = $validator->validate();
        $type                = $filters['type'] ?? 'all';
        $saldo               = (int) $anak->transaksiPoin()->sum('amount');
        $timezone            = $request->user()->timezone ?: config('app.timezone');
        $orderedTransactions = $anak->transaksiPoin()->orderByDesc('created_at')->orderByDesc('id')->get();
        $balanceAfter        = [];
        $runningBalance      = $saldo;
        foreach ($orderedTransactions as $transaction) {
            $balanceAfter[$transaction->id] = $runningBalance;
            $runningBalance -= $transaction->amount;
        }

        $query = $anak->transaksiPoin()->orderByDesc('created_at')->orderByDesc('id');

        if ('all' !== $type) {
            $query->where('type', $type);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        $transactions    = $query->paginate(10)->withQueryString();
        $transactionData = $transactions->getCollection()->map(function (TransaksiPoin $transaction) use ($balanceAfter, $timezone): array {
            $title = match ($transaction->type) {
                'poin_waktu_berangkat'       => 'Poin waktu berangkat',
                'bonus_mingguan'             => 'Bonus konsisten',
                'penyesuaian_bonus_mingguan' => 'Penyesuaian bonus mingguan',
                'penyesuaian_manual'         => 'Penyesuaian poin',
                'penukaran_hadiah'           => 'Penukaran hadiah',
                'pembatalan_penukaran'       => 'Pembatalan penukaran',
                default                      => 'Perubahan saldo',
            };

            return [
                'id'           => $transaction->id,
                'type'         => $transaction->type,
                'title'        => $title,
                'detail'       => $transaction->description !== $title ? $transaction->description : null,
                'date'         => $transaction->created_at->copy()->setTimezone($timezone)->locale('id')->translatedFormat('l, d F Y'),
                'time'         => $transaction->created_at->copy()->setTimezone($timezone)->format('H:i'),
                'amount'       => $transaction->amount,
                'balanceAfter' => $balanceAfter[$transaction->id] ?? 0,
            ];
        })->values()->all();

        return Inertia::render('RiwayatPoin', [
            'balance'      => $saldo,
            'transactions' => $transactionData,
            'filters'      => [
                'type' => $type,
                'from' => $filters['from'] ?? null,
                'to'   => $filters['to']   ?? null,
            ],
            'pagination' => [
                'currentPage' => $transactions->currentPage(),
                'lastPage'    => $transactions->lastPage(),
                'total'       => $transactions->total(),
            ],
        ]);
    }
}
