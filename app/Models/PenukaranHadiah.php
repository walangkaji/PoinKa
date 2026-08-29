<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenukaranHadiah extends Model
{
    protected $table = 'penukaran_hadiah';

    public $timestamps = false;

    public const CREATED_AT = 'created_at';

    public const UPDATED_AT = null;

    protected $fillable = ['anak_id', 'hadiah_id', 'poin_cost_snapshot', 'redeemed_at', 'idempotency_key', 'status', 'cancelled_at', 'created_at'];

    protected function casts(): array
    {
        return ['poin_cost_snapshot' => 'integer', 'redeemed_at' => 'datetime', 'cancelled_at' => 'datetime', 'created_at' => 'datetime'];
    }

    public function anak(): BelongsTo
    {
        return $this->belongsTo(Anak::class);
    }

    public function hadiah(): BelongsTo
    {
        return $this->belongsTo(Hadiah::class);
    }
}
