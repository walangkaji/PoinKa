import { ArrowDown, ArrowUp, ClockCounterClockwise, Coins, Funnel, X } from '@phosphor-icons/react';
import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { DateRangePicker, SelectMenu } from '../Components/FormControls';
import ProductShell from '../Components/ProductShell';
import { useMemo } from 'react';

const typeOptions = [
    { value: 'all', label: 'Semua aktivitas' },
    { value: 'poin_waktu_berangkat', label: 'Poin berangkat' },
    { value: 'bonus_mingguan', label: 'Bonus mingguan' },
    { value: 'penyesuaian_bonus_mingguan', label: 'Penyesuaian bonus mingguan' },
    { value: 'penyesuaian_manual', label: 'Penyesuaian poin' },
    { value: 'penukaran_hadiah', label: 'Penukaran hadiah' },
    { value: 'pembatalan_penukaran', label: 'Pembatalan penukaran' },
];

function queryFor(page, filters) {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page);
    if (filters.type && filters.type !== 'all') params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    const query = params.toString();

    return '/riwayat-poin' + (query ? '?' + query : '');
}

function Pagination({ pagination, filters }) {
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
                    href={queryFor(pagination.currentPage - 1, filters)}
                    preserveScroll
                    preserveState
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
                    href={queryFor(pagination.currentPage + 1, filters)}
                    preserveScroll
                    preserveState
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

export default function RiwayatPoin({ balance, transactions, filters, pagination }) {
    const [form, setForm] = useState(filters);
    const didMount = useRef(false);
    const skipNextAutoFilter = useRef(false);
    const hasFilters = Boolean((form.type && form.type !== 'all') || form.from || form.to);
    const invalidRange = useMemo(
        () => Boolean(form.from && form.to && form.from > form.to),
        [form.from, form.to],
    );

    function update(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return undefined;
        }
        if (skipNextAutoFilter.current) {
            skipNextAutoFilter.current = false;
            return undefined;
        }

        if (invalidRange) return undefined;

        const timer = setTimeout(() => {
            router.get(queryFor(1, form), {}, { preserveScroll: true, preserveState: true });
        }, 150);

        return () => clearTimeout(timer);
    }, [form.type, form.from, form.to, invalidRange]);

    function clearFilters() {
        const empty = { type: 'all', from: null, to: null };
        skipNextAutoFilter.current = true;
        setForm(empty);
        router.get('/riwayat-poin', {}, { preserveScroll: true, preserveState: true });
    }

    return (
        <ProductShell active={null} eyebrow="Semua perubahan saldo" title="Riwayat poin">
            <section className="rounded-[2rem] bg-[#17342d] p-6 text-[#f5f2ec] shadow-[0_20px_50px_rgba(23,52,45,0.12)] sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8d2c5]">
                            Saldo saat ini
                        </p>
                        <p className="mt-3 font-mono text-5xl font-semibold tracking-[-0.08em]">
                            {balance}
                        </p>
                        <p className="mt-2 text-sm text-[#b8d2c5]">poin tersedia</p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#285249] text-[#e7a84e]">
                        <Coins size={23} weight="duotone" />
                    </span>
                </div>
            </section>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <Funnel size={21} weight="duotone" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">Filter riwayat</h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Temukan perubahan poin berdasarkan jenis atau tanggal.
                        </p>
                    </div>
                </div>
                <form className="mt-5 space-y-4" onSubmit={(event) => event.preventDefault()}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <span className="text-sm font-semibold text-[#31554a]">
                                Jenis aktivitas
                            </span>
                            <SelectMenu
                                className="mt-2"
                                value={form.type || 'all'}
                                options={typeOptions}
                                onChange={(value) => update('type', value)}
                                ariaLabel="Pilih jenis aktivitas"
                            />
                        </div>
                        <DateRangePicker
                            label="Rentang tanggal"
                            optional
                            from={form.from || ''}
                            to={form.to || ''}
                            onChange={({ from, to }) => {
                                update('from', from);
                                update('to', to);
                            }}
                        />
                    </div>
                    {invalidRange && (
                        <p className="text-xs font-medium text-[#a3622e]">
                            Tanggal mulai tidak boleh setelah tanggal akhir.
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#527268] ring-1 ring-[#e1e8e1] transition-colors hover:bg-[#edf0e9]">
                                <X size={15} weight="bold" />
                                Bersihkan
                            </button>
                        )}
                    </div>
                </form>
            </section>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <ClockCounterClockwise size={21} weight="duotone" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">Aktivitas poin</h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Poin masuk dan keluar tercatat di sini.
                        </p>
                    </div>
                </div>
                <div className="mt-5 divide-y divide-[#edf0e9]">
                    {transactions.length === 0 ? (
                        <p className="py-6 text-sm text-[#789088]">
                            Belum ada perubahan poin untuk filter ini.
                        </p>
                    ) : (
                        transactions.map((transaction) => {
                            const isAdded = transaction.amount >= 0;
                            const iconClass =
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ' +
                                (isAdded
                                    ? 'bg-[#dfe9df] text-[#3d8a70]'
                                    : 'bg-[#f5e4d8] text-[#a3622e]');
                            const amountClass =
                                'font-mono text-base font-bold ' +
                                (isAdded ? 'text-[#3d8a70]' : 'text-[#a3622e]');

                            return (
                                <div
                                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                                    key={transaction.id}>
                                    <span className={iconClass}>
                                        {isAdded ? (
                                            <ArrowUp size={19} weight="bold" />
                                        ) : (
                                            <ArrowDown size={19} weight="bold" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#31554a]">
                                            {transaction.title}
                                        </p>
                                        <p className="mt-1 text-xs text-[#789088]">
                                            {transaction.date} · {transaction.time}
                                        </p>
                                        {transaction.detail && (
                                            <p className="mt-1 text-xs text-[#789088]">
                                                {transaction.detail}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className={amountClass}>
                                            {isAdded ? '+' : ''}
                                            {transaction.amount}
                                        </p>
                                        <p className="mt-1 text-[11px] font-medium text-[#8ca198]">
                                            Saldo {transaction.balanceAfter}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <Pagination pagination={pagination} filters={filters} />
            </section>
        </ProductShell>
    );
}
