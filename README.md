<p align="center">
  <img src="resources/images/icon-round.png" alt="PoinKa" width="120">
</p>

<h1 align="center">PoinKa</h1>

<p align="center">Satu Hari Lebih Baik.</p>

PoinKa adalah aplikasi web untuk mencatat waktu berangkat sekolah, mengelola poin, melihat statistik, dan mengatur hadiah untuk anak.


PoinKa mengutamakan tampilan handphone, dengan penyesuaian untuk desktop.

## Fitur utama

- Login dan pendaftaran akun orang tua.
- Sesi login jangka panjang dan logout manual.
- Pengaturan profil anak dan zona waktu.
- Pencatatan waktu berangkat hari ini.
- Aturan poin berdasarkan waktu keberangkatan.
- Pengaturan hari sekolah.
- Kalender tanggal khusus seperti hari libur, tidak ada sekolah, dan izin.
- Catatan berangkat manual dan edit catatan.
- Riwayat poin masuk dan keluar.
- Saldo poin dan penyesuaian saldo manual.
- Statistik mingguan dan jumlah hari berturut-turut.
- Daftar hadiah yang dapat diurutkan berdasarkan poin.
- Tambah, edit, hapus, jadikan target, dan tukar hadiah.
- Dialog konfirmasi dan pesan status.
- Navigasi bawah untuk berpindah halaman.
- Tampilan untuk handphone dan desktop.

## Teknologi

- PHP 8.3+
- Laravel 13
- MySQL
- React 19
- Inertia.js
- Vite
- Tailwind CSS 4
- Phosphor Icons

## Persiapan

Pastikan perangkat sudah memiliki:

- PHP 8.3 atau lebih baru
- Composer
- Node.js dan npm
- MySQL

## Instalasi

### 1. Pasang dependensi PHP

```bash
composer install
```

### 2. Siapkan file environment

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Buat application key:

```bash
php artisan key:generate
```

### 3. Atur koneksi database

Buka file `.env`, lalu sesuaikan bagian berikut:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=poinka
DB_USERNAME=root
DB_PASSWORD=
```

Pastikan database `poinka` sudah dibuat di MySQL dan username/password memiliki hak akses ke database tersebut.

### 4. Jalankan migration dan data contoh

```bash
php artisan migrate --seed
```

Seeder demo membuat data contoh akun, anak, aturan poin, hadiah, dan catatan sekitar satu bulan ke belakang.

> `php artisan migrate:fresh --seed` akan menghapus seluruh tabel dan data yang ada. Gunakan hanya untuk lingkungan pengembangan.

### 5. Pasang dependensi frontend dan buat asset

```bash
npm install
npm run build
```

## Menjalankan aplikasi

Jalankan server Laravel:

```bash
php artisan serve
```

Buka aplikasi di:

```text
http://127.0.0.1:8000
```

Untuk pengembangan frontend dengan hot reload, buka terminal kedua:

```bash
npm run dev
```

## Login

Seeder menyediakan akun demo untuk lingkungan lokal. Detail akun dapat dilihat di `database/seeders/PoinkaDemoSeeder.php`.

Untuk penggunaan nyata, buat akun melalui halaman **Buat akun** dan jangan menyimpan password di repository atau dokumentasi publik.

## Perintah yang sering digunakan

```bash
# Menjalankan test backend
php artisan test

# Membuat asset frontend production
npm run build

# Menghapus cache aplikasi
php artisan optimize:clear

# Melihat daftar route
php artisan route:list
```

## Struktur penting

```text
app/
├── Actions/              Logika pencatatan waktu
├── Http/Controllers/     Controller halaman dan form
├── Models/               Model database
└── Services/             Perhitungan poin dan bonus

database/
├── migrations/           Struktur tabel
└── seeders/              Data demo

resources/js/
├── Components/           Komponen UI yang digunakan bersama
└── Pages/                Halaman React/Inertia

routes/web.php            Daftar route aplikasi
```

## Konfigurasi sesi login

PoinKa menggunakan session database dan fitur remember login. Pengguna tidak perlu login setiap hari. Sesi akan berakhir ketika pengguna logout, browser menghapus cookie, atau browser digunakan dalam mode private/incognito.

Konfigurasi terkait:

```env
SESSION_DRIVER=database
SESSION_LIFETIME=5256000
AUTH_REMEMBER_DURATION=5256000
```

## Pemeriksaan sebelum digunakan

Sebelum aplikasi digunakan, pastikan:

- koneksi database berhasil;
- `php artisan migrate --seed` selesai tanpa error;
- `php artisan test` lulus;
- `npm run build` berhasil;
- aplikasi dapat dibuka dari komputer;
- tombol logout berhasil mengakhiri sesi.

## Lisensi

Proyek ini dibuat untuk kebutuhan internal dan pengembangan aplikasi PoinKa.
