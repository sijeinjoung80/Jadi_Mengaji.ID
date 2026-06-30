import { useState, useEffect, ChangeEvent } from "react";
import { 
  BookOpen, FileText, Download, FileImage, Eye, Calendar, Search,
  Lock, Unlock, CheckCircle, CreditCard, AlertTriangle, RefreshCw, Upload
} from "lucide-react";
import { Material, User } from "../types";

interface SyllabusMaterialsProps {
  currentUser: User;
  onRefreshUser: () => void;
  pushToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function SyllabusMaterials({ currentUser, onRefreshUser, pushToast }: SyllabusMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchString, setSearchString] = useState<string>("");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewMaterial && previewMaterial.type === "pdf") {
      try {
        const base64Data = previewMaterial.fileData;
        const parts = base64Data.split(";base64,");
        const contentType = parts[0].split(":")[1] || "application/pdf";
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error("Failed to parse base64 PDF", e);
        setPdfUrl(previewMaterial.fileData);
      }
    } else {
      setPdfUrl(null);
    }
  }, [previewMaterial]);

  // Premium purchased state tracking (Requirement 7)
  const [purchases, setPurchases] = useState<any[]>([]);
  const [purchasingMaterial, setPurchasingMaterial] = useState<Material | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>("");
  const [receiptFileName, setReceiptFileName] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const fetchMyPurchases = async () => {
    try {
      const res = await fetch("/api/admin/material-purchases");
      if (res.ok) {
        const data = await res.json();
        const mine = data.purchases?.filter((p: any) => p.username === currentUser.username.toLowerCase()) || [];
        setPurchases(mine);
      }
    } catch {
      console.warn("Gagal sinkron data transaksi materi.");
    }
  };

  const fetchMaterialsList = async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (res.ok && data.materials) {
        setMaterials(data.materials);
      } else {
        pushToast("Gagal memuat daftar materi syllabus.", "error");
      }
    } catch {
      pushToast("Gagal terhubung ke Cloud server syllabus.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAllSyllabusAndPurchases = async () => {
    setLoading(true);
    await Promise.all([fetchMaterialsList(), fetchMyPurchases()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllSyllabusAndPurchases();
  }, [currentUser]);

  // Helper to trigger direct file download from Base64
  const downloadBase64File = (material: Material) => {
    try {
      const base64Data = material.fileData;
      const link = document.createElement("a");
      link.href = base64Data;
      link.download = material.fileName || `${material.title}.${material.type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      pushToast(`Mengunduh ${material.title}...`, "success");
    } catch {
      pushToast("Gagal mengunduh file bimbingan.", "error");
    }
  };

  const handleReceiptFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      pushToast("Ukuran file bukti transfer maksimal 8MB.", "error");
      return;
    }
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitMaterialPurchase = async () => {
    if (!purchasingMaterial || !receiptBase64) {
      pushToast("Mohon sertakan file bukti pembayaran terlebih dahulu.", "error");
      return;
    }
    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/materials/purchase/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          materialId: purchasingMaterial.id,
          receiptData: receiptBase64
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(`Bukti transfer untuk "${purchasingMaterial.title}" sukses disampaikan ke Admin! Mohon luangkan waktu beberapa saat untuk proses verifikasi.`, "success");
        setPurchasingMaterial(null);
        setReceiptFileName("");
        setReceiptBase64("");
        onRefreshUser();
        await fetchMyPurchases();
      } else {
        pushToast(data.error || "Gagal mengirimkan pengajuan.", "error");
      }
    } catch {
      pushToast("Koneksi gagal saat menghubungi bank pusat.", "error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filtered = materials.filter((m) => {
    return (
      m.title.toLowerCase().includes(searchString.toLowerCase()) ||
      (m.description || "").toLowerCase().includes(searchString.toLowerCase())
    );
  });

  filtered.sort((a, b) => b.uploadedAt - a.uploadedAt);

  return (
    <div id="syllabus-materials-container" className="space-y-6">

      {/* SYLLABUS COLORFUL BANNER */}
      <div className="relative bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 rounded-3xl p-6 text-white text-left overflow-hidden shadow-lg border border-white/10 shrink-0">
        <div className="relative z-10 font-sans">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-100 bg-emerald-950/40 py-1 px-3 rounded-full border border-emerald-400/20 font-mono inline-block">
            Silabus & Pembahasan 📖
          </span>
          <h1 className="text-lg font-black mt-2">MATERI & ARSIP PEMBAHASAN BELAJAR PREMIUM</h1>
          <p className="text-xxs md:text-xs text-emerald-50/90 mt-1 max-w-2xl leading-relaxed">
            Disediakan langsung oleh para pembina dan ustadz dewan penasihat khalayak ramai. Unduh materi pembahasan PDF makhraj huruf, tajwid mutasyabihah, serta tafsir i'jazul Qur'an.
          </p>
        </div>
        <span className="absolute right-4 bottom-2 text-7xl opacity-10 select-none pointer-events-none">📚</span>
      </div>
      
      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm gap-4">
        <div>
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Pencarian Cepat Dokumen</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Cari dan saring materi pembahasan bimbingan mengaji Anda di bawah ini.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Cari materi / pembahasan..." 
            value={searchString}
            onChange={(e) => setSearchString(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
          />
        </div>
      </div>

      {/* MATERIALS LIST GRID */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400 font-semibold flex flex-col items-center justify-center space-y-2">
          <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat arsip materi...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200/50 rounded-3xl select-none text-slate-400">
          <span className="text-3xl">📚</span>
          <p className="text-xs font-bold text-slate-600 mt-2">Belum ada materi pembelajaran</p>
          <p className="text-3xs max-w-xs mx-auto text-slate-400 mt-1">Arsip silabus akan diunggah secara bertahap oleh Admin Halaqah Mengaji.ID.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mat) => {
            const isPremium = (mat.price || 0) > 0;
            const hasUnlocked = !isPremium || 
                               currentUser.role === "Admin" || 
                               currentUser.role === "Ustadz" || 
                               (currentUser.purchasedMaterials && currentUser.purchasedMaterials.includes(mat.id));
            
            const myPurchase = purchases.find(p => p.materialId === mat.id);

            return (
              <div key={mat.id} className="bg-white p-5 rounded-3xl border border-slate-200/50 flex flex-col justify-between hover:shadow-md transition-all shadow-xs relative overflow-hidden">
                {isPremium && (
                  <div className="absolute top-0 right-0">
                    <span className={`text-[8px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase block ${
                      hasUnlocked ? "bg-emerald-500 text-white" : "bg-teal-900 text-teal-100"
                    }`}>
                      {hasUnlocked ? "Premium: Unlocked" : `Syllabus Rp ${parseInt(mat.price + "").toLocaleString()}`}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2.5 rounded-xl border ${mat.type === "pdf" ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-sky-50 border-sky-100 text-sky-600"}`}>
                      {mat.type === "pdf" ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                    </div>
                    <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-mono flex items-center space-x-1 uppercase">
                      <Calendar className="w-3 h-3 mr-0.5" />
                      <span>{new Date(mat.uploadedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs text-slate-800 leading-snug">{mat.title}</h4>
                  <p className="text-xxs text-slate-400 mt-2 leading-relaxed lines-3 min-h-[40px]">{mat.description || "Tidak ada deskripsi tambahan."}</p>
                  <div className="text-[10px] text-slate-400 mt-2 select-all font-mono truncate">File: {mat.fileName}</div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col space-y-2 shrink-0">
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      onClick={() => setPreviewMaterial(mat)}
                      className="flex-1 py-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-xxs font-bold text-slate-700 flex items-center justify-center space-x-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    {hasUnlocked && (
                      <button 
                        type="button"
                        onClick={() => downloadBase64File(mat)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xxs font-semibold flex items-center justify-center space-x-1 shadow-xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh</span>
                      </button>
                    )}
                  </div>

                  {!hasUnlocked && (
                    <div className="pt-1 space-y-2">
                      {myPurchase?.status === "PENDING" ? (
                        <div className="bg-amber-50 text-amber-800 border border-amber-250/60 px-3 py-1.5 rounded-xl text-center text-[10px] font-black tracking-wide animate-pulse">
                          🕒 Menunggu Persetujuan Admin / Guru
                        </div>
                      ) : myPurchase?.status === "REJECTED" ? (
                        <div className="space-y-2">
                          <div className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-center text-3xs font-extrabold">
                            ❌ Bukti Pembayaran Ditolak Admin
                          </div>
                          <button 
                            type="button"
                            onClick={() => setPurchasingMaterial(mat)}
                            className="w-full py-2 bg-teal-900 hover:bg-teal-950 text-white font-extrabold rounded-xl text-xxs transition flex items-center justify-center space-x-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Kirim Ulang Pembayaran</span>
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setPurchasingMaterial(mat)}
                          className="w-full py-2 bg-teal-900 hover:bg-emerald-900 text-white font-extrabold rounded-xl text-xxs transition flex items-center justify-center space-x-1.5 shadow shadow-emerald-950/20"
                        >
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Beli Silabus (Rp {parseInt(mat.price + "").toLocaleString()})</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECKOUT PURCHASE MODAL (Requirement 7) */}
      {purchasingMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200/40">
            <button 
              type="button"
              onClick={() => setPurchasingMaterial(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition font-bold"
            >
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">Tutup</span>
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">Pembayaran Silabus Premium</h4>
                <p className="text-[10.5px] text-teal-800 font-extrabold mt-0.5">Materi: {purchasingMaterial.title}</p>
                <p className="text-3xs text-slate-400 mt-1">Satu kali transaksi memberikan hak unduh & pratinjau abadi selamanya.</p>
              </div>
            </div>

            <div className="my-5 bg-slate-50 rounded-2xl border p-4 text-left">
              <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Rincian Bank Pengiriman</span>
              
              <div className="bg-white border rounded-xl p-3 flex justify-between items-center mb-3">
                <div>
                  <h5 className="text-[11px] font-black text-slate-800">Nomor Rekening BSI</h5>
                  <p className="text-xs font-mono font-extrabold text-emerald-700 tracking-wide mt-0.5">7143553088</p>
                  <p className="text-[10px] text-slate-500">an. Jaenudin</p>
                </div>
                <span className="text-[9px] font-extrabold bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded border border-emerald-500/25">
                  BSI Bank
                </span>
              </div>

              <div className="text-[10px] text-slate-600 font-semibold space-y-1 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/30">
                <span className="text-emerald-800 font-bold block">💡 Langkah Transaksi:</span>
                <p className="leading-relaxed">
                  Bayar sejumlah <strong className="text-emerald-700 font-extrabold font-mono">Rp {parseInt(purchasingMaterial.price + "").toLocaleString()}</strong> ke rekening di atas, tangkap layar atau foto kertas bukti penyetoran Anda, lalu unggah fotonya di bawah:
                </p>
              </div>
            </div>

            {/* Bukti upload form */}
            <div className="space-y-4">
              <div>
                <label className="block text-[9.5px] font-black text-slate-600 uppercase tracking-wide mb-1.5">Unggah Foto Bukti Transfer (*.jpg/*.png)</label>
                <div className="relative border-2 border-dashed border-slate-350 bg-slate-50 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-100/50 transition duration-150">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleReceiptFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className="space-y-1 text-slate-500">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                    <p className="text-[10px] font-extrabold text-slate-600">
                      {receiptFileName ? `Terpilih: ${receiptFileName}` : "Klik / Seret foto struk pembelian ke sini"}
                    </p>
                    <p className="text-3xs text-slate-400">File Image (*.jpg, *.png) Maksimal 8MB</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setPurchasingMaterial(null)} 
                  className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 font-semibold text-xxs text-slate-650"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  disabled={submittingPayment || !receiptBase64}
                  onClick={submitMaterialPurchase}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black rounded-xl text-xxs tracking-wider shadow"
                >
                  {submittingPayment ? "Mengunggah..." : "Konfirmasi Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setPreviewMaterial(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors z-20"
            >
              <span className="text-xs font-bold mr-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">Tutup (ESC)</span>
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4 pr-16 bg-white shrink-0">
              <h3 className="text-xs font-black text-slate-800">{previewMaterial.title}</h3>
              <p className="text-3xs text-slate-400 font-mono mt-0.5">Nama File: {previewMaterial.fileName}</p>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-50 rounded-2xl flex items-center justify-center p-4 min-h-[400px]">
              {previewMaterial.type === "jpg" ? (
                <img 
                  src={previewMaterial.fileData} 
                  alt={previewMaterial.title}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow border border-slate-200"
                />
              ) : (
                (() => {
                  const hasUnlocked = !previewMaterial.price || 
                    currentUser.role === "Admin" || 
                    currentUser.role === "Ustadz" || 
                    (currentUser.purchasedMaterials && currentUser.purchasedMaterials.includes(previewMaterial.id));
                  
                  if (hasUnlocked) {
                    return (
                      <div className="w-full h-full flex flex-col space-y-3">
                        <iframe 
                          src={pdfUrl || ""} 
                          className="w-full h-[60vh] rounded-xl border border-slate-200 shadow"
                          title={previewMaterial.title}
                        />
                        <div className="flex justify-center">
                          <button 
                            onClick={() => {
                              downloadBase64File(previewMaterial);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xxs flex items-center space-x-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh File PDF</span>
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center p-8 select-none text-slate-400">
                        <span className="text-4xl">🔐</span>
                        <h4 className="text-xs font-bold text-slate-700 mt-3">Silabus PDF Terkunci</h4>
                        <p className="text-xxs text-slate-400 mt-2 max-w-sm mx-auto">
                          Materi bimbingan ini bersifat premium. Silakan selesaikan pembayaran terlebih dahulu untuk dapat membaca materi ini secara penuh.
                        </p>
                        <p className="mt-4 font-black text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg text-3xs border border-rose-100 uppercase tracking-widest inline-block">
                          🔒 Memerlukan Aktivasi Pembelian
                        </p>
                      </div>
                    );
                  }
                })()
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
