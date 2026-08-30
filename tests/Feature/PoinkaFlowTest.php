<?php

namespace Tests\Feature;

use App\Actions\CatatWaktuBerangkat;
use App\Models\Anak;
use App\Models\AturanPoin;
use App\Models\CatatanBerangkat;
use App\Models\Hadiah;
use App\Models\KalenderSekolah;
use App\Models\Pengaturan;
use App\Models\PenukaranHadiah;
use App\Models\SnapshotPengaturan;
use App\Models\TransaksiPoin;
use App\Models\User;
use App\Services\LayananBonusMingguan;
use App\Services\LayananPoin;
use App\Services\LayananSnapshotPengaturan;
use Carbon\CarbonImmutable;
use Database\Seeders\PoinkaDemoSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PoinkaFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_is_remembered_until_logout(): void
    {
        $user = User::factory()->create(['email' => 'aji@example.com']);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
        $response->assertCookie(Auth::getRecallerName());
        $this->assertGreaterThan(now()->addYear()->timestamp, $response->getCookie(Auth::getRecallerName())->getExpiresTime());

        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_unknown_web_page_redirects_to_dashboard(): void
    {
        [$user] = $this->makeChildWithRules();

        $this->actingAs($user)
            ->get('/halaman-yang-tidak-ada')
            ->assertRedirect('/');
    }

    public function test_parent_can_register_and_set_up_a_child(): void
    {
        $response = $this->post('/daftar', [
            'name' => 'Rani',
            'email' => 'rani@example.com',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
        ]);

        $response->assertRedirect('/mulai');
        $this->assertAuthenticated();

        $response = $this->post('/mulai', [
            'child_name' => 'Shaka',
            'on_time_target' => '06:30',
            'school_days' => [1, 2, 3, 4, 5],
        ]);

        $response->assertRedirect('/');
        $this->assertDatabaseHas('anak', ['name' => 'Shaka']);
        $this->assertDatabaseCount('aturan_poin', 3);
    }

    public function test_onboarding_generates_point_rules_before_a_custom_target(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/mulai', [
            'child_name' => 'Shaka',
            'on_time_target' => '05:00',
            'school_days' => [1, 2, 3, 4, 5],
        ])->assertRedirect('/');

        $this->assertSame(
            ['04:45:00', '04:50:00', '05:00:00'],
            $user->aturanPoin()->orderBy('sort_order')->pluck('cutoff_time')->map(fn ($time): string => (string) $time)->all(),
        );
    }

    public function test_onboarding_rejects_a_target_before_0015(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->from('/mulai')->post('/mulai', [
            'child_name' => 'Shaka',
            'on_time_target' => '00:05',
            'school_days' => [1, 2, 3, 4, 5],
        ])->assertSessionHasErrors('on_time_target');

        $this->assertDatabaseCount('anak', 0);
        $this->assertDatabaseCount('aturan_poin', 0);
    }

    public function test_repeated_onboarding_submission_keeps_the_existing_setup(): void
    {
        $user = User::factory()->create();
        $firstSetup = [
            'child_name' => 'Shaka',
            'on_time_target' => '06:30',
            'school_days' => [1, 2, 3, 4, 5],
        ];

        $this->actingAs($user)->post('/mulai', $firstSetup)->assertRedirect('/');
        $this->actingAs($user)->post('/mulai', [
            ...$firstSetup,
            'child_name' => 'Nama lain',
        ])->assertRedirect('/');

        $this->assertDatabaseCount('anak', 1);
        $this->assertDatabaseCount('pengaturan', 1);
        $this->assertDatabaseCount('aturan_poin', 3);
        $this->assertSame('Shaka', $user->anak()->sole()->name);
    }

    public function test_parent_can_request_a_password_reset_link(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $this->from('/lupa-password')->post('/lupa-password', ['email' => $user->email])->assertRedirect('/lupa-password');

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_reset_request_does_not_reveal_whether_an_email_exists(): void
    {
        $this->from('/lupa-password')
            ->post('/lupa-password', ['email' => 'tidak-ada@example.com'])
            ->assertRedirect('/lupa-password')
            ->assertSessionHas('success', 'Jika email terdaftar, tautan reset sudah dikirim.')
            ->assertSessionDoesntHaveErrors();
    }

    public function test_history_rejects_a_reversed_date_range(): void
    {
        [$user] = $this->makeChildWithRules();

        $this->actingAs($user)
            ->from('/riwayat-poin')
            ->get('/riwayat-poin?from=2026-08-29&to=2026-08-01')
            ->assertSessionHasErrors('to');
    }

    public function test_demo_seeder_can_be_run_more_than_once_without_duplicate_rewards(): void
    {
        $this->seed(PoinkaDemoSeeder::class);
        $this->seed(PoinkaDemoSeeder::class);

        $this->assertDatabaseCount('hadiah', 5);
    }

    public function test_pencatatan_hanya_dibuat_sekali_dan_poin_tidak_berlipat(): void
    {
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
        $anak = Anak::query()->create(['user_id' => $user->id, 'name' => 'Shaka', 'is_active' => true]);
        Pengaturan::query()->create([
            'user_id' => $user->id,
            'on_time_target' => '23:59:00',
            'school_days' => [1, 2, 3, 4, 5, 6, 7],
        ]);
        AturanPoin::query()->create([
            'user_id' => $user->id,
            'cutoff_time' => '23:59:00',
            'poin' => 3,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($user)->from('/')->post('/catat-waktu-berangkat')
            ->assertRedirect('/')
            ->assertSessionHas('record_result', fn (array $result): bool => $result['status'] === 'recorded'
                && $result['points'] === 3
                && $result['balance'] === 3);
        $this->actingAs($user)->from('/')->post('/catat-waktu-berangkat')->assertRedirect('/');

        $this->assertDatabaseCount('catatan_berangkat', 1);
        $this->assertDatabaseCount('transaksi_poin', 1);
        $this->assertDatabaseHas('transaksi_poin', ['anak_id' => $anak->id, 'amount' => 3]);
    }

    public function test_point_cutoff_is_compared_at_minute_precision(): void
    {
        $aturan = collect([
            (object) ['cutoff_time' => '06:15:00', 'poin' => 3],
            (object) ['cutoff_time' => '06:20:00', 'poin' => 2],
            (object) ['cutoff_time' => '06:30:00', 'poin' => 1],
        ]);

        $this->assertSame(3, app(LayananPoin::class)->hitung('06:15:59', $aturan));
        $this->assertSame(2, app(LayananPoin::class)->hitung('06:20:59', $aturan));
        $this->assertTrue(LayananPoin::sebelumAtauSama('06:30:59', '06:30:00'));
    }

    public function test_manual_record_rejects_weekends_and_calendar_exceptions(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $user->pengaturan()->update(['school_days' => [1, 2, 3, 4, 5]]);
        $sunday = CarbonImmutable::now('Asia/Jakarta')->startOfWeek()->subDay()->toDateString();

        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => $sunday,
            'jam_berangkat' => '06:10',
        ])->assertSessionHasErrors('tanggal_berangkat');

        $schoolDate = CarbonImmutable::now('Asia/Jakarta')->startOfWeek()->subWeek()->addDay()->toDateString();
        $user->kalenderSekolah()->create(['date' => $schoolDate, 'type' => 'libur']);
        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => $schoolDate,
            'jam_berangkat' => '06:10',
        ])->assertSessionHasErrors('tanggal_berangkat');

        $this->assertDatabaseCount('catatan_berangkat', 0);
        $this->assertDatabaseCount('transaksi_poin', 0);
    }

    public function test_manual_record_rejects_a_future_time_today(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-31 06:00:00', 'Asia/Jakarta'));
        [$user] = $this->makeChildWithRules();

        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => '2026-08-31',
            'jam_berangkat' => '06:01',
        ])->assertRedirect('/catatan')->assertSessionHasErrors('jam_berangkat');

        $this->assertDatabaseCount('catatan_berangkat', 0);
        $this->assertDatabaseCount('transaksi_poin', 0);
        CarbonImmutable::setTestNow();
    }

    public function test_manual_record_correction_preserves_point_history(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $date = now()->subDay()->toDateString();

        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => $date,
            'jam_berangkat' => '06:10',
        ])->assertRedirect('/catatan');

        $record = CatatanBerangkat::query()->firstOrFail();
        $this->actingAs($user)->from('/catatan')->put('/catatan/'.$record->id, [
            'jam_berangkat' => '06:25',
        ])->assertRedirect('/catatan');

        $this->assertDatabaseHas('catatan_berangkat', ['id' => $record->id, 'poin_didapat' => 1]);
        $this->assertDatabaseCount('transaksi_poin', 3);
        $this->assertDatabaseHas('transaksi_poin', ['amount' => -3, 'type' => 'penyesuaian_manual']);
        $this->assertDatabaseHas('transaksi_poin', ['amount' => 1, 'type' => 'poin_waktu_berangkat']);
    }

    public function test_manual_record_correction_uses_the_recorded_rule_snapshot(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $date = now()->subDay()->toDateString();

        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => $date,
            'jam_berangkat' => '06:10',
        ])->assertRedirect('/catatan');

        AturanPoin::query()->where('user_id', $user->id)->update(['cutoff_time' => '06:00:00']);
        $record = $anak->catatanBerangkat()->firstOrFail();
        $this->actingAs($user)->from('/catatan')->put('/catatan/'.$record->id, [
            'jam_berangkat' => '06:12',
        ])->assertRedirect('/catatan');

        $this->assertSame(3, $record->fresh()->poin_didapat);
        $this->assertNotEmpty($record->fresh()->aturan_poin_snapshot);
    }

    public function test_manual_historical_record_uses_recorded_date_in_point_history(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $date = CarbonImmutable::now('Asia/Jakarta')->subDay()->toDateString();

        $this->actingAs($user)->from('/catatan')->post('/catatan', [
            'tanggal_berangkat' => $date,
            'jam_berangkat' => '06:10',
        ])->assertRedirect('/catatan');

        $transaction = $anak->transaksiPoin()->where('type', 'poin_waktu_berangkat')->firstOrFail();
        $this->assertSame($date, $transaction->created_at->setTimezone('Asia/Jakarta')->toDateString());
        $this->assertSame('06:10', $transaction->created_at->setTimezone('Asia/Jakarta')->format('H:i'));
    }

    public function test_historical_target_snapshot_is_used_for_streak_calculation(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $anak->catatanBerangkat()->create([
            'tanggal_berangkat' => CarbonImmutable::now('Asia/Jakarta')->toDateString(),
            'jam_berangkat' => '06:25:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 1,
        ]);
        $user->pengaturan()->update(['on_time_target' => '06:20:00']);

        $this->assertSame(1, app(CatatWaktuBerangkat::class)->hitungStreak($anak));
    }

    public function test_streak_uses_the_school_schedule_that_applied_to_each_past_date(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-07 08:00', 'Asia/Jakarta');
        $pastWeek = $reference->startOfWeek()->subWeek();
        CarbonImmutable::setTestNow($reference);

        SnapshotPengaturan::query()->create([
            'user_id' => $user->id,
            'effective_date' => $pastWeek->toDateString(),
            'on_time_target' => '06:30:00',
            'point_rules' => [],
            'school_days' => [1, 2],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 2,
            'weekly_bonus_points' => 5,
        ]);
        SnapshotPengaturan::query()->create([
            'user_id' => $user->id,
            'effective_date' => $reference->startOfWeek()->toDateString(),
            'on_time_target' => '06:30:00',
            'point_rules' => [],
            'school_days' => [1],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 1,
            'weekly_bonus_points' => 5,
        ]);
        $anak->catatanBerangkat()->create([
            'tanggal_berangkat' => $pastWeek->toDateString(),
            'jam_berangkat' => '06:10:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 3,
        ]);

        $this->assertSame(0, app(CatatWaktuBerangkat::class)->hitungStreak($anak));
        CarbonImmutable::setTestNow();
    }

    public function test_settings_change_applies_tomorrow_after_a_record_exists_today(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $snapshot = app(LayananSnapshotPengaturan::class);
        $today = CarbonImmutable::now('Asia/Jakarta')->startOfDay();
        $rules = $user->aturanPoin()->orderBy('sort_order')->get();
        $snapshot->simpan($user, $today);
        $anak->catatanBerangkat()->create([
            'tanggal_berangkat' => $today->toDateString(),
            'jam_berangkat' => '06:10:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 3,
        ]);

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '06:45',
            'school_days' => [1, 2, 3, 4, 5],
            'rules' => $rules->map(fn ($rule): array => [
                'id' => $rule->id,
                'cutoff_time' => substr($rule->cutoff_time, 0, 5),
                'points' => $rule->poin,
            ])->all(),
        ])->assertRedirect('/pengaturan');

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '07:00',
            'school_days' => [1, 2, 3, 4, 5],
            'rules' => [
                ['id' => $rules[0]->id, 'cutoff_time' => '06:25', 'points' => 3],
                ['id' => $rules[1]->id, 'cutoff_time' => '06:30', 'points' => 2],
                ['id' => $rules[2]->id, 'cutoff_time' => '07:00', 'points' => 1],
            ],
        ])->assertRedirect('/pengaturan');

        $todaySnapshot = $user->snapshotPengaturan()->whereDate('effective_date', $today->toDateString())->sole();
        $tomorrowSnapshot = $user->snapshotPengaturan()->whereDate('effective_date', $today->addDay()->toDateString())->sole();

        $this->assertSame('06:30:00', $todaySnapshot->on_time_target);
        $this->assertSame('07:00:00', $tomorrowSnapshot->on_time_target);
        $this->assertSame('06:25', $tomorrowSnapshot->point_rules[0]['cutoff_time']);
        $this->actingAs($user)->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('targetTime', '06:30')
            ->where('pointRules.0.cutoffTime', '06:15'));
    }

    public function test_settings_change_applies_today_before_the_first_record(): void
    {
        [$user] = $this->makeChildWithRules();
        $snapshot = app(LayananSnapshotPengaturan::class);
        $today = CarbonImmutable::now('Asia/Jakarta')->startOfDay();
        $rules = $user->aturanPoin()->orderBy('sort_order')->get();
        $snapshot->simpan($user, $today);

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '07:00',
            'school_days' => [1, 2, 3, 4, 5],
            'rules' => [
                ['id' => $rules[0]->id, 'cutoff_time' => '06:25', 'points' => 3],
                ['id' => $rules[1]->id, 'cutoff_time' => '06:30', 'points' => 2],
                ['id' => $rules[2]->id, 'cutoff_time' => '07:00', 'points' => 1],
            ],
        ])->assertRedirect('/pengaturan');

        $todaySnapshot = $user->snapshotPengaturan()->whereDate('effective_date', $today->toDateString())->sole();

        $this->assertSame('07:00:00', $todaySnapshot->on_time_target);
        $this->assertSame('06:25', $todaySnapshot->point_rules[0]['cutoff_time']);
        $this->actingAs($user)->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('targetTime', '07:00')
            ->where('pointRules.0.cutoffTime', '06:25'));
    }

    public function test_today_calendar_exception_cannot_change_after_a_record_exists(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $today = CarbonImmutable::now('Asia/Jakarta')->toDateString();
        $anak->catatanBerangkat()->create([
            'tanggal_berangkat' => $today,
            'jam_berangkat' => '06:10:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 3,
        ]);
        $exception = $user->kalenderSekolah()->create(['date' => $today, 'type' => 'libur']);

        $this->actingAs($user)
            ->from('/pengaturan')
            ->post('/kalender-sekolah', [
                'date' => $today,
                'type' => 'tidak_ada_sekolah',
            ])
            ->assertRedirect('/pengaturan')
            ->assertSessionHasErrors('date');

        $this->assertSame('libur', $exception->fresh()->type);

        $this->actingAs($user)
            ->from('/pengaturan')
            ->delete('/kalender-sekolah/'.$exception->id)
            ->assertRedirect('/pengaturan')
            ->assertSessionHasErrors('date');

        $this->assertDatabaseHas('kalender_sekolah', ['id' => $exception->id]);
    }

    public function test_home_target_reward_includes_its_image_url(): void
    {
        [$user] = $this->makeChildWithRules();
        Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Sepeda',
            'image' => 'rewards/sepeda.jpg',
            'poin_cost' => 300,
            'is_target' => true,
            'is_active' => true,
        ]);

        $this->actingAs($user)->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('reward.imageUrl', '/storage/rewards/sepeda.jpg'));
    }

    public function test_reward_redemption_uses_a_snapshot_and_debits_once(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Buku cerita',
            'poin_cost' => 5,
            'is_target' => true,
            'is_active' => true,
        ]);
        TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'bonus_manual',
            'amount' => 10,
            'description' => 'Saldo awal test',
        ]);

        $payload = ['idempotency_key' => 'test-redeem-1'];
        $this->actingAs($user)->from('/hadiah')->post('/hadiah/'.$reward->id.'/tukar', $payload)->assertRedirect('/hadiah');
        $this->actingAs($user)->from('/hadiah')->post('/hadiah/'.$reward->id.'/tukar', $payload)->assertRedirect('/hadiah');

        $this->assertDatabaseHas('penukaran_hadiah', ['hadiah_id' => $reward->id, 'poin_cost_snapshot' => 5]);
        $this->assertDatabaseHas('transaksi_poin', ['amount' => -5, 'type' => 'penukaran_hadiah']);
        $this->assertDatabaseCount('penukaran_hadiah', 1);
        $this->assertSame(5, (int) $anak->transaksiPoin()->sum('amount'));
    }

    public function test_reward_redemption_can_be_cancelled_and_points_are_returned(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Buku cerita',
            'poin_cost' => 5,
            'is_active' => true,
        ]);
        TransaksiPoin::query()->create(['anak_id' => $anak->id, 'type' => 'bonus_manual', 'amount' => 10, 'description' => 'Saldo awal test']);

        $this->actingAs($user)->from('/hadiah')->post('/hadiah/'.$reward->id.'/tukar', ['idempotency_key' => 'cancel-test'])->assertRedirect('/hadiah');
        $redemption = PenukaranHadiah::query()->firstOrFail();
        $this->actingAs($user)->from('/hadiah')->post('/penukaran-hadiah/'.$redemption->id.'/batal')->assertRedirect('/hadiah');

        $this->assertDatabaseHas('penukaran_hadiah', ['id' => $redemption->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('transaksi_poin', ['type' => 'pembatalan_penukaran', 'amount' => 5, 'reference_id' => $redemption->id]);
        $this->assertSame(10, (int) $anak->transaksiPoin()->sum('amount'));
    }

    public function test_older_active_redemption_can_be_reached_through_pagination(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create(['user_id' => $user->id, 'name' => 'Buku cerita', 'poin_cost' => 5, 'is_active' => true]);

        foreach (range(1, 11) as $index) {
            PenukaranHadiah::query()->create([
                'anak_id' => $anak->id,
                'hadiah_id' => $reward->id,
                'poin_cost_snapshot' => 5,
                'redeemed_at' => now()->subMinutes($index),
                'status' => 'active',
            ]);
        }

        $this->actingAs($user)->get('/hadiah?redemption_page=2')->assertInertia(fn (Assert $page) => $page
            ->where('redemptionPagination.currentPage', 2)
            ->where('redemptions.0.status', 'active'));
    }

    public function test_parent_can_update_child_name(): void
    {
        [$user, $anak] = $this->makeChildWithRules();

        $this->actingAs($user)->from('/pengaturan')->post('/profil-anak', [
            'name' => 'Shaka Baru',
        ])->assertRedirect('/pengaturan');

        $this->assertSame('Shaka Baru', $anak->fresh()->name);
    }

    public function test_parent_can_add_and_remove_point_rules(): void
    {
        [$user] = $this->makeChildWithRules();
        $rules = $user->aturanPoin()->orderBy('sort_order')->get();

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '06:30',
            'school_days' => [1, 2, 3, 4, 5],
            'rules' => [
                ['id' => $rules[0]->id, 'cutoff_time' => '06:15', 'points' => 3],
                ['id' => $rules[1]->id, 'cutoff_time' => '06:20', 'points' => 2],
                ['id' => null, 'cutoff_time' => '06:30', 'points' => 1],
            ],
            'removed_rule_ids' => [$rules[2]->id],
        ])->assertRedirect('/pengaturan');

        $this->assertSame(3, $user->aturanPoin()->where('is_active', true)->count());
        $this->assertDatabaseHas('aturan_poin', ['id' => $rules[2]->id, 'is_active' => false]);
        $this->assertDatabaseHas('aturan_poin', ['user_id' => $user->id, 'cutoff_time' => '06:30:00', 'is_active' => true]);
    }

    public function test_parent_can_edit_and_delete_an_unused_reward(): void
    {
        [$user] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Hadiah lama',
            'description' => 'Deskripsi lama',
            'poin_cost' => 10,
            'is_active' => true,
        ]);

        $this->actingAs($user)->from('/hadiah')->put('/hadiah/'.$reward->id, [
            'name' => 'Hadiah baru',
            'description' => 'Deskripsi baru',
            'poin_cost' => 15,
        ])->assertRedirect('/hadiah');
        $this->assertDatabaseHas('hadiah', ['id' => $reward->id, 'name' => 'Hadiah Baru', 'poin_cost' => 15]);

        $this->actingAs($user)->from('/hadiah')->delete('/hadiah/'.$reward->id)->assertRedirect('/hadiah');
        $this->assertDatabaseMissing('hadiah', ['id' => $reward->id]);
    }

    public function test_reward_names_are_presented_in_title_case(): void
    {
        [$user] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'tablet belajar',
            'poin_cost' => 100,
            'is_active' => true,
        ]);

        $this->assertSame('Tablet Belajar', $reward->fresh()->name);
        $this->assertDatabaseHas('hadiah', ['id' => $reward->id, 'name' => 'Tablet Belajar']);
    }

    public function test_redeemed_reward_is_archived_instead_of_deleted(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Hadiah terpakai',
            'poin_cost' => 10,
            'is_target' => true,
            'is_active' => true,
        ]);
        PenukaranHadiah::query()->create([
            'anak_id' => $anak->id,
            'hadiah_id' => $reward->id,
            'poin_cost_snapshot' => 10,
            'redeemed_at' => now(),
        ]);

        $this->actingAs($user)->from('/hadiah')->delete('/hadiah/'.$reward->id)->assertRedirect('/hadiah');
        $this->assertDatabaseHas('hadiah', ['id' => $reward->id, 'is_active' => false, 'is_target' => false]);
    }

    public function test_archived_reward_cannot_be_made_target(): void
    {
        [$user] = $this->makeChildWithRules();
        $reward = Hadiah::query()->create([
            'user_id' => $user->id,
            'name' => 'Hadiah arsip',
            'poin_cost' => 10,
            'is_target' => false,
            'is_active' => false,
        ]);

        $this->actingAs($user)->from('/hadiah')->post('/hadiah/'.$reward->id.'/target')->assertNotFound();
        $this->assertDatabaseHas('hadiah', ['id' => $reward->id, 'is_target' => false, 'is_active' => false]);
    }

    public function test_parent_can_update_rules_and_add_a_school_calendar_date(): void
    {
        [$user] = $this->makeChildWithRules();
        $rules = $user->aturanPoin()->orderBy('sort_order')->get();

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '06:45',
            'school_days' => [1, 2, 3, 4],
            'rules' => $rules->map(fn ($rule): array => [
                'id' => $rule->id,
                'cutoff_time' => substr($rule->cutoff_time, 0, 5),
                'points' => $rule->poin,
            ])->all(),
        ])->assertRedirect('/pengaturan');

        $this->actingAs($user)->from('/pengaturan')->post('/kalender-sekolah', [
            'date' => now()->addDay()->toDateString(),
            'type' => 'libur',
            'description' => 'Libur keluarga',
        ])->assertRedirect('/pengaturan');

        $this->assertDatabaseHas('pengaturan', ['user_id' => $user->id, 'on_time_target' => '06:45:00']);
        $this->assertDatabaseHas('kalender_sekolah', ['user_id' => $user->id, 'type' => 'libur', 'description' => 'Libur keluarga']);
    }

    public function test_calendar_entries_can_be_reached_through_pagination(): void
    {
        [$user] = $this->makeChildWithRules();

        foreach (range(1, 11) as $index) {
            KalenderSekolah::query()->create([
                'user_id' => $user->id,
                'date' => now()->addDays($index)->toDateString(),
                'type' => 'libur',
                'description' => 'Libur '.$index,
            ]);
        }

        $this->actingAs($user)->get('/pengaturan?calendar_page=2')->assertInertia(fn (Assert $page) => $page
            ->where('calendarPagination.currentPage', 2)
            ->where('calendar.0.description', 'Libur 11'));
    }

    public function test_point_rules_reject_duplicate_cutoffs_and_cutoffs_after_target(): void
    {
        [$user] = $this->makeChildWithRules();

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '06:20',
            'school_days' => [1, 2, 3, 4, 5],
            'rules' => [
                ['id' => null, 'cutoff_time' => '06:15', 'points' => 3],
                ['id' => null, 'cutoff_time' => '06:15', 'points' => 2],
                ['id' => null, 'cutoff_time' => '06:30', 'points' => 1],
            ],
        ])->assertSessionHasErrors('rules');
    }

    public function test_weekly_bonus_target_cannot_exceed_school_days(): void
    {
        [$user] = $this->makeChildWithRules();
        $rules = $user->aturanPoin()->orderBy('sort_order')->get();

        $this->actingAs($user)->from('/pengaturan')->put('/pengaturan', [
            'on_time_target' => '06:30',
            'school_days' => [1, 2, 3],
            'rules' => $rules->map(fn ($rule): array => ['id' => $rule->id, 'cutoff_time' => substr($rule->cutoff_time, 0, 5), 'points' => $rule->poin])->all(),
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 4,
            'weekly_bonus_points' => 5,
        ])->assertSessionHasErrors('weekly_bonus_days');
    }

    public function test_bonus_is_processed_when_opening_a_non_home_balance_page(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $user->pengaturan()->update(['weekly_bonus_days' => 5, 'weekly_bonus_points' => 5]);
        $reference = CarbonImmutable::parse('2026-09-07 08:00', 'Asia/Jakarta');
        CarbonImmutable::setTestNow($reference);

        foreach (range(0, 4) as $offset) {
            $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $reference->startOfWeek()->subWeek()->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
        }

        $this->actingAs($user)->get('/hadiah')->assertOk();

        $bonus = $anak->transaksiPoin()->where('type', 'bonus_mingguan')->firstOrFail();
        $this->assertSame('2026-08-31', $bonus->bonus_week_start->toDateString());
        CarbonImmutable::setTestNow();
    }

    public function test_completed_week_gets_only_one_weekly_bonus(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $user->pengaturan()->update(['weekly_bonus_days' => 5, 'weekly_bonus_points' => 5]);
        $monday = CarbonImmutable::parse('2026-08-31', 'Asia/Jakarta');

        foreach (range(0, 4) as $offset) {
            $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $monday->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
        }

        $service = app(LayananBonusMingguan::class);
        $reference = CarbonImmutable::parse('2026-09-07 08:00', 'Asia/Jakarta');
        $service->proses($anak, $reference);
        $service->proses($anak, $reference);

        $this->assertDatabaseCount('transaksi_poin', 1);
        $this->assertDatabaseHas('transaksi_poin', ['type' => 'bonus_mingguan', 'amount' => 5]);
    }

    public function test_manual_records_from_an_older_completed_week_receive_their_bonus(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-21 08:00', 'Asia/Jakarta');
        $week = $reference->startOfWeek()->subWeeks(2);
        CarbonImmutable::setTestNow($reference);

        foreach (range(0, 4) as $offset) {
            $record = $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $week->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
            TransaksiPoin::query()->create([
                'anak_id' => $anak->id,
                'type' => 'poin_waktu_berangkat',
                'amount' => 3,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Poin waktu berangkat',
            ]);
        }

        app(LayananBonusMingguan::class)->proses($anak, $reference);

        $bonus = $anak->transaksiPoin()->where('type', 'bonus_mingguan')->firstOrFail();
        $this->assertSame($week->toDateString(), $bonus->bonus_week_start->toDateString());
        CarbonImmutable::setTestNow();
    }

    public function test_correcting_a_completed_week_reverses_an_invalid_weekly_bonus(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-21 08:00', 'Asia/Jakarta');
        $week = $reference->startOfWeek()->subWeeks(2);
        CarbonImmutable::setTestNow($reference);

        foreach (range(0, 4) as $offset) {
            $record = $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $week->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
            TransaksiPoin::query()->create([
                'anak_id' => $anak->id,
                'type' => 'poin_waktu_berangkat',
                'amount' => 3,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Poin waktu berangkat',
            ]);
        }

        $bonus = app(LayananBonusMingguan::class);
        $bonus->proses($anak, $reference);
        $record = $anak->catatanBerangkat()->oldest('tanggal_berangkat')->firstOrFail();

        $this->actingAs($user)->from('/catatan')->put('/catatan/'.$record->id, [
            'jam_berangkat' => '06:40',
        ])->assertRedirect('/catatan');

        $this->assertSame(-5, (int) $anak->transaksiPoin()->where('type', 'penyesuaian_bonus_mingguan')->sum('amount'));
        CarbonImmutable::setTestNow();
    }

    public function test_completed_week_correction_is_rejected_when_bonus_has_already_been_spent(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-21 08:00', 'Asia/Jakarta');
        $week = $reference->startOfWeek()->subWeeks(2);
        CarbonImmutable::setTestNow($reference);

        foreach (range(0, 4) as $offset) {
            $record = $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $week->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
            TransaksiPoin::query()->create([
                'anak_id' => $anak->id,
                'type' => 'poin_waktu_berangkat',
                'amount' => 3,
                'reference_type' => CatatanBerangkat::class,
                'reference_id' => $record->id,
                'description' => 'Poin waktu berangkat',
            ]);
        }

        app(LayananBonusMingguan::class)->proses($anak, $reference);
        TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'penukaran_hadiah',
            'amount' => -15,
            'description' => 'Bonus sudah digunakan',
        ]);
        $record = $anak->catatanBerangkat()->oldest('tanggal_berangkat')->firstOrFail();

        $this->actingAs($user)
            ->from('/catatan')
            ->put('/catatan/'.$record->id, ['jam_berangkat' => '06:40'])
            ->assertRedirect('/catatan')
            ->assertSessionHasErrors('jam_berangkat');

        $this->assertSame('06:10:00', $record->fresh()->jam_berangkat);
        $this->assertSame(5, (int) $anak->transaksiPoin()->sum('amount'));
        $this->assertSame(0, (int) $anak->transaksiPoin()->where('type', 'penyesuaian_bonus_mingguan')->sum('amount'));
        CarbonImmutable::setTestNow();
    }

    public function test_manual_historical_record_uses_the_configuration_snapshot_for_its_date(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-21 08:00', 'Asia/Jakarta');
        $recordDate = $reference->startOfWeek()->subWeeks(2);
        CarbonImmutable::setTestNow($reference);

        SnapshotPengaturan::query()->create([
            'user_id' => $user->id,
            'effective_date' => $recordDate->toDateString(),
            'on_time_target' => '06:30:00',
            'point_rules' => [['cutoff_time' => '06:30:00', 'points' => 3]],
            'school_days' => [1],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 1,
            'weekly_bonus_points' => 5,
        ]);
        $user->pengaturan()->update(['on_time_target' => '06:15:00', 'school_days' => [5]]);

        $this->actingAs($user)
            ->from('/catatan')
            ->post('/catatan', [
                'tanggal_berangkat' => $recordDate->toDateString(),
                'jam_berangkat' => '06:20',
            ])
            ->assertRedirect('/catatan');

        $record = $anak->catatanBerangkat()->sole();
        $this->assertSame('06:30:00', $record->target_tepat_waktu_saat_dicatat);
        $this->assertSame(3, $record->poin_didapat);
        CarbonImmutable::setTestNow();
    }

    public function test_note_only_record_edit_does_not_create_point_transactions(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $record = $anak->catatanBerangkat()->create([
            'tanggal_berangkat' => now()->subDay()->toDateString(),
            'jam_berangkat' => '06:10:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 3,
        ]);
        TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'poin_waktu_berangkat',
            'amount' => 3,
            'reference_type' => CatatanBerangkat::class,
            'reference_id' => $record->id,
            'description' => 'Poin waktu berangkat',
        ]);

        $this->actingAs($user)
            ->from('/catatan')
            ->put('/catatan/'.$record->id, [
                'jam_berangkat' => '06:10',
                'note' => 'Menunggu teman',
            ])
            ->assertRedirect('/catatan');

        $this->assertSame('Menunggu teman', $record->fresh()->note);
        $this->assertDatabaseCount('transaksi_poin', 1);
    }

    public function test_statistics_keeps_the_school_schedule_that_applied_to_a_past_week(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $reference = CarbonImmutable::parse('2026-09-14 08:00', 'Asia/Jakarta');
        $pastWeek = $reference->startOfWeek()->subWeek();
        CarbonImmutable::setTestNow($reference);
        SnapshotPengaturan::query()->create([
            'user_id' => $user->id,
            'effective_date' => $pastWeek->toDateString(),
            'school_days' => [1, 2, 3, 4, 5],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 5,
            'weekly_bonus_points' => 5,
        ]);
        SnapshotPengaturan::query()->create([
            'user_id' => $user->id,
            'effective_date' => $reference->toDateString(),
            'school_days' => [1],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 1,
            'weekly_bonus_points' => 5,
        ]);

        foreach (range(0, 4) as $offset) {
            $anak->catatanBerangkat()->create([
                'tanggal_berangkat' => $pastWeek->addDays($offset)->toDateString(),
                'jam_berangkat' => '06:10:00',
                'sumber' => 'manual',
                'target_tepat_waktu_saat_dicatat' => '06:30:00',
                'poin_didapat' => 3,
            ]);
        }

        $this->actingAs($user)->get('/statistik')->assertInertia(fn (Assert $page) => $page
            ->where('previousSummary.schoolDayCount', 5)
            ->where('previousSummary.onTimeCount', 5));
        CarbonImmutable::setTestNow();
    }

    public function test_demo_seeder_never_creates_a_bonus_for_an_incomplete_week(): void
    {
        $reference = CarbonImmutable::parse('2026-09-05 08:00', 'Asia/Jakarta');
        CarbonImmutable::setTestNow($reference);
        $user = User::factory()->create(['email' => 'aji@globaltesla.com', 'timezone' => 'Asia/Jakarta']);
        Anak::query()->create(['user_id' => $user->id, 'name' => 'Shaka', 'is_active' => true]);
        Pengaturan::query()->create([
            'user_id' => $user->id,
            'on_time_target' => '06:30:00',
            'school_days' => [1, 2, 3, 4, 5],
            'weekly_bonus_active' => true,
            'weekly_bonus_name' => 'Bonus konsisten',
            'weekly_bonus_days' => 4,
            'weekly_bonus_points' => 5,
        ]);

        $this->seed(PoinkaDemoSeeder::class);

        $this->assertSame(0, TransaksiPoin::query()->where('created_at', '>', $reference)->count());
        CarbonImmutable::setTestNow();
    }

    public function test_parent_can_adjust_balance_without_making_it_negative(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        TransaksiPoin::query()->create(['anak_id' => $anak->id, 'type' => 'bonus_manual', 'amount' => 5, 'description' => 'Saldo awal test']);

        $this->actingAs($user)->from('/catatan')->post('/penyesuaian-poin', ['amount' => -2, 'description' => 'Koreksi kecil'])->assertRedirect('/catatan');
        $this->assertSame(3, (int) $anak->transaksiPoin()->sum('amount'));

        $this->actingAs($user)
            ->from('/catatan')
            ->post('/penyesuaian-poin', ['amount' => -4, 'description' => 'Terlalu besar'])
            ->assertRedirect('/catatan')
            ->assertSessionHasErrors('amount');
        $this->assertSame(3, (int) $anak->transaksiPoin()->sum('amount'));
    }

    public function test_point_adjustment_validation_is_shown_in_indonesian(): void
    {
        [$user] = $this->makeChildWithRules();

        $this->actingAs($user)
            ->from('/catatan')
            ->post('/penyesuaian-poin', [
                'amount' => 'bukan angka',
                'description' => 'Koreksi kecil',
            ])
            ->assertRedirect('/catatan')
            ->assertSessionHasErrors([
                'amount' => 'jumlah poin harus berupa bilangan bulat.',
            ]);
    }

    public function test_parent_can_cancel_manual_adjustment_and_keep_audit_trail(): void
    {
        [$user, $anak] = $this->makeChildWithRules();

        $this->actingAs($user)
            ->from('/catatan')
            ->post('/penyesuaian-poin', [
                'amount' => 5,
                'description' => 'Koreksi saldo',
            ])
            ->assertRedirect('/catatan');

        $adjustment = $anak->transaksiPoin()->where('type', 'penyesuaian_manual')->sole();

        $this->actingAs($user)
            ->from('/riwayat-poin')
            ->post('/penyesuaian-poin/'.$adjustment->id.'/batal')
            ->assertRedirect('/riwayat-poin');

        $this->assertSame(0, (int) $anak->transaksiPoin()->sum('amount'));
        $this->assertDatabaseHas('transaksi_poin', [
            'type' => 'pembatalan_penyesuaian',
            'amount' => -5,
            'reference_type' => TransaksiPoin::class,
            'reference_id' => $adjustment->id,
        ]);
        $this->assertDatabaseCount('transaksi_poin', 2);

        $this->actingAs($user)
            ->post('/penyesuaian-poin/'.$adjustment->id.'/batal')
            ->assertRedirect();
        $this->assertDatabaseCount('transaksi_poin', 2);
    }

    public function test_manual_adjustment_cannot_be_cancelled_when_balance_would_turn_negative(): void
    {
        [$user, $anak] = $this->makeChildWithRules();

        $this->actingAs($user)
            ->from('/catatan')
            ->post('/penyesuaian-poin', [
                'amount' => 5,
                'description' => 'Koreksi saldo',
            ])
            ->assertRedirect('/catatan');

        $adjustment = $anak->transaksiPoin()->where('type', 'penyesuaian_manual')->sole();
        TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'bonus_manual',
            'amount' => -5,
            'description' => 'Poin terpakai',
        ]);

        $this->actingAs($user)
            ->from('/riwayat-poin')
            ->post('/penyesuaian-poin/'.$adjustment->id.'/batal')
            ->assertRedirect('/riwayat-poin')
            ->assertSessionHasErrors('adjustment');

        $this->assertSame(0, (int) $anak->transaksiPoin()->sum('amount'));
        $this->assertDatabaseCount('transaksi_poin', 2);
    }

    public function test_orphan_point_transaction_repair_only_removes_missing_record_references(): void
    {
        [$user, $anak] = $this->makeChildWithRules();
        $record = CatatanBerangkat::query()->create([
            'anak_id' => $anak->id,
            'tanggal_berangkat' => '2026-08-28',
            'jam_berangkat' => '06:10:00',
            'sumber' => 'manual',
            'target_tepat_waktu_saat_dicatat' => '06:30:00',
            'poin_didapat' => 3,
        ]);
        $valid = TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'poin_waktu_berangkat',
            'amount' => 3,
            'reference_type' => CatatanBerangkat::class,
            'reference_id' => $record->id,
            'description' => 'Poin valid',
        ]);
        $orphan = TransaksiPoin::query()->create([
            'anak_id' => $anak->id,
            'type' => 'poin_waktu_berangkat',
            'amount' => 3,
            'reference_type' => CatatanBerangkat::class,
            'reference_id' => 999999,
            'description' => 'Poin yatim',
        ]);

        $this->artisan('poinka:repair-orphan-point-transactions')
            ->expectsOutputToContain('Ditemukan 1 transaksi yatim')
            ->assertSuccessful();
        $this->assertDatabaseHas('transaksi_poin', ['id' => $orphan->id]);

        $this->artisan('poinka:repair-orphan-point-transactions', ['--fix' => true])->assertSuccessful();
        $this->assertDatabaseMissing('transaksi_poin', ['id' => $orphan->id]);
        $this->assertDatabaseHas('transaksi_poin', ['id' => $valid->id]);
    }

    /**
     * @return array{0: User, 1: Anak}
     */
    private function makeChildWithRules(): array
    {
        $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
        $anak = Anak::query()->create(['user_id' => $user->id, 'name' => 'Shaka', 'is_active' => true]);
        Pengaturan::query()->create([
            'user_id' => $user->id,
            'on_time_target' => '06:30:00',
            'school_days' => [1, 2, 3, 4, 5, 6, 7],
        ]);
        AturanPoin::query()->insert([
            ['user_id' => $user->id, 'cutoff_time' => '06:15:00', 'poin' => 3, 'sort_order' => 1, 'is_active' => true],
            ['user_id' => $user->id, 'cutoff_time' => '06:20:00', 'poin' => 2, 'sort_order' => 2, 'is_active' => true],
            ['user_id' => $user->id, 'cutoff_time' => '06:30:00', 'poin' => 1, 'sort_order' => 3, 'is_active' => true],
        ]);

        return [$user, $anak];
    }
}
