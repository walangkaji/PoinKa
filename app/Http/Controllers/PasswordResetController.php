<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    public function showRequest(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function send(Request $request): RedirectResponse
    {
        $data   = $request->validate(['email' => ['required', 'email']]);
        $status = Password::sendResetLink(['email' => $data['email']]);

        return Password::RESET_LINK_SENT === $status
            ? back()->with('success', 'Jika email terdaftar, tautan reset sudah dikirim.')
            : back()->withErrors(['email' => 'Email reset belum dapat dikirim. Coba lagi nanti.']);
    }

    public function showReset(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->string('email')->toString(),
        ]);
    }

    public function reset(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'token'    => ['required', 'string'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password'       => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        });

        return Password::PASSWORD_RESET === $status
            ? redirect()->route('login')->with('success', 'Kata sandi berhasil diubah. Silakan masuk kembali.')
            : back()->withErrors(['email' => 'Tautan reset tidak valid atau sudah kedaluwarsa.']);
    }
}
