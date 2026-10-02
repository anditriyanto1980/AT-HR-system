import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Calendar,
  User,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { PayrollItem } from '../../types';
import { dataService } from '../../services/dataService';

interface PayslipModalProps {
  item: PayrollItem | null;
  onClose: () => void;
}

// Convert number to Indonesian Words (Terbilang)
function terbilangRupiah(n: number): string {
  if (n < 0) return 'Minus ' + terbilangRupiah(Math.abs(n));
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function toWords(num: number): string {
    if (num < 12) return bilangan[num];
    if (num < 20) return toWords(num - 10) + ' Belas';
    if (num < 100) return toWords(Math.floor(num / 10)) + ' Puluh ' + toWords(num % 10);
    if (num < 200) return 'Seratus ' + toWords(num - 100);
    if (num < 1000) return toWords(Math.floor(num / 100)) + ' Ratus ' + toWords(num % 100);
    if (num < 2000) return 'Seribu ' + toWords(num - 1000);
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' Ribu ' + toWords(num % 1000);
    if (num < 1000000000)
      return toWords(Math.floor(num / 1000000)) + ' Juta ' + toWords(num % 1000000);
    return (
      toWords(Math.floor(num / 1000000000)) +
      ' Miliar ' +
      toWords(num % 1000000000)
    );
  }

  const clean = Math.floor(n);
  if (clean === 0) return 'Nol Rupiah';
  return toWords(clean).trim().replace(/\s+/g, ' ') + ' Rupiah';
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ item, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  if (!item) return null;

  const company = dataService.getCompany();
  const profile = dataService.getSalaryProfile(item.employee_id);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        {/* Modal Top Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center font-bold text-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Official Slip Gaji Elektronik
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                No: <span className="font-mono font-semibold text-slate-700">{item.slip_number}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto print:overflow-visible text-slate-800 space-y-6">
          {/* Header PT Nusantara Prima */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow tracking-wider">
                  {company.app_short_name || (company.app_name ? company.app_name.substring(0, 2).toUpperCase() : 'AT')}
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                    {company.name}
                  </h1>
                  <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                    Payroll & People Operations
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 pt-1 leading-relaxed max-w-md">
                {company.address}
              </p>
              <p className="text-[11px] text-slate-500">
                Telp: {company.phone} | Email: {company.email}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg w-full sm:w-auto">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold tracking-widest uppercase mb-1">
                SLIP GAJI KARYAWAN
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Periode: <span className="font-bold text-slate-900">{item.period_label}</span>
              </p>
              <p className="text-xs text-slate-500">
                Status:{' '}
                <span
                  className={`font-semibold ${
                    item.status === 'PAID'
                      ? 'text-emerald-700'
                      : item.status === 'APPROVED'
                      ? 'text-blue-700'
                      : 'text-amber-700'
                  }`}
                >
                  {item.status === 'PAID' ? 'LUNAS / DITRANSFER' : item.status}
                </span>
              </p>
              {item.payment_date && (
                <p className="text-[11px] text-slate-500">
                  Tanggal Transfer: {item.payment_date}
                </p>
              )}
            </div>
          </div>

          {/* Employee & Bank Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Karyawan</span>
                <span className="font-bold text-slate-900">{item.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Induk Karyawan (NIK)</span>
                <span className="font-mono font-semibold text-slate-800">{item.employee_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jabatan & Departemen</span>
                <span className="font-medium text-slate-800">
                  {item.position_name} - {item.department_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Cabang</span>
                <span className="font-medium text-slate-800">{item.branch_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status PTKP Pajak</span>
                <span className="font-semibold text-slate-800">{profile.ptkp_status || 'TK/0'}</span>
              </div>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor NPWP</span>
                <span className="font-mono font-medium text-slate-800">{profile.npwp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BPJS Ketenagakerjaan</span>
                <span className="font-mono font-medium text-slate-800">{profile.bpjs_tk_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BPJS Kesehatan</span>
                <span className="font-mono font-medium text-slate-800">{profile.bpjs_kes_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rekening Payroll</span>
                <span className="font-semibold text-slate-800">
                  {item.bank_name || profile.bank_name} ({item.bank_account_number || profile.bank_account_number})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kehadiran / Hari Kerja</span>
                <span className="font-semibold text-slate-800">
                  {item.present_days} dari {item.work_days} hari ({item.late_minutes}m terlambat)
                </span>
              </div>
            </div>
          </div>

          {/* Dual Column: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings (Penerimaan) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  A. Penerimaan (Earnings)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Nominal (IDR)</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gaji Pokok</span>
                  <span className="font-semibold text-slate-900">{formatIDR(item.base_salary)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Jabatan</span>
                  <span className="font-semibold text-slate-900">{formatIDR(item.position_allowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Transportasi</span>
                  <span className="font-semibold text-slate-900">{formatIDR(item.transport_allowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Uang Makan</span>
                  <span className="font-semibold text-slate-900">{formatIDR(item.meal_allowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Tunjangan Komunikasi</span>
                  <span className="font-semibold text-slate-900">{formatIDR(item.communication_allowance)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">Upah Lembur (Overtime)</span>
                    {item.overtime_hours > 0 && (
                      <span className="text-[10px] text-slate-400 block">
                        ({item.overtime_hours} jam terverifikasi)
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-slate-900">{formatIDR(item.overtime_pay)}</span>
                </div>
                {item.bonus > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Bonus & Insentif Prestasi</span>
                    <span className="font-semibold text-slate-900">{formatIDR(item.bonus)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-emerald-950">
                  <span>Total Penghasilan Bruto</span>
                  <span>{formatIDR(item.gross_income)}</span>
                </div>
              </div>
            </div>

            {/* Deductions (Potongan) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  B. Potongan (Deductions)
                </span>
                <span className="text-[11px] font-semibold text-rose-700">Nominal (IDR)</span>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">BPJS Kesehatan (1%)</span>
                    <span className="text-[10px] text-slate-400 block">Iuran Pekerja</span>
                  </div>
                  <span className="font-semibold text-rose-700">-{formatIDR(item.bpjs_kes_employee)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">BPJS Ketenagakerjaan JHT (2%)</span>
                    <span className="text-[10px] text-slate-400 block">Jaminan Hari Tua</span>
                  </div>
                  <span className="font-semibold text-rose-700">-{formatIDR(item.bpjs_tk_jht_employee)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">BPJS Ketenagakerjaan JP (1%)</span>
                    <span className="text-[10px] text-slate-400 block">Jaminan Pensiun</span>
                  </div>
                  <span className="font-semibold text-rose-700">-{formatIDR(item.bpjs_tk_jp_employee)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="text-slate-600">Pajak Penghasilan (PPh 21 TER)</span>
                    <span className="text-[10px] text-slate-400 block">Tarif Efektif Rata-rata</span>
                  </div>
                  <span className="font-semibold text-rose-700">-{formatIDR(item.pph21)}</span>
                </div>
                {item.late_deduction > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Denda Keterlambatan</span>
                    <span className="font-semibold text-rose-700">-{formatIDR(item.late_deduction)}</span>
                  </div>
                )}
                {item.absence_deduction > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Potongan Unpaid / Alpha</span>
                    <span className="font-semibold text-rose-700">-{formatIDR(item.absence_deduction)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-bold text-sm text-rose-950">
                  <span>Total Potongan</span>
                  <span>-{formatIDR(item.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Take Home Pay Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-300">
                Penerimaan Bersih (Take Home Pay)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {formatIDR(item.take_home_pay)}
              </div>
              <p className="text-xs text-slate-300 italic pt-1 max-w-md">
                Terbilang: &quot;{terbilangRupiah(item.take_home_pay)}&quot;
              </p>
            </div>

            <div className="text-right space-y-1 text-xs border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <div className="text-slate-400">Tunjangan BPJS Perusahaan (Benefit):</div>
              <div className="text-slate-200 font-medium">
                BPJS Kes 4%: {formatIDR(item.bpjs_kes_company)}
              </div>
              <div className="text-slate-200 font-medium">
                BPJS TK JHT, JKK, JKM, JP: {formatIDR(item.bpjs_tk_jht_company + item.bpjs_tk_jkk_company + item.bpjs_tk_jkm_company + item.bpjs_tk_jp_company)}
              </div>
              <div className="text-[10px] text-slate-500 pt-1">
                *Ditanggung sepenuhnya oleh pemberi kerja (tidak memotong gaji).
              </div>
            </div>
          </div>

          {/* Signature & Disclaimer Section */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-16">
              <p className="text-slate-500">Penerima (Karyawan),</p>
              <div>
                <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 mx-8">
                  {item.employee_name}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">NIK: {item.employee_code}</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="text-slate-500">
                Jakarta, {item.payment_date || new Date().toISOString().split('T')[0]}
                <br />
                <span className="font-semibold text-slate-700">Head of Finance & People Operations</span>
              </p>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-semibold text-[11px] mb-1">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Digitally Signed & Certified</span>
                </div>
                <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 mx-8">
                  Siti Rahmawati, S.Psi., CHRP
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{company.app_name || 'AT-HR Enterprise'} Automated Payroll</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-center text-slate-400 pt-4 border-t border-slate-100">
            Slip gaji ini adalah dokumen resmi yang diterbitkan secara elektronik oleh Sistem {company.app_name || 'AT-HR'}. Informasi dalam slip ini bersifat rahasia (Strictly Confidential).
          </div>
        </div>
      </div>
    </div>
  );
};
