import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export default function Toast({ message, tone = 'success' }) {
    const [visible, setVisible] = useState(Boolean(message));
    const isError = tone === 'error';

    useEffect(() => {
        if (!message) {
            setVisible(false);
            return undefined;
        }

        setVisible(true);
        const timeout = window.setTimeout(() => setVisible(false), 4500);

        return () => window.clearTimeout(timeout);
    }, [message]);

    if (!message || !visible) {
        return null;
    }

    return (
        <div
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            className={`fixed inset-x-4 top-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-[0_18px_45px_rgba(23,52,45,0.16)] motion-safe:animate-[poinka-toast-in_350ms_cubic-bezier(0.32,0.72,0,1)_both] sm:left-auto sm:right-6 sm:w-full sm:max-w-sm ${isError ? 'bg-[#f5e4d8] text-[#8a552c]' : 'bg-[#17342d] text-[#f5f2ec]'}`}>
            {isError ? (
                <WarningCircle size={21} weight="duotone" className="shrink-0" />
            ) : (
                <CheckCircle size={21} weight="duotone" className="shrink-0 text-[#e7a84e]" />
            )}
            <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{message}</p>
            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="Tutup pesan"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/15">
                <X size={17} weight="bold" />
            </button>
        </div>
    );
}
