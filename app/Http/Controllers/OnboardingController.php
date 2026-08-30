<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LayananSnapshotPengaturan;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if ($request->user()->anak()->exists()) {
            return redirect()->route('home');
        }

        return Inertia::render('Onboarding', [
            'defaults' => [
                'target'     => '06:30',
                'schoolDays' => [1, 2, 3, 4, 5],
            ],
        ]);
    }

    public function store(Request $request, LayananSnapshotPengaturan $snapshotPengaturan): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'child_name'     => ['required', 'string', 'max:100'],
            'on_time_target' => ['required', 'date_format:H:i'],
            'school_days'    => ['required', 'array', 'min:1'],
            'school_days.*'  => ['integer', 'between:1,7', 'distinct'],
        ]);
        $validator->after(function ($validator) use ($request): void {
            if ($request->input('on_time_target') && $request->input('on_time_target') < '00:15') {
                $validator->errors()->add('on_time_target', 'Target tepat waktu paling awal adalah 00:15.');
            }
        });
        $data = $validator->validate();

        $user = $request->user();

        DB::transaction(function () use ($data, $user, $snapshotPengaturan): void {
            $user = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($user->anak()->exists()) {
                return;
            }

            $user->anak()->create([
                'name'      => $data['child_name'],
                'is_active' => true,
            ]);

            $user->pengaturan()->create([
                'on_time_target' => $data['on_time_target'] . ':00',
                'school_days'    => array_values(array_map('intval', $data['school_days'])),
            ]);

            $target = CarbonImmutable::createFromFormat('H:i', $data['on_time_target']);
            $user->aturanPoin()->createMany([
                ['cutoff_time' => $target->subMinutes(15)->format('H:i:s'), 'poin' => 3, 'sort_order' => 1, 'is_active' => true],
                ['cutoff_time' => $target->subMinutes(10)->format('H:i:s'), 'poin' => 2, 'sort_order' => 2, 'is_active' => true],
                ['cutoff_time' => $target->format('H:i:s'), 'poin' => 1, 'sort_order' => 3, 'is_active' => true],
            ]);
            $snapshotPengaturan->simpan($user, CarbonImmutable::now($user->timezone ?: config('app.timezone'))->startOfDay());
        });

        return redirect()->route('home');
    }
}
