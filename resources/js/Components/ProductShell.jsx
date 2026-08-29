import iconMark from '../../images/icon.png';
import { Head, Link } from '@inertiajs/react';
import BottomNav from './BottomNav';
import BrandWordmark from './BrandWordmark';
import ShortcutMenu from './ShortcutMenu';
import Toast from './Toast';

export default function ProductShell({
    title,
    eyebrow,
    active = 'beranda',
    flash,
    error,
    children,
}) {
    return (
        <div className="min-h-[100dvh] bg-[#f5f2ec] px-5 pb-28 text-[#17342d] sm:px-8 md:pb-10">
            <Head title={title} />
            <Toast message={flash?.success} />
            <Toast message={error} tone="error" />
            <header className="mx-auto flex w-full max-w-3xl items-center justify-between py-6 sm:py-8">
                <Link href="/" className="flex items-center gap-3">
                    <img
                        src={iconMark}
                        alt=""
                        aria-hidden="true"
                        className="h-10 w-10 rounded-2xl object-cover"
                    />
                    <span>
                        <BrandWordmark className="block text-[15px] font-bold" />
                        <span className="block text-[10px] font-medium tracking-[0.04em] text-[#7b9288]">
                            Satu Hari Lebih Baik.
                        </span>
                    </span>
                </Link>
                <ShortcutMenu />
            </header>
            <main className="mx-auto w-full max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3d8a70]">
                    {eyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.07em]">
                    {title}
                </h1>
                <div className="mt-8">{children}</div>
            </main>
            <BottomNav active={active} />
        </div>
    );
}
