<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('timezone')->default('Asia/Jakarta');
        });

        Schema::create('anak', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->date('birth_date')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('pengaturan', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->time('on_time_target')->default('06:30:00');
            $table->json('school_days');
            $table->boolean('weekly_bonus_active')->default(true);
            $table->string('weekly_bonus_name')->default('Bonus konsisten');
            $table->unsignedInteger('weekly_bonus_days')->default(5);
            $table->unsignedInteger('weekly_bonus_points')->default(5);
            $table->timestamps();
        });

        Schema::create('aturan_poin', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->time('cutoff_time');
            $table->unsignedInteger('poin');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active', 'sort_order']);
        });

        Schema::create('catatan_berangkat', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('anak_id')->constrained('anak')->cascadeOnDelete();
            $table->date('tanggal_berangkat');
            $table->time('jam_berangkat');
            $table->string('sumber', 20);
            $table->text('note')->nullable();
            $table->time('target_tepat_waktu_saat_dicatat');
            $table->unsignedInteger('poin_didapat')->default(0);
            $table->timestamps();

            $table->unique(['anak_id', 'tanggal_berangkat']);
        });

        Schema::create('transaksi_poin', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('anak_id')->constrained('anak')->cascadeOnDelete();
            $table->string('type', 40);
            $table->integer('amount');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('description');
            $table->json('metadata_json')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['anak_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });

        Schema::create('hadiah', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('poin_cost');
            $table->boolean('is_target')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });

        Schema::create('penukaran_hadiah', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('anak_id')->constrained('anak')->cascadeOnDelete();
            $table->foreignId('hadiah_id')->constrained('hadiah')->restrictOnDelete();
            $table->unsignedInteger('poin_cost_snapshot');
            $table->timestamp('redeemed_at');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('kalender_sekolah', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('type', 30);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kalender_sekolah');
        Schema::dropIfExists('penukaran_hadiah');
        Schema::dropIfExists('hadiah');
        Schema::dropIfExists('transaksi_poin');
        Schema::dropIfExists('catatan_berangkat');
        Schema::dropIfExists('aturan_poin');
        Schema::dropIfExists('pengaturan');
        Schema::dropIfExists('anak');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('timezone');
        });
    }
};
