<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Hadiah extends Model
{
    protected $table = 'hadiah';

    protected $fillable = ['user_id', 'name', 'description', 'image', 'poin_cost', 'is_target', 'is_active'];

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): string => Str::title($value ?? ''),
            set: fn (string $value): string => Str::title(trim($value)),
        );
    }

    protected function casts(): array
    {
        return ['poin_cost' => 'integer', 'is_target' => 'boolean', 'is_active' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function penukaran(): HasMany
    {
        return $this->hasMany(PenukaranHadiah::class);
    }
}
