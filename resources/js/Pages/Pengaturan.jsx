import {
    CalendarDots,
    Check,
    Clock,
    DotsThreeVertical,
    GearSix,
    Info,
    Plus,
    SignOut,
    Star,
    Trash,
    UserCircle,
    X,
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

function timeToMinutes(value) {
    const [hours = 0, minutes = 0] = String(value || '00:00')
        .split(':')
        .map(Number);

    return hours * 60 + minutes;
}

function minutesToTime(total) {
    const safeTotal = Math.max(0, Math.min(23 * 60 + 59, total));

    return `${String(Math.floor(safeTotal / 60)).padStart(2, '0')}:${String(safeTotal % 60).padStart(2, '0')}`;
}

function ruleRange(rules, index) {
    const current = rules[index]?.cutoff_time?.slice(0, 5) || '00:00';

    if (index === 0) return `Sebelum / Sampai ${current}`;

    const previous = timeToMinutes(rules[index - 1]?.cutoff_time);

    return `${minutesToTime(previous + 1)} - ${current}`;
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
    const [activeRuleIndex, setActiveRuleIndex] = useState(null);
    const [ruleDraft, setRuleDraft] = useState(null);
    const [ruleTimePickerOpen, setRuleTimePickerOpen] = useState(false);
    const [showStickySave, setShowStickySave] = useState(false);
    const saveButtonRef = useRef(null);

    useEffect(() => {
        const button = saveButtonRef.current;

        if (!form.isDirty || !button) {
            setShowStickySave(false);
            return undefined;
        }

        if (!('IntersectionObserver' in window)) {
            setShowStickySave(true);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => setShowStickySave(!entry.isIntersecting),
            { threshold: 0.1 },
        );

        observer.observe(button);

        return () => observer.disconnect();
    }, [form.isDirty]);

    useEffect(() => {
        if (activeRuleIndex === null) {
            setRuleTimePickerOpen(false);
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setActiveRuleIndex(null);
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeRuleIndex]);

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

    function openRuleEditor(index) {
        const rule = form.data.rules[index];
        setRuleTimePickerOpen(false);
        setActiveRuleIndex(index);
        setRuleDraft({ cutoff_time: rule.cutoff_time, points: Number(rule.points) || 0 });
    }

    function saveRuleDraft() {
        if (activeRuleIndex === null || !ruleDraft) return;

        const nextRules = form.data.rules.map((rule, index) =>
            index === activeRuleIndex
                ? { ...rule, cutoff_time: ruleDraft.cutoff_time, points: ruleDraft.points }
                : rule,
        );

        form.setData('rules', nextRules);
        persistSettings(nextRules, () => setActiveRuleIndex(null));
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
        setActiveRuleIndex(null);
    }

    function persistSettings(nextRules, onSuccess) {
        form.transform((data) => ({
            ...data,
            rules: nextRules.map(({ key, ...rule }) => rule),
        }));
        form.put('/pengaturan', {
            preserveScroll: true,
            onSuccess: () => {
                form.setDefaults();
                onSuccess?.();
            },
        });
    }

    function submitSettings(event) {
        event.preventDefault();
        persistSettings(form.data.rules);
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
            <div className="flex flex-col">
                <form
                    id="settings-form"
                    noValidate
                    onSubmit={submitSettings}
                    className="order-3 mt-5">
                    <section className="rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                                    <Star size={21} weight="duotone" />
                                </span>
                                <div>
                                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-[#123f37]">
                                        Aturan poin
                                    </h2>
                                    <p className="mt-1 text-sm leading-5 text-[#789088]">
                                        Poin ditentukan berdasarkan waktu keberangkatan.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 space-y-2">
                                {form.data.rules.map((rule, index) => (
                                    <div
                                        className={`flex min-h-[76px] items-center gap-3 rounded-[1.15rem] border px-3 py-3 ${index === 0 ? 'border-[#d8e8da] bg-[#f0f7f0]' : index === 1 ? 'border-[#f2e6b9] bg-[#fffaf0]' : 'border-[#f2e0c3] bg-[#fff8ef]'}`}
                                        key={rule.key}>
                                        <span
                                            className={`h-3 w-3 shrink-0 rounded-full ${index === 0 ? 'bg-[#48a879]' : index === 1 ? 'bg-[#f2be24]' : 'bg-[#f3ae4d]'}`}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="whitespace-nowrap text-[14px] font-semibold tracking-[-0.025em] text-[#153f37] sm:text-[15px]">
                                                Sampai {rule.cutoff_time?.slice(0, 5)}
                                            </h3>
                                            <p className="mt-0.5 text-[12px] leading-5 text-[#69716f] sm:text-[14px]">
                                                {ruleRange(form.data.rules, index)}
                                            </p>
                                        </div>
                                        <span className="rounded-[0.9rem] bg-white/75 px-3 py-2 text-[13px] font-semibold text-[#286b50] sm:min-w-[112px] sm:px-4 sm:text-center sm:text-[15px]">
                                            +{rule.points} poin
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Edit aturan sampai ${rule.cutoff_time?.slice(0, 5)}`}
                                            onClick={() => openRuleEditor(index)}
                                            className="flex h-10 w-7 shrink-0 items-center justify-center rounded-xl text-[#123f37] transition-[background-color,transform] duration-300 hover:bg-white/70 active:scale-[0.92] sm:w-8">
                                            <DotsThreeVertical size={23} weight="bold" />
                                        </button>
                                    </div>
                                ))}
                                {form.errors.rules && (
                                    <p className="mt-3 text-sm font-medium text-[#a3622e]">
                                        {form.errors.rules}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={addRule}
                                    className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-[#bed2bd] text-[16px] font-bold text-[#297057] transition-[background-color,transform] duration-300 hover:bg-[#f3f7f0] active:scale-[0.99]">
                                    <Plus size={24} weight="regular" />
                                    Tambah aturan
                                </button>
                                <div className="mt-5 flex items-start gap-3 rounded-[1.1rem] bg-[#eef4e9] px-4 py-3.5 text-[#39755f]">
                                    <Info size={22} weight="duotone" className="mt-0.5 shrink-0" />
                                    <p className="text-[13px] font-semibold leading-5">
                                        Poin diberikan setiap hari sesuai aturan di atas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {activeRuleIndex !== null && ruleDraft && (
                        <div
                            className="fixed inset-0 z-[55] flex items-end justify-center bg-[#153f37]/35 px-0 py-0 backdrop-blur-[2px] motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:items-center sm:px-5 sm:py-6"
                            role="presentation"
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget && !ruleTimePickerOpen)
                                    setActiveRuleIndex(null);
                            }}>
                            <section
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="edit-rule-title"
                                className={`max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-t-[2rem] p-5 text-[#153f37] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:max-w-[520px] sm:rounded-[2rem] sm:p-6 ${ruleTimePickerOpen ? 'bg-transparent shadow-none ring-0' : 'bg-white shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1]'}`}
                                onMouseDown={(event) => event.stopPropagation()}>
                                <div className="mx-auto h-1.5 w-14 rounded-full bg-[#c9cfca] sm:hidden" />
                                <div
                                    className={`mt-4 flex items-start justify-between gap-4 sm:mt-0 ${ruleTimePickerOpen ? 'invisible' : ''}`}>
                                    <div>
                                        <h2
                                            id="edit-rule-title"
                                            className="text-[21px] font-bold tracking-[-0.045em]">
                                            Edit aturan
                                        </h2>
                                        <p className="mt-1 text-sm leading-5 text-[#69716f]">
                                            Sesuaikan batas waktu dan jumlah poin.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveRuleIndex(null)}
                                        aria-label="Tutup edit aturan"
                                        className="flex h-10 w-10 items-center justify-center rounded-full text-[#153f37] transition-colors hover:bg-[#f1f4ee]">
                                        <X size={22} weight="regular" />
                                    </button>
                                </div>
                                <div className="mt-6">
                                    <TimePicker
                                        label="Sampai jam"
                                        value={ruleDraft.cutoff_time}
                                        onChange={(value) =>
                                            setRuleDraft((draft) => ({
                                                ...draft,
                                                cutoff_time: value,
                                            }))
                                        }
                                        error={form.errors[`rules.${activeRuleIndex}.cutoff_time`]}
                                        withinModal
                                        onOpenChange={setRuleTimePickerOpen}
                                    />
                                    <div className={ruleTimePickerOpen ? 'invisible' : 'mt-5'}>
                                        <span className="text-sm font-semibold text-[#31554a]">
                                            Poin
                                        </span>
                                        <div className="mt-2 flex h-16 items-center justify-between rounded-[1.25rem] bg-[#fffefd] px-2 ring-1 ring-[#e1e8e1]">
                                            <button
                                                type="button"
                                                aria-label="Kurangi poin"
                                                onClick={() =>
                                                    setRuleDraft((draft) => ({
                                                        ...draft,
                                                        points: Math.max(
                                                            0,
                                                            Number(draft.points) - 1,
                                                        ),
                                                    }))
                                                }
                                                className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#f0f4ec] text-[25px] text-[#267054] transition-transform active:scale-[0.94]">
                                                -
                                            </button>
                                            <span className="text-[22px] font-bold text-[#153f37]">
                                                {ruleDraft.points}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label="Tambah poin"
                                                onClick={() =>
                                                    setRuleDraft((draft) => ({
                                                        ...draft,
                                                        points: Number(draft.points) + 1,
                                                    }))
                                                }
                                                className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[#f0f4ec] text-[25px] text-[#267054] transition-transform active:scale-[0.94]">
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={saveRuleDraft}
                                    className="mt-6 min-h-14 w-full rounded-[1.15rem] bg-[#0f5549] px-5 text-[16px] font-bold text-white transition-[background-color,transform] hover:bg-[#0b463d] active:scale-[0.985]">
                                    Simpan perubahan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeRule(activeRuleIndex)}
                                    disabled={form.data.rules.length <= 1}
                                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 text-[15px] font-bold text-[#d75b38] transition-colors hover:text-[#b84527] disabled:cursor-not-allowed disabled:opacity-35">
                                    <Trash size={19} weight="duotone" />
                                    Hapus aturan
                                </button>
                            </section>
                        </div>
                    )}
                </form>
                <section className="order-1 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <UserCircle size={22} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Profil anak
                            </h2>
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
                                onChange={(event) =>
                                    profileForm.setData('name', event.target.value)
                                }
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
                <div className="contents">
                    <section className="order-2 mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
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
                    <section className="order-4 mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
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
                                <span className="text-sm font-semibold text-[#31554a]">
                                    Nama bonus
                                </span>
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
                                <span className="text-sm font-semibold text-[#31554a]">
                                    Bonus poin
                                </span>
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
                        <div className="order-5 mt-5 flex justify-center">
                            <button
                                ref={saveButtonRef}
                                type="button"
                                onClick={submitSettings}
                                disabled={form.processing}
                                className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white disabled:opacity-60">
                                <Check size={17} weight="bold" />
                                {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </button>
                        </div>
                    )}
                </div>
                <section className="order-6 mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
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
                            <span className="text-sm font-semibold text-[#31554a]">
                                Jenis tanggal
                            </span>
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
                                                calendarTypes.find(
                                                    (type) => type.value === entry.type,
                                                )?.label
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
                <section className="order-7 mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
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
                {form.isDirty && showStickySave && (
                    <div className="fixed inset-x-4 bottom-24 z-10 flex justify-center sm:bottom-6">
                        <button
                            type="button"
                            onClick={submitSettings}
                            disabled={form.processing}
                            className="flex min-h-12 items-center gap-2 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(23,52,45,0.22)] transition-transform active:scale-[0.985] disabled:opacity-60">
                            <Check size={17} weight="bold" />
                            {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                )}
            </div>
        </ProductShell>
    );
}
