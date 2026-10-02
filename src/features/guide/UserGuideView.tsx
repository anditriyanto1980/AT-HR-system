import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Building2,
  MapPin,
  Sparkles,
  Camera,
  AlertCircle,
  FileText,
  Receipt,
  Plane,
  Award,
  CalendarDays,
  Layers,
  Database,
  HelpCircle,
  ExternalLink,
  Info,
  Check,
  Smartphone,
  Flame,
  ArrowRight,
  Filter,
  Lock,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { BrandIcon } from '../../components/common/BrandIcon';

interface UserGuideViewProps {
  onNavigateTab?: (tab: string) => void;
}

type RoleFilter = 'ALL' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

interface GuideChapter {
  id: string;
  number: string;
  title: string;
  category: string;
  targetRole: RoleFilter[];
  summary: string;
  badge?: string;
  actionTab?: string;
  actionLabel?: string;
  sections: {
    title: string;
    description?: string;
    steps?: string[];
    tips?: string[];
    warnings?: string[];
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({ onNavigateTab }) => {
  const { role } = useAuth();
  const company = dataService.getCompany();
  const appName = company.app_name || 'AT-HR Enterprise';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
  const [activeChapterId, setActiveChapterId] = useState<string>('intro');
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({
    intro: true,
  });

  const toggleSection = (id: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const chapters: GuideChapter[] = [
    {
      id: 'intro',
      number: '01',
      title: 'Pengenalan & Arsitektur Sistem',
      category: 'Konsep Dasar',
      targetRole: ['ALL'],
      summary: `Mengenal ekosistem ${appName}, arsitektur teknologi Cloud Firestore, Progressive Web App (PWA), dan navigasi antarmuka.`,
      badge: 'Dasar',
      sections: [
        {
          title: `Tentang ${appName}`,
          description: `${appName} adalah sistem manajemen sumber daya manusia (HRIS) dan presensi cerdas terpadu berbasis cloud yang dirancang untuk efisiensi operasional perusahaan modern. Sistem menggabungkan validasi geolokasi GPS, kamera selfie anti-fraud, alur persetujuan bertingkat, komputasi payroll otomatis (BPJS & PPh 21), serta sinkronisasi data realtime Google Firebase Cloud Firestore.`,
          steps: [
            'Aksesibilitas Multi-Device: Dapat dibuka melalui browser desktop, tablet, maupun smartphone Android dan iOS.',
            'PWA Offline Capability: Aplikasi dapat diinstal ke layar utama (Home Screen) dan tetap dapat mencatat presensi saat koneksi internet terputus sementara.',
            'Google Firebase Cloud Firestore: Penyimpanan data tersentralisasi dengan perlindungan Firestore Security Rules berstandar enterprise.',
            'Multi-Role & Hak Akses Terpisah: Menjamin kerahasiaan data sensitif (seperti slip gaji dan evaluasi kinerja).',
          ],
          tips: [
            'Simpan URL portal ini ke bookmark browser Anda untuk kemudahan akses setiap hari kerja.',
            'Pastikan selalu mengizinkan akses Lokasi (GPS) dan Kamera pada perangkat saat pertama kali membuka aplikasi.',
          ],
        },
        {
          title: 'Komponen Navigasi Utama',
          description: 'Antarmuka aplikasi dibagi menjadi tiga area ergonomis utama:',
          steps: [
            'Top Header: Berisi identitas aplikasi, pencarian cepat (Global Search), notifikasi aktivitas real-time, status koneksi cloud, tombol layar penuh, dan menu profil pengguna.',
            'Left Sidebar (Desktop): Mengelompokkan modul kerja ke dalam 6 zona: Main Menu, Operations, Finance & Payroll, Talent & Notice, Organization, dan System.',
            'Bottom Navigation Bar (Mobile): Memudahkan akses satu jempol untuk tombol Clock-In utama, riwayat presensi, pengajuan cuti, dan profil pada ponsel pintar.',
          ],
        },
      ],
    },
    {
      id: 'whitelabel',
      number: '02',
      title: 'Kustomisasi Nama Aplikasi & Identitas Perusahaan (Whitelabeling)',
      category: 'Pengaturan Admin',
      targetRole: ['ADMIN'],
      summary: 'Cara mengubah nama sistem aplikasi, slogan, logo/brand icon, serta profil resmi perusahaan sesuai entitas bisnis Anda.',
      badge: 'Admin Only',
      actionTab: 'organization',
      actionLabel: 'Buka Pengaturan Branding',
      sections: [
        {
          title: 'Langkah Mengganti Nama & Branding Sistem',
          description: `Sistem ini mendukung fitur Whitelabeling penuh. Administrator dapat mengubah nama "${appName}" menjadi nama sistem internal perusahaan Anda dalam hitungan detik.`,
          steps: [
            'Buka menu "Branch & Units" (Organisasi) pada sidebar sebelah kiri.',
            'Pilih Tab ke-3 bertuliskan "Company Profile & Branding" di bagian atas halaman.',
            'Pada kolom "Nama Aplikasi / Sistem HR", ketik nama aplikasi yang Anda inginkan (contoh: "PT Maju Bersama HRIS", "Presensi Pintar Indah", atau "Nexus HR").',
            'Isi kolom "Tagline / Slogan Aplikasi" (contoh: "Smart Attendance & Workforce Platform").',
            'Tentukan "Kode Singkat / Inisial Brand" (2-5 huruf kapital, misal: "MBH", "NEX", "HR").',
            'Pilih salah satu dari 7 Ikon Brand Vektor (Gem, Building, Sparkles, Shield, Briefcase, Rocket, Award).',
            'Lengkapi data legalitas: Nama Resmi Perusahaan, Alamat Kantor Pusat, Nomor Telepon, Email Resmi, dan Website.',
            'Klik tombol biru "Simpan & Terapkan Perubahan".',
          ],
          tips: [
            'Perubahan nama aplikasi langsung berdampak instan secara realtime ke: Header Bar, Halaman Login Karyawan, Judul Tab Browser (HTML Title), Kredensial Akun Karyawan, dan Kop Dokumen Resmi Slip Gaji.',
            'Data konfigurasi otomatis disinkronkan ke dokumen "companies/comp-01" di Google Firebase Cloud Firestore.',
          ],
        },
      ],
    },
    {
      id: 'rbac',
      number: '03',
      title: 'Struktur Peran & Hak Akses Pengguna (RBAC)',
      category: 'Keamanan & Akun',
      targetRole: ['ALL'],
      summary: 'Penjelasan hak akses 4 tingkatan peran: Super Admin, HR Admin, Manager, dan Karyawan.',
      badge: 'Security',
      sections: [
        {
          title: 'Matriks Peran Pengguna (Role-Based Access Control)',
          description: 'Setiap akun dalam sistem memiliki wewenang yang diatur secara ketat:',
          table: {
            headers: ['Peran (Role)', 'Tanggung Jawab Utama', 'Akses Modul Kunci', 'Kerahasiaan'],
            rows: [
              [
                'SUPER_ADMIN',
                'Pemilik sistem & IT Administrator',
                'Seluruh modul, Database Firestore, Audit Trail, Whitelabeling, Reset Password',
                'Akses Penuh',
              ],
              [
                'HR_ADMIN',
                'Tim HRD & People Operations',
                'Master Karyawan, Shift, Penggajian (Payroll), Semua Laporan, Rekap Cuti/Izin/Lembur',
                'Tinggi (HR Only)',
              ],
              [
                'MANAGER',
                'Kepala Divisi / Supervisor Lapangan',
                'Monitoring Presensi Tim, Approvals Hub (Cuti, Lembur, Izin, Reimbursement, Koreksi)',
                'Divisi Masing-masing',
              ],
              [
                'EMPLOYEE',
                'Karyawan / Staf Perusahaan',
                'Clock-In/Out Selfie, Cuti Saya, Izin, Lembur, Reimbursement Saya, Slip Gaji Pribadi',
                'Data Pribadi Sendiri',
              ],
            ],
          },
          tips: [
            'Untuk beralih peran dalam mode pengujian, klik foto profil di pojok kanan atas, lalu pilih peran yang ingin disimulasikan dari daftar dropdown.',
            'Karyawan tidak akan pernah dapat melihat besaran gaji atau permohonan milik karyawan lain.',
          ],
        },
      ],
    },
    {
      id: 'clock-in',
      number: '04',
      title: 'Presensi Online GPS & Kamera Selfie (Clock In / Out)',
      category: 'Presensi Harian',
      targetRole: ['ALL'],
      summary: 'Panduan lengkap melakukan absensi masuk dan pulang dengan validasi lokasi radius kantor dan foto selfie anti-fraud.',
      badge: 'Harian',
      actionTab: 'clock-in',
      actionLabel: 'Buka Halaman Clock-In',
      sections: [
        {
          title: 'Tata Cara Melakukan Presensi Harian',
          description: 'Sistem presensi dilengkapi deteksi lokasi presisi tinggi dan verifikasi wajah kamera.',
          steps: [
            'Buka menu "Clock In / Out" dari sidebar atau klik tombol bulat besar di bilah navigasi bawah ponsel.',
            'Periksa status Jadwal Kerja hari ini (Nama Shift, Jam Masuk, Jam Pulang, dan Toleransi Keterlambatan).',
            'Izinkan browser mengakses GPS Lokasi jika diminta. Sistem akan menampilkan peta lokasi, koordinat latitude/longitude, dan jarak Anda dari kantor cabang terdekat.',
            'Pastikan jarak Anda berada dalam RADIUS KANTOR YANG DIIZINKAN (misal: radius 150 meter dari Kantor Pusat).',
            'Klik tombol "Buka Kamera Selfie" dan pastikan wajah Anda terlihat jelas dalam bingkai lingkaran.',
            'Pilih Tipe Presensi: "Absen Masuk (Clock In)" di awal shift, atau "Absen Pulang (Clock Out)" di akhir shift.',
            'Tulis catatan singkat jika diperlukan (misal: "Sedang tugas luar" atau "Jalanan macet").',
            'Klik tombol "Konfirmasi & Rekam Presensi". Suara konfirmasi dan pesan sukses akan muncul.',
          ],
          warnings: [
            'Jika Anda berada di luar radius kantor yang telah ditetapkan oleh HR, tombol absensi akan dinonaktifkan atau ditandai sebagai pelanggaran radius.',
            'Dilarang menggunakan aplikasi Fake GPS atau memanipulasi koordinat. Sistem mencatat metadata perangkat dan tingkat akurasi satelit.',
          ],
          tips: [
            'Jika sinyal GPS melemah di dalam gedung tinggi, melangkahlah mendekati jendela atau nyalakan Wi-Fi ponsel untuk membantu akurasi lokasi.',
            'Bagi karyawan shift malam yang melewati tengah malam, sistem otomatis mendeteksi hari shift aktif tanpa merusak perhitungan jam lembur.',
          ],
        },
        {
          title: 'Status Presensi & Indikator Warna',
          table: {
            headers: ['Label Status', 'Warna Indikator', 'Arti & Konsekuensi'],
            rows: [
              ['ON_TIME (Tepat Waktu)', 'Hijau Emerald', 'Masuk sebelum atau tepat pada jam masuk shift (termasuk masa toleransi).'],
              ['LATE (Terlambat)', 'Kuning Amber', 'Masuk melewati batas toleransi keterlambatan (misal lewat 15 menit).'],
              ['EARLY_DEPARTURE (Pulang Awal)', 'Oranye', 'Melakukan clock-out sebelum jam selesai shift resmi tanpa izin tertulis.'],
              ['ABSENT (Mangkir)', 'Merah Rose', 'Tidak ada rekaman presensi pada hari kerja aktif dan tidak ada permohonan izin/cuti.'],
              ['ON_LEAVE (Cuti Resmi)', 'Biru Soft', 'Sedang dalam masa cuti tahunan atau cuti khusus yang telah disetujui atasan.'],
              ['BUSINESS_TRIP (Dinas)', 'Ungu Violet', 'Sedang menjalankan penugasan dinas luar kota/lapangan.'],
            ],
          },
        },
      ],
    },
    {
      id: 'correction',
      number: '05',
      title: 'Koreksi Absensi (Attendance Correction)',
      category: 'Presensi Harian',
      targetRole: ['ALL'],
      summary: 'Prosedur pengajuan perbaikan presensi jika lupa clock-in/out, kendala teknis gadget, atau tugas luar mendadak.',
      badge: 'Solusi',
      actionTab: 'attendance-correction',
      actionLabel: 'Buka Form Koreksi Absensi',
      sections: [
        {
          title: 'Alur Pengajuan Koreksi Presensi',
          description: 'Jika Anda lupa melakukan clock-in karena baterai ponsel habis atau terburu-buru menghadiri rapat eksternal, ikuti prosedur berikut:',
          steps: [
            'Buka menu "Correction" pada menu Operations.',
            'Klik tombol "+ Ajukan Koreksi Absensi".',
            'Pilih tanggal kerja yang ingin dikoreksi.',
            'Pilih tipe koreksi: "Koreksi Jam Masuk (Clock In)", "Koreksi Jam Pulang (Clock Out)", atau "Koreksi Keduanya".',
            'Tentukan waktu jam dan menit yang sebenarnya.',
            'Pilih Alasan Koreksi (Lupa Absen, Kendala Teknis Aplikasi, Tugas Luar Mendadak, atau Pemadaman Listrik).',
            'Tuliskan kronologi singkat dan lampirkan bukti pendukung (foto tanda terima tugas / surat tugas jika ada).',
            'Kirimkan pengajuan. Permohonan akan masuk ke Approvals Hub Manager dan HR Admin.',
          ],
          tips: [
            'Koreksi yang telah disetujui oleh HR Admin akan secara otomatis memperbarui status absensi di database dan mempengaruhi rekapitulasi slip gaji akhir bulan.',
          ],
        },
      ],
    },
    {
      id: 'leave',
      number: '06',
      title: 'Pengelolaan Cuti (Leave Management)',
      category: 'Waktu Kerja',
      targetRole: ['ALL'],
      summary: 'Tata cara melihat sisa kuota cuti tahunan, mengajukan cuti bersama/pribadi, dan alur approval atasan.',
      badge: 'Esensial',
      actionTab: 'leave',
      actionLabel: 'Buka Manajemen Cuti',
      sections: [
        {
          title: 'Ketentuan & Alur Permohonan Cuti',
          steps: [
            'Masuk ke menu "Leave (Cuti)" pada sidebar.',
            'Cek kartu saldo kuota cuti Anda: Kuota Tahunan, Terpakai, dan Sisa Hari yang tersedia.',
            'Klik tombol "+ Ajukan Permohonan Cuti".',
            'Pilih Jenis Cuti:',
            '  • Cuti Tahunan (Mengurangi saldo cuti tahunan)',
            '  • Cuti Sakit (Disertai surat dokter)',
            '  • Cuti Melahirkan (Maternity Leave - 3 bulan sesuai UU Ketenagakerjaan)',
            '  • Cuti Menikah (3 hari kalender)',
            '  • Cuti Duka / Kemalangan (2 hari kalender)',
            'Pilih Tanggal Mulai dan Tanggal Selesai. Sistem otomatis menghitung jumlah hari kerja (melewati hari libur akhir pekan).',
            'Isi Alasan Pengambilan Cuti serta Nomor Telepon Darurat yang dapat dihubungi selama cuti.',
            'Tentukan nama Karyawan Pengganti (Handover / Backup PIC) selama Anda tidak masuk kerja.',
            'Klik "Submit Permohonan". Notifikasi akan dikirimkan langsung ke dashboard Manager Anda.',
          ],
          tips: [
            'Ajukan cuti tahunan selambat-lambatnya 3 hari kerja sebelum tanggal mulai cuti agar tim kerja dapat mengatur pembagian beban tugas.',
            'Jika status permohonan masih "PENDING", Anda dapat membatalkan permohonan tersebut secara mandiri.',
          ],
        },
      ],
    },
    {
      id: 'permission',
      number: '07',
      title: 'Izin Kerja & Sakit (Permission)',
      category: 'Waktu Kerja',
      targetRole: ['ALL'],
      summary: 'Panduan izin datang terlambat, pulang lebih awal, izin urusan penting keluarga, sakit, dan dispensasi dinas.',
      badge: 'Waktu Kerja',
      actionTab: 'permission',
      actionLabel: 'Buka Permohonan Izin',
      sections: [
        {
          title: 'Kategori Izin yang Didukung',
          table: {
            headers: ['Kategori Izin', 'Deskripsi & Bukti Pendukung', 'Dampak Terhadap Gaji'],
            rows: [
              ['Izin Sakit Ringan / Berat', 'Wajib melampirkan foto Surat Keterangan Dokter resmi.', 'Tidak memotong gaji (Upah dibayar penuh)'],
              ['Izin Terlambat Masuk', 'Kendala transportasi, kendaraan mogok, atau musibah pagi hari.', 'Tidak memotong cuti tahunan'],
              ['Izin Pulang Lebih Awal', 'Kepentingan mendesak atau anggota keluarga sakit mendadak.', 'Memerlukan persetujuan lisan/tulisan atasan'],
              ['Izin Keluar Kantor Sementara', 'Urusan bank dinas, pajak perusahaan, atau tes kesehatan dinas.', 'Presensi tetap tercatat aktif'],
              ['Dispensasi Khusus', 'Menghadiri panggilan sidang pengadilan, donor darah, tugas negara.', 'Dibayar penuh sesuai regulasi Disnaker'],
            ],
          },
        },
      ],
    },
    {
      id: 'overtime',
      number: '08',
      title: 'Lembur Kerja (Overtime & Surat Perintah Lembur)',
      category: 'Waktu Kerja',
      targetRole: ['ALL'],
      summary: 'Pencatatan Surat Perintah Lembur (SPL), komputasi jam lembur hari kerja vs hari libur, dan pencairan kompensasi.',
      badge: 'Kompensasi',
      actionTab: 'overtime',
      actionLabel: 'Buka Modul Lembur',
      sections: [
        {
          title: 'Ketentuan & Alur Pengajuan Lembur',
          steps: [
            'Buka menu "Overtime (Lembur)".',
            'Klik tombol "+ Buat Form Lembur (SPL)".',
            'Pilih Tanggal Pelaksanaan Lembur dan Jam Mulai s/d Jam Selesai.',
            'Pilih Tipe Hari: "Hari Kerja Biasa (Weekdays)" atau "Hari Libur / Akhir Pekan (Weekend/Holiday)".',
            'Uraikan rincian pekerjaan atau target tugas yang diselesaikan selama lembur.',
            'Kirimkan formulir untuk ditinjau oleh Atasan Langsung.',
          ],
          tips: [
            'Sesuai ketentuan Kepmenakertrans No. 102/2004, jam pertama lembur hari kerja dihitung 1,5x upah per jam, dan jam kedua seterusnya dihitung 2x upah per jam.',
            'Total akumulasi jam lembur yang disetujui akan otomatis dikonversi menjadi rupiah dan masuk ke komponen penerimaan "Tunjangan Lembur" pada slip gaji bulanan.',
          ],
        },
      ],
    },
    {
      id: 'approvals',
      number: '09',
      title: 'Pusat Persetujuan (Approvals Hub) untuk Atasan & HR',
      category: 'Manajerial',
      targetRole: ['ADMIN', 'MANAGER'],
      summary: 'Dashboard 1-Click untuk meninjau, menyetujui, atau menolak permohonan cuti, izin, lembur, dinas, reimbursement, dan koreksi.',
      badge: 'Manager/HR',
      actionTab: 'approvals-hub',
      actionLabel: 'Buka Approvals Hub',
      sections: [
        {
          title: 'Efisiensi Persetujuan Terpadu',
          description: 'Approvals Hub menyatukan seluruh antrean permohonan staf Anda ke dalam satu meja kerja yang ringkas dan cepat.',
          steps: [
            'Buka menu "Approvals Hub". Badge merah di samping menu menandakan jumlah permohonan yang menunggu persetujuan Anda.',
            'Filter berdasarkan jenis permohonan: Semua, Cuti, Izin, Lembur, Dinas, Reimbursement, atau Koreksi Absensi.',
            'Klik salah satu kartu untuk melihat rincian permohonan, riwayat kehadiran staf, sisa saldo cuti, dan lampiran foto struk/surat.',
            'Klik tombol hijau "Approve" untuk menyetujui, atau tombol merah "Reject" dengan menyertakan alasan penolakan jika tidak memenuhi syarat.',
            'Gunakan tombol "Batch Approve" untuk menyetujui sekaligus beberapa permohonan rutin dalam 1 detik.',
          ],
          tips: [
            'Setelah disetujui, pemohon akan menerima notifikasi konfirmasi di sistem mereka dan status dokumen langsung diperbarui di Firebase Firestore.',
          ],
        },
      ],
    },
    {
      id: 'payroll',
      number: '10',
      title: 'Penggajian (Payroll) & Slip Gaji Resmi',
      category: 'Keuangan',
      targetRole: ['ALL'],
      summary: 'Perhitungan gaji pokok, tunjangan, potongan BPJS Kesehatan & Ketenagakerjaan, PPh 21, dan cetak slip gaji ber-kop resmi.',
      badge: 'Payroll',
      actionTab: 'payroll',
      actionLabel: 'Buka Penggajian & Slip Gaji',
      sections: [
        {
          title: 'Struktur Komponen Gaji & Slip Gaji Resmi',
          description: `Modul payroll ${appName} mengotomatiskan komputasi keuangan karyawan secara transparan dan akurat:`,
          table: {
            headers: ['Kategori', 'Komponen', 'Metode Perhitungan / Keterangan'],
            rows: [
              ['Pendapatan (+)', 'Gaji Pokok (Basic Salary)', 'Sesuai kesepakatan kontrak kerja & level jabatan.'],
              ['Pendapatan (+)', 'Tunjangan Jabatan & Keahlian', 'Tunjangan fungsional posisi.'],
              ['Pendapatan (+)', 'Tunjangan Transport & Makan', 'Dihitung proporsional berdasarkan jumlah kehadiran fisik.'],
              ['Pendapatan (+)', 'Upah Lembur Resmi', 'Otomatis dihitung dari permohonan lembur yang disetujui.'],
              ['Potongan (-)', 'BPJS Ketenagakerjaan (JHT 2%, JP 1%)', 'Iuran porsi karyawan sesuai regulasi pemerintah.'],
              ['Potongan (-)', 'BPJS Kesehatan (1%)', 'Iuran jaminan kesehatan porsi karyawan.'],
              ['Potongan (-)', 'Pajak Penghasilan (PPh Pasal 21)', 'Tarif efektif bulanan (TER) PP 58/2023.'],
              ['Potongan (-)', 'Potongan Keterlambatan / Kasbon', 'Jika ada potongan denda atau cicilan pinjaman koperasi.'],
            ],
          },
          steps: [
            'Karyawan: Buka tab "My Payslips" untuk melihat daftar riwayat slip gaji per periode bulan.',
            'Klik tombol "Lihat Slip Gaji" untuk membuka pratinjau dokumen dengan kop surat resmi perusahaan Anda.',
            'Klik "Cetak / Unduh PDF" untuk menyimpan salinan slip gaji bertanda tangan digital.',
            'HR Admin: Dapat melakukan generate batch penggajian massal seluruh karyawan, mengubah profil gaji per individu, dan mengunci batch payroll periode bersangkutan.',
          ],
          tips: [
            'Slip gaji yang dicetak memuat kode identitas perusahaan, watermark status "LUNAS / PAID", dan rincian take home pay bersih.',
          ],
        },
      ],
    },
    {
      id: 'organization',
      number: '11',
      title: 'Manajemen Karyawan, Cabang, Departemen & Jadwal Roster',
      category: 'Master Data',
      targetRole: ['ADMIN'],
      summary: 'Kelola data staf, mutasi unit kerja, shift kerja (pagi, siang, malam, fleksibel), dan kalender jadwal roster.',
      badge: 'Master Data',
      actionTab: 'employees',
      actionLabel: 'Buka Data Karyawan',
      sections: [
        {
          title: 'Pengelolaan Karyawan & Kredensial Akun',
          steps: [
            'Buka menu "Employees" untuk melihat seluruh direktori karyawan aktif.',
            'Gunakan tombol "+ Tambah Karyawan" untuk mendaftarkan staf baru.',
            'Lengkapi NIK Karyawan, Nama Lengkap, Email, No HP, Cabang Penempatan, Departemen, Jabatan, dan Tanggal Bergabung.',
            'Klik tombol kunci "User Access" pada baris karyawan untuk mengatur Username, Role Hak Akses, atau Generate Password baru.',
            'Gunakan tombol "Salin Kredensial" untuk mengirimkan data login WhatsApp/Email kepada karyawan bersangkutan.',
          ],
        },
        {
          title: 'Shift Kerja & Penugasan Jadwal Roster',
          steps: [
            'Buka menu "Shift Rules" untuk melihat dan membuat aturan jam kerja (contoh: Shift Reguler 08:00 - 17:00, Shift Malam 22:00 - 06:00).',
            'Tentukan toleransi keterlambatan (misal 15 menit) dan batas jam lembur.',
            'Buka menu "Work Schedule" untuk menugaskan karyawan ke shift tertentu dalam format kalender bulanan.',
          ],
        },
      ],
    },
    {
      id: 'firebase-pwa',
      number: '12',
      title: 'Penyimpanan Cloud Firebase Firestore & Mode Offline PWA',
      category: 'Teknologi & Cloud',
      targetRole: ['ALL'],
      summary: 'Mekanisme sinkronisasi data ke Google Firebase Cloud Firestore dan instalasi PWA di smartphone/laptop.',
      badge: 'Cloud Sync',
      actionTab: 'database-setup',
      actionLabel: 'Buka Pengaturan Cloud Firestore',
      sections: [
        {
          title: 'Penyimpanan Database Google Firebase Cloud Firestore',
          description: `Sistem ini 100% menggunakan database Google Firebase Cloud Firestore terdesentralisasi yang aman, realtime, dan berkecepatan tinggi.`,
          steps: [
            'Klik ikon Pengaturan (Gear) pada pojok kanan atas Header untuk membuka panel status Firebase Firestore.',
            'Panel menampilkan informasi: Project ID, Database Mode (Production Realtime), Status Auth, dan jumlah koleksi aktif.',
            'Gunakan tombol "Sync All Data to Cloud Firestore" untuk mencadangkan dan menyinkronkan seluruh master data (karyawan, absensi, cuti, payroll, dan profil branding) ke cloud dalam satu sentuhan.',
            'Koleksi data dilindungi oleh Firestore Security Rules yang memastikan hanya pengguna berwenang yang dapat membaca atau memodifikasi dokumen.',
          ],
        },
        {
          title: 'Cara Menginstal Aplikasi ke Home Screen (PWA)',
          description: 'Aplikasi ini dapat diinstal langsung seperti aplikasi native di smartphone atau laptop tanpa perlu unduh dari Google Play Store / App Store:',
          steps: [
            'Di Ponsel Android (Chrome): Buka tautan portal aplikasi di Google Chrome, ketuk ikon titik tiga (⋮) di pojok kanan atas, lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama".',
            'Di iPhone / iPad (Safari): Buka tautan di Safari, ketuk tombol Bagikan (ikon kotak panah ke atas di bawah layar), gulir ke bawah dan pilih "Add to Home Screen (Tambahkan ke Layar Utama)".',
            'Di Komputer Windows / Mac (Chrome / Edge): Klik ikon komputer kecil bertuliskan "Instal" pada bilah URL browser di sebelah kanan, lalu klik "Instal".',
            'Aplikasi akan muncul dengan ikon resmi perusahaan Anda di desktop atau layar utama ponsel, dapat dibuka dalam mode layar penuh (standalone tanpa bilah URL), dan bekerja optimal bahkan saat jaringan lambat.',
          ],
        },
      ],
    },
    {
      id: 'faq',
      number: '13',
      title: 'Pertanyaan Umum (FAQ) & Panduan Troubleshooting',
      category: 'Bantuan & Solusi',
      targetRole: ['ALL'],
      summary: 'Solusi cepat untuk kendala izin lokasi GPS, kamera tidak terbuka, lupa sandi, dan sinkronisasi data.',
      badge: 'FAQ',
      sections: [
        {
          title: 'Tanya Jawab Masalah Teknis Populer',
          steps: [
            'Tanya: Mengapa muncul peringatan "Izin Lokasi (GPS) Ditolak"?',
            'Jawab: Periksa izin lokasi di browser Anda. Klik ikon gembok / pengaturan di samping URL di address bar, pilih "Permissions" / "Izin Situs", lalu ubah Lokasi menjadi "Izinkan (Allow)". Pastikan juga GPS / Layanan Lokasi di pengaturan smartphone Anda aktif.',
            'Tanya: Mengapa kamera tidak mau terbuka saat mau Clock-In?',
            'Jawab: Pastikan tidak ada tab atau aplikasi lain yang sedang menggunakan kamera perangkat (seperti Zoom atau Google Meet). Berikan izin akses kamera saat browser meminta persetujuan.',
            'Tanya: Saya sudah berada di kantor, tetapi sistem mendeteksi saya di luar radius?',
            'Jawab: Akurasi GPS ponsel dapat terpengaruh oleh gedung berstruktur baja atau berada di ruang bawah tanah. Nyalakan Wi-Fi ponsel (tidak harus tersambung ke internet, cukup nyala untuk membantu triangulasi lokasi Google) dan tunggu 10 detik agar titik akurasi menyempit.',
            'Tanya: Bagaimana jika saya lupa kata sandi akun saya?',
            'Jawab: Hubungi Super Admin atau tim HR Admin perusahaan Anda. Admin dapat mereset atau memberikan kata sandi baru melalui menu "Employees" -> "User Access".',
            'Tanya: Apakah data saya aman jika ponsel saya hilang?',
            'Jawab: Sangat aman. Seluruh data tersimpan secara terenkripsi di Google Firebase Cloud Firestore. Akun Anda dapat langsung diakses dari perangkat lain dengan username dan password Anda, dan Admin dapat menonaktifkan akun lama sewaktu-waktu.',
          ],
          tips: [
            'Jika Anda mengalami kendala lain yang belum terjawab, hubungi Administrator HR perusahaan Anda melalui kontak yang tertera di menu profil perusahaan.',
          ],
        },
      ],
    },
  ];

  // Filtering chapters based on search query and role filter
  const filteredChapters = useMemo(() => {
    return chapters.filter((chapter) => {
      // Role filter check
      if (selectedRole !== 'ALL') {
        const matchesRole =
          chapter.targetRole.includes('ALL') || chapter.targetRole.includes(selectedRole);
        if (!matchesRole) return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = chapter.title.toLowerCase().includes(q);
      const inSummary = chapter.summary.toLowerCase().includes(q);
      const inCategory = chapter.category.toLowerCase().includes(q);
      const inSections = chapter.sections.some(
        (sec) =>
          sec.title.toLowerCase().includes(q) ||
          sec.description?.toLowerCase().includes(q) ||
          sec.steps?.some((step) => step.toLowerCase().includes(q))
      );

      return inTitle || inSummary || inCategory || inSections;
    });
  }, [chapters, selectedRole, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Top Banner / Document Title (Hidden on Print) */}
      <div className="bg-gradient-to-r from-[#0B1528] via-[#0E2042] to-[#122B5C] text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shadow-xs">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                PANDUAN RESMI SISTEM OPERASIONAL (SOP)
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Edisi Terkini: {appName}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                Google Firebase Powered
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
              Buku Panduan Pengguna & Manual Operasional
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Panduan terperinci penggunaan sistem <strong>{appName}</strong> untuk seluruh tingkatan
              karyawan, atasan, dan tim HRD. Berisi instruksi langkah demi langkah, regulasi presensi
              GPS, kebijakan cuti/izin/lembur, penggajian, serta solusi troubleshooting teknis.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs shadow-md"
              title="Cetak Buku Panduan Resmi dalam Format PDF / Printer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak / Ekspor PDF</span>
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('clock-in')}
                className="px-5 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Mulai Absensi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Printable Document Cover & Header (Only visible in Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base">
                {company.app_short_name || 'HR'}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {company.name}
                </h1>
                <p className="text-xs text-slate-600 font-semibold tracking-wider">
                  SOP & MANUAL SISTEM APLIKASI: {appName.toUpperCase()}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 pt-1">{company.address}</p>
            <p className="text-[11px] text-slate-500">
              Telp: {company.phone} | Email: {company.email} | Web: {company.website || '-'}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-bold text-slate-900">DOKUMEN RESMI INTERNAL</div>
            <div>
              Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
            </div>
            <div className="text-[10px] text-slate-500">Versi Sistem: 3.2.0 (Firestore Production)</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Role Filters (Hidden on Print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik panduan (contoh: absen selfie, slip gaji, ganti nama, sisa cuti, gps...)"
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter Peran:
            </span>
            {[
              { id: 'ALL', label: 'Semua Peran' },
              { id: 'EMPLOYEE', label: 'Karyawan' },
              { id: 'MANAGER', label: 'Manager / Atasan' },
              { id: 'ADMIN', label: 'HR / Admin' },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setSelectedRole(rf.id as RoleFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedRole === rf.id
                    ? 'bg-[#1D63FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Summary */}
        {searchQuery && (
          <div className="text-xs text-slate-600 flex items-center justify-between border-t border-slate-100 pt-3">
            <span>
              Menemukan <strong>{filteredChapters.length}</strong> bab panduan untuk kata kunci "
              <strong>{searchQuery}</strong>"
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset Pencarian
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Table of Contents & Guide Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Table of Contents (4 Cols on LG, Hidden on Print) */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  📑
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Bab & Modul
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {filteredChapters.length} Topik
              </span>
            </div>

            <div className="overflow-y-auto flex-1 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
              {filteredChapters.map((ch) => {
                const isActive = activeChapterId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChapterId(ch.id);
                      setExpandedSectionIds((prev) => ({ ...prev, [ch.id]: true }));
                      const el = document.getElementById(`chapter-${ch.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 group cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-[#1D63FF] font-bold border border-blue-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5 ${
                        isActive ? 'bg-[#1D63FF] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ch.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate leading-snug">{ch.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {ch.category}
                      </div>
                    </div>
                    {ch.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0 group-hover:bg-slate-200">
                        {ch.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Support Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mt-2 space-y-1.5 text-[11px]">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Bantuan & Dukungan Teknis</span>
              </div>
              <p className="text-slate-500 text-[10px] leading-relaxed">
                Butuh bantuan implementasi atau kendala akun? Hubungi Admin HR:
              </p>
              <div className="text-[10px] font-semibold text-slate-700 truncate">
                📧 {company.email}
              </div>
              <div className="text-[10px] font-semibold text-slate-700">
                📞 {company.phone}
              </div>
            </div>
          </div>
        </div>

        {/* Right Chapters Content (8 Cols on LG, Full on Print) */}
        <div className="lg:col-span-8 space-y-6 print:lg:col-span-12 print:space-y-8">
          {filteredChapters.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
                🔍
              </div>
              <h3 className="text-sm font-bold text-slate-900">Topik Panduan Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada bab yang cocok dengan kata kunci "{searchQuery}" atau filter peran yang dipilih.
                Silakan coba kata kunci lain seperti "cuti", "lembur", "presensi", atau klik tombol di bawah:
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRole('ALL');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Tampilkan Semua Panduan
              </button>
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const isExpanded = expandedSectionIds[chapter.id] ?? true;

              return (
                <div
                  id={`chapter-${chapter.id}`}
                  key={chapter.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all print:border-none print:shadow-none print:p-0"
                >
                  {/* Chapter Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#0B1528] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm mt-0.5">
                        {chapter.number}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            {chapter.category}
                          </span>
                          {chapter.badge && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              {chapter.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {chapter.targetRole.map((r) => (
                              <span
                                key={r}
                                className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                              >
                                {r === 'ALL'
                                  ? 'Semua Peran'
                                  : r === 'ADMIN'
                                  ? 'Admin/HR'
                                  : r === 'MANAGER'
                                  ? 'Manager'
                                  : 'Karyawan'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {chapter.title}
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                          {chapter.summary}
                        </p>
                      </div>
                    </div>

                    {/* Action Button & Toggle (Hidden on Print) */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 print:hidden">
                      {chapter.actionTab && onNavigateTab && (
                        <button
                          onClick={() => onNavigateTab(chapter.actionTab!)}
                          className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{chapter.actionLabel || 'Buka Modul'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => toggleSection(chapter.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}
                      >
                        <ChevronRight
                          className={`w-5 h-5 transition-transform ${
                            isExpanded ? 'rotate-90 text-blue-600' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Chapter Body Sections */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6">
                      {chapter.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="space-y-3.5">
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span>{sec.title}</span>
                          </h3>

                          {sec.description && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {sec.description}
                            </p>
                          )}

                          {/* Step-by-step list */}
                          {sec.steps && sec.steps.length > 0 && (
                            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                              {sec.steps.map((st, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                                  <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                    {i + 1}
                                  </span>
                                  <div className="flex-1 whitespace-pre-line">{st}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Data Table if present */}
                          {sec.table && (
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                                  <tr>
                                    {sec.table.headers.map((h, hIdx) => (
                                      <th key={hIdx} className="px-3.5 py-2.5 whitespace-nowrap">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {sec.table.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                      {row.map((cell, cIdx) => (
                                        <td
                                          key={cIdx}
                                          className={`px-3.5 py-2.5 text-slate-700 leading-relaxed ${
                                            cIdx === 0 ? 'font-bold text-slate-900' : ''
                                          }`}
                                        >
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Tips Callout */}
                          {sec.tips && sec.tips.length > 0 && (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                                <Sparkles className="w-4 h-4 text-blue-600" />
                                <span>Tips Efisiensi & Rekomendasi Praktis:</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 pl-1 leading-relaxed">
                                {sec.tips.map((t, tIdx) => (
                                  <li key={tIdx}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Warnings Callout */}
                          {sec.warnings && sec.warnings.length > 0 && (
                            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span>Peringatan & Ketentuan Disiplin:</span>
                              </div>
                              <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 pl-1 leading-relaxed">
                                {sec.warnings.map((w, wIdx) => (
                                  <li key={wIdx}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Signoff & Copyright (For both screen and print) */}
      <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-2">
          <BrandIcon name={company.brand_icon} className="w-4 h-4 text-slate-700" />
          <span>
            {appName} &copy; {new Date().getFullYear()} {company.name}. Seluruh Hak Cipta Dilindungi.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Standard Operating Procedure (SOP) Internal</span>
          <span>&bull;</span>
          <span className="font-semibold text-slate-700">Firebase Cloud Firestore Verified</span>
        </div>
      </div>
    </div>
  );
};
