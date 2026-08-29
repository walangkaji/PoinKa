<?php

namespace App\Console\Commands;

use App\Models\CatatanBerangkat;
use App\Models\TransaksiPoin;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairOrphanPointTransactions extends Command
{
    protected $signature = 'poinka:repair-orphan-point-transactions {--fix : Hapus transaksi yatim yang ditemukan}';

    protected $description = 'Audit dan, bila diminta, hapus transaksi poin yang tidak lagi memiliki catatan sumber';

    public function handle(): int
    {
        $orphans = TransaksiPoin::query()
            ->where('reference_type', CatatanBerangkat::class)
            ->whereNotNull('reference_id')
            ->get()
            ->filter(fn (TransaksiPoin $transaction): bool => ! CatatanBerangkat::query()->whereKey($transaction->reference_id)->exists())
            ->values();

        if ($orphans->isEmpty()) {
            $this->info('Tidak ditemukan transaksi poin yatim.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Anak', 'Tipe', 'Jumlah', 'Referensi'],
            $orphans->map(fn (TransaksiPoin $transaction): array => [
                $transaction->id,
                $transaction->anak_id,
                $transaction->type,
                $transaction->amount,
                $transaction->reference_id,
            ])->all(),
        );

        $netAmount = (int) $orphans->sum('amount');

        if (! $this->option('fix')) {
            $this->warn("Ditemukan {$orphans->count()} transaksi yatim dengan dampak saldo bersih {$netAmount} poin. Jalankan ulang dengan --fix untuk menghapusnya.");

            return self::SUCCESS;
        }

        DB::transaction(function () use ($orphans): void {
            TransaksiPoin::query()->whereKey($orphans->modelKeys())->delete();
        });

        $this->info("{$orphans->count()} transaksi yatim berhasil dihapus. Dampak saldo bersih: {$netAmount} poin.");

        return self::SUCCESS;
    }
}
