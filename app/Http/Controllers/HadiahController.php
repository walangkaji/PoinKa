<?php

namespace App\Http\Controllers;

use App\Models\Hadiah;
use App\Models\PenukaranHadiah;
use App\Models\TransaksiPoin;
use App\Services\LayananBonusMingguan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Format;
use Intervention\Image\Laravel\Facades\Image;

class HadiahController extends Controller
{
    public function index(Request $request, LayananBonusMingguan $bonus): Response|RedirectResponse
    {
        if (! $request->user()->anak) {
            return redirect()->route('onboarding');
        }

        $anak = $request->user()->anak;
        $bonus->proses($anak);

        $redemptions = $anak->penukaranHadiah()
            ->with('hadiah')
            ->latest('redeemed_at')
            ->paginate(10, ['*'], 'redemption_page')
            ->withQueryString();

        return Inertia::render('Hadiah', [
            'balance'     => (int) $anak->transaksiPoin()->sum('amount'),
            'redemptions' => $redemptions->getCollection()->map(fn (PenukaranHadiah $redemption): array => [
                'id'         => $redemption->id,
                'rewardName' => $redemption->hadiah?->name ?? 'Hadiah',
                'cost'       => $redemption->poin_cost_snapshot,
                'date'       => $redemption->redeemed_at->locale('id')->translatedFormat('l, d F Y'),
                'time'       => $redemption->redeemed_at->format('H:i'),
                'status'     => $redemption->status,
            ])->values()->all(),
            'redemptionPagination' => [
                'currentPage' => $redemptions->currentPage(),
                'lastPage'    => $redemptions->lastPage(),
                'total'       => $redemptions->total(),
            ],
            'rewards' => $request->user()->hadiah()->where('is_active', true)->latest()->get()->map(fn (Hadiah $reward): array => [
                'id'          => $reward->id,
                'name'        => $reward->name,
                'description' => $reward->description,
                'imageUrl'    => $reward->image ? '/storage/' . ltrim($reward->image, '/') : null,
                'cost'        => $reward->poin_cost,
                'isTarget'    => $reward->is_target,
            ])->values()->all(),
            'pointRules' => $request->user()->aturanPoin()->where('is_active', true)->orderBy('sort_order')->get()->map(fn ($rule): array => [
                'cutoffTime' => substr($rule->cutoff_time, 0, 5),
                'points'     => (int) $rule->poin,
            ])->values()->all(),
            'settings' => [
                'schoolDays'        => $request->user()->pengaturan->school_days,
                'weeklyBonusActive' => (bool) $request->user()->pengaturan->weekly_bonus_active,
                'weeklyBonusDays'   => (int) $request->user()->pengaturan->weekly_bonus_days,
                'weeklyBonusPoints' => (int) $request->user()->pengaturan->weekly_bonus_points,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['name' => Str::title(trim((string) $request->input('name')))]);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('hadiah', 'name')->where(fn ($query) => $query->where('user_id', $request->user()->id)),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'poin_cost'   => ['required', 'integer', 'min:1'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'name.unique' => 'Nama hadiah sudah digunakan. Pilih nama lain.',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $this->storeOptimizedImage($request->file('image'));
        }

        $request->user()->hadiah()->create($data + ['is_active' => true, 'is_target' => false]);

        return back()->with('success', 'Hadiah berhasil ditambahkan.');
    }

    public function update(Request $request, Hadiah $hadiah): RedirectResponse
    {
        abort_unless($hadiah->user_id === $request->user()->id, 404);

        $request->merge(['name' => Str::title(trim((string) $request->input('name')))]);

        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('hadiah', 'name')
                    ->where(fn ($query) => $query->where('user_id', $request->user()->id))
                    ->ignore($hadiah->id),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'poin_cost'   => ['required', 'integer', 'min:1'],
            'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ], [
            'name.unique' => 'Nama hadiah sudah digunakan. Pilih nama lain.',
        ]);

        if ($request->hasFile('image')) {
            $oldImage      = $hadiah->image;
            $data['image'] = $this->storeOptimizedImage($request->file('image'));
            $hadiah->update($data);

            if ($oldImage) {
                Storage::disk('public')->delete($oldImage);
            }
        } else {
            $hadiah->update($data);
        }

        return back()->with('success', 'Hadiah berhasil diperbarui.');
    }

