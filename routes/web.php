<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatatanBerangkatController;
use App\Http\Controllers\HadiahController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\KalenderSekolahController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\PengaturanController;
use App\Http\Controllers\PenyesuaianPoinController;
use App\Http\Controllers\ProfilAnakController;
use App\Http\Controllers\RiwayatPoinController;
use App\Http\Controllers\StatistikController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1')->name('login.store');
    Route::get('/daftar', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/daftar', [AuthController::class, 'register'])->name('register.store');
    Route::get('/lupa-password', [PasswordResetController::class, 'showRequest'])->name('password.request');
    Route::post('/lupa-password', [PasswordResetController::class, 'send'])->middleware('throttle:3,1')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showReset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1')->name('password.update');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/mulai', [OnboardingController::class, 'show'])->name('onboarding');
    Route::post('/mulai', [OnboardingController::class, 'store'])->name('onboarding.store');
    Route::get('/', [HomeController::class, 'index'])->name('home');
    Route::post('/catat-waktu-berangkat', [HomeController::class, 'record'])->name('record.store');
    Route::get('/catatan', [CatatanBerangkatController::class, 'index'])->name('records.index');
    Route::post('/catatan', [CatatanBerangkatController::class, 'store'])->name('records.store');
    Route::put('/catatan/{catatanBerangkat}', [CatatanBerangkatController::class, 'update'])->name('records.update');
    Route::get('/statistik', [StatistikController::class, 'index'])->name('statistics.index');
    Route::get('/hadiah', [HadiahController::class, 'index'])->name('rewards.index');
    Route::get('/riwayat-poin', [RiwayatPoinController::class, 'index'])->name('points.history');
    Route::post('/hadiah', [HadiahController::class, 'store'])->name('rewards.store');
    Route::put('/hadiah/{hadiah}', [HadiahController::class, 'update'])->name('rewards.update');
    Route::delete('/hadiah/{hadiah}', [HadiahController::class, 'destroy'])->name('rewards.destroy');
    Route::post('/hadiah/{hadiah}/target', [HadiahController::class, 'target'])->name('rewards.target');
    Route::post('/hadiah/{hadiah}/tukar', [HadiahController::class, 'redeem'])->name('rewards.redeem');
    Route::post('/penukaran-hadiah/{penukaranHadiah}/batal', [HadiahController::class, 'cancel'])->name('rewards.cancel');
    Route::get('/pengaturan', [PengaturanController::class, 'index'])->name('settings.index');
    Route::put('/pengaturan', [PengaturanController::class, 'update'])->name('settings.update');
    Route::post('/profil-anak', [ProfilAnakController::class, 'update'])->name('child-profile.update');
    Route::post('/penyesuaian-poin', [PenyesuaianPoinController::class, 'store'])->name('points.adjust');
    Route::post('/kalender-sekolah', [KalenderSekolahController::class, 'store'])->name('calendar.store');
    Route::delete('/kalender-sekolah/{kalenderSekolah}', [KalenderSekolahController::class, 'destroy'])->name('calendar.destroy');
});
