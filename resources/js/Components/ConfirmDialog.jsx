import { Check, WarningCircle, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Lanjutkan',
    cancelLabel = 'Batal',
    tone = 'default',
    onConfirm,
    onCancel,
}) {
    const cancelButtonRef = useRef(null);
    const confirmButtonRef = useRef(null);
    const submittingRef = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    const isDanger = tone === 'danger';

    useEffect(() => {
        if (!open) {
            submittingRef.current = false;
            setSubmitting(false);
            return undefined;
        }

        const previousActiveElement = document.activeElement;
        const focusTarget = isDanger ? cancelButtonRef.current : confirmButtonRef.current;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !submittingRef.current) {
                onCancel();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(
                Boolean,
            );

            if (focusableElements.length === 0) {
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        focusTarget?.focus();

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);

            if (previousActiveElement instanceof HTMLElement) {
                previousActiveElement.focus();
            }
        };
    }, [isDanger, onCancel, open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/35 px-4 py-6 backdrop-blur-[2px] motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (!submitting && event.target === event.currentTarget) {
                    onCancel();
                }
            }}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                className="w-full max-w-md rounded-[2rem] bg-white p-5 text-[#17342d] shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-6"
                onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDanger ? 'bg-[#f5e4d8] text-[#a3622e]' : 'bg-[#edf0e9] text-[#3d8a70]'}`}>
                        {isDanger ? (
                            <WarningCircle size={23} weight="duotone" />
                        ) : (
                            <Check size={23} weight="bold" />
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={submitting}
                        aria-label="Tutup konfirmasi"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#f5f2ec] disabled:cursor-not-allowed disabled:opacity-50">
                        <X size={19} weight="bold" />
                    </button>
                </div>
                <h2
                    id="confirm-dialog-title"
                    className="mt-5 text-xl font-semibold tracking-[-0.04em]">
                    {title}
                </h2>
                <p
                    id="confirm-dialog-description"
                    className="mt-2 text-sm leading-6 text-[#789088]">
                    {message}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        ref={cancelButtonRef}
                        onClick={onCancel}
                        disabled={submitting}
                        className="min-h-12 rounded-2xl bg-[#f5f2ec] px-4 text-sm font-bold text-[#31554a] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#edf0e9] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50">
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        ref={confirmButtonRef}
                        onClick={() => {
                            submittingRef.current = true;
                            setSubmitting(true);
                            onConfirm();
                        }}
                        disabled={submitting}
                        className={`min-h-12 rounded-2xl px-4 text-sm font-bold text-white transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-wait disabled:opacity-60 ${isDanger ? 'bg-[#a3622e] hover:bg-[#8a552c]' : 'bg-[#17342d] hover:bg-[#245044]'}`}>
                        {submitting ? 'Memproses...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}
