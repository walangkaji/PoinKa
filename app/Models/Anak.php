<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anak extends Model
{
    use HasFactory;

    protected $table = 'anak';

    protected $fillable = ['user_id', 'name', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function catatanBerangkat(): HasMany
    {
        return $this->hasMany(CatatanBerangkat::class);
    }

    public function transaksiPoin(): HasMany
    {
        return $this->hasMany(TransaksiPoin::class);
    }

    public function penukaranHadiah(): HasMany
    {
        return $this->hasMany(PenukaranHadiah::class);
    }
}
