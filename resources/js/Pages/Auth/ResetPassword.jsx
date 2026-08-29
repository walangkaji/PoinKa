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
                className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
            />
            {error && (
                <span className="mt-2 block text-xs font-medium text-[#a3622e]">{error}</span>
            )}
        </label>
    );
}

export default function ResetPassword({ token, email, errors }) {
    const { data, setData, post, processing, isDirty } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function submit(event) {
        event.preventDefault();
        post('/reset-password');
    }

    return (
        <AuthShell
            eyebrow="Akses kembali"
            title="Buat kata sandi baru."
            description="Gunakan kata sandi minimal 8 karakter untuk melanjutkan."
            footer={
                <span>
                    Sudah ingat kata sandi?{' '}
                    <Link className="font-bold text-[#3d8a70]" href="/login">
                        Masuk
                    </Link>
                </span>
            }>
            <form noValidate className="space-y-5" onSubmit={submit}>
                <Field
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    error={errors.email}
                    autoComplete="email"
                />
                <Field
                    label="Kata sandi baru"
                    type="password"
                    value={data.password}
                    onChange={(event) => setData('password', event.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                />
                <Field
                    label="Ulangi kata sandi baru"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(event) => setData('password_confirmation', event.target.value)}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                />
                <button
                    disabled={processing || !isDirty}
                    className="min-h-12 w-full rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-[#f5f2ec] transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">
                    {processing ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                </button>
            </form>
        </AuthShell>
    );
}
