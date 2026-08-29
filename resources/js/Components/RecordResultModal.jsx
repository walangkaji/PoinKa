import { CheckCircle, Clock, Sparkle, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

export default function RecordResultModal({ result }) {
    const [open, setOpen] = useState(Boolean(result));

    useEffect(() => {
        if (!result) {
            setOpen(false);
            return undefined;
        }

        setOpen(true);
        return undefined;
    }, [result]);

    if (!result || !open) {
        return null;
    }

    const recorded = result.status === 'recorded';
    const alreadyRecorded = result.status === 'already_recorded';
    const title = recorded
        ? 'Hebat, langkahmu tercatat!'
        : alreadyRecorded
          ? 'Hari ini sudah tercatat'
          : 'Belum ada pencatatan';
    const description = recorded
        ? 'Kamu mendapatkan poin untuk langkah baik hari ini.'
        : alreadyRecorded
          ? 'Satu hari hanya bisa dicatat satu kali.'
          : 'Hari ini bukan jadwal sekolah, jadi belum ada poin yang ditambahkan.';

    function closeModal() {
        setOpen(false);
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/45 px-5 py-6 backdrop-blur-sm"
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) closeModal();
            }}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="record-result-title"
                className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-[#f5f2ec] text-[#17342d] shadow-[0_24px_70px_rgba(23,52,45,0.28)] motion-safe:animate-[poinka-rise_450ms_cubic-bezier(0.32,0.72,0,1)_both]">
                <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#3d8a70]/20 blur-3xl" />
                <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Tutup hasil pencatatan"
                    className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/65 text-[#527268] transition-colors hover:bg-white active:scale-95">
                    <X size={19} weight="bold" />
                </button>

                <div className="relative p-6 sm:p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dfe9df] text-[#3d8a70]">
                        {recorded ? (
                            <Sparkle size={28} weight="fill" />
                        ) : alreadyRecorded ? (
                            <CheckCircle size={28} weight="duotone" />
                        ) : (
                            <Clock size={28} weight="duotone" />
                        )}
                    </div>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#3d8a70]">
                        Hasil hari ini
                    </p>
                    <h2
                        id="record-result-title"
                        className="mt-2 max-w-[15ch] text-3xl font-semibold leading-[1.05] tracking-[-0.06em]">
                        {title}
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[#668077]">{description}</p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-[#17342d] p-4 text-[#f5f2ec]">
                            <p className="text-xs font-medium text-[#b8d2c5]">Poin didapat</p>
                            <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.06em] text-[#e7a84e]">
                                +{result.points}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[#e7a84e] p-4 text-[#17342d]">
                            <p className="text-xs font-medium text-[#7e581d]">Total poin</p>
                            <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.06em]">
                                {result.balance}
                            </p>
                        </div>
                    </div>

                    {result.time && (
                        <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#527268]">
                            <Clock size={18} weight="duotone" /> Tercatat pukul {result.time}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={closeModal}
                        className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#3d8a70] px-5 text-sm font-bold text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985]">
                        Tutup Hasil
                    </button>
                    <p className="mt-3 text-center text-[11px] font-medium text-[#8ca198]">
                        Tutup setelah selesai menunjukkannya.
                    </p>
                </div>
            </section>
        </div>
    );
}
