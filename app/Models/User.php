<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'timezone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;
    use Notifiable;

    public function anak(): HasOne
    {
        return $this->hasOne(Anak::class);
    }

    public function pengaturan(): HasOne
    {
        return $this->hasOne(Pengaturan::class);
    }

    public function aturanPoin(): HasMany
    {
        return $this->hasMany(AturanPoin::class);
    }

    public function hadiah(): HasMany
    {
        return $this->hasMany(Hadiah::class);
    }

    public function kalenderSekolah(): HasMany
    {
        return $this->hasMany(KalenderSekolah::class);
    }

    public function snapshotPengaturan(): HasMany
    {
        return $this->hasMany(SnapshotPengaturan::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }
}
