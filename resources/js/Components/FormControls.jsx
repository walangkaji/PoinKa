import {
    CalendarDots,
    CaretDown,
    CaretLeft,
    CaretRight,
    Check,
    Clock,
    X,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const weekDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const monthFormatter = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

export function getTodayKey() {
    const today = new Date();

    return formatDateKey(today);
}

function formatDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function parseDateKey(value) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    return year && month && day ? new Date(year, month - 1, day) : null;
}

function isDateDisabled(dateKey, min, max) {
    return (min && dateKey < min) || (max && dateKey > max);
}

export function useDismissablePopover() {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return { open, setOpen, rootRef };
}

export function DatePicker({ label, value, onChange, error, min, max, optional = false }) {
    const popover = useDismissablePopover();
    const [viewDate, setViewDate] = useState(
        () => parseDateKey(value) || parseDateKey(min) || new Date(),
    );
    const selectedDate = parseDateKey(value);

    useEffect(() => {
        if (value) {
            setViewDate(parseDateKey(value));
        }
    }, [value]);

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const leadingEmptyDays = (new Date(year, month, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cellCount = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7;

        return Array.from({ length: cellCount }, (_, index) => {
            const day = index - leadingEmptyDays + 1;

            if (day < 1 || day > daysInMonth) {
                return null;
            }

            const date = new Date(year, month, day);

            return { key: formatDateKey(date), day };
        });
    }, [viewDate]);

    function changeMonth(offset) {
        setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    }

    function selectDate(dateKey) {
        if (isDateDisabled(dateKey, min, max)) {
            return;
        }

        popover.setOpen(false);
        onChange(dateKey);
    }

    return (
        <div className="block">
            <span className="text-sm font-semibold text-[#31554a]">
                {label}
                {optional && <span className="font-normal text-[#8ca198]"> (opsional)</span>}
            </span>
            <div className="relative mt-2" ref={popover.rootRef}>
                <button
                    type="button"
                    aria-label={label}
                    aria-haspopup="dialog"
                    aria-expanded={popover.open}
                    onClick={() => {
                        setViewDate(parseDateKey(value) || parseDateKey(min) || new Date());
                        popover.setOpen((current) => !current);
                    }}
                    className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[#f5f2ec] px-4 text-left text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#edf0e9] focus:ring-2 focus:ring-[#3d8a70]">
                    <CalendarDots size={20} weight="duotone" className="shrink-0 text-[#3d8a70]" />
                    <span className={value ? '' : 'text-[#9aaba3]'}>
                        {selectedDate ? dateFormatter.format(selectedDate) : 'Pilih tanggal'}
                    </span>
                    <CaretDown
                        size={18}
                        weight="bold"
                        className={`ml-auto shrink-0 text-[#527268] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${popover.open ? 'rotate-180' : ''}`}
                    />
                </button>
                {popover.open && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/50 px-4 py-6 backdrop-blur-sm motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) popover.setOpen(false);
                        }}>
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Pilih ${label.toLowerCase()}`}
                            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-4 shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-5"
                            onMouseDown={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                                        Pilih tanggal
                                    </p>
                                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#17342d]">
                                        {label}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => popover.setOpen(false)}
                                    aria-label="Tutup pilihan tanggal"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] focus:outline-none focus:ring-2 focus:ring-[#3d8a70]">
                                    <X size={19} weight="bold" />
                                </button>
                            </div>
                            <div className="mt-5 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    aria-label="Bulan sebelumnya"
                                    onClick={() => changeMonth(-1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#527268] transition-colors hover:bg-[#edf0e9]">
                                    <CaretLeft size={18} weight="bold" />
                                </button>
                                <p className="text-sm font-bold capitalize text-[#31554a]">
                                    {monthFormatter.format(viewDate)}
                                </p>
                                <button
                                    type="button"
                                    aria-label="Bulan berikutnya"
                                    onClick={() => changeMonth(1)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#527268] transition-colors hover:bg-[#edf0e9]">
                                    <CaretRight size={18} weight="bold" />
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-[#789088]">
                                {weekDays.map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>
                            <div className="mt-2 grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) =>
                                    day ? (
                                        <button
                                            type="button"
                                            key={day.key}
                                            disabled={isDateDisabled(day.key, min, max)}
                                            aria-pressed={value === day.key}
                                            onClick={() => selectDate(day.key)}
                                            className={`h-10 rounded-xl text-xs font-semibold transition-colors ${value === day.key ? 'bg-[#3d8a70] text-white' : isDateDisabled(day.key, min, max) ? 'cursor-not-allowed text-[#c3cdc5]' : 'text-[#31554a] hover:bg-[#edf0e9]'}`}>
                                            {day.day}
                                        </button>
                                    ) : (
                                        <span aria-hidden="true" key={`empty-${index}`} />
                                    ),
                                )}
                            </div>
                            {optional && value && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('');
                                        popover.setOpen(false);
                                    }}
                                    className="mt-3 min-h-10 w-full rounded-xl text-xs font-bold text-[#a3622e] transition-colors hover:bg-[#f5e4d8]">
                                    Hapus Pilihan
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => popover.setOpen(false)}
                                className="mt-3 min-h-11 w-full rounded-xl bg-[#f5f2ec] px-4 text-sm font-bold text-[#31554a] transition-colors hover:bg-[#edf0e9]">
                                Batal
                            </button>
                        </section>
                    </div>
                )}
            </div>
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </div>
    );
}

function timeParts(value) {
    const [hour = '00', minute = '00'] = String(value || '').split(':');

    return { hour: hour.padStart(2, '0').slice(0, 2), minute: minute.padStart(2, '0').slice(0, 2) };
}

function validTimePart(value, maximum) {
    const numericValue = Number.parseInt(value || '0', 10);

    return String(
        Math.min(maximum, Math.max(0, Number.isNaN(numericValue) ? 0 : numericValue)),
    ).padStart(2, '0');
}

function timeToMinutes(value) {
    const current = timeParts(value);

    return Number(current.hour) * 60 + Number(current.minute);
}

function formatMinutes(totalMinutes) {
    const safeMinutes = Math.min(23 * 60 + 59, Math.max(0, totalMinutes));

    return `${String(Math.floor(safeMinutes / 60)).padStart(2, '0')}:${String(safeMinutes % 60).padStart(2, '0')}`;
}

function centerTimeOption(listRef, optionRef) {
    const list = listRef.current;
    const option = optionRef.current;

    if (!list || !option) return;

    const listBounds = list.getBoundingClientRect();
    const optionBounds = option.getBoundingClientRect();
    const optionCenter = optionBounds.top - listBounds.top + optionBounds.height / 2;

    list.scrollTop += optionCenter - list.clientHeight / 2;
}

export function TargetTimePicker({ label, value, onChange, error, helper }) {
    const popover = useDismissablePopover();
    const current = timeParts(value);
    const [hour, setHour] = useState(current.hour);
    const [minute, setMinute] = useState(current.minute);
    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);
    const selectedHourRef = useRef(null);
    const selectedMinuteRef = useRef(null);
    const currentMinutes = timeToMinutes(value);
    const quickTimes = useMemo(() => {
        const start = Math.max(
            0,
            Math.min(23 * 60 - 60, Math.floor((currentMinutes - 30) / 15) * 15),
        );
        const options = Array.from({ length: 5 }, (_, index) => formatMinutes(start + index * 15));

        return options.includes(`${current.hour}:${current.minute}`)
            ? options
            : [...options, `${current.hour}:${current.minute}`];
    }, [current.hour, current.minute, currentMinutes]);

    useEffect(() => {
        if (!popover.open) return undefined;

        const frame = requestAnimationFrame(() => {
            centerTimeOption(hourListRef, selectedHourRef);
            centerTimeOption(minuteListRef, selectedMinuteRef);
            selectedHourRef.current?.focus({ preventScroll: true });
        });

        return () => cancelAnimationFrame(frame);
    }, [popover.open]);

    function openPicker() {
        setHour(current.hour);
        setMinute(current.minute);
        popover.setOpen(true);
    }

    function adjustTime(offset) {
        onChange(formatMinutes(currentMinutes + offset));
    }

    function commitTime() {
        popover.setOpen(false);
        onChange(`${validTimePart(hour, 23)}:${validTimePart(minute, 59)}`);
    }

    return (
        <div className="block">
            <span className="text-sm font-semibold text-[#31554a]">{label}</span>
            {helper && (
                <span className="mt-1 block text-xs leading-5 text-[#789088]">{helper}</span>
            )}
            <div className="relative mt-3" ref={popover.rootRef}>
                <div className="rounded-[1.5rem] bg-[#f5f2ec] p-4 ring-1 ring-[#e1e8e1] sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => adjustTime(-5)}
                            aria-label="Kurangi 5 menit"
                            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-white/75 text-[#31554a] ring-1 ring-[#dfe8dc] transition-transform active:scale-95 sm:h-20 sm:w-20">
                            <span className="text-2xl font-semibold leading-none">−5</span>
                            <span className="mt-1 text-[10px] font-bold">menit</span>
                        </button>
                        <div className="min-w-0 text-center">
                            <p className="font-mono text-[clamp(2.8rem,12vw,4.5rem)] font-semibold leading-none tracking-[-0.09em] text-[#17342d]">
                                {current.hour}:{current.minute}
                            </p>
                            <p className="mt-2 text-xs font-medium text-[#668077] sm:text-sm">
                                Berangkat paling lambat
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => adjustTime(5)}
                            aria-label="Tambah 5 menit"
                            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-white/75 text-[#31554a] ring-1 ring-[#dfe8dc] transition-transform active:scale-95 sm:h-20 sm:w-20">
                            <span className="text-2xl font-semibold leading-none">+5</span>
                            <span className="mt-1 text-[10px] font-bold">menit</span>
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={openPicker}
                        aria-haspopup="dialog"
                        aria-expanded={popover.open}
                        className="mt-5 flex min-h-12 w-full items-center justify-between rounded-2xl bg-white/75 px-4 text-sm font-bold text-[#3d8a70] ring-1 ring-[#e1e8e1] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#3d8a70]">
                        Ubah Waktu Lainnya <CaretRight size={19} weight="bold" />
                    </button>
                </div>
                {popover.open && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17342d]/50 px-4 py-6 backdrop-blur-sm motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6"
                        role="presentation"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) popover.setOpen(false);
                        }}>
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="target-time-dialog-title"
                            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-4 shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-5"
                            onMouseDown={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                                        Target tepat waktu
                                    </p>
                                    <h2
                                        id="target-time-dialog-title"
                                        className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#17342d]">
                                        Ubah waktu target
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => popover.setOpen(false)}
                                    aria-label="Tutup pilihan waktu"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] focus:outline-none focus:ring-2 focus:ring-[#3d8a70]">
                                    <X size={19} weight="bold" />
                                </button>
                            </div>
                            <p className="mt-5 text-sm font-bold text-[#31554a]">
                                Pilih waktu cepat
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {quickTimes.map((time) => (
                                    <button
                                        type="button"
                                        key={time}
                                        onClick={() => {
                                            popover.setOpen(false);
                                            onChange(time);
                                        }}
                                        className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold ring-1 transition-colors ${time === `${current.hour}:${current.minute}` ? 'bg-[#edf0e9] text-[#17342d] ring-[#3d8a70]' : 'bg-[#f5f2ec] text-[#31554a] ring-[#e1e8e1] hover:bg-[#edf0e9]'}`}>
                                        {time}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-[#789088]">Jam</p>
                                    <div
                                        ref={hourListRef}
                                        className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-[#f5f2ec] p-1">
                                        {Array.from({ length: 24 }, (_, index) =>
                                            String(index).padStart(2, '0'),
                                        ).map((option) => (
                                            <button
                                                type="button"
                                                ref={option === hour ? selectedHourRef : undefined}
                                                key={option}
                                                onClick={() => setHour(option)}
                                                className={`flex min-h-10 w-full items-center justify-center rounded-lg text-sm font-semibold ${option === hour ? 'bg-[#dfe9df] text-[#17342d]' : 'text-[#527268] hover:bg-white'}`}>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#789088]">Menit</p>
                                    <div
                                        ref={minuteListRef}
                                        className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-[#f5f2ec] p-1">
                                        {Array.from({ length: 60 }, (_, index) =>
                                            String(index).padStart(2, '0'),
                                        ).map((option) => (
                                            <button
                                                type="button"
                                                ref={
                                                    option === minute
                                                        ? selectedMinuteRef
                                                        : undefined
                                                }
                                                key={option}
                                                onClick={() => setMinute(option)}
                                                className={`flex min-h-10 w-full items-center justify-center rounded-lg text-sm font-semibold ${option === minute ? 'bg-[#dfe9df] text-[#17342d]' : 'text-[#527268] hover:bg-white'}`}>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => popover.setOpen(false)}
                                    className="min-h-11 rounded-xl bg-[#f5f2ec] px-4 text-sm font-bold text-[#31554a] transition-colors hover:bg-[#edf0e9]">
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={commitTime}
                                    className="min-h-11 rounded-xl bg-[#17342d] px-4 text-sm font-bold text-white transition-transform active:scale-[0.985]">
                                    Terapkan
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </div>
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </div>
    );
}

export function TimePicker({
    label,
    value,
    onChange,
    error,
    helper,
    withinModal = false,
    onOpenChange,
}) {
    const popover = useDismissablePopover();
    const current = timeParts(value);
    const [hour, setHour] = useState(current.hour);
    const [minute, setMinute] = useState(current.minute);
    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);
    const selectedHourRef = useRef(null);
    const selectedMinuteRef = useRef(null);
    const nestedPickerOpen = withinModal && popover.open;

    function setPickerOpen(nextOpen) {
        popover.setOpen(nextOpen);
        onOpenChange?.(nextOpen);
    }

    useEffect(() => {
        if (!popover.open) return undefined;

        const frame = requestAnimationFrame(() => {
            centerTimeOption(hourListRef, selectedHourRef);
            centerTimeOption(minuteListRef, selectedMinuteRef);
            selectedHourRef.current?.focus({ preventScroll: true });
        });

        return () => cancelAnimationFrame(frame);
    }, [popover.open]);

    function openPicker() {
        const next = timeParts(value);
        setHour(next.hour);
        setMinute(next.minute);
        setPickerOpen(true);
    }

    function commitTime() {
        setPickerOpen(false);
        onChange(`${validTimePart(hour, 23)}:${validTimePart(minute, 59)}`);
    }

    return (
        <div className="block">
            <span
                className={`text-sm font-semibold text-[#31554a] ${nestedPickerOpen ? 'invisible' : ''}`}>
                {label}
            </span>
            {helper && (
                <span
                    className={`mt-1 block text-xs leading-5 text-[#789088] ${nestedPickerOpen ? 'invisible' : ''}`}>
                    {helper}
                </span>
            )}
            <div className="relative mt-2" ref={popover.rootRef}>
                <button
                    type="button"
                    aria-label={label}
                    aria-haspopup="dialog"
                    aria-expanded={popover.open}
                    onClick={openPicker}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl bg-[#f5f2ec] px-4 text-left text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#edf0e9] focus:ring-2 focus:ring-[#3d8a70] ${nestedPickerOpen ? 'invisible' : ''}`}>
                    <Clock size={20} weight="duotone" className="shrink-0 text-[#3d8a70]" />
                    <span className={value ? '' : 'text-[#9aaba3]'}>
                        {value ? `${current.hour}:${current.minute}` : 'Pilih jam'}
                    </span>
                    <CaretDown
                        size={18}
                        weight="bold"
                        className={`ml-auto shrink-0 text-[#527268] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${popover.open ? 'rotate-180' : ''}`}
                    />
                </button>
                {popover.open && (
                    <div
                        className={`fixed inset-0 ${withinModal ? 'z-[70] bg-transparent' : 'z-[60] bg-[#17342d]/50 backdrop-blur-sm'} flex items-center justify-center px-4 py-6 motion-safe:animate-[poinka-modal-backdrop-in_220ms_ease-out_both] sm:p-6`}
                        role="presentation"
                        onMouseDown={(event) => {
                            if (withinModal) {
                                event.stopPropagation();
                                return;
                            }
                            if (event.target === event.currentTarget) setPickerOpen(false);
                        }}
                        onClick={
                            withinModal
                                ? (event) => {
                                      event.stopPropagation();
                                      if (event.target === event.currentTarget)
                                          setPickerOpen(false);
                                  }
                                : undefined
                        }>
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Pilih ${label.toLowerCase()}`}
                            className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-4 shadow-[0_24px_70px_rgba(23,52,45,0.22)] ring-1 ring-[#e1e8e1] motion-safe:animate-[poinka-modal-in_420ms_cubic-bezier(0.32,0.72,0,1)_both] sm:p-5"
                            onMouseDown={(event) => event.stopPropagation()}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8ca198]">
                                        Atur waktu
                                    </p>
                                    <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#17342d]">
                                        {label}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(false)}
                                    aria-label="Tutup pilihan waktu"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#789088] transition-colors hover:bg-[#f5f2ec] focus:outline-none focus:ring-2 focus:ring-[#3d8a70]">
                                    <X size={19} weight="bold" />
                                </button>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-[#789088]">Jam</p>
                                    <div
                                        ref={hourListRef}
                                        className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-[#f5f2ec] p-1">
                                        {Array.from({ length: 24 }, (_, index) =>
                                            String(index).padStart(2, '0'),
                                        ).map((option) => (
                                            <button
                                                type="button"
                                                ref={option === hour ? selectedHourRef : undefined}
                                                key={option}
                                                onClick={() => setHour(option)}
                                                className={`flex min-h-10 w-full items-center justify-center rounded-lg text-sm font-semibold ${option === hour ? 'bg-[#dfe9df] text-[#17342d]' : 'text-[#527268] hover:bg-white'}`}>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#789088]">Menit</p>
                                    <div
                                        ref={minuteListRef}
                                        className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-[#f5f2ec] p-1">
                                        {Array.from({ length: 60 }, (_, index) =>
                                            String(index).padStart(2, '0'),
                                        ).map((option) => (
                                            <button
                                                type="button"
                                                ref={
                                                    option === minute
                                                        ? selectedMinuteRef
                                                        : undefined
                                                }
                                                key={option}
                                                onClick={() => setMinute(option)}
                                                className={`flex min-h-10 w-full items-center justify-center rounded-lg text-sm font-semibold ${option === minute ? 'bg-[#dfe9df] text-[#17342d]' : 'text-[#527268] hover:bg-white'}`}>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(false)}
                                    className="min-h-11 rounded-xl bg-[#f5f2ec] px-4 text-sm font-bold text-[#31554a] transition-colors hover:bg-[#edf0e9]">
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={commitTime}
                                    className="min-h-11 rounded-xl bg-[#17342d] px-4 text-sm font-bold text-white transition-transform active:scale-[0.985]">
                                    Terapkan
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </div>
            {error && (
                <span
                    className={`mt-2 block text-xs font-medium text-[#a3622e] ${nestedPickerOpen ? 'invisible' : ''}`}>
                    {error}
                </span>
            )}
        </div>
    );
}

export function SelectMenu({ value, options, onChange, ariaLabel, className = '' }) {
    const popover = useDismissablePopover();
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div ref={popover.rootRef} className={`relative ${className}`}>
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={popover.open}
                aria-label={ariaLabel}
                onClick={() => popover.setOpen((current) => !current)}
                className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#f5f2ec] px-4 text-left text-sm font-semibold text-[#31554a] outline-none ring-1 ring-[#e1e8e1] transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#edf0e9] focus:ring-2 focus:ring-[#3d8a70]">
                <span>{selectedOption?.label}</span>
                <CaretDown
                    size={18}
                    weight="bold"
                    className={`text-[#527268] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${popover.open ? 'rotate-180' : ''}`}
                />
            </button>
            {popover.open && (
                <div
                    role="listbox"
                    aria-label={ariaLabel}
                    className="absolute inset-x-0 top-full z-20 mt-2 rounded-2xl bg-white p-1.5 shadow-[0_18px_45px_rgba(23,52,45,0.16)] ring-1 ring-[#e1e8e1]">
                    {options.map((option) => (
                        <button
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            key={option.value}
                            onClick={() => {
                                popover.setOpen(false);
                                onChange(option.value);
                            }}
                            className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors ${option.value === value ? 'bg-[#edf0e9] text-[#3d8a70]' : 'text-[#31554a] hover:bg-[#f5f2ec]'}`}>
                            {option.label}
                            {option.value === value && <Check size={17} weight="bold" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Checkbox({ checked, onChange, children }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex min-h-11 items-center gap-3 text-left text-sm text-[#668077]">
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 transition-[background-color,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${checked ? 'bg-[#3d8a70] text-white ring-[#3d8a70]' : 'bg-[#f5f2ec] text-transparent ring-[#cbdccc]'}`}>
                <Check size={14} weight="bold" />
            </span>
            <span>{children}</span>
        </button>
    );
}
