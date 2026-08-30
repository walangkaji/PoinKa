import React from 'react';
import { Clock, Minus, PencilSimple, Plus, PlusMinus } from '@phosphor-icons/react';
import { Link, useForm } from '@inertiajs/react';
import { DatePicker, TimePicker } from '../Components/FormControls';
import ProductShell from '../Components/ProductShell';
import RecordEditModal from '../Components/RecordEditModal';

function Field({ label, type = 'text', value, onChange, error }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#31554a]">{label}</span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="mt-2 block h-14 w-full appearance-none rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base leading-[3.5rem] text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
            />
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </label>
    );
}

function Pagination({ pagination }) {
    if (!pagination || pagination.lastPage <= 1) {
        return null;
    }

    const isFirstPage = pagination.currentPage === 1;
    const isLastPage = pagination.currentPage === pagination.lastPage;

    return (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf0e9] pt-4">
            <span className="text-xs font-semibold text-[#8ca198]">
                Halaman {pagination.currentPage} dari {pagination.lastPage}
            </span>
            <div className="flex items-center gap-2">
                <Link
                    href={`/catatan?page=${pagination.currentPage - 1}`}
                    preserveScroll
                    preserveState
                    aria-disabled={isFirstPage}
                    tabIndex={isFirstPage ? -1 : undefined}
                    className={`flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ring-1 ring-[#e1e8e1] ${isFirstPage ? 'pointer-events-none opacity-40' : 'text-[#527268] hover:bg-[#edf0e9]'}`}>
                    Sebelumnya
                </Link>
                <Link
                    href={`/catatan?page=${pagination.currentPage + 1}`}
                    preserveScroll
                    preserveState
                    aria-disabled={isLastPage}
                    tabIndex={isLastPage ? -1 : undefined}
                    className={`flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ring-1 ring-[#e1e8e1] ${isLastPage ? 'pointer-events-none opacity-40' : 'text-[#527268] hover:bg-[#edf0e9]'}`}>
                    Berikutnya
                </Link>
            </div>
        </div>
    );
}

