import iconMark from '../../images/icon.png';
import { ArrowUpRight, Check, Gift, LockKey, Medal, Sparkle, Target } from '@phosphor-icons/react';
import { Head, Link, useForm } from '@inertiajs/react';
import BottomNav from '../Components/BottomNav';
import BrandWordmark from '../Components/BrandWordmark';
import RecordResultModal from '../Components/RecordResultModal';
import ShortcutMenu from '../Components/ShortcutMenu';
import Toast from '../Components/Toast';

function WeekRow({ item }) {
    const isToday = item.state === 'today';
    const isUpcoming = item.state === 'upcoming';
    const isException = item.state === 'exception';

    return (
        <div className={`flex items-center gap-3 py-3 ${isUpcoming ? 'opacity-45' : ''}`}>
            <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${isToday ? 'bg-[#e7a84e] text-[#17342d]' : isException ? 'bg-[#f5e4d8] text-[#a3622e]' : 'bg-[#edf0e9] text-[#5e766d]'}`}>
                {item.date}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#17342d]">{item.day}</p>
                <p className="text-xs text-[#789088]">
                    {isException
                        ? 'Tidak ada sekolah'
                        : isToday
                          ? 'Hari ini'
                          : isUpcoming
                            ? 'Belum dimulai'
                            : item.time
                              ? 'Sudah tercatat'
                              : 'Belum tercatat'}
                </p>
            </div>
            <div className="text-right">
                {item.time ? (
                    <>
                        <p className="font-mono text-sm font-semibold tracking-tight text-[#17342d]">
                            {item.time}
                        </p>
                        <p className="text-xs font-medium text-[#3d8a70]">+{item.points} poin</p>
                    </>
                ) : (
                    <span
                        className={`text-xs font-medium ${isToday ? 'text-[#9a681e]' : 'text-[#aab8b1]'}`}>
                        {isException ? 'Tidak ada sekolah' : isToday ? 'Menunggu' : 'Belum ada'}
                    </span>
                )}
            </div>
        </div>
    );
}

function ProgressBar({ current, total }) {
    const percentage = Math.min(100, Math.round((current / total) * 100));

    return (
        <div
            aria-label={`${percentage}% menuju hadiah`}
            className="h-2 overflow-hidden rounded-full bg-[#dce4dc]">
            <div
                className="h-full rounded-full bg-[#3d8a70] transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

function PointGuide({ rules, target }) {
    const guide = [...rules, { cutoffTime: target, points: 0, isLast: true }];

    return (
        <div className="mt-5 rounded-[1.4rem] bg-[#20443b] p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b8d2c5]">
                    Cara mendapat poin
                </p>
                <Sparkle size={16} weight="fill" className="text-[#e7a84e]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {guide.map((rule, index) => (
                    <div
                        className="rounded-xl bg-[#285249] px-3 py-2.5"
                        key={`${rule.cutoffTime}-${index}`}>
                        <p className="text-[10px] font-medium leading-4 text-[#a9c9bc]">
                            {rule.isLast ? `Lewat ${rule.cutoffTime}` : `Sampai ${rule.cutoffTime}`}
                        </p>
                        <p className="mt-1 font-mono text-lg font-semibold tracking-[-0.04em] text-[#e7a84e]">
                            +{rule.points}{' '}
                            <span className="font-sans text-[10px] font-medium tracking-normal text-[#b8d2c5]">
                                poin
                            </span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Home({
    child,
    today,
    currentTime,
    targetTime,
    balance,
    currentStreak,
    reward,
    week,
    todayRecord,
    canRecord,
    flash,
    pointRules = [],
}) {
    const recordForm = useForm();

    function catatWaktu(event) {
        event.preventDefault();
        recordForm.post('/catat-waktu-berangkat');
    }

    return (
        <>
            <Head title="Beranda" />
            <Toast message={flash?.success} />
            <RecordResultModal result={flash?.recordResult} />

            <div className="min-h-[100dvh] bg-[#f5f2ec] pb-24 text-[#17342d] md:pb-8">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-4 pt-6 sm:px-8 md:pb-6 md:pt-8">
                    <Link
                        href="/"
                        aria-label="Kembali ke dashboard"
                        className="flex items-center gap-3 rounded-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                        <img
                            src={iconMark}
                            alt=""
                            aria-hidden="true"
                            className="h-10 w-10 rounded-2xl object-cover shadow-[0_10px_24px_rgba(23,52,45,0.12)]"
                        />
                        <div>
                            <BrandWordmark className="text-[15px] font-bold tracking-[-0.02em]" />
                            <p className="text-[10px] font-medium tracking-[0.04em] text-[#7b9288]">
                                Satu Hari Lebih Baik.
                            </p>
                        </div>
                    </Link>
                    <ShortcutMenu />
                </header>

                <main className="mx-auto grid w-full max-w-6xl gap-5 px-5 sm:px-8 md:grid-cols-[1.08fr_0.92fr] md:gap-6">
                    <section className="relative overflow-hidden rounded-[2rem] bg-[#17342d] px-6 pb-7 pt-7 text-[#f5f2ec] shadow-[0_24px_60px_rgba(23,52,45,0.14)] sm:px-9 sm:pb-9 sm:pt-8">
                        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3d8a70]/35 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-[#b8d2c5]">
                                        Selamat pagi, {child.name}
                                    </p>
                                    <h1 className="mt-2 max-w-[16ch] text-[clamp(2.1rem,8vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
                                        Satu langkah baik untuk hari ini.
                                    </h1>
                                </div>
                                <Sparkle
                                    className="mt-1 shrink-0 text-[#e7a84e]"
                                    size={24}
                                    weight="fill"
                                />
                            </div>

                            <div className="mt-10 flex items-end justify-between gap-5 border-t border-white/15 pt-5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#9dbbae]">
                                        {today}
                                    </p>
                                    <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.06em] text-white">
                                        {currentTime}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[#b8d2c5]">Target</p>
                                    <p className="mt-1 font-mono text-lg font-semibold text-[#e7a84e]">
                                        {targetTime}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-[1.4rem] bg-[#f5f2ec] p-1.5 text-[#17342d]">
                                {todayRecord ? (
                                    <div className="flex min-h-16 items-center justify-between rounded-[1.1rem] bg-[#dfe9df] px-5">
                                        <span>
                                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#527268]">
                                                Sudah tercatat
                                            </span>
                                            <span className="mt-1 block text-lg font-bold tracking-[-0.03em]">
                                                Pukul {todayRecord.time} · +{todayRecord.points}{' '}
                                                poin
                                            </span>
                                        </span>
                                        <Link
                                            href="/catatan"
                                            aria-label="Edit catatan hari ini"
                                            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-[#3d8a70] hover:bg-white/60">
                                            <Check size={24} weight="bold" />
                                        </Link>
                                    </div>
                                ) : canRecord ? (
                                    <form onSubmit={catatWaktu}>
                                        <button
                                            disabled={recordForm.processing}
                                            className="group flex min-h-16 w-full items-center justify-between rounded-[1.1rem] bg-[#e7a84e] px-5 text-left transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-wait disabled:opacity-70">
                                            <span>
                                                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b4916]">
                                                    Aksi pagi
                                                </span>
                                                <span className="mt-1 block text-lg font-bold tracking-[-0.03em]">
                                                    {recordForm.processing
                                                        ? 'Mencatat...'
                                                        : 'Catat waktu berangkat'}
                                                </span>
                                            </span>
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17342d] text-[#f5f2ec] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px">
                                                <ArrowUpRight size={21} weight="bold" />
                                            </span>
                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex min-h-16 items-center justify-between rounded-[1.1rem] bg-[#edf0e9] px-5">
                                        <span>
                                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#789088]">
                                                Hari tanpa jadwal
                                            </span>
                                            <span className="mt-1 block text-base font-bold tracking-[-0.03em]">
                                                Nikmati waktu bersama keluarga
                                            </span>
                                        </span>
                                        <Check
                                            className="shrink-0 text-[#8ca198]"
                                            size={22}
                                            weight="bold"
                                        />
                                    </div>
                                )}
                            </div>
                            <PointGuide rules={pointRules} target={targetTime} />
                        </div>
                    </section>

                    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-1">
                        <Link
                            href="/statistik"
                            aria-label="Lihat statistik konsistensi"
                            className="group rounded-[2rem] bg-white/80 p-6 ring-1 ring-[#e1e8e1] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(23,52,45,0.10)] active:scale-[0.985] motion-safe:animate-[poinka-rise_700ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-7">
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                                    <Medal size={22} weight="duotone" />
                                </div>
                                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8ca198]">
                                    Konsistensi{' '}
                                    <ArrowUpRight
                                        className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px"
                                        size={15}
                                    />
                                </span>
                            </div>
                            <p className="mt-7 font-mono text-4xl font-semibold tracking-[-0.07em] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                                {currentStreak}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#668077]">
                                hari berturut-turut
                            </p>
                            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#3d8a70] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                                <Check size={15} weight="bold" />
                                Lihat perjalanan
                            </div>
                        </Link>

                        <Link
                            href="/hadiah"
                            aria-label="Lihat saldo dan hadiah"
                            className="group rounded-[2rem] bg-[#e7a84e] p-6 text-[#17342d] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(126,88,29,0.18)] active:scale-[0.985] motion-safe:animate-[poinka-rise_700ms_cubic-bezier(0.32,0.72,0,1)_both] [animation-delay:120ms] sm:p-7">
                            <div className="flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f5d79f] text-[#7e581d]">
                                    <Target size={22} weight="duotone" />
                                </div>
                                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7e581d]">
                                    Saldo poin{' '}
                                    <ArrowUpRight
                                        className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-px"
                                        size={15}
                                    />
                                </span>
                            </div>
                            <p className="mt-7 font-mono text-4xl font-semibold tracking-[-0.07em] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                                {balance}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#7e581d]">poin tersedia</p>
                            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#7e581d] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                                <Gift size={15} weight="bold" />
                                Lihat hadiah pilihan
                            </div>
                        </Link>
                    </div>

                    <section className="rounded-[2rem] bg-white/80 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                                    Ritme minggu ini
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                                    Sedikit demi sedikit.
                                </h2>
                            </div>
                            <Link
                                href="/statistik"
                                className="flex min-h-11 items-center gap-1 rounded-full bg-[#edf0e9] px-3 text-xs font-bold text-[#3d8a70] transition-colors hover:bg-[#dfe9df]">
                                Lihat Statistik <ArrowUpRight size={15} weight="bold" />
                            </Link>
                        </div>
                        <div className="mt-5 divide-y divide-[#edf0e9]">
                            {week.map((item) => (
                                <WeekRow item={item} key={item.date} />
                            ))}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-[2rem] bg-[#dfe9df] p-6 sm:p-8">
                        <div className="overflow-hidden rounded-[1.5rem] bg-[#cbdccb]">
                            {reward?.imageUrl ? (
                                <img
                                    src={reward.imageUrl}
                                    alt={reward.name}
                                    className="aspect-[4/3] h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex aspect-[4/3] items-center justify-center text-[#3d8a70]">
                                    <Gift size={68} weight="duotone" />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5e766d]">
                                    Target hadiah
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                                    {reward?.name || 'Belum ada hadiah'}
                                </h2>
                            </div>
                            {reward && (
                                <Link
                                    href="/hadiah"
                                    className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-white/70 px-4 text-xs font-bold text-[#3d8a70] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]">
                                    Detail <ArrowUpRight size={15} weight="bold" />
                                </Link>
                            )}
                        </div>
                        <div className="mt-6 flex items-end justify-between gap-4">
                            {reward ? (
                                <p className="font-mono text-3xl font-semibold tracking-[-0.07em]">
                                    {reward.current}{' '}
                                    <span className="font-sans text-sm font-medium tracking-normal text-[#6f877d]">
                                        / {reward.cost}
                                    </span>
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-[#6f877d]">
                                    Tambahkan hadiah pertama
                                </p>
                            )}
                        </div>
                        {reward && (
                            <>
                                <div className="mt-4">
                                    <ProgressBar current={reward.current} total={reward.cost} />
                                </div>
                                <p className="mt-3 text-sm font-medium text-[#6f877d]">
                                    Tinggal {reward.cost - reward.current} poin lagi
                                </p>
                            </>
                        )}
                    </section>
                </main>

                <BottomNav active="beranda" />

                <div className="mx-auto mt-6 flex max-w-6xl items-center justify-center gap-2 px-5 text-center text-[11px] font-medium text-[#9aaba3] sm:px-8">
                    <LockKey size={13} weight="duotone" />
                    Catatan waktu ditentukan oleh server
                </div>
            </div>
        </>
    );
}
