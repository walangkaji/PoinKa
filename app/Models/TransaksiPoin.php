<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransaksiPoin extends Model
{
    protected $table = 'transaksi_poin';

    public $timestamps = false;

    public const CREATED_AT = 'created_at';

    public const UPDATED_AT = null;

    protected $fillable = [
        'anak_id', 'type', 'amount', 'reference_type', 'reference_id',
        'description', 'metadata_json', 'bonus_week_start', 'created_at',
    ];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'metadata_json' => 'array', 'bonus_week_start' => 'date', 'created_at' => 'datetime'];
    }

    public function anak(): BelongsTo
    {
        return $this->belongsTo(Anak::class);
    }
}