export default function Catatan({ records, target, balance, flash, pagination, today }) {
    const [editingId, setEditingId] = React.useState(null);
    const createForm = useForm({ tanggal_berangkat: '', jam_berangkat: target, note: '' });
    const editForm = useForm({ jam_berangkat: '', note: '' });
    const adjustForm = useForm({ amount: '', description: '' });

    function submitCreate(event) {
        event.preventDefault();
        createForm.post('/catatan', { preserveScroll: true, onSuccess: () => createForm.reset() });
    }

    function startEdit(record) {
        const editValues = { jam_berangkat: record.time, note: record.note || '' };

        setEditingId(record.id);
        editForm.setData(editValues);
        editForm.setDefaults(editValues);
    }

    function submitEdit(event) {
        event.preventDefault();
        editForm.put(`/catatan/${editingId}`, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    }

    function submitAdjustment(event) {
        event.preventDefault();
        adjustForm.post('/penyesuaian-poin', {
            preserveScroll: true,
            onSuccess: () => adjustForm.reset(),
        });
    }

    function changeAdjustmentAmount(delta) {
        const currentAmount = Number.parseInt(adjustForm.data.amount, 10) || 0;

        adjustForm.setData('amount', String(currentAmount + delta));
    }

    return (
        <ProductShell
            active={null}
            eyebrow="Riwayat kebiasaan"
            title="Catatan berangkat"
            flash={flash}>
            <section className="rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <Plus size={21} weight="bold" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">
                            Tambah catatan lama
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[#789088]">
                            Gunakan ini jika waktu berangkat belum sempat dicatat hari itu.
                        </p>
                    </div>
                </div>
                <form noValidate className="mt-6 space-y-5" onSubmit={submitCreate}>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <DatePicker
                            label="Tanggal"
                            value={createForm.data.tanggal_berangkat}
                            onChange={(value) => createForm.setData('tanggal_berangkat', value)}
                            error={createForm.errors.tanggal_berangkat}
                            max={today}
                        />
                        <TimePicker
                            label="Jam berangkat"
                            value={createForm.data.jam_berangkat}
                            onChange={(value) => createForm.setData('jam_berangkat', value)}
                            error={createForm.errors.jam_berangkat}
                        />
                    </div>
                    <Field
                        label="Catatan (opsional)"
                        value={createForm.data.note}
                        onChange={(event) => createForm.setData('note', event.target.value)}
                        error={createForm.errors.note}
                    />
                    <button
                        type="submit"
                        disabled={createForm.processing || !createForm.isDirty}
                        className="mx-auto block min-h-12 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-[#f5f2ec] disabled:cursor-not-allowed disabled:opacity-60">
                        {createForm.processing ? 'Menyimpan...' : 'Simpan Catatan'}
                    </button>
                </form>
            </section>

            <section className="mt-5 rounded-[2rem] bg-[#e7a84e] p-6 text-[#17342d] sm:p-8">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5d79f] text-[#7e581d]">
                        <PlusMinus size={21} weight="bold" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">
                            Sesuaikan saldo poin
                        </h2>
                        <p className="mt-1 text-sm text-[#7e581d]">
                            Saldo saat ini: {balance} poin. Tambahkan atau kurangi dengan alasan
                            yang jelas.
                        </p>
                    </div>
                </div>
                <form noValidate className="mt-6 space-y-4" onSubmit={submitAdjustment}>
                    <div className="flex h-14 w-full items-center overflow-hidden rounded-2xl bg-[#f5f2ec] ring-1 ring-[#edc778] focus-within:ring-2 focus-within:ring-[#17342d]">
                        <button
                            type="button"
                            aria-label="Kurangi 1 poin"
                            onClick={() => changeAdjustmentAmount(-1)}
                            className="flex h-full w-14 shrink-0 items-center justify-center text-[#8a552c] transition-colors hover:bg-[#f0dfbf] active:bg-[#e9d3a8]">
                            <Minus size={19} weight="bold" />
                        </button>
                        <input
                            type="number"
                            inputMode="numeric"
                            step="1"
                            placeholder="Jumlah poin"
                            value={adjustForm.data.amount}
                            onChange={(event) => adjustForm.setData('amount', event.target.value)}
                            className="h-full min-w-0 flex-1 bg-transparent px-2 py-0 text-center text-base text-[#17342d] outline-none"
                        />
                        <button
                            type="button"
                            aria-label="Tambah 1 poin"
                            onClick={() => changeAdjustmentAmount(1)}
                            className="flex h-full w-14 shrink-0 items-center justify-center text-[#8a552c] transition-colors hover:bg-[#f0dfbf] active:bg-[#e9d3a8]">
                            <Plus size={19} weight="bold" />
                        </button>
                    </div>
                    {adjustForm.errors.amount && (
                        <p className="text-xs font-medium text-[#8a552c]">
                            {adjustForm.errors.amount}
                        </p>
                    )}
                    <input
                        type="text"
                        placeholder="Alasan penyesuaian"
                        value={adjustForm.data.description}
                        onChange={(event) => adjustForm.setData('description', event.target.value)}
                        className="block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base leading-[3.5rem] text-[#17342d] outline-none ring-1 ring-[#edc778] focus:ring-2 focus:ring-[#17342d]"
                    />
                    {adjustForm.errors.description && (
                        <p className="text-xs font-medium text-[#8a552c]">
                            {adjustForm.errors.description}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={adjustForm.processing || !adjustForm.isDirty}
                        className="mx-auto block min-h-12 rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {adjustForm.processing ? 'Menyimpan...' : 'Simpan Penyesuaian'}
                    </button>
                </form>
            </section>

            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-[-0.04em]">Catatan terbaru</h2>
                    <span className="text-xs font-semibold text-[#8ca198]">
                        {pagination?.total ?? records.length} catatan
                    </span>
                </div>
                <div className="mt-5 divide-y divide-[#edf0e9]">
                    {records.length === 0 ? (
                        <p className="py-6 text-sm text-[#789088]">
                            Belum ada catatan. Langkah pertama bisa dicatat dari Beranda.
                        </p>
                    ) : (
                        records.map((record) => (
                            <div key={record.id} className="flex items-center gap-3 py-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                                    <Clock size={21} weight="duotone" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold">{record.date}</p>
                                    <p className="mt-1 text-xs text-[#789088]">
                                        {record.source === 'manual'
                                            ? 'Dicatat manual'
                                            : 'Dicatat langsung'}
                                        {record.note ? ' · ' + record.note : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold">{record.time}</p>
                                    <p className="text-xs font-semibold text-[#3d8a70]">
                                        +{record.points} poin
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={'Edit catatan ' + record.date}
                                    onClick={() => startEdit(record)}
                                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#527268] hover:bg-[#edf0e9]">
                                    <PencilSimple size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                <Pagination pagination={pagination} />
            </section>
            <RecordEditModal
                open={Boolean(editingId)}
                record={records.find((record) => record.id === editingId)}
                form={editForm}
                onClose={() => setEditingId(null)}
                onSubmit={submitEdit}
            />
        </ProductShell>
    );
}
