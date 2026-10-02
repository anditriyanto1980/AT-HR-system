# AT-HR - Smart Attendance & Enterprise HRIS System

Sistem Manajemen SDM, Kehadiran Cerdas dengan Geofencing GPS, Jam Kerja Fleksibel, Payroll, Klaim Reimbursement, dan Terintegrasi dengan **Firebase Cloud Firestore & Authentication**.

---

## 🚀 Panduan Push ke GitHub & Deploy di Vercel

### 1. Push ke GitHub

Buka terminal di direktori proyek dan jalankan perintah berikut:

```bash
# 1. Pastikan semua file telah distaging
git add .

# 2. Buat commit pertama
git commit -m "feat: complete AT-HR HRIS with Firebase integration"

# 3. Ubah nama branch ke main
git branch -M main

# 4. Hubungkan remote repository GitHub Anda
# Ganti USERNAME dan REPO_NAME dengan akun GitHub Anda
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 5. Push ke GitHub
git push -u origin main
```

---

### 2. Deploy ke Vercel

Proyek ini telah dilengkapi dengan konfigurasi `vercel.json` bawaan sehingga siap dideploy secara otomatis:

1. Kunjungi [vercel.com](https://vercel.com) dan login ke akun Anda.
2. Klik tombol **"Add New..."** > **"Project"**.
3. Hubungkan repositori GitHub yang baru saja Anda push.
4. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. *(Opsional)* Pada bagian **Environment Variables**, Anda dapat menambahkan variabel dari `.env.example` jika ingin menyesuaikan kredensial Firebase / Supabase production:
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. Klik **"Deploy"**. Proses build memakan waktu ~1 menit dan aplikasi Anda langsung online dengan domain HTTPS gratis dari Vercel!

---

## 🛠️ Fitur Utama Aplikasi

- **Smart Attendance (Absensi Cerdas)**: Clock in/out dengan validasi radius geofencing GPS, selfie camera snapshot, dan deteksi keterlambatan otomatis.
- **Firebase Firestore & Auth**: Terintegrasi langsung dengan database Cloud Firestore dan login Google.
- **PWA Ready**: Mendukung instalasi aplikasi di desktop & Android/iOS via Service Worker.
- **Multi-Role & RBAC**: Akses bertingkat untuk Super Admin, HR Admin, Manager, dan Karyawan.
- **Manajemen Operasional**: Cuti (Leave), Izin, Lembur (Overtime), Koreksi Absensi, dan SPPD (Business Trip).
- **Payroll & Reimbursement**: Perhitungan gaji lengkap (BPJS, PPh 21, slip gaji) dan pengajuan klaim biaya.

---

## 💻 Menjalankan Secara Lokal

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```
