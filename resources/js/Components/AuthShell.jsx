import iconMark from '../../images/icon.png';
import { Head } from '@inertiajs/react';
import BrandWordmark from './BrandWordmark';
import Toast from './Toast';

export default function AuthShell({ eyebrow, title, description, children, footer, flash }) {
    return (
        <div className="min-h-[100dvh] bg-[#f5f2ec] px-5 py-8 text-[#17342d] sm:px-8 sm:py-12">
            <Head title={title} />
            <Toast message={flash?.success} />
            <main className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
                <div className="mb-8 flex items-center gap-3">
                    <img
                        src={iconMark}
                        alt=""
                        aria-hidden="true"
                        className="h-11 w-11 rounded-2xl object-cover shadow-[0_10px_24px_rgba(23,52,45,0.12)]"
                    />
                    <div>
                        <BrandWordmark className="text-[15px] font-bold tracking-[-0.02em]" />
                        <p className="text-[10px] font-medium tracking-[0.04em] text-[#7b9288]">
                            Satu Hari Lebih Baik.
                        </p>
                    </div>
                </div>

                <section className="rounded-[2rem] bg-white/85 p-6 ring-1 ring-[#e1e8e1] sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3d8a70]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.06em]">
                        {title}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[#668077]">{description}</p>
                    <div className="mt-7">{children}</div>
                </section>

                <div className="mt-6 text-center text-sm text-[#668077]">{footer}</div>
            </main>
        </div>
    );
}
