import { Link, useForm } from '@inertiajs/react';
import AuthShell from '../../Components/AuthShell';

function Field({ label, type = 'text', value, onChange, error, autoComplete }) {
    return (
        <label className="block">
            <span className="text-sm font-semibold text-[#31554a]">{label}</span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base leading-[3.5rem] text-[#17342d] outline-none ring-1 ring-[#e1e8e1] transition-[box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-[#9aaba3] focus:ring-2 focus:ring-[#3d8a70]"
            />
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </label>
    );
}

export default function Register() {
    const { data, setData, post, processing, errors, isDirty } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event) {
        event.preventDefault();
        post('/daftar');
    }

    return (
        <AuthShell
            eyebrow="Mulai dari langkah kecil"
            title="Buat kebiasaan yang terasa ringan."
            description="Buat akun Orang Tua untuk mulai mencatat waktu berangkat dan memberi apresiasi yang konsisten."
            footer={
                <span>
                    Sudah punya akun?{' '}
                    <Link className="font-bold text-[#3d8a70]" href="/login">
                        Masuk
                    </Link>
                </span>
            }>
            <form noValidate className="space-y-5" onSubmit={submit}>
                <Field
                    label="Nama Anda"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    error={errors.name}
                    autoComplete="name"
                />
                <Field
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    error={errors.email}
                    autoComplete="email"
                />
                <Field
                    label="Kata sandi"
                    type="password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                />
                <Field
                    label="Ulangi kata sandi"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                />
                <button
                    disabled={processing || !isDirty}
                    className="min-h-12 w-full rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-[#f5f2ec] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">
                    {processing ? 'Membuat Akun...' : 'Buat Akun'}
                </button>
            </form>
        </AuthShell>
    );
}
