import { ChartLineUp, GearSix, Gift, House } from '@phosphor-icons/react';
import { Link } from '@inertiajs/react';

const items = [
    { key: 'beranda', label: 'Beranda', href: '/', icon: House },
    { key: 'statistik', label: 'Statistik', href: '/statistik', icon: ChartLineUp },
    { key: 'hadiah', label: 'Hadiah', href: '/hadiah', icon: Gift },
    { key: 'pengaturan', label: 'Pengaturan', href: '/pengaturan', icon: GearSix },
];

export default function BottomNav({ active = 'beranda' }) {
    return (
        <nav
            aria-label="Navigasi utama"
            className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e1e8e1] bg-[#f5f2ec]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:static md:mx-auto md:mt-7 md:max-w-xl md:rounded-full md:border md:px-4 md:py-2">
            <div className="mx-auto flex max-w-md items-center justify-around">
                {items.map(({ key, label, href, icon: Icon }) => {
                    const isActive = key === active;
                    return (
                        <Link
                            aria-current={isActive ? 'page' : undefined}
                            href={href}
                            className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[10px] font-semibold transition-colors ${isActive ? 'text-[#3d8a70]' : 'text-[#8ca198] hover:bg-white/70 hover:text-[#527268]'}`}
                            key={key}>
                            <Icon size={21} weight={isActive ? 'fill' : 'regular'} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
