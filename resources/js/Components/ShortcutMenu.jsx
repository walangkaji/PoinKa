import { ArrowUpRight, List } from '@phosphor-icons/react';
import { Link } from '@inertiajs/react';
import { useDismissablePopover } from './FormControls';

export default function ShortcutMenu() {
    const menu = useDismissablePopover();

    return (
        <div className="relative" ref={menu.rootRef}>
            <button
                type="button"
                aria-label="Buka menu pintasan"
                aria-haspopup="menu"
                aria-expanded={menu.open}
                onClick={() => menu.setOpen((current) => !current)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/75 text-[#527268] ring-1 ring-[#dfe7df] transition-[background-color,transform] duration-300 hover:bg-white active:scale-[0.97]">
                <List size={24} weight="bold" />
            </button>
            {menu.open && (
                <div
                    role="menu"
                    aria-label="Menu pintasan"
                    className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl bg-white p-2 text-[#17342d] shadow-[0_18px_45px_rgba(23,52,45,0.16)] ring-1 ring-[#e1e8e1]">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ca198]">
                        Menu pintasan
                    </p>
                    <Link
                        href="/riwayat-poin"
                        role="menuitem"
                        onClick={() => menu.setOpen(false)}
                        className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold text-[#31554a] transition-colors hover:bg-[#edf0e9]">
                        Riwayat poin <ArrowUpRight size={16} weight="bold" />
                    </Link>
                    <Link
                        href="/catatan"
                        role="menuitem"
                        onClick={() => menu.setOpen(false)}
                        className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold text-[#31554a] transition-colors hover:bg-[#edf0e9]">
                        Catatan berangkat <ArrowUpRight size={16} weight="bold" />
                    </Link>
                </div>
            )}
        </div>
    );
}
