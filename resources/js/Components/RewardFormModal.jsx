import { ChartLineUp, Gift, ImageSquare, X } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

function Field({ label, value, onChange, error, ...props }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#31554a]">{label}</span>
            <input
                {...props}
                value={value}
                onChange={onChange}
                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] transition-[box-shadow] focus:ring-2 focus:ring-[#3d8a70]"
            />
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </label>
    );
}

function estimateSchoolDays(cost, dailyPoints, settings) {
    const schoolDaysPerWeek = Math.max(1, settings?.schoolDays?.length || 5);
    const bonusDays = Math.max(1, Number(settings?.weeklyBonusDays) || schoolDaysPerWeek);
    const bonusPoints = Math.max(0, Number(settings?.weeklyBonusPoints) || 0);
    const bonusActive = Boolean(settings?.weeklyBonusActive && bonusPoints > 0);
    let earnedPoints = 0;
    let schoolDays = 0;
    let daysThisWeek = 0;

    while (earnedPoints < cost && schoolDays < 10000) {
        earnedPoints += dailyPoints;
        schoolDays += 1;
        daysThisWeek += 1;

        if (daysThisWeek === schoolDaysPerWeek) {
            if (bonusActive && daysThisWeek >= bonusDays) earnedPoints += bonusPoints;
            daysThisWeek = 0;
        }
    }

    return schoolDays < 10000 ? schoolDays : null;
}

