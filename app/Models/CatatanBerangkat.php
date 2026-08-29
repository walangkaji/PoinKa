<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatatanBerangkat extends Model
{
    protected $table = 'catatan_berangkat';

    protected $fillable = [
        'anak_id', 'tanggal_berangkat', 'jam_berangkat', 'sumber', 'note',
        'target_tepat_waktu_saat_dicatat', 'aturan_poin_snapshot', 'poin_didapat',
    ];

    protected function casts(): array
    {
        return ['tanggal_berangkat' => 'date', 'aturan_poin_snapshot' => 'array', 'poin_didapat' => 'integer'];
    }

    public function anak(): BelongsTo
    {
        return $this->belongsTo(Anak::class);
    }
}
