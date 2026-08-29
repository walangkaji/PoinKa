import { useForm } from '@inertiajs/react';
import { TimePicker } from '../Components/FormControls';
import AuthShell from '../Components/AuthShell';

const days = [
    { value: 1, label: 'Senin' },
    { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' },
    { value: 4, label: 'Kamis' },
    { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' },
    { value: 7, label: 'Minggu' },
];

export default function Onboarding({ defaults }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        child_name: '',
        on_time_target: defaults.target,
        school_days: defaults.schoolDays,
    });

    function submit(event) {
        event.preventDefault();
        post('/mulai');
    }

    function toggleDay(day) {
        const schoolDays = data.school_days.includes(day)
            ? data.school_days.filter((value) => value !== day)
            : [...data.school_days, day].sort((a, b) => a - b);
        setData('school_days', schoolDays);
    }

    return (
        <AuthShell
            eyebrow="Satu langkah lagi"
            title="Kenalkan kami pada anak Anda."
            description="Informasi ini membantu PoinKa menghitung waktu dan poin dengan aturan yang sesuai keluarga Anda."
            footer="Anda dapat mengubah pengaturan ini kapan saja.">
            <form noValidate className="space-y-6" onSubmit={submit}>
                <label className="block">
                    <span className="text-sm font-semibold text-[#31554a]">Nama anak</span>
                    <input
                        value={data.child_name}
                        onChange={(event) => setData('child_name', event.target.value)}
                        autoComplete="off"
                        className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base leading-[3.5rem] text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                    />
                    {errors.child_name && (
                        <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                            {errors.child_name}
                        </span>
                    )}
                </label>

                <TimePicker
                    label="Target tepat waktu"
                    helper="Berangkat sampai jam ini masih dianggap tepat waktu."
                    value={data.on_time_target}
                    onChange={(value) => setData('on_time_target', value)}
                    error={errors.on_time_target}
                />

                <fieldset>
                    <legend className="text-sm font-semibold text-[#31554a]">Hari sekolah</legend>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {days.map((day) => {
                            const selected = data.school_days.includes(day.value);
                            return (
                                <button
                                    type="button"
                                    key={day.value}
                                    onClick={() => toggleDay(day.value)}
                                    aria-pressed={selected}
                                    className={`min-h-11 rounded-xl text-xs font-bold transition-colors ${selected ? 'bg-[#3d8a70] text-white' : 'bg-[#f5f2ec] text-[#8ca198] ring-1 ring-[#e1e8e1]'}`}>
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                    {errors.school_days && (
                        <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                            Pilih setidaknya satu hari.
                        </span>
                    )}
                </fieldset>

                <button
                    disabled={processing || !isDirty}
                    className="min-h-12 w-full rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-[#f5f2ec] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">
                    {processing ? 'Menyimpan...' : 'Mulai Menggunakan PoinKa'}
                </button>
            </form>
        </AuthShell>
    );
}