function RewardEstimate({ cost, pointRules, settings }) {
    const numericCost = Number.parseInt(cost || '0', 10);

    if (!numericCost || numericCost < 1) return null;

    const schoolDaysPerWeek = Math.max(1, settings?.schoolDays?.length || 5);
    const bonusCanEarn = Boolean(
        settings?.weeklyBonusActive && Number(settings?.weeklyBonusPoints) > 0,
    );
    const estimates = pointRules
        .filter((rule) => Number(rule.points) > 0 || bonusCanEarn)
        .map((rule) => ({
            ...rule,
            schoolDays: estimateSchoolDays(numericCost, Number(rule.points), settings),
        }));

    return (
        <div className="rounded-[1.35rem] bg-[#eef4e9] px-4 py-3.5 text-[#39755f]">
            <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#3d8a70]">
                    <ChartLineUp size={19} weight="duotone" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">Estimasi pencapaian</p>
                    <p className="mt-1 text-xs leading-5 text-[#6f837a]">
                        Perkiraan dari 0 poin, tanpa menghitung saldo saat ini.
                    </p>
                </div>
            </div>
            {estimates.length > 0 ? (
                <div className="mt-3 space-y-2">
                    {estimates.map((rule) => (
                        <div
                            className="flex items-center justify-between gap-3 rounded-xl bg-white/65 px-3 py-2.5"
                            key={`${rule.cutoffTime}-${rule.points}`}>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#31554a]">
                                    Sampai {rule.cutoffTime}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#789088]">
                                    +{rule.points} poin / hari sekolah
                                </p>
                            </div>
                            <div className="shrink-0 text-right text-xs leading-4 font-bold text-[#286b50]">
                                {rule.schoolDays ? (
                                    <>
                                        <span className="block">
                                            {rule.schoolDays} hari sekolah
                                        </span>
                                        <span className="mt-0.5 block font-medium text-[#6f837a]">
                                            sekitar {Math.ceil(rule.schoolDays / schoolDaysPerWeek)}{' '}
                                            minggu
                                        </span>
                                    </>
                                ) : (
                                    'Belum dapat dicapai'
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-xs font-semibold text-[#6f837a]">
                    Belum dapat diperkirakan karena semua aturan bernilai 0 poin.
                </p>
            )}
            {settings?.weeklyBonusActive && (
                <p className="mt-3 text-[11px] leading-4 text-[#6f837a]">
                    Estimasi sudah termasuk bonus mingguan jika target tepat waktu tercapai.
                </p>
            )}
        </div>
    );
}

export default function RewardFormModal({
    open,
    editing,
    form,
    existingImageUrl,
    pointRules = [],
    settings = {},
    onClose,
    onSubmit,
}) {
    const closeButtonRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const processingRef = useRef(form.processing);
    onCloseRef.current = onClose;
    processingRef.current = form.processing;

    useEffect(() => {
        if (!open) return undefined;

        const previousActiveElement = document.activeElement;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !processingRef.current) onCloseRef.current();
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
            if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/35 px-4 py-6 backdrop-blur-[2px] motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !form.processing) onClose();
            }}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="reward-form-title"
                className="flex max-h-[calc(100dvh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-white text-[#17342d] shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both]"
                onMouseDown={(event) => event.stopPropagation()}>
                <div className="shrink-0 bg-white px-5 pb-3 pt-5 shadow-[0_8px_14px_-14px_rgba(23,52,45,0.45)] sm:px-6 sm:pt-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                                <Gift size={23} weight="duotone" />
                            </span>
                            <div>
                                <h2
                                    id="reward-form-title"
                                    className="text-xl font-semibold tracking-[-0.04em]">
                                    {editing ? 'Edit hadiah' : 'Tambah hadiah'}
                                </h2>
                                <p className="mt-1 text-sm text-[#789088]">
                                    {editing
                                        ? 'Perbarui informasi hadiah.'
                                        : 'Buat hadiah baru untuk daftar pilihan.'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            ref={closeButtonRef}
                            onClick={onClose}
                            disabled={form.processing}
                            aria-label="Tutup formulir hadiah"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] disabled:cursor-not-allowed disabled:opacity-50">
                            <X size={19} weight="bold" />
                        </button>
                    </div>
                </div>
                <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
                        <div className="space-y-4 pb-5 pt-6 sm:pb-6 sm:pt-6">
                            <Field
                                label="Nama hadiah"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                error={form.errors.name}
                                autoComplete="off"
                            />
                            <Field
                                label="Deskripsi singkat"
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData('description', event.target.value)
                                }
                                error={form.errors.description}
                                placeholder="Opsional"
                            />
                            <Field
                                label="Harga dalam poin"
                                value={form.data.poin_cost}
                                onChange={(event) =>
                                    form.setData('poin_cost', event.target.value.replace(/\D/g, ''))
                                }
                                error={form.errors.poin_cost}
                                inputMode="numeric"
                            />
                            <RewardEstimate
                                cost={form.data.poin_cost}
                                pointRules={pointRules}
                                settings={settings}
                            />
                            <label className="block">
                                <span className="text-sm font-semibold text-[#31554a]">
                                    Foto hadiah{' '}
                                    <span className="font-normal text-[#8ca198]">(opsional)</span>
                                </span>
                                <span className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-[#f5f2ec] px-4 text-sm text-[#789088] ring-1 ring-[#e1e8e1]">
                                    <ImageSquare
                                        size={20}
                                        weight="duotone"
                                        className="shrink-0 text-[#3d8a70]"
                                    />
                                    <span className="min-w-0 flex-1 truncate">
                                        {form.data.image?.name ||
                                            (existingImageUrl
                                                ? 'Foto tersimpan · pilih untuk mengganti'
                                                : 'Pilih foto')}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="sr-only"
                                        onChange={(event) =>
                                            form.setData('image', event.target.files?.[0] ?? null)
                                        }
                                    />
                                </span>
                                {form.errors.image && (
                                    <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                                        {form.errors.image}
                                    </span>
                                )}
                                <span className="mt-2 block text-xs text-[#8ca198]">
                                    JPG, PNG, atau WebP · maksimal 2 MB.
                                </span>
                            </label>
                        </div>
                    </div>
                    <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-[#edf0e9] bg-white px-5 pb-5 pt-3 shadow-[0_-8px_14px_-14px_rgba(23,52,45,0.45)] sm:px-6 sm:pb-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={form.processing}
                            className="min-h-12 rounded-2xl bg-[#f5f2ec] px-4 text-sm font-bold text-[#31554a] transition-colors hover:bg-[#edf0e9] disabled:opacity-50">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || !form.isDirty}
                            className="min-h-12 rounded-2xl bg-[#17342d] px-4 text-sm font-bold text-white transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50">
                            {form.processing
                                ? 'Menyimpan...'
                                : editing
                                  ? 'Simpan Perubahan'
                                  : 'Tambah Hadiah'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
