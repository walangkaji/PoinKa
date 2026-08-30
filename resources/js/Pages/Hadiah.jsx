import React from 'react';
import {
    ArrowUpRight,
    DotsThreeVertical,
    Gift,
    ImageSquare,
    PencilSimple,
    Plus,
    Target,
    Trash,
    Trophy,
    X,
} from '@phosphor-icons/react';
import { Link, router, useForm } from '@inertiajs/react';
import ConfirmDialog from '../Components/ConfirmDialog';
import { SelectMenu, useDismissablePopover } from '../Components/FormControls';
import ProductShell from '../Components/ProductShell';
import RewardFormModal from '../Components/RewardFormModal';

function createRedemptionKey() {
    if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    if (typeof window !== 'undefined' && typeof window.crypto?.getRandomValues === 'function') {
        const values = new Uint32Array(4);
        window.crypto.getRandomValues(values);

        return `redeem-${Array.from(values, (value) => value.toString(36)).join('-')}`;
    }

    return `redeem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function RewardActions({ reward, balance, onTarget, onEdit, onDelete, onRedeem }) {
    const canRedeem = balance >= reward.cost;
    const popover = useDismissablePopover();

    return (
        <div
            className="flex shrink-0 items-center gap-2"
            onClick={(event) => event.stopPropagation()}>
            <div
                tabIndex={canRedeem ? -1 : 0}
                aria-describedby={!canRedeem ? `reward-hint-${reward.id}` : undefined}
                className="group/redeem relative shrink-0 outline-none">
                <button
                    type="button"
                    disabled={!canRedeem}
                    aria-disabled={!canRedeem}
                    onClick={() => onRedeem(reward)}
                    className={`min-h-11 rounded-xl px-3 text-xs font-bold transition-transform ${canRedeem ? 'bg-[#17342d] text-white active:scale-[0.98]' : 'cursor-not-allowed bg-[#dfe5df] text-[#8ca198]'}`}>
                    Tukar
                </button>
                {!canRedeem && (
                    <span
                        id={`reward-hint-${reward.id}`}
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-40 -translate-x-1/2 rounded-xl bg-[#17342d] px-3 py-2 text-center text-[11px] font-semibold leading-4 text-[#f5f2ec] opacity-0 shadow-[0_12px_28px_rgba(23,52,45,0.18)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/redeem:-translate-y-0.5 group-hover/redeem:opacity-100 group-focus-within/redeem:-translate-y-0.5 group-focus-within/redeem:opacity-100">
                        Kurang {reward.cost - balance} poin lagi
                    </span>
                )}
            </div>
            <div ref={popover.rootRef} className="group relative">
                <button
                    type="button"
                    aria-label={`Aksi hadiah ${reward.name}`}
                    aria-haspopup="menu"
                    aria-expanded={popover.open}
                    onClick={() => popover.setOpen((current) => !current)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white/70 text-[#527268] ring-1 ring-[#d7e2d8] outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#3d8a70]">
                    <DotsThreeVertical size={21} weight="bold" />
                </button>
                {popover.open && (
                    <div
                        role="menu"
                        className="absolute right-0 top-full z-30 mt-2 w-48 rounded-2xl bg-white p-1.5 shadow-[0_18px_45px_rgba(23,52,45,0.16)] ring-1 ring-[#e1e8e1]">
                        <button
                            type="button"
                            role="menuitem"
                            disabled={reward.isTarget}
                            onClick={() => {
                                popover.setOpen(false);
                                onTarget(reward);
                            }}
                            className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold ${reward.isTarget ? 'cursor-default text-[#8ca198]' : 'text-[#3d8a70] transition-colors hover:bg-[#edf0e9]'}`}>
                            <Target size={17} weight="duotone" />
                            {reward.isTarget ? 'Target Utama' : 'Jadikan Target'}
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                popover.setOpen(false);
                                onEdit(reward);
                            }}
                            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-[#3d8a70] transition-colors hover:bg-[#edf0e9]">
                            <PencilSimple size={17} weight="bold" />
                            Edit
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                popover.setOpen(false);
                                onDelete(reward);
                            }}
                            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-[#a3622e] transition-colors hover:bg-[#f5e4d8]">
                            <Trash size={17} weight="bold" />
                            Hapus
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function RewardThumbnail({ reward, onPreview }) {
    if (!reward.imageUrl) {
        return (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5d79f] text-[#7e581d]">
                <Trophy size={20} weight="duotone" />
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onPreview(reward)}
            aria-label={`Perbesar gambar ${reward.name}`}
            className="group/image flex h-10 w-10 shrink-0 cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-[#f5d79f] text-[#7e581d] outline-none ring-offset-2 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#3d8a70]">
            <img
                src={reward.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-110"
            />
        </button>
    );
}

function RewardImageModal({ reward, onClose }) {
    const closeButtonRef = React.useRef(null);
    const onCloseRef = React.useRef(onClose);

    onCloseRef.current = onClose;

    React.useEffect(() => {
        if (!reward?.imageUrl) return undefined;

        const previousActiveElement = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onCloseRef.current();
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        requestAnimationFrame(() => closeButtonRef.current?.focus());

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previousActiveElement?.focus?.();
        };
    }, [reward]);

    if (!reward?.imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#17342d]/50 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="reward-image-title"
                className="w-full max-w-lg rounded-[2rem] bg-white p-4 text-[#17342d] shadow-[0_24px_70px_rgba(23,52,45,0.28)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-6"
                onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-4 px-1">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                            Hadiah pilihan
                        </p>
                        <h2
                            id="reward-image-title"
                            className="mt-1 text-xl font-semibold tracking-[-0.04em]">
                            {reward.name}
                        </h2>
                    </div>
                    <button
                        type="button"
                        ref={closeButtonRef}
                        onClick={onClose}
                        aria-label="Tutup gambar hadiah"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d8a70]">
                        <X size={19} weight="bold" />
                    </button>
                </div>
                <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[#f5f2ec]">
                    <img
                        src={reward.imageUrl}
                        alt={reward.name}
                        className="max-h-[70vh] w-full object-contain"
                    />
                </div>
                <p className="mt-4 px-1 text-sm font-semibold text-[#789088]">{reward.cost} poin</p>
            </section>
        </div>
    );
}

function RedemptionPagination({ pagination }) {
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
                    href={`/hadiah?redemption_page=${pagination.currentPage - 1}`}
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
                    href={`/hadiah?redemption_page=${pagination.currentPage + 1}`}
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

function RewardProgress({ reward, balance }) {
    const collectedPoints = Math.min(Math.max(balance, 0), reward.cost);
    const remainingPoints = Math.max(reward.cost - balance, 0);
    const progressPercent = Math.min(Math.max((balance / reward.cost) * 100, 0), 100);
    const canRedeem = balance >= reward.cost;

    return (
        <div className="mt-2.5 max-w-64">
            <div className="flex items-center justify-between gap-3 text-[11px] leading-4">
                <span className="font-semibold text-[#527268]">
                    {collectedPoints} / {reward.cost} poin
                </span>
                <span className={canRedeem ? 'font-bold text-[#3d8a70]' : 'text-[#789088]'}>
                    {canRedeem ? 'Bisa ditukar' : `Kurang ${remainingPoints} poin`}
                </span>
            </div>
            <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#dfe8df]"
                role="progressbar"
                aria-label={`Progress hadiah ${reward.name}`}
                aria-valuemin="0"
                aria-valuemax={reward.cost}
                aria-valuenow={collectedPoints}>
                <div
                    className="h-full rounded-full bg-[#3d8a70] transition-[width] duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}

export default function Hadiah({
    balance,
    rewards,
    redemptions,
    redemptionPagination,
    flash,
    errors,
    pointRules,
    settings,
}) {
    const form = useForm({ name: '', description: '', poin_cost: '', image: null });
    const formScrollPosition = React.useRef(null);
    const [sortOrder, setSortOrder] = React.useState('highest');
    const [editingReward, setEditingReward] = React.useState(null);
    const [formOpen, setFormOpen] = React.useState(false);
    const [confirmation, setConfirmation] = React.useState(null);
    const [previewReward, setPreviewReward] = React.useState(null);

    const sortedRewards = React.useMemo(
        () =>
            [...rewards].sort((first, second) => {
                const difference =
                    sortOrder === 'highest' ? second.cost - first.cost : first.cost - second.cost;

                return difference || first.name.localeCompare(second.name, 'id');
            }),
        [rewards, sortOrder],
    );
    function submit(event) {
        event.preventDefault();
        formScrollPosition.current = window.scrollY;

        form.transform((data) => (editingReward ? { ...data, _method: 'put' } : data));
        form.post(editingReward ? `/hadiah/${editingReward.id}` : '/hadiah', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeForm,
        });
    }

    function startEditing(reward) {
        const rewardValues = {
            name: reward.name,
            description: reward.description ?? '',
            poin_cost: reward.cost,
            image: null,
        };

        setEditingReward(reward);
        setFormOpen(true);
        formScrollPosition.current = window.scrollY;
        form.setData(rewardValues);
        form.setDefaults(rewardValues);
        form.clearErrors();
    }

    function startAdding() {
        setEditingReward(null);
        setFormOpen(true);
        formScrollPosition.current = window.scrollY;
        form.setDefaults({ name: '', description: '', poin_cost: '', image: null });
        form.reset();
        form.clearErrors();
    }

    function closeForm() {
        const scrollPosition = formScrollPosition.current;
        setEditingReward(null);
        setFormOpen(false);
        form.reset();
        form.clearErrors();
        formScrollPosition.current = null;

        if (scrollPosition !== null) {
            requestAnimationFrame(() =>
                window.scrollTo({ top: scrollPosition, left: 0, behavior: 'auto' }),
            );
        }
    }

    function postAction(url, message = null, data = {}) {
        if (!message) {
            router.post(url, { ...data }, { preserveScroll: true });
            return;
        }

        setConfirmation({
            title: 'Tukar hadiah ini?',
            message,
            confirmLabel: 'Tukar Sekarang',
            onConfirm: () => {
                setConfirmation(null);
                router.post(url, { ...data }, { preserveScroll: true });
            },
        });
    }

    function deleteReward(reward) {
        setConfirmation({
            title: 'Hapus hadiah ini?',
            message: `Hadiah ${reward.name} akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.`,
            confirmLabel: 'Hapus Hadiah',
            tone: 'danger',
            onConfirm: () => {
                setConfirmation(null);
                router.delete(`/hadiah/${reward.id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (editingReward?.id === reward.id) {
                            closeForm();
                        }
                    },
                });
            },
        });
    }

    function redeemReward(reward) {
        postAction(
            `/hadiah/${reward.id}/tukar`,
            `Tukar ${reward.name} dengan ${reward.cost} poin? Penukaran dapat dibatalkan selama masih aktif.`,
            { idempotency_key: createRedemptionKey() },
        );
    }

    function cancelRedemption(redemption) {
        setConfirmation({
            title: 'Batalkan penukaran?',
            message: `Poin ${redemption.cost} akan dikembalikan ke saldo.`,
            confirmLabel: 'Batalkan Penukaran',
            tone: 'danger',
            onConfirm: () => {
                setConfirmation(null);
                router.post(
                    `/penukaran-hadiah/${redemption.id}/batal`,
                    {},
                    { preserveScroll: true },
                );
            },
        });
    }

    return (
        <ProductShell
            active="hadiah"
            eyebrow="Apresiasi yang punya tujuan"
            title="Hadiah untuk langkah baik"
            flash={flash}
            error={errors?.reward}>
            <ConfirmDialog
                open={Boolean(confirmation)}
                title={confirmation?.title}
                message={confirmation?.message}
                confirmLabel={confirmation?.confirmLabel}
                tone={confirmation?.tone}
                onConfirm={confirmation?.onConfirm}
                onCancel={() => setConfirmation(null)}
            />

            <Link
                href="/riwayat-poin"
                className="group block rounded-[2rem] bg-[#17342d] p-6 text-[#f5f2ec] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(23,52,45,0.16)] active:scale-[0.985] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8d2c5]">
                            Saldo saat ini
                        </p>
                        <p className="mt-3 font-mono text-5xl font-semibold tracking-[-0.08em]">
                            {balance}
                        </p>
                        <p className="mt-2 text-sm text-[#b8d2c5]">poin tersedia untuk ditukar</p>
                    </div>
                    <ArrowUpRight
                        size={21}
                        weight="bold"
                        className="text-[#e7a84e] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px"
                    />
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#e7a84e]">
                    Lihat Riwayat Poin <ArrowUpRight size={15} weight="bold" />
                </p>
            </Link>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <Gift size={21} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Daftar hadiah
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">
                                Satu hadiah dapat dipilih sebagai target utama.
                            </p>
                        </div>
                    </div>
                    <SelectMenu
                        className="w-full sm:w-48"
                        value={sortOrder}
                        options={[
                            { value: 'highest', label: 'Poin terbesar' },
                            { value: 'lowest', label: 'Poin terkecil' },
                        ]}
                        onChange={setSortOrder}
                        ariaLabel="Urutkan hadiah berdasarkan poin"
                    />
                </div>
                <button
                    type="button"
                    onClick={startAdding}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#3d8a70] px-5 text-sm font-bold text-white transition-transform active:scale-[0.985] sm:w-auto">
                    <Plus size={18} weight="bold" />
                    Tambah Hadiah
                </button>
                <div className="mt-5 space-y-3">
                    {sortedRewards.length === 0 ? (
                        <p className="py-4 text-sm text-[#789088]">
                            Belum ada hadiah. Tambahkan satu di bawah.
                        </p>
                    ) : (
                        sortedRewards.map((reward) => (
                            <div
                                className={
                                    'grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-[#f5f2ec] p-4 ' +
                                    (reward.imageUrl
                                        ? 'cursor-zoom-in transition-colors hover:bg-[#f1eee7]'
                                        : '')
                                }
                                onClick={() => {
                                    if (reward.imageUrl) setPreviewReward(reward);
                                }}
                                key={reward.id}>
                                <RewardThumbnail reward={reward} onPreview={setPreviewReward} />
                                <div className="min-w-0">
                                    <p className="truncate font-semibold">{reward.name}</p>
                                    <p className="text-xs text-[#789088]">
                                        <span className="font-bold">{reward.cost}</span> poin
                                        {reward.isTarget ? ' · Target utama' : ''}
                                    </p>
                                    <RewardProgress reward={reward} balance={balance} />
                                </div>
                                <RewardActions
                                    reward={reward}
                                    balance={balance}
                                    onTarget={(item) => postAction(`/hadiah/${item.id}/target`)}
                                    onEdit={startEditing}
                                    onDelete={deleteReward}
                                    onRedeem={redeemReward}
                                />
                            </div>
                        ))
                    )}
                </div>
            </section>
            {redemptions?.length > 0 && (
                <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <Trophy size={21} weight="duotone" />
                        </span>
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.04em]">
                                Riwayat pencapaian
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">
                                Hadiah yang ditukar dan status pencapaiannya tercatat di sini.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 divide-y divide-[#edf0e9]">
                        {redemptions.map((redemption) => (
                            <div
                                className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                                key={redemption.id}>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5d79f] text-[#7e581d]">
                                    <ImageSquare size={20} weight="duotone" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold">
                                        {redemption.rewardName}
                                    </p>
                                    <p className="mt-1 text-xs text-[#789088]">
                                        {redemption.date} · {redemption.time} · {redemption.cost}{' '}
                                        poin
                                    </p>
                                    <p
                                        className={`mt-1 text-xs font-semibold ${redemption.status === 'active' ? 'text-[#3d8a70]' : 'text-[#8ca198]'}`}>
                                        {redemption.status === 'active' ? 'Tercapai' : 'Dibatalkan'}
                                    </p>
                                </div>
                                {redemption.status === 'active' && (
                                    <button
                                        type="button"
                                        onClick={() => cancelRedemption(redemption)}
                                        className="min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold text-[#a3622e] ring-1 ring-[#e1cfc3] transition-colors hover:bg-[#f5e4d8]">
                                        Batalkan
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <RedemptionPagination pagination={redemptionPagination} />
                </section>
            )}
            <RewardFormModal
                open={formOpen}
                editing={Boolean(editingReward)}
                existingImageUrl={editingReward?.imageUrl}
                form={form}
                pointRules={pointRules}
                settings={settings}
                onClose={closeForm}
                onSubmit={submit}
            />
            <RewardImageModal reward={previewReward} onClose={() => setPreviewReward(null)} />
        </ProductShell>
    );
}
