<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AturanPoin extends Model
{
    protected $table = 'aturan_poin';

    protected $fillable = ['user_id', 'cutoff_time', 'poin', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['poin' => 'integer', 'sort_order' => 'integer', 'is_active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
