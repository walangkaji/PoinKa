import { Link, useForm } from '@inertiajs/react';
import AuthShell from '../../Components/AuthShell';

export default function ForgotPassword({ flash }) {
    const { data, setData, post, processing, errors, isDirty } = useForm({ email: '' });

    function submit(event) {
        event.preventDefault();
        post('/lupa-password');
    }

    return (
        <AuthShell
            eyebrow="Akses kembali"
            title="Atur ulang kata sandi."
            description="Masukkan email akun Anda. Jika terdaftar, kami akan mengirim tautan untuk membuat kata sandi baru."
            flash={flash}
            footer={
                <span>
                    Ingat kata sandi?{' '}
                    <Link className="font-bold text-[#3d8a70]" href="/login">
                        Kembali masuk
                    </Link>
                </span>
            }>
            <form noValidate className="space-y-5" onSubmit={submit}>
                <label className="block">
                    <span className="text-sm font-semibold text-[#31554a]">Email</span>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(event) => setData('email', event.target.value)}
                        autoComplete="email"
                        className="mt-2 block h-14 w-full rounded-2xl bg-[#f5f2ec] px-4 py-0 text-base text-[#17342d] outline-none ring-1 ring-[#e1e8e1] focus:ring-2 focus:ring-[#3d8a70]"
                    />
                    {errors.email && (
                        <span className="mt-2 block text-xs font-medium text-[#a3622e]">
                            {errors.email}
                        </span>
                    )}
                </label>
                <button
                    disabled={processing || !isDirty}
                    className="min-h-12 w-full rounded-2xl bg-[#17342d] px-5 text-sm font-bold text-[#f5f2ec] transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60">
                    {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </button>
            </form>
        </AuthShell>
    );
}
