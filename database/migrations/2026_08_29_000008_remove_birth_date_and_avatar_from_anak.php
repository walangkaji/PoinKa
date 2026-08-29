<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration {
    public function up(): void
    {
        DB::table('anak')
            ->whereNotNull('avatar')
            ->pluck('avatar')
            ->each(fn (string $avatar): bool => Storage::disk('public')->delete($avatar));

        Schema::table('anak', function (Blueprint $table): void {
            $table->dropColumn(['birth_date', 'avatar']);
        });
    }

    public function down(): void
    {
        Schema::table('anak', function (Blueprint $table): void {
            $table->date('birth_date')->nullable();
            $table->string('avatar')->nullable();
        });
    }
};
