import React, { useState, ChangeEvent, FormEvent } from "react";
import { CreditCard, Upload, CheckCircle, ShieldCheck, Key, RefreshCw } from "lucide-react";
import { User } from "../types";

interface PaymentActivationProps {
  currentUser: User;
  onActivated: (updatedUser: User) => void;
  pushToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function PaymentActivation({ currentUser, onActivated, pushToast }: PaymentActivationProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>("LEVEL_1");
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activationCode, setActivationCode] = useState<string>("MNG-DEMO-CODE");
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isBypassing, setIsBypassing] = useState<boolean>(false);

  const handleInstantBypass = async () => {
    setIsBypassing(true);
    try {
      const res = await fetch("/api/payment/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        pushToast("Sukses! Akun demo terverifikasi instan tanpa transfer manual.", "success");
        onActivated(data.user);
      } else {
        pushToast(data.error || "Gagal memproses bypass instan.", "error");
      }
    } catch {
      pushToast("Gagal berkomunikasi dengan server untuk bypass.", "error");
    } finally {
      setIsBypassing(false);
    }
  };

  // Convert receipt upload to base64
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      pushToast("Ukuran file bukti maksimal 8MB.", "error");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      pushToast("Gagal membaca file gambar/dokumen.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64) {
      pushToast("Silakan unggah foto atau file bukti transfer pembayaran Anda.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          packageLevel: selectedPackage,
          receiptData: fileBase64,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        pushToast("Sukses! Bukti transfer pembayaran terkirim ke sistem Mengaji.ID.", "success");
        pushToast(`Menunggu verifikasi manual oleh Admin. Harap periksa halaman ini secara berkala!`, "info");
        // Refresh local data to show PENDING state without a code initially
        const updated = {
          ...currentUser,
          package: selectedPackage,
          paymentStatus: "PENDING",
          paymentReceipt: fileBase64,
          activationCode: ""
        };
        onActivated(updated);
        setFileBase64("");
        setFileName("");
      } else {
        pushToast(data.error || "Gagal memproses checkout.", "error");
      }
    } catch {
      pushToast("Gangguan koneksi ke server pemrosesan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      pushToast("Masukkan kode unik aktivasi Anda.", "error");
      return;
    }

    setIsActivating(true);
    try {
      const res = await fetch("/api/payment/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          code: activationCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        pushToast("Mabruk! Akun premium bimbingan mengaji Anda telah aktif sepenuhnya!", "success");
        onActivated(data.user);
      } else {
        pushToast(data.error || "Kode aktivasi tidak valid atau tidak cocok.", "error");
      }
    } catch {
      pushToast("Gagal memproses aktivasi bimbingan.", "error");
    } finally {
      setIsActivating(false);
    }
  };

  const packages = [
    { id: "LEVEL_1", title: "LEVEL 1", desc: "3 pertemuan (Bimbingan Tartil)", price: "Rp 225.000", meetings: 3 },
    { id: "LEVEL_2", title: "LEVEL 2", desc: "6 pertemuan (Tahsin & Tajwid)", price: "Rp 420.000", meetings: 6 },
    { id: "LEVEL_3", title: "LEVEL 3", desc: "8 pertemuan (Syllabus Lengkap Hafalan)", price: "Rp 550.000", meetings: 8 },
  ];

  return (
    <div id="payment-activation-panel" className="bg-white p-6 md:p-8 rounded-3xl border border-rose-200/60 shadow-xl shadow-rose-950/5 relative overflow-hidden max-w-4xl mx-auto">
      <div className="absolute top-0 right-0 p-5 select-none pointer-events-none opacity-5 text-8xl font-serif">💰</div>
      
      <div className="border-b border-slate-100 pb-5 mb-6 text-center md:text-left">
        <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-800 px-3 py-1 rounded-full tracking-wider border border-red-200">
          Akses Fitur Terkunci
        </span>
        <h2 className="text-xl font-black text-slate-800 mt-3 tracking-tight">Pendaftaran Halaqah Bimbingan Premium</h2>
        <p className="text-xs text-slate-500 mt-1">
          Semua fitur digital (Al-Qur'an tartil, Ruang bimbingan privat, & Syllabus materi) baru terbuka setelah melakukan aktivasi kelas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: BANK DETAILS & RECEIPT SUBMIT */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50">
            <h4 className="flex items-center space-x-2 text-xs font-bold text-teal-950 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Instruksi Transfer BSI</span>
            </h4>
            
            <div className="mt-4 space-y-2">
              <p className="text-2xs text-slate-500">Silakan lakukan transfer sesuai harga paket ke rekening resmi berikut:</p>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 relative">
                <span className="absolute right-3 top-3 text-2xs bg-emerald-100 text-emerald-800 px-2 rounded font-extrabold">BSI</span>
                <p className="text-[11px] text-slate-400 font-bold">Bank Syariah Indonesia (BSI)</p>
                <p className="text-sm font-black text-slate-800 font-mono tracking-widest mt-1">7143553088</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Atas Nama: <strong className="text-rose-600">Jaenudin</strong></p>
              </div>

              {/* OPSI Pembayaran E-Wallet DANA */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 relative mt-2.5">
                <span className="absolute right-3 top-3 text-2xs bg-sky-100 text-sky-800 px-2 rounded font-extrabold">DANA</span>
                <p className="text-[11px] text-slate-400 font-bold">E-Wallet DANA</p>
                <p className="text-sm font-black text-slate-800 font-mono tracking-widest mt-1">0896-7891-6761</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">Atas Nama: <strong className="text-sky-700 font-black">JAENUDIN</strong></p>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center mt-1">
                Supported directly by <strong className="text-teal-900">AI Mengaji.ID</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div>
              <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Pilih Paket Belajar Kelas</label>
              <div className="grid grid-cols-1 gap-2.5">
                {packages.map((pkg) => (
                  <label 
                    key={pkg.id} 
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPackage === pkg.id 
                        ? "bg-teal-50/70 border-teal-500/80 ring-1 ring-teal-500/30" 
                        : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input 
                        type="radio" 
                        name="package_level" 
                        checked={selectedPackage === pkg.id}
                        onChange={() => setSelectedPackage(pkg.id)}
                        className="text-teal-700 focus:ring-teal-500 h-4 border-slate-300"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{pkg.title}</p>
                        <p className="text-xxs text-slate-400 mt-0.5">{pkg.desc} (30 Menit/Sesi)</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-teal-900">{pkg.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">Unggah Bukti Transfer (PDF / JPG / PNG)</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-all p-5 text-center flex flex-col items-center justify-center cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-2xs font-bold text-slate-600 block">
                  {fileName ? `File terpilih: ${fileName}` : "Tarik file bukti atau klik untuk memilih"}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 block">Support format gambar JPG, PNG, atau Syllabus PDF s/d 8MB</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-700/10 flex items-center justify-center space-x-2 text-xs uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Mengirim...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Kirim Bukti Pembayaran</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: REALTIME ACTIVE VERIFICATION */}
        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-200/60 mb-4 bg-transparent">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Verifikasi Sesi Belajar</h4>
              </div>

              {currentUser.paymentStatus === "PENDING" ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-[11px] leading-relaxed text-amber-800 mb-5">
                  {!currentUser.activationCode ? (
                    <>
                      <p className="font-extrabold text-xs">⏳ Sedang Ditinjau oleh Admin</p>
                      <p className="mt-1 text-[10.5px]">
                        Bukti transfer Anda sudah terkirim! Admin saat ini sedang meneliti bukti slip pembayaran Anda secara manual. 
                        <strong> Kode Aktivasi Belajar</strong> akan muncul di sini secara otomatis begitu pembayaran disahkan oleh Admin.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-extrabold text-xs text-emerald-800">✅ Pembayaran Terverifikasi Admin!</p>
                      <p className="mt-1 text-[10.5px]">
                        Selamat, pembayaran Anda telah valid! Salin <strong>Kode Aktivasi</strong> di bawah ini, lalu tempelkan di form untuk mengaktifkan akun bimbingan Anda.
                      </p>
                      <div className="mt-3 p-2.5 bg-white rounded border border-amber-300 font-mono text-center text-xs font-black tracking-widest select-all">
                        {currentUser.activationCode}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-2xs text-slate-400 leading-relaxed mb-5">
                  Silakan konfirmasi transaksi Anda. Setelah mengirim slip transfer, Admin akan memverifikasi secara manual dan menerbitkan Kode Unik Aktivasi yang langsung dapat disalin untuk diaktifkan.
                </p>
              )}

              {/* SPECIAL DEMO BYPASS BANNER */}
              <div className="mb-5 p-3.5 bg-teal-50/70 border border-teal-200/50 rounded-xl text-left">
                <span className="text-[8px] font-black uppercase bg-teal-200 text-teal-900 px-2 py-0.5 rounded tracking-wider font-sans mb-1.5 inline-block">
                  ⚡ INSTANT DEMO BYPASS
                </span>
                <p style={{ fontSize: "10px" }} className="text-slate-600 leading-normal mb-2.5">
                  Ingin langsung menguji semua fitur siswa? Tekan tombol di bawah untuk mengaktifkan status Premium secara instan.
                </p>
                <button
                  type="button"
                  onClick={handleInstantBypass}
                  disabled={isBypassing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-3 rounded-lg text-xxs uppercase tracking-wide flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-600/10"
                >
                  <span>⚡ Aktifkan Fitur Premium (Instan)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleActivationSubmit} className="space-y-4">
              <div>
                <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Input Kode Unik Aktivasi</span>
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: MNG-L1-XXXXXX"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  className="w-full text-center px-4 py-3 bg-white border-2 border-slate-200/80 rounded-xl focus:border-teal-500 focus:ring-0 outline-none font-mono font-bold tracking-widest text-xs uppercase"
                />
              </div>

              <button 
                type="submit" 
                disabled={isActivating}
                className="w-full bg-slate-900 hover:bg-slate-950 text-amber-400 font-bold py-3 px-5 rounded-xl text-xxs tracking-wider uppercase flex items-center justify-center space-x-2 border border-slate-800"
              >
                {isActivating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencocokkan Kode...</span>
                  </>
                ) : (
                  <span>Aktivasikan Pembelajaran Anda</span>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
