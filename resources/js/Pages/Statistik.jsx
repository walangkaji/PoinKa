import {
    ArrowDown,
    ArrowUp,
    ArrowUpRight,
    ChartLineUp,
    Check,
    Clock,
    Medal,
    Target,
} from '@phosphor-icons/react';
import { Link } from '@inertiajs/react';
import ProductShell from '../Components/ProductShell';

function Delta({ value, suffix = 'poin' }) {
    if (value === 0)
        return <span className="text-xs font-semibold text-[#8ca198]">Tidak berubah</span>;

    const positive = value > 0;

    return (
        <span
            className={
                'flex items-center gap-1 text-xs font-bold ' +
                (positive ? 'text-[#3d8a70]' : 'text-[#a3622e]')
            }>
            {positive ? <ArrowUp size={14} weight="bold" /> : <ArrowDown size={14} weight="bold" />}
            {Math.abs(value)}
            {suffix === '%' ? suffix : ' ' + suffix}
        </span>
    );
}

export default function Statistik({ summary, previousSummary, chart, records }) {
    const maxPoints = Math.max(1, ...chart.map((item) => item.points));
    const pointsDelta = summary.points - previousSummary.points;
    const percentageDelta = summary.onTimePercentage - previousSummary.onTimePercentage;

    return (
        <ProductShell
            active="statistik"
            eyebrow="Lihat langkah yang terkumpul"
            title="Statistik minggu ini">
            <section className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-[2rem] bg-[#17342d] p-5 text-[#f5f2ec]">
                    <Medal size={24} weight="duotone" className="text-[#e7a84e]" />
                    <p className="mt-6 font-mono text-3xl font-semibold">{summary.streak}</p>
                    <p className="mt-1 text-sm text-[#b8d2c5]">hari berturut-turut</p>
                </div>
                <div className="rounded-[2rem] bg-white/85 p-5 ring-1 ring-[#e1e8e1]">
                    <Target size={24} weight="duotone" className="text-[#3d8a70]" />
                    <p className="mt-6 font-mono text-3xl font-semibold">
                        {summary.onTimePercentage}%
                    </p>
                    <p className="mt-1 text-sm text-[#789088]">tepat waktu</p>
                    <Delta value={percentageDelta} suffix="%" />
                </div>
                <div className="rounded-[2rem] bg-[#e7a84e] p-5">
                    <Check size={24} weight="bold" />
                    <p className="mt-6 font-mono text-3xl font-semibold">+{summary.points}</p>
                    <p className="mt-1 text-sm text-[#7e581d]">poin minggu ini</p>
                    <Delta value={pointsDelta} />
                </div>
                <div className="rounded-[2rem] bg-[#dfe9df] p-5">
                    <Clock size={24} weight="duotone" className="text-[#3d8a70]" />
                    <p className="mt-6 font-mono text-3xl font-semibold">
                        {summary.averageTime || '--:--'}
                    </p>
                    <p className="mt-1 text-sm text-[#527268]">rata-rata berangkat</p>
                </div>
            </section>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf0e9] text-[#3d8a70]">
                        <ChartLineUp size={21} weight="duotone" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.04em]">
                            Grafik minggu ini
                        </h2>
                        <p className="mt-1 text-sm text-[#789088]">
                            Perbandingan poin setiap hari sekolah.
                        </p>
                    </div>
                </div>
                <div className="mt-6 flex h-52 items-end justify-between gap-2 border-b border-[#e1e8e1] px-1">
                    {chart.map((item) => (
                        <div
                            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                            key={item.date}>
                            <div className="flex h-full w-full items-end justify-center">
                                <div
                                    title={item.points + ' poin'}
                                    className={
                                        'w-full max-w-8 rounded-t-xl transition-[height] ' +
                                        (item.onTime === true
                                            ? 'bg-[#3d8a70]'
                                            : item.hasRecord
                                              ? 'bg-[#e7a84e]'
                                              : 'bg-[#dfe5df]')
                                    }
                                    style={{
                                        height: item.points
                                            ? Math.max(10, (item.points / maxPoints) * 100) + '%'
                                            : '6%',
                                    }}
                                />
                            </div>
                            <span className="text-[10px] font-bold text-[#789088]">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-[#789088]">
                    <span className="flex items-center gap-1.5">
                        <i className="h-2.5 w-2.5 rounded-full bg-[#3d8a70]" />
                        Tepat waktu
                    </span>
                    <span className="flex items-center gap-1.5">
                        <i className="h-2.5 w-2.5 rounded-full bg-[#e7a84e]" />
                        Terlambat
                    </span>
                    <span className="flex items-center gap-1.5">
                        <i className="h-2.5 w-2.5 rounded-full bg-[#dfe5df]" />
                        Belum tercatat
                    </span>
                </div>
            </section>
            <section className="mt-5 rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                            Catatan minggu ini
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                            Setiap hari punya arti.
                        </h2>
                    </div>
                    <Link
                        href="/catatan"
                        className="flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-bold text-[#3d8a70] hover:bg-[#edf0e9]">
                        Kelola <ArrowUpRight size={15} />
                    </Link>
                </div>
                <div className="mt-5 divide-y divide-[#edf0e9]">
                    {records.length === 0 ? (
                        <p className="py-6 text-sm text-[#789088]">Belum ada catatan minggu ini.</p>
                    ) : (
                        records.map((record) => (
                            <div className="flex items-center gap-3 py-4" key={record.date}>
                                <span
                                    className={
                                        'flex h-9 w-9 items-center justify-center rounded-xl ' +
                                        (record.onTime
                                            ? 'bg-[#dfe9df] text-[#3d8a70]'
                                            : 'bg-[#f5e4d8] text-[#a3622e]')
                                    }>
                                    <Check size={17} weight="bold" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">{record.date}</p>
                                    <p className="text-xs text-[#789088]">
                                        {record.onTime
                                            ? 'Tepat waktu'
                                            : 'Tetap tercatat, lanjutkan besok'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-sm font-bold">{record.time}</p>
                                    <p className="text-xs font-semibold text-[#3d8a70]">
                                        +{record.points} poin
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </ProductShell>
    );
}
