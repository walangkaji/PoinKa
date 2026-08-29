import {
    CalendarDots,
    Check,
    Clock,
    GearSix,
    Plus,
    SignOut,
    Trash,
    UserCircle,
} from '@phosphor-icons/react';
import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../Components/ConfirmDialog';
import {
    Checkbox,
    DatePicker,
    SelectMenu,
    TargetTimePicker,
    TimePicker,
} from '../Components/FormControls';
import ProductShell from '../Components/ProductShell';

const days = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' },
];

const calendarTypes = [
    { value: 'libur', label: 'Hari libur' },
    { value: 'tidak_ada_sekolah', label: 'Tidak ada sekolah' },
    { value: 'izin', label: 'Izin' },
];

function nextCutoff(value) {
    const parts = String(value || '06:30')
        .split(':')
        .map(Number);
    const total = Math.min(parts[0] * 60 + parts[1] + 5, 23 * 60 + 59);

    return [
        String(Math.floor(total / 60)).padStart(2, '0'),
        String(total % 60).padStart(2, '0'),
    ].join(':');
}

function CalendarPagination({ pagination }) {
    if (!pagination || pagination.lastPage <= 1) return null;

    const isFirstPage = pagination.currentPage <= 1;
    const isLastPage = pagination.currentPage >= pagination.lastPage;

    return (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf0e9] pt-4">
            <span className="text-xs font-semibold text-[#8ca198]">
                Halaman {pagination.currentPage} dari {pagination.lastPage}
            </span>
            <div className="flex items-center gap-2">
                <Link
                    href={`/pengaturan?calendar_page=${pagination.currentPage - 1}`}
                    preserveScroll
                    aria-disabled={isFirstPage}
                    tabIndex={isFirstPage ? -1 : undefined}
                    className={
                        'flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ring-1 ring-[#e1e8e1] ' +
                        (isFirstPage
                            ? 'pointer-events-none opacity-40'
                            : 'text-[#527268] hover:bg-[#edf0e9]')
                    }>
                    Sebelumnya
                </Link>
                <Link
                    href={`/pengaturan?calendar_page=${pagination.currentPage + 1}`}
                    preserveScroll
                    aria-disabled={isLastPage}
                    tabIndex={isLastPage ? -1 : undefined}
                    className={
                        'flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ring-1 ring-[#e1e8e1] ' +
                        (isLastPage
                            ? 'pointer-events-none opacity-40'
                            : 'text-[#527268] hover:bg-[#edf0e9]')
                    }>
                    Berikutnya
                </Link>
            </div>
        </div>
    );
}

