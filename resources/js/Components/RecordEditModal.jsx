import { Clock, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { TimePicker } from './FormControls';

function Field({ label, value, onChange, error }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#31554a]">{label}</span>
            <input
                type="text"
                value={value}
                onChange={onChange}
                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
            />
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </label>
    );
}

export default function RecordEditModal({ open, record, form, onClose, onSubmit }) {
    const closeButtonRef = useRef(null);
    const onCloseRef = useRef(onClose);
    const processingRef = useRef(form.processing);
    const [timePickerOpen, setTimePickerOpen] = useState(false);
    const timePickerOpenRef = useRef(timePickerOpen);
    onCloseRef.current = onClose;
    processingRef.current = form.processing;
    timePickerOpenRef.current = timePickerOpen;

    useEffect(() => {
        if (!open) {
            setTimePickerOpen(false);
            return undefined;
        }

        const previousActiveElement = document.activeElement;
        const previousScrollY = window.scrollY;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !processingRef.current && !timePickerOpenRef.current)
                onCloseRef.current();
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
            window.scrollTo(0, previousScrollY);
            if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus();
        };
    }, [open]);

    if (!open || !record) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/35 px-4 py-6 backdrop-blur-[2px] motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !form.processing && !timePickerOpen)
                    onClose();
            }}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="record-edit-title"
                className={`w-full max-w-md rounded-[2rem] p-5 text-[#17342d] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] ${timePickerOpen ? 'bg-transparent shadow-none ring-0' : 'bg-white shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1]'}`}
                onClick={(event) => event.stopPropagation()}>
                <div
                    className={`flex items-start justify-between gap-4 ${timePickerOpen ? 'invisible' : ''}`}>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                            <Clock size={23} weight="duotone" />
                        </span>
                        <div>
                            <h2
                                id="record-edit-title"
                                className="text-xl font-semibold tracking-[-0.04em]">
                                Edit catatan
                            </h2>
                            <p className="mt-1 text-sm text-[#789088]">{record.date}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        ref={closeButtonRef}
                        onClick={onClose}
                        disabled={form.processing}
                        aria-label="Tutup edit catatan"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] disabled:cursor-not-allowed disabled:opacity-50">
                        <X size={19} weight="bold" />
                    </button>
                </div>
                <form noValidate className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <TimePicker
                        label="Jam berangkat"
                        value={form.data.jam_berangkat}
                        onChange={(value) => form.setData('jam_berangkat', value)}
                        error={form.errors.jam_berangkat}
                        withinModal
                        onOpenChange={setTimePickerOpen}
                    />
                    <div className={timePickerOpen ? 'invisible' : ''}>
                        <Field
                            label="Catatan (opsional)"
                            value={form.data.note}
                            onChange={(event) => form.setData('note', event.target.value)}
                            error={form.errors.note}
                        />
                        <div className="grid grid-cols-2 gap-3 pt-2">
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
                                {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    );
}
