# Panduan Deploy ke Vercel - Sistem Bel Otomatis MI Syuriyah

Aplikasi ini dibangun menggunakan **React 19 + Vite + Tailwind CSS + Firebase (Firestore & Auth)** dan telah dikonfigurasi secara optimal agar dapat langsung di-deploy di **Vercel**.

---

## 🚀 Cara Deploy ke Vercel

### Opsi 1: Deploy Langsung via GitHub & Vercel Dashboard (Paling Mudah)

1. **Ekspor Proyek ke GitHub**:
   - Di AI Studio Build, buka menu **Settings** di pojok kanan atas.
   - Pilih **Export to GitHub** atau unduh sebagai ZIP lalu unggah ke repository GitHub Anda.
2. **Buka Vercel**:
   - Masuk ke [vercel.com](https://vercel.com) dan klik **"Add New..."** → **"Project"**.
   - Hubungkan akun GitHub Anda dan pilih repository proyek ini.
3. **Konfigurasi Project di Vercel**:
   - **Framework Preset**: Pilih `Vite` (akan terdeteksi secara otomatis).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Deploy**:
   - Klik tombol **"Deploy"**. Vercel akan mengompilasi dan mempublikasikan aplikasi dalam hitungan detik.

---

### Opsi 2: Deploy menggunakan Vercel CLI

Jika Anda menggunakan terminal / command line:
```bash
# 1. Install Vercel CLI jika belum ada
npm install -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Jalankan perintah deploy di folder proyek
vercel

# 4. Untuk deploy ke production
vercel --prod
```

---

## ⚙️ Pengaturan Tambahan (Opsional)

File `vercel.json` telah disediakan dengan konfigurasi:
- **Routing SPA (Single Page Application)**: Memastikan routing tidak mengalami error 404 saat halaman di-refresh.
- **Cache Static Assets**: Optimasi performa aset suara & ikon.

### 🔐 Otorisasi Domain di Firebase Authentication
Jika Anda menggunakan fitur **Masuk dengan Google (Firebase Auth)** pada domain Vercel Anda (misal: `https://bel-syuriyah.vercel.app`):
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Masuk ke menu **Authentication** → tab **Settings** → **Authorized domains**.
3. Tambahkan domain Vercel Anda (contoh: `bel-syuriyah.vercel.app`).
