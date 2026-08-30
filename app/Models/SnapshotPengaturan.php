<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SnapshotPengaturan extends Model
{
    protected $table = 'snapshot_pengaturan';

    protected $fillable = [
        'user_id', 'effective_date', 'on_time_target', 'point_rules', 'school_days', 'weekly_bonus_active',
        'weekly_bonus_name', 'weekly_bonus_days', 'weekly_bonus_points',
    ];

    protected function casts(): array
    {
        return [
            'effective_date' => 'date',
            'point_rules' => 'array',
            'school_days' => 'array',
            'weekly_bonus_active' => 'boolean',
            'weekly_bonus_days' => 'integer',
            'weekly_bonus_points' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