export default function Pengaturan({
    settings,
    rules,
    calendar,
    calendarPagination,
    child,
    flash,
    today,
}) {
    const form = useForm({
        on_time_target: settings.onTimeTarget,
        school_days: settings.schoolDays,
        rules: rules.map((rule) => ({
            id: rule.id,
            key: rule.id,
            cutoff_time: rule.cutoffTime,
            points: rule.points,
        })),
        removed_rule_ids: [],
        weekly_bonus_active: settings.weeklyBonusActive,
        weekly_bonus_name: settings.weeklyBonusName,
        weekly_bonus_days: settings.weeklyBonusDays,
        weekly_bonus_points: settings.weeklyBonusPoints,
    });
    const profileForm = useForm({ name: child.name });
    const calendarForm = useForm({ date: '', type: 'libur', description: '' });
    const [confirmation, setConfirmation] = useState(null);
    const [showStickySave, setShowStickySave] = useState(false);
    const saveButtonRef = useRef(null);

    useEffect(() => {
        function updateStickyState() {
            const button = saveButtonRef.current;
            if (!button) {
                setShowStickySave(false);
                return;
            }

            const bounds = button.getBoundingClientRect();
            setShowStickySave(bounds.top > window.innerHeight);
        }

        updateStickyState();
        window.addEventListener('scroll', updateStickyState, { passive: true });
        window.addEventListener('resize', updateStickyState);

        return () => {
            window.removeEventListener('scroll', updateStickyState);
            window.removeEventListener('resize', updateStickyState);
        };
    }, [form.isDirty]);

    function toggleDay(day) {
        const schoolDays = form.data.school_days.includes(day)
            ? form.data.school_days.filter((value) => value !== day)
            : [...form.data.school_days, day].sort((a, b) => a - b);
        form.setData('school_days', schoolDays);
    }

    function updateRule(index, key, value) {
        form.setData(
            'rules',
            form.data.rules.map((rule, ruleIndex) =>
                ruleIndex === index ? { ...rule, [key]: value } : rule,
            ),
        );
    }

    function addRule() {
        const previous = form.data.rules.at(-1);
        form.setData('rules', [
            ...form.data.rules,
            {
                id: null,
                key: 'new-' + Date.now(),
                cutoff_time: nextCutoff(previous?.cutoff_time),
                points: 0,
            },
        ]);
    }

    function removeRule(index) {
        if (form.data.rules.length <= 1) return;
        const removed = form.data.rules[index];
        form.setData(
            'rules',
            form.data.rules.filter((_, ruleIndex) => ruleIndex !== index),
        );
        if (removed.id)
            form.setData('removed_rule_ids', [...form.data.removed_rule_ids, removed.id]);
    }

    function submitSettings(event) {
        event.preventDefault();
        form.transform((data) => ({ ...data, rules: data.rules.map(({ key, ...rule }) => rule) }));
        form.put('/pengaturan', { preserveScroll: true, onSuccess: () => form.setDefaults() });
    }

    function submitProfile(event) {
        event.preventDefault();
        profileForm.post('/profil-anak', {
            preserveScroll: true,
            onSuccess: () => profileForm.setDefaults(),
        });
    }

    function submitCalendar(event) {
        event.preventDefault();
        calendarForm.post('/kalender-sekolah', {
            preserveScroll: true,
            onSuccess: () => calendarForm.reset(),
        });
    }

    function deleteCalendarEntry(entry) {
        setConfirmation({
            title: 'Hapus tanggal khusus?',
            message: entry.date + ' akan dihapus dari kalender sekolah.',
            confirmLabel: 'Hapus Tanggal',
            tone: 'danger',
            onConfirm: () => {
                setConfirmation(null);
                router.delete('/kalender-sekolah/' + entry.id, { preserveScroll: true });
            },
        });
    }

    return (
        <ProductShell
            active="pengaturan"
            eyebrow="Atur sesuai keluarga"
            title="Pengaturan"
            flash={flash}>
            <ConfirmDialog
                open={Boolean(confirmation)}
                title={confirmation?.title}
                message={confirmation?.message}
                confirmLabel={confirmation?.confirmLabel}
                tone={confirmation?.tone}
                onConfirm={confirmation?.onConfirm}
                onCancel={() => setConfirmation(null)}
            />
            <section className="rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <UserCircle size={22} weight="duotone" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">Profil anak</h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Perbarui informasi yang tampil di aplikasi.
                        </p>
                    </div>
                </div>
                <form noValidate className="mt-5 flex flex-col gap-4" onSubmit={submitProfile}>
                    <label className="block">
                        <span className="text-sm font-semibold text-[#31554a]">Nama anak</span>
                        <input
                            value={profileForm.data.name}
                            onChange={(event) => profileForm.setData('name', event.target.value)}
                            className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                        />
                        {profileForm.errors.name && (
                            <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                {profileForm.errors.name}
                            </span>
                        )}
                    </label>
                    {profileForm.isDirty && (
                        <button
                            type="submit"
                            disabled={profileForm.processing}
                            className="flex min-h-12 self-center items-center gap-2 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
                            <Check size={17} weight="bold" />
                            {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    )}
                </form>
            </section>
            <form id="settings-form" noValidate onSubmit={submitSettings}>
                <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <GearSix size={21} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Aturan harian
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">
                                Perubahan ini dipakai untuk pencatatan berikutnya.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <TargetTimePicker
                            label="Target tepat waktu"
                            helper="Berangkat sampai jam ini masih dihitung tepat waktu."
                            value={form.data.on_time_target}
                            onChange={(value) => form.setData('on_time_target', value)}
                            error={form.errors.on_time_target}
                        />
                    </div>
                    <fieldset className="mt-6">
                        <legend className="text-sm font-semibold text-[#31554a]">
                            Hari sekolah
                        </legend>
                        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
                            {days.map((day) => {
                                const selected = form.data.school_days.includes(day.value);
                                return (
                                    <button
                                        type="button"
                                        key={day.value}
                                        onClick={() => toggleDay(day.value)}
                                        aria-pressed={selected}
                                        className={
                                            'min-h-11 min-w-0 whitespace-nowrap rounded-xl px-1 text-[11px] font-bold leading-none transition-colors sm:px-0 sm:text-xs ' +
                                            (selected
                                                ? 'bg-[#3d8a70] text-white'
                                                : 'bg-[#f5f2ec] text-[#8ca198] ring-1 ring-[#e1e8e1]')
                                        }>
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                        {form.errors.school_days && (
                            <p className="mt-2 text-xs font-medium text-[#a3622e]">
                                Pilih setidaknya satu hari sekolah.
                            </p>
                        )}
                    </fieldset>
                </section>
                <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <Clock size={21} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Aturan poin
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">
                                Semakin awal, poin bisa semakin besar.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 space-y-4">
                        {form.data.rules.map((rule, index) => (
                            <div
                                className="grid min-w-0 grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)_auto] items-end gap-2"
                                key={rule.key}>
                                <TimePicker
                                    label="Sampai jam"
                                    value={rule.cutoff_time}
                                    onChange={(value) => updateRule(index, 'cutoff_time', value)}
                                    error={form.errors['rules.' + index + '.cutoff_time']}
                                />
                                <label className="block min-w-0">
                                    <span className="text-sm font-semibold text-[#31554a]">
                                        Poin
                                    </span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={rule.points}
                                        onChange={(event) =>
                                            updateRule(
                                                index,
                                                'points',
                                                event.target.value.replace(/\D/g, ''),
                                            )
                                        }
                                        className="mt-2 block h-14 w-full min-w-0 rounded-2xl bg-[#f5f2ec] px-3 py-0 text-center text-base outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                                    />
                                    {form.errors['rules.' + index + '.points'] && (
                                        <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                            {form.errors['rules.' + index + '.points']}
                                        </span>
                                    )}
                                </label>
                                <button
                                    type="button"
                                    aria-label="Hapus aturan poin"
                                    onClick={() => removeRule(index)}
                                    disabled={form.data.rules.length <= 1}
                                    className="mb-0 flex h-11 w-11 items-center justify-center rounded-xl text-[#a3622e] transition-colors hover:bg-[#f5e4d8] disabled:cursor-not-allowed disabled:opacity-30">
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {form.errors.rules && (
                        <p className="mt-2 text-xs font-medium text-[#a3622e]">
                            {form.errors.rules}
                        </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={addRule}
                            className="mx-auto flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#3d8a70] ring-1 ring-[#cbdccc] transition-colors hover:bg-[#edf0e9]">
                            <Plus size={16} weight="bold" />
                            Tambah Aturan
                        </button>
                    </div>
                </section>
                <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <Check size={21} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Bonus mingguan
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">
                                Bonus diberikan setelah target konsistensi tercapai.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Checkbox
                            checked={form.data.weekly_bonus_active}
                            onChange={(value) => form.setData('weekly_bonus_active', value)}>
                            Aktifkan bonus mingguan
                        </Checkbox>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <label className="block">
                            <span className="text-sm font-semibold text-[#31554a]">Nama bonus</span>
                            <input
                                value={form.data.weekly_bonus_name}
                                onChange={(event) =>
                                    form.setData('weekly_bonus_name', event.target.value)
                                }
                                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 text-base outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                            />
                            {form.errors.weekly_bonus_name && (
                                <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                    {form.errors.weekly_bonus_name}
                                </span>
                            )}
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[#31554a]">
                                Hari tepat waktu
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.data.weekly_bonus_days}
                                onChange={(event) =>
                                    form.setData(
                                        'weekly_bonus_days',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 text-base outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                            />
                            {form.errors.weekly_bonus_days && (
                                <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                    {form.errors.weekly_bonus_days}
                                </span>
                            )}
                        </label>
                        <label className="block">
                            <span className="text-sm font-semibold text-[#31554a]">Bonus poin</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.data.weekly_bonus_points}
                                onChange={(event) =>
                                    form.setData(
                                        'weekly_bonus_points',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 text-base outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                            />
                            {form.errors.weekly_bonus_points && (
                                <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                    {form.errors.weekly_bonus_points}
                                </span>
                            )}
                        </label>
                    </div>
                </section>
                {form.isDirty && (
                    <div className="mt-5 flex justify-center">
                        <button
                            ref={saveButtonRef}
                            type="submit"
                            disabled={form.processing}
                            className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white disabled:opacity-60">
                            <Check size={17} weight="bold" />
                            {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                )}
            </form>
            {form.isDirty && showStickySave && (
                <div className="fixed inset-x-4 bottom-24 z-10 flex justify-center sm:bottom-6">
                    <button
                        type="submit"
                        form="settings-form"
                        disabled={form.processing}
                        className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(23,52,45,0.22)] disabled:opacity-60">
                        <Check size={17} weight="bold" />
                        {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                </div>
            )}
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <CalendarDots size={21} weight="duotone" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">
                            Kalender sekolah
                        </h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Tanggal khusus lebih kuat daripada jadwal biasa.
                        </p>
                    </div>
                </div>
                <form noValidate className="mt-5 space-y-4" onSubmit={submitCalendar}>
                    <DatePicker
                        label="Tanggal"
                        value={calendarForm.data.date}
                        onChange={(value) => calendarForm.setData('date', value)}
                        error={calendarForm.errors.date}
                        min={today}
                    />
                    <div className="block">
                        <span className="text-sm font-semibold text-[#31554a]">Jenis tanggal</span>
                        <SelectMenu
                            className="mt-2"
                            value={calendarForm.data.type}
                            options={calendarTypes}
                            onChange={(value) => calendarForm.setData('type', value)}
                            ariaLabel="Pilih jenis tanggal khusus"
                        />
                        {calendarForm.errors.type && (
                            <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                {calendarForm.errors.type}
                            </span>
                        )}
                    </div>
                    <label className="block">
                        <span className="text-sm font-semibold text-[#31554a]">
                            Keterangan{' '}
                            <span className="font-normal text-[#8ca198]">(opsional)</span>
                        </span>
                        <input
                            type="text"
                            placeholder="Contoh: Libur keluarga"
                            value={calendarForm.data.description}
                            onChange={(event) =>
                                calendarForm.setData('description', event.target.value)
                            }
                            className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                        />
                        {calendarForm.errors.description && (
                            <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                {calendarForm.errors.description}
                            </span>
                        )}
                    </label>
                    <button
                        type="submit"
                        disabled={calendarForm.processing || !calendarForm.isDirty}
                        className="mx-auto block min-h-12 rounded-2xl bg-[#3d8a70] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {calendarForm.processing ? 'Menyimpan...' : 'Tambah Tanggal'}
                    </button>
                </form>
                <div className="mt-5 divide-y divide-[#edf0e9]">
                    {calendar.length === 0 ? (
                        <p className="py-4 text-sm text-[#789088]">
                            Belum ada tanggal khusus ke depan.
                        </p>
                    ) : (
                        calendar.map((entry) => (
                            <div className="flex items-center gap-3 py-4" key={entry.id}>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{entry.date}</p>
                                    <p className="text-xs text-[#789088]">
                                        {
                                            calendarTypes.find((type) => type.value === entry.type)
                                                ?.label
                                        }
                                        {entry.description ? ' · ' + entry.description : ''}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={'Hapus tanggal ' + entry.date}
                                    onClick={() => deleteCalendarEntry(entry)}
                                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#a3622e] hover:bg-[#f5e4d8]">
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <CalendarPagination pagination={calendarPagination} />
            </section>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">Akun</h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Keluar hanya saat Anda memang ingin mengakhiri sesi.
                        </p>
                    </div>
                    <SignOut size={22} className="text-[#a3622e]" />
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="mt-5 min-h-12 w-full rounded-2xl bg-[#f5e4d8] px-5 text-sm font-bold text-[#8a552c] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985]">
                    Keluar Dari Akun
                </button>
            </section>
        </ProductShell>
    );
}