    public function destroy(Request $request, Hadiah $hadiah): RedirectResponse
    {
        abort_unless($hadiah->user_id === $request->user()->id, 404);

        if ($hadiah->penukaran()->exists()) {
            $hadiah->update(['is_active' => false, 'is_target' => false]);

            return back()->with('success', 'Hadiah diarsipkan karena sudah pernah ditukar.');
        }

        if ($hadiah->image) {
            Storage::disk('public')->delete($hadiah->image);
        }
        $hadiah->delete();

        return back()->with('success', 'Hadiah berhasil dihapus.');
    }

    public function target(Request $request, Hadiah $hadiah): RedirectResponse
    {
        abort_unless($hadiah->user_id === $request->user()->id && $hadiah->is_active, 404);
        DB::transaction(function () use ($request, $hadiah): void {
            $request->user()->hadiah()->where('id', '!=', $hadiah->id)->update(['is_target' => false]);
            $hadiah->update(['is_target' => true]);
        });

        return back()->with('success', 'Target hadiah diperbarui.');
    }

    public function redeem(Request $request, Hadiah $hadiah): RedirectResponse
    {
        $data = $request->validate(['idempotency_key' => ['required', 'string', 'max:100']]);
        abort_unless($hadiah->user_id === $request->user()->id && $hadiah->is_active, 404);
        $anak = $request->user()->anak;
        abort_unless($anak, 404);

        $result = DB::transaction(function () use ($hadiah, $anak, $data): string {
            $hadiah = Hadiah::query()->lockForUpdate()->findOrFail($hadiah->id);

            if (PenukaranHadiah::query()->where('idempotency_key', $data['idempotency_key'])->exists()) {
                return 'already_redeemed';
            }

            $balance = (int) $anak->transaksiPoin()->lockForUpdate()->sum('amount');

            if ($balance < $hadiah->poin_cost) {
                return 'insufficient';
            }

            $redemption = PenukaranHadiah::query()->create([
                'anak_id'            => $anak->id,
                'hadiah_id'          => $hadiah->id,
                'poin_cost_snapshot' => $hadiah->poin_cost,
                'redeemed_at'        => now(),
                'idempotency_key'    => $data['idempotency_key'],
                'status'             => 'active',
            ]);
            TransaksiPoin::query()->create([
                'anak_id'        => $anak->id,
                'type'           => 'penukaran_hadiah',
                'amount'         => -$hadiah->poin_cost,
                'reference_type' => PenukaranHadiah::class,
                'reference_id'   => $redemption->id,
                'description'    => 'Penukaran hadiah: ' . $hadiah->name,
                'metadata_json'  => ['poin_cost_snapshot' => $hadiah->poin_cost],
            ]);

            return 'redeemed';
        });

        return 'insufficient' === $result
            ? back()->withErrors(['reward' => 'Poin belum cukup untuk hadiah ini.'])
            : back()->with('success', 'Hadiah berhasil ditukar.');
    }

    public function cancel(Request $request, PenukaranHadiah $penukaranHadiah): RedirectResponse
    {
        $anak = $request->user()->anak;
        abort_unless($anak && $penukaranHadiah->anak_id === $anak->id, 404);

        $cancelled = DB::transaction(function () use ($penukaranHadiah, $anak): bool {
            $redemption = PenukaranHadiah::query()->lockForUpdate()->findOrFail($penukaranHadiah->id);

            if ('active' !== $redemption->status) {
                return false;
            }

            $redemption->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);

            TransaksiPoin::query()->create([
                'anak_id'        => $anak->id,
                'type'           => 'pembatalan_penukaran',
                'amount'         => $redemption->poin_cost_snapshot,
                'reference_type' => PenukaranHadiah::class,
                'reference_id'   => $redemption->id,
                'description'    => 'Pengembalian poin: pembatalan ' . $redemption->hadiah?->name,
                'metadata_json'  => ['poin_cost_snapshot' => $redemption->poin_cost_snapshot],
            ]);

            return true;
        });

        return back()->with('success', $cancelled ? 'Penukaran dibatalkan dan poin dikembalikan.' : 'Penukaran sudah dibatalkan sebelumnya.');
    }

    private function storeOptimizedImage(UploadedFile $image): string
    {
        $path = 'rewards/'.Str::uuid().'.webp';
        $optimized = Image::decode($image)
            ->scaleDown(width: 1200)
            ->encodeUsingFormat(Format::WEBP, quality: 80);

        Storage::disk('public')->put($path, $optimized);

        return $path;
    }
}
