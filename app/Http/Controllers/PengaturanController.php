<?php

namespace App\Http\Controllers;

use App\Services\LayananSnapshotPengaturan;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user()->load(['anak', 'pengaturan']);

        if (! $user->anak || ! $user->pengaturan) {
            return redirect()->route('onboarding');
        }
        $today = CarbonImmutable::now($user->timezone ?: config('app.timezone'))->toDateString();

        $calendar = $user->kalenderSekolah()
            ->whereDate('date', '>=', $today)
            ->orderBy('date')
            ->paginate(10, ['*'], 'calendar_page')
            ->withQueryString();

        return Inertia::render('Pengaturan', [
            'settings' => [
                'onTimeTarget'      => substr($user->pengaturan->on_time_target, 0, 5),
                'schoolDays'        => $user->pengaturan->school_days,
                'weeklyBonusActive' => $user->pengaturan->weekly_bonus_active,
                'weeklyBonusName'   => $user->pengaturan->weekly_bonus_name,
                'weeklyBonusDays'   => $user->pengaturan->weekly_bonus_days,
                'weeklyBonusPoints' => $user->pengaturan->weekly_bonus_points,
            ],
            'today' => $today,
            'child' => [
                'name' => $user->anak->name,
            ],
            'rules' => $user->aturanPoin()->where('is_active', true)->orderBy('sort_order')->get()->map(fn ($rule): array => [
                'id'         => $rule->id,
                'cutoffTime' => substr($rule->cutoff_time, 0, 5),
                'points'     => $rule->poin,
            ])->values()->all(),
            'calendar' => $calendar->getCollection()->map(fn ($entry): array => [
                'id'          => $entry->id,
                'date'        => $entry->date->locale('id')->translatedFormat('l, d F Y'),
                'type'        => $entry->type,
                'description' => $entry->description,
            ])->values()->all(),
            'calendarPagination' => [
                'currentPage' => $calendar->currentPage(),
                'lastPage'    => $calendar->lastPage(),
                'total'       => $calendar->total(),
            ],
        ]);
    }

    public function update(Request $request, LayananSnapshotPengaturan $snapshotPengaturan): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'on_time_target'      => ['required', 'date_format:H:i'],
            'school_days'         => ['required', 'array', 'min:1'],
            'school_days.*'       => ['integer', 'between:1,7', 'distinct'],
            'rules'               => ['required', 'array', 'min:1'],
            'rules.*.id'          => ['nullable', 'integer'],
            'rules.*.cutoff_time' => ['required', 'date_format:H:i'],
            'rules.*.points'      => ['required', 'integer', 'min:0'],
            'removed_rule_ids'    => ['nullable', 'array'],
            'removed_rule_ids.*'  => ['integer', 'distinct'],
            'weekly_bonus_active' => ['sometimes', 'boolean'],
            'weekly_bonus_name'   => ['sometimes', 'required', 'string', 'max:100'],
            'weekly_bonus_days'   => ['sometimes', 'required', 'integer', 'min:1', 'max:7'],
            'weekly_bonus_points' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);
        $validator->after(function ($validator) use ($request): void {
            $rules = $request->input('rules', []);
            $times = collect($rules)->pluck('cutoff_time')->values()->all();

            if (\count($times) > 1 && $times !== collect($times)->sort()->values()->all()) {
                $validator->errors()->add('rules', 'Urutkan batas waktu dari yang paling awal.');
            }

            if (\count($times) !== \count(array_unique($times))) {
                $validator->errors()->add('rules', 'Batas waktu aturan poin tidak boleh sama.');
            }

            $points = collect($rules)->pluck('points')->map(fn ($points): int => (int) $points)->values();

            if ($points->count() > 1 && $points->values()->all() !== $points->sortDesc()->values()->all()) {
                $validator->errors()->add('rules', 'Poin harus berkurang atau tetap saat batas waktunya makin lambat.');
            }
            $target = $request->input('on_time_target');

            if ($target && collect($times)->contains(fn (string $time): bool => $time > $target)) {
                $validator->errors()->add('rules', 'Batas waktu poin tidak boleh melewati target tepat waktu.');
            }

            if ((int) $request->input('weekly_bonus_days', 0) > \count($request->input('school_days', []))) {
                $validator->errors()->add('weekly_bonus_days', 'Target bonus tidak boleh melebihi jumlah hari sekolah.');
            }

            $ids = collect($rules)->pluck('id')->filter()->map(fn ($id): int => (int) $id)->unique()->values();

            if ($ids->count() !== $request->user()->aturanPoin()->whereIn('id', $ids)->count()) {
                $validator->errors()->add('rules', 'Aturan poin tidak valid.');
            }
        });
        $data = $validator->validate();
        $user = $request->user();

        DB::transaction(function () use ($data, $user, $snapshotPengaturan): void {
            $settings = [
                'on_time_target' => $data['on_time_target'] . ':00',
                'school_days'    => array_values(array_map('intval', $data['school_days'])),
            ];

            if (\array_key_exists('weekly_bonus_active', $data)) {
                $settings['weekly_bonus_active'] = (bool) $data['weekly_bonus_active'];
            }

            if (\array_key_exists('weekly_bonus_name', $data)) {
                $settings['weekly_bonus_name'] = trim($data['weekly_bonus_name']);
            }

            if (\array_key_exists('weekly_bonus_days', $data)) {
                $settings['weekly_bonus_days'] = $data['weekly_bonus_days'];
            }

            if (\array_key_exists('weekly_bonus_points', $data)) {
                $settings['weekly_bonus_points'] = $data['weekly_bonus_points'];
            }
            $user->pengaturan()->update($settings);

            foreach ($data['removed_rule_ids'] ?? [] as $removedRuleId) {
                $user->aturanPoin()->whereKey($removedRuleId)->update(['is_active' => false]);
            }

            foreach ($data['rules'] as $index => $ruleData) {
                $rule = $user->aturanPoin()->whereKey($ruleData['id'] ?? 0)->first();

                if ($rule) {
                    $rule->update([
                        'cutoff_time' => $ruleData['cutoff_time'],
                        'poin'        => $ruleData['points'],
                        'sort_order'  => $index + 1,
                        'is_active'   => true,
                    ]);
                } else {
                    $user->aturanPoin()->create([
                        'cutoff_time' => $ruleData['cutoff_time'] . ':00',
                        'poin'        => $ruleData['points'],
                        'sort_order'  => $index + 1,
                        'is_active'   => true,
                    ]);
                }
            }

            $timezone = $user->timezone ?: config('app.timezone');
            $snapshotPengaturan->simpan($user, CarbonImmutable::now($timezone)->startOfDay());
        });

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
