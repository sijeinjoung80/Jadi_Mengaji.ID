import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { 
  Users, BookOpen, Trash2, Edit2, Check, X, Upload, 
  RefreshCw, Award, CreditCard, Clock, GraduationCap, ShieldAlert,
  Share2, Copy, Eye, Download
} from "lucide-react";
import { User, Ustadz, Material } from "../types";

interface AdminPanelProps {
  currentUser: User;
  onStudentUpdated: () => void;
  pushToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminPanel({ currentUser, onStudentUpdated, pushToast }: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<string>("students");
  const [loading, setLoading] = useState<boolean>(true);

  // States
  const [students, setStudents] = useState<User[]>([]);
  const [ustadzListState, setUstadzListState] = useState<Ustadz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialPurchases, setMaterialPurchases] = useState<any[]>([]);
  const [tempPassword, setTempPassword] = useState<string>("");
  const [tempPasswordUstadz, setTempPasswordUstadz] = useState<string>("");

  // Forms
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editRemaining, setEditRemaining] = useState<number>(0);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>("UNPAID");
  const [editPackage, setEditPackage] = useState<string>("LEVEL_1");
  const [editSelectedUstadz, setEditSelectedUstadz] = useState<string>("AUTO");

  const [editingUstadz, setEditingUstadz] = useState<Ustadz | null>(null);
  const [ustadzToDelete, setUstadzToDelete] = useState<Ustadz | null>(null);
  const [editUName, setEditUName] = useState<string>("");
  const [editUInit, setEditUInit] = useState<string>("");
  const [editUSpec, setEditUSpec] = useState<string>("");
  const [editUDesc, setEditUDesc] = useState<string>("");

  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [uploadType, setUploadType] = useState<"pdf" | "jpg">("pdf");
  const [uploadFileBase64, setUploadFileBase64] = useState<string>("");
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);

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
        console.error("Failed to parse base64 PDF in admin", e);
        setPdfUrl(previewMaterial.fileData);
      }
    } else {
      setPdfUrl(null);
    }
  }, [previewMaterial]);

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

  // Fetch functions
  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok && data.students) {
        setStudents(data.students);
      }
    } catch {
      console.error("Gagal mengambil data siswa.");
    }
  };

  const fetchUstadz = async () => {
    try {
      const res = await fetch("/api/ustadz");
      const data = await res.json();
      if (res.ok && data.ustadz) {
        setUstadzListState(data.ustadz);
      }
    } catch {
      console.error("Gagal mengambil data ustadz.");
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/materials");
      const data = await res.json();
      if (res.ok && data.materials) {
        setMaterials(data.materials);
      }
    } catch {
      console.error("Gagal mengambil data materi.");
    }
  };

  const fetchMaterialPurchases = async () => {
    try {
      const res = await fetch("/api/admin/material-purchases");
      if (res.ok) {
        const data = await res.json();
        setMaterialPurchases(data.purchases || []);
      }
    } catch {
      console.error("Gagal mengambil data transaksi materi.");
    }
  };

  const loadAllAdminData = async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchUstadz(), fetchMaterials(), fetchMaterialPurchases()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllAdminData();
    
    // Periodically fetch in the background to automatically sync new registrations, transactions, and edits
    const interval = setInterval(() => {
      fetchStudents();
      fetchUstadz();
      fetchMaterialPurchases();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Student Edit / Verify Action
  const handleEditStudentSelect = (std: User) => {
    setEditingStudent(std);
    setEditRemaining(std.remainingMeetings || 0);
    setEditCompleted(std.sessionsCompleted || 0);
    setEditStatus(std.paymentStatus || "UNPAID");
    setEditPackage(std.package || "LEVEL_1");
    setTempPassword(std.password || "");
    // If the student's assignment is locked manually, set to selectedUstadz name, otherwise default to AUTO
    setEditSelectedUstadz(std.manualUstadzAssignment ? (std.selectedUstadz || "AUTO") : "AUTO");
  };

  const handleUpdateStudentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      // Deducting meetings total corresponding to selected package if verified
      let total = editingStudent.totalMeetings || 0;
      if (editStatus === "VERIFIED" && total === 0) {
        if (editPackage === "LEVEL_1") total = 3;
        else if (editPackage === "LEVEL_2") total = 6;
        else if (editPackage === "LEVEL_3") total = 8;
      }

      const res = await fetch("/api/admin/students/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editingStudent.username,
          package: editPackage,
          paymentStatus: editStatus,
          totalMeetings: total,
          remainingMeetings: editRemaining,
          sessionsCompleted: editCompleted,
          selectedUstadz: editSelectedUstadz
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(`Berhasil merubah data bimbingan siswa ${editingStudent.name}!`, "success");
        setEditingStudent(null);
        await fetchStudents();
        onStudentUpdated();
      } else {
        pushToast(data.error || "Gagal mengupdate siswa.", "error");
      }
    } catch {
      pushToast("Gagal menyinkronkan data perubahan siswa.", "error");
    }
  };

  // Ustadz Edit Actions (Requirement 1: edit tiap pitur termasuk merubah nama ustadz nya)
  const handleEditUstadzSelect = async (ust: Ustadz) => {
    setEditingUstadz(ust);
    setEditUName(ust.name);
    setEditUInit(ust.initials);
    setEditUSpec(ust.specialization);
    setEditUDesc(ust.desc);
    setTempPasswordUstadz("Memuat sandi...");
    try {
      const res = await fetch(`/api/admin/users/get-password?username=${encodeURIComponent(ust.id)}`);
      const data = await res.json();
      if (res.ok && data.password) {
        setTempPasswordUstadz(data.password);
      } else {
        setTempPasswordUstadz("");
      }
    } catch {
      setTempPasswordUstadz("");
    }
  };

  const handleUpdateUstadzSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUstadz) return;

    try {
      const res = await fetch("/api/admin/ustadz/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUstadz.id,
          name: editUName,
          initials: editUInit,
          specialization: editUSpec,
          desc: editUDesc
        }),
      });

      const data = await res.json();
      if (res.ok) {
        pushToast(`Sukses mengubah info materi mengaji ${editUName}!`, "success");
        setEditingUstadz(null);
        await fetchUstadz();
      } else {
        pushToast(data.error || "Gagal merubah data ustadz.", "error");
      }
    } catch {
      pushToast("Gagal menyinkronkan data guru.", "error");
    }
  };

  const executeDeleteUstadz = async (ust: Ustadz) => {
    try {
      const res = await fetch("/api/admin/ustadz/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ust.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(`Berhasil mengeluarkan guru ${ust.name} dari sistem!`, "success");
        if (editingUstadz?.id === ust.id) {
          setEditingUstadz(null);
        }
        setUstadzToDelete(null);
        await fetchUstadz();
      } else {
        pushToast(data.error || "Gagal mengeluarkan ustadz.", "error");
      }
    } catch {
      pushToast("Koneksi gagal saat mengeluarkan ustadz.", "error");
    }
  };

  const handleDeleteUstadz = (ust: Ustadz) => {
    setUstadzToDelete(ust);
  };

  const downloadUstadzCertificate = (ust: Ustadz) => {
    try {
      if (!ust.certificateData) return;
      const link = document.createElement("a");
      link.href = ust.certificateData;
      link.download = ust.certificateName || `syahadah_${ust.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      pushToast(`Mengunduh dokumen: ${ust.certificateName || "Syahadah"}.`, "success");
    } catch {
      pushToast("Gagal mengunduh ijazah/sertifikat ustadz.", "error");
    }
  };

  // Manual trigger for Gojek-style ustadz rebalance allocation
  const handleTriggerRebalance = async () => {
    setIsRebalancing(true);
    try {
      const res = await fetch("/api/admin/students/rebalance", {
         method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(data.message || "Berhasil merestrukturisasi & meroute penugasan guru otomatis!", "success");
        await fetchStudents();
        onStudentUpdated();
      } else {
        pushToast(data.error || "Gagal mengatur ulang penugasan otomatis.", "error");
      }
    } catch {
      pushToast("Gagal berkomunikasi dengan server penyeimbang.", "error");
    } finally {
      setIsRebalancing(false);
    }
  };

  // Materials Upload Actions (Requirement 3: bagi admin bisa mengupload materi dalam bentuk pdf,jpg)
  const handleMaterialFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      pushToast("Ukuran file materi maksimal 15MB.", "error");
      return;
    }

    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      pushToast("Gagal mengurai dokumen materi.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFileBase64) {
      pushToast("Mohon pilih file bimbingan terlebih dahulu.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/materials/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          type: uploadType,
          fileName: uploadFileName,
          fileData: uploadFileBase64,
          description: uploadDesc
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(`Materi ${uploadTitle} berhasil diterbitkan di Cloud!`, "success");
        setUploadTitle("");
        setUploadDesc("");
        setUploadFileName("");
        setUploadFileBase64("");
        await fetchMaterials();
      } else {
        pushToast(data.error || "Gagal menggunggah materi bimbingan.", "error");
      }
    } catch {
      pushToast("Gagal terhubung dengan penyimpanan awan.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    if (!confirm(`Hapus materi silabus "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/materials/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        pushToast("Syllabus berhasil ditarik dan didelete.", "success");
        await fetchMaterials();
      } else {
        pushToast("Gagal menghapus silabus.", "error");
      }
    } catch {
      pushToast("Sistem cloud terganggu.", "error");
    }
  };

  const handleTriggerMeetingDeduct = async (username: string, name: string) => {
    if (!confirm(`Selesaikan tatap muka bimbingan 30 menit siswa "${name}" sekarang? Sisa pertemuan akan berkurang 1.`)) {
      return;
    }

    try {
      const res = await fetch("/api/sessions/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      if (res.ok) {
        pushToast(`Berhasil mencatatkan penyelesaian bimbingan 30 menit untuk ${name}!`, "success");
        await fetchStudents();
        onStudentUpdated();
      } else {
        pushToast("Gagal memproses absensi.", "error");
      }
    } catch {
      pushToast("Koneksi gagal.", "error");
    }
  };

  return (
    <div id="admin-workspace-panel" className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm flex flex-col flex-1">
      
      {/* ADMIN UPPER COLORFUL BANNER */}
      <div className="relative bg-gradient-to-r from-teal-500 via-sky-600 to-indigo-600 rounded-3xl p-6 text-white text-left overflow-hidden shadow-lg border border-white/10 mb-6 shrink-0">
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-black tracking-widest text-teal-100 bg-teal-900/40 py-1 px-3 rounded-full border border-teal-400/20 font-mono inline-block">
            Sistem Pengawas Admin ⚙️
          </span>
          <h1 className="text-lg font-black mt-2">DASHBOARD & REKAPITULASI DATA ADMINISTRATOR</h1>
          <p className="text-xxs md:text-xs text-teal-50/90 mt-1 max-w-2xl leading-relaxed">
            Kelola transaksi akun santri, verifikasi aktivasi paket bimbingan mengaji iqra dan tahsin, konfigurasikan form rombongan belajar terjadwal, serta pantau laporan harian.
          </p>
        </div>
        <span className="absolute right-4 bottom-2 text-7xl opacity-10 select-none pointer-events-none">⚙️</span>
      </div>

      {/* ADMIN UPPER SUB TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 mb-6 gap-3 shrink-0">
        <div className="flex items-center space-x-2.5">
          <GraduationCap className="w-5 h-5 text-teal-800" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Panel Administrasi Mengaji.ID</h3>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] sm:text-xxs font-black shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
            type="button"
            onClick={() => setAdminTab("students")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "students" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Rekap Quota Siswa
          </button>
          <button 
            type="button"
            onClick={() => setAdminTab("rombongan")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "rombongan" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Rombongan Belajar
          </button>
          <button 
            type="button"
            onClick={() => setAdminTab("ustadz")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "ustadz" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Kelola Guru
          </button>
          <button 
            type="button"
            onClick={() => setAdminTab("materials")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "materials" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Upload Silabus
          </button>
          <button 
            type="button"
            onClick={() => setAdminTab("purchases")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "purchases" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Verifikasi Materi ({materialPurchases.filter(p => p.status === "PENDING").length})
          </button>
          <button 
            type="button"
            onClick={() => setAdminTab("share")}
            className={`px-3 py-2 rounded-lg transition-all text-center ${adminTab === "share" ? "bg-white text-teal-950 shadow-sm" : "text-slate-500 hover:text-teal-900"}`}
          >
            Bagikan Link 🌐
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xxs font-semibold flex flex-col items-center justify-center space-y-2 flex-1">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-800" />
          <span>Sinkronisasi Datastore Cloud...</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">

          {/* ======================= TAB 1: REKAP DATA SISWA ======================= */}
          {adminTab === "students" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                <span className="text-xxs font-mono text-slate-400">Arsip terdaftar: {students.length} Santri</span>
                <button onClick={fetchStudents} className="p-1 px-3 text-3xs font-bold text-teal-950 hover:bg-teal-900 hover:text-white border border-teal-900/30 rounded-lg flex items-center space-x-1">
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Segarkan Siswa</span>
                </button>
              </div>

              {/* SPECIAL PERSYARATAN 6 LISTING CONTAINER */}
              <div id="persyaratan-6-rekap-box" className="bg-gradient-to-r from-teal-950 to-slate-900 p-5 rounded-3xl text-white shadow-md border border-teal-900/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-100">Daftar Rekap Siswa Sesuai Persyaratan 6</h4>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                    Sisa Pertemuan Terkikis Otomatis
                  </span>
                </div>
                <p className="text-[10px] text-teal-200/70 mb-4 leading-relaxed font-semibold">
                  Setiap siswa dengan paketnya akan berkurang terus jumlahnya sesuai dengan ketuntasan waktu belajar pada level nya. Dapat dikurangi secara manual oleh admin atau otomatis dari ruang belajar siswa.
                </p>
                <div className="bg-slate-950/85 p-3 rounded-2xl border border-teal-900/40 font-mono text-[10.5px] leading-relaxed space-y-1 text-slate-300">
                  <div className="text-teal-400 font-bold border-b border-teal-900/60 pb-1.5 mb-2.5 flex justify-between items-center text-[9px] uppercase tracking-wider">
                    <span>siswa:</span>
                    <span>Format: [Nama] | [Level] | sisa pertemuan: [sisa] | [status]</span>
                  </div>
                  {students.length === 0 ? (
                    <div className="text-slate-500 text-xxs py-2 font-semibold">Belum ada siswa terdaftar di database.</div>
                  ) : (
                    students.map((std, idx) => {
                      const levelName = std.package ? std.package.replace("_", " ") : "BELUM AKTIF";
                      const sisa = std.remainingMeetings ?? 0;
                      let statusText = "status aktif";
                      if (std.paymentStatus !== "VERIFIED") {
                        statusText = "belum aktif (menunggu bimbingan)";
                      } else if (sisa <= 0) {
                        statusText = "tidak aktif (kuota tuntas)";
                      }
                      return (
                        <div key={std.username} className="flex justify-between items-center py-1.5 border-b border-slate-900/40 last:border-b-0 hover:bg-slate-900/40 px-1.5 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-705 overflow-hidden flex items-center justify-center shrink-0">
                              {std.photoUrl ? (
                                <img src={std.photoUrl} alt={std.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-teal-350 text-[9px] font-black">{std.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="text-teal-100 font-bold">
                              {idx + 1}. <span className="text-white underline decoration-emerald-800 underline-offset-2">{std.name}</span> | {levelName} | sisa pertemuan:{sisa} | <span className={`${sisa > 0 && std.paymentStatus === "VERIFIED" ? "text-emerald-400 font-extrabold" : "text-rose-400 font-bold"}`}>{statusText}</span>
                            </span>
                          </div>
                          {/* Mini shortcut button to simulate manual/quick deduction */}
                          <button
                            type="button"
                            onClick={() => handleTriggerMeetingDeduct(std.username, std.name)}
                            disabled={sisa <= 0 || std.paymentStatus !== "VERIFIED"}
                            className="text-[9px] font-black bg-teal-900 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-teal-900 text-emerald-400 hover:text-white px-2 py-0.5 rounded transition"
                          >
                            -1 Sesi
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xxs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-3xs font-extrabold tracking-wider border-b border-slate-100">
                      <th className="py-3 px-4">Nama & Email</th>
                      <th className="py-3 px-4">Paket Belajar</th>
                      <th className="py-3 px-4">Status Bayar</th>
                      <th className="py-3 px-4 font-mono">Kode Aktivasi</th>
                      <th className="py-3 px-4 text-center">Ketuntasan (30m)</th>
                      <th className="py-3 px-4 text-center">Aksi Quota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {students.map((std) => (
                      <tr key={std.username} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 overflow-hidden flex items-center justify-center shrink-0">
                              {std.photoUrl ? (
                                <img src={std.photoUrl} alt={std.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-teal-800 text-[11px] font-black">{std.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <div className="text-slate-800 font-bold text-[11px]">{std.name}</div>
                              <div className="text-slate-400 text-[9px] font-mono mt-0.5">{std.username} • {std.email}</div>
                            </div>
                          </div>
                          {std.sessionHistory && std.sessionHistory.length > 0 && (
                            <div className="mt-1.5 bg-teal-50/40 p-1.5 rounded-lg border border-teal-100/30 max-w-xs">
                              <div className="text-[8px] text-teal-800 font-bold uppercase tracking-wider mb-0.5">Riwayat Waktu Belajar:</div>
                              <ul className="list-disc list-inside text-[8.5px] text-slate-600 font-mono space-y-0.5">
                                {std.sessionHistory.map((log, lIdx) => (
                                  <li key={lIdx} className="truncate" title={log}>{log}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-3xs select-none ${std.package && std.package !== "BELUM_AKTIF" ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-slate-100 text-slate-400"}`}>
                            {std.package ? std.package.replace("_", " ") : "BELUM AKTIF"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] ${std.paymentStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : std.paymentStatus === "PENDING" ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                            {std.paymentStatus || "UNPAID"}
                          </span>
                        </td>
                        <td className="py-3 px-4 select-all font-mono text-[10px] text-teal-950 font-bold">
                          {std.activationCode || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-slate-800 font-mono text-[10px] font-black">
                            Sisa: <span className="text-teal-700 font-extrabold">{std.remainingMeetings ?? 0}</span> / {std.totalMeetings ?? 0}
                          </div>
                          <div className="text-slate-400 text-[8px] mt-0.5 font-mono">Tuntas: {std.sessionsCompleted ?? 0} Sesi</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1.5 justify-center">
                            {std.paymentStatus === "PENDING" && !std.activationCode && (
                              <button 
                                onClick={async () => {
                                  if (confirm(`Sahkan pembayaran untuk siswa ${std.name}? Sistem akan otomatis membuat Kode Aktivasi dan mengirimnya ke chat.`)) {
                                    try {
                                      const res = await fetch("/api/admin/students/verify-payment", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ username: std.username })
                                      });
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        pushToast(`Sukses menyetujui paket untuk bimbingan ${std.name}!`, "success");
                                        await fetchStudents();
                                        onStudentUpdated();
                                      } else {
                                        pushToast(data.error || "Gagal memproses persetujuan.", "error");
                                      }
                                    } catch {
                                      pushToast("Tidak bisa terhubung dengan database bimbingan.", "error");
                                    }
                                  }
                                }}
                                className="p-1 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-extrabold text-[9px] shadow-sm animate-pulse whitespace-nowrap"
                              >
                                Sahkan Pembayaran
                              </button>
                            )}

                            {std.paymentReceipt && (
                              <a 
                                href={std.paymentReceipt} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white rounded border border-sky-200/60 font-bold transition-all text-[9px] text-center whitespace-nowrap"
                              >
                                Lihat Slip
                              </a>
                            )}

                            <button 
                              onClick={() => handleTriggerMeetingDeduct(std.username, std.name)}
                              disabled={(std.remainingMeetings || 0) <= 0}
                              title="Kurangi sisa bimbingan siswa -1 (30 Menit)"
                              className="p-1 px-2.5 bg-emerald-50 text-emerald-700 disabled:opacity-40 hover:bg-emerald-600 hover:text-white rounded border border-emerald-200/60 font-bold transition-all text-[9px] whitespace-nowrap"
                            >
                              Selesai 1 Sesi
                            </button>
                            <button 
                              onClick={() => handleEditStudentSelect(std)}
                              title="Ubah rincian bimbingan"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition whitespace-nowrap"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* STUDENT EDIT DIALOG */}
              {editingStudent && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 animate-fade-in space-y-4">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                    <h4 className="font-extrabold text-slate-800 uppercase text-2xs flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Ubah Ketuntasan Belajar & Quota: <strong className="text-teal-950">{editingStudent.name}</strong></span>
                    </h4>
                    <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>

                  <form onSubmit={handleUpdateStudentSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-xxs font-bold">
                    <div>
                      <label className="block text-3xs uppercase tracking-wider text-slate-500 mb-1">Paket Bimbingan</label>
                      <select 
                        value={editPackage}
                        onChange={(e) => setEditPackage(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
                      >
                        <option value="BELUM_AKTIF">BELUM AKTIF</option>
                        <option value="LEVEL_1">LEVEL 1 (3 Sesi)</option>
                        <option value="LEVEL_2">LEVEL 2 (6 Sesi)</option>
                        <option value="LEVEL_3">LEVEL 3 (8 Sesi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-3xs uppercase tracking-wider text-slate-500 mb-1">Status Pembayaran</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500"
                      >
                        <option value="UNPAID">UNPAID (Belum Bayar)</option>
                        <option value="PENDING">PENDING (Review Bukti)</option>
                        <option value="VERIFIED">VERIFIED (Aktif/Terverifikasi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-3xs uppercase tracking-wider text-slate-500 mb-1">Sisa Pertemuan</label>
                      <input 
                        type="number"
                        min={0}
                        value={editRemaining}
                        onChange={(e) => setEditRemaining(parseInt(e.target.value) || 0)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs uppercase tracking-wider text-slate-500 mb-1">Sesi Selesai (Tuntas)</label>
                      <input 
                        type="number"
                        min={0}
                        value={editCompleted}
                        onChange={(e) => setEditCompleted(parseInt(e.target.value) || 0)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs uppercase tracking-wider text-slate-500 mb-1">Penugasan Guru Privat</label>
                      <select 
                        value={editSelectedUstadz}
                        onChange={(e) => setEditSelectedUstadz(e.target.value)}
                        className="w-full bg-white p-2.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-500 font-extrabold text-teal-950 bg-teal-50/50"
                      >
                        <option value="AUTO">🔄 Sistem Otomatis (Re-balance)</option>
                        {ustadzListState.map((u) => (
                          <option key={u.id} value={u.name}>👤 {u.name}</option>
                        ))}
                      </select>
                    </div>

                    {editingStudent.paymentReceipt && (
                      <div className="md:col-span-5 p-3 bg-white border border-slate-200 rounded-xl">
                        <p className="text-3xs text-slate-400 mb-1">Telah diupload siswa bukti transfer pembayaran:</p>
                        <img 
                          src={editingStudent.paymentReceipt} 
                           alt="Bukti Transfer"
                          className="max-h-40 rounded border shadow-inner object-contain"
                        />
                      </div>
                    )}

                    <div className="md:col-span-5 p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs uppercase tracking-widest text-[#2c3e50] font-black flex items-center gap-1">
                          <span>🔑</span> Kata Sandi / Password Siswa
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                            let gPassword = "";
                            for (let i = 0; i < 8; i++) {
                              gPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setTempPassword(gPassword);
                          }}
                          className="text-[9px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-md border border-sky-200 transition cursor-pointer select-none"
                        >
                          🔄 Generate Sandi Acak
                        </button>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative flex-1 w-full">
                          <input
                            type="text"
                            placeholder="Sandi baru..."
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="w-full bg-white p-2.5 border border-slate-250 rounded-lg focus:outline-none focus:border-sky-500 font-mono text-xs text-slate-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!tempPassword.trim()) {
                              pushToast("Mohon masukkan password atau klik generate.", "error");
                              return;
                            }
                            if (confirm(`Ganti kata sandi siswa ${editingStudent.name} menjadi: "${tempPassword}"?`)) {
                              try {
                                const res = await fetch("/api/admin/users/reset-password", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ username: editingStudent.username, newPassword: tempPassword })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  pushToast(`Sandi untuk ${editingStudent.name} berhasil diperbarui di cloud database!`, "success");
                                  setEditingStudent({ ...editingStudent, password: tempPassword });
                                  await fetchStudents();
                                } else {
                                  pushToast(data.error || "Gagal memperbarui kata sandi.", "error");
                                }
                              } catch {
                                pushToast("Gangguan jaringan/server bimbingan.", "error");
                              }
                            }
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black transition cursor-pointer"
                        >
                          Simpan Sandi Baru
                        </button>
                      </div>
                      <div className="text-[9.5px] text-slate-400 italic mt-0.5">
                        * Sandi saat ini: <span className="font-mono font-bold select-all text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{editingStudent.password || "(tidak dapat terbaca/bawaan)"}</span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-end space-x-2 pt-2">
                      <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 border rounded-lg hover:bg-slate-100">Batalkan</button>
                      <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-950 font-black">Simpan Perubahan</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB: ROMBONGAN BELAJAR (Cohort) ======================= */}
          {adminTab === "rombongan" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-900 to-teal-950 p-6 rounded-2xl text-teal-100 text-left border border-teal-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <h4 className="font-extrabold text-xs text-white uppercase tracking-wider mb-1">Daftar Rombongan Belajar & Jadwal Santri</h4>
                  <p className="text-3xs text-slate-300 leading-normal">
                    Rombongan Belajar (pembagian kelompok santri per ustadz/ustadzah) beserta jadwal bimbingan rutin masing-masing santri yang dialokasikan merata secara otomatis atau ditentukan mandiri oleh admin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerRebalance}
                  disabled={isRebalancing}
                  className="px-4 py-2.5 bg-white text-teal-950 font-black text-3xs uppercase tracking-wide rounded-xl shadow hover:bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shrink-0 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-teal-800 ${isRebalancing ? "animate-spin" : ""}`} />
                  <span>{isRebalancing ? "Alokasi..." : "Sirkulasi & Distribusi Guru"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {ustadzListState.map((ust) => {
                  const assignedStudents = students.filter(s => {
                    if (s.role !== "Siswa") return false;
                    if (!s.selectedUstadz) return false;
                    return s.selectedUstadz.toLowerCase().includes(ust.name.toLowerCase()) || 
                           ust.name.toLowerCase().includes(s.selectedUstadz.toLowerCase());
                  });

                  return (
                    <div key={ust.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col space-y-3 shadow-inner">
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200">
                        <div className="w-9 h-9 rounded-full bg-teal-900 border border-teal-800 overflow-hidden flex items-center justify-center shrink-0">
                          {ust.photoUrl ? (
                            <img src={ust.photoUrl} alt={ust.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-white font-black text-xxs">{ust.initials}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">{ust.name}</h4>
                          <span className="text-[9px] text-[#2c3e50] bg-teal-100/50 px-1.5 py-0.5 rounded font-black">
                            {assignedStudents.length} Santri Bimbingan
                          </span>
                        </div>
                      </div>

                      {/* NAMA-NAMA SISWA BERIKUT DENGAN WAKTU BELAJARNYA (Requirement 3) */}
                      <div className="space-y-2 mt-1">
                        {assignedStudents.length === 0 ? (
                          <p className="text-3xs text-slate-400 italic font-mono py-1">Belum memiliki santri bimbingan.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {assignedStudents.map((stud, sIdx) => (
                              <div key={stud.id} className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between text-[11px] shadow-sm">
                                <div className="flex items-center space-x-2.5">
                                  <span className="font-mono text-3xs font-black text-slate-400">{sIdx + 1}.</span>
                                  <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 overflow-hidden flex items-center justify-center shrink-0">
                                    {stud.photoUrl ? (
                                      <img src={stud.photoUrl} alt={stud.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="text-teal-800 text-[9px] font-black">{stud.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="font-extrabold text-slate-800 leading-none">{stud.name}</span>
                                      {stud.manualUstadzAssignment ? (
                                        <span className="text-[7.5px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.2 rounded-md" title="Memprioritaskan penugasan manual admin">MANUAL</span>
                                      ) : (
                                        <span className="text-[7.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.2 rounded-md" title="Distribusi seimbang otomatis sistem">AUTO</span>
                                      )}
                                    </div>
                                    <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5">@{stud.username} • {(stud.package || "LEVEL 1").replace("_", " ")}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-black text-rose-800 bg-red-50 border border-rose-100 px-2 py-0.5 rounded-md flex items-center space-x-1 font-mono">
                                    <Clock className="w-2.5 h-2.5 text-rose-600 mr-1 inline" />
                                    <span>{stud.studyTime || "Belum Diatur"}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* UNASSIGNED STUDENTS COHORT */}
                {(() => {
                  const unassigned = students.filter(s => {
                    if (s.role !== "Siswa") return false;
                    return !s.selectedUstadz || !ustadzListState.some(ust => s.selectedUstadz.toLowerCase().includes(ust.name.toLowerCase()) || ust.name.toLowerCase().includes(s.selectedUstadz.toLowerCase()));
                  });

                  if (unassigned.length === 0) return null;

                  return (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col space-y-3 shadow-inner">
                      <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200">
                        <span className="w-8 h-8 bg-slate-400 text-white rounded-lg flex items-center justify-center font-black text-xxs shrink-0">
                          -
                        </span>
                        <div>
                          <h4 className="font-black text-xs text-slate-800 uppercase tracking-tight">Santri Belum Memilih Ustadz</h4>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black">
                            {unassigned.length} Santri Mandiri
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mt-1">
                        {unassigned.map((stud, sIdx) => (
                          <div key={stud.id} className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between text-[11px] shadow-sm">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono text-3xs font-black text-slate-400">{sIdx + 1}.</span>
                              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {stud.photoUrl ? (
                                  <img src={stud.photoUrl} alt={stud.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-slate-500 text-[9px] font-black">{stud.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-800 leading-none">{stud.name}</span>
                                <span className="text-[8.5px] text-slate-400 font-mono block mt-0.5">@{stud.username}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-bold bg-[#f1f3f5] text-slate-600 px-2 py-0.5 rounded-md">
                              {stud.studyTime || "Mandiri / Belum Diatur"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ======================= TAB 2: KELOLA GURU (USTADZ) ======================= */}
          {adminTab === "ustadz" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LIST READ-ONLY & SELECT */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-2xs font-extrabold uppercase text-slate-400 block tracking-widest pb-1 border-b">Klik Edit Untuk Memulai</span>
                
                <div className="grid grid-cols-1 gap-4">
                  {ustadzListState.map((ust) => (
                    <div key={ust.id} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: General ustadz profile, academic degree, bio */}
                      <div className="flex-1 space-y-3.5">
                        <div className="flex items-start space-x-3.5">
                          <div className="w-12 h-12 rounded-full bg-teal-900 overflow-hidden flex items-center justify-center shrink-0 border-2 border-teal-800 shadow-sm">
                            {ust.photoUrl ? (
                              <img src={ust.photoUrl} alt={ust.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-white font-extrabold text-[13px]">{ust.initials || "U"}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-extrabold text-xs text-slate-800">{ust.name}</h4>
                              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tight">{ust.initials}</span>
                            </div>
                            <p className="text-[10px] font-black text-teal-800 mt-0.5">{ust.specialization}</p>
                            <p className="text-[10px] text-slate-500 font-mono select-all mt-1">📧 {ust.email || "belum_ada@domain.com"}</p>
                          </div>
                        </div>

                        {/* Middle: Rigorous Demographic & Academic Validation Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10.5px]">
                          <div>
                            <span className="text-[9px] text-[#2c3e50] uppercase tracking-wider block font-bold mb-0.5">Kependudukan (NIK & Domisili)</span>
                            <div className="font-semibold text-slate-700 space-y-0.5">
                              <div>NIK: <span className="font-mono text-slate-600 font-bold select-all">{ust.nik || "-"}</span></div>
                              <div>Domisili: <span className="text-slate-600 font-bold">{ust.province || "-"}, {ust.country || "-"}</span></div>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#2c3e50] uppercase tracking-wider block font-bold mb-0.5">Kualifikasi Akademik</span>
                            <div className="font-semibold text-slate-700 space-y-0.5">
                              <div>Gelar: <span className="text-slate-600 font-bold">{ust.degree || "-"}</span></div>
                              <div>Universitas: <span className="text-slate-600 font-bold">{ust.university || "-"}</span></div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Tags: Teaching competencies assessment checklist tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[9px] font-bold text-slate-400 mr-1">Keahlian:</span>
                          
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold ${ust.qualificationTahsin ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50/70 text-rose-800 border border-rose-100"}`}>
                            {ust.qualificationTahsin ? "✓" : "✗"} Tahsin
                          </span>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold ${ust.qualificationTajwid ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50/70 text-rose-800 border border-rose-100"}`}>
                            {ust.qualificationTajwid ? "✓" : "✗"} Tajwid
                          </span>

                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold ${ust.qualificationFiqih ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50/70 text-rose-800 border border-rose-100"}`}>
                            {ust.qualificationFiqih ? "✓" : "✗"} Fiqih
                          </span>

                          {/* Certificate attachment check */}
                          {ust.certificateData && (
                            <button
                              type="button"
                              onClick={() => downloadUstadzCertificate(ust)}
                              className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-black text-sky-700 bg-sky-50 border border-sky-200 shadow-xs hover:bg-sky-600 hover:text-white transition"
                              title={`Klik untuk mengunduh: ${ust.certificateName || "Syahadah"}`}
                            >
                              📎 Syahadah / Ijazah
                            </button>
                          )}
                        </div>

                        <p className="text-3xs text-slate-400 italic max-w-xl font-semibold leading-relaxed">"{ust.desc}"</p>
                      </div>

                      {/* Right: Actions (Edit info / Delete teacher out) */}
                      <div className="flex md:flex-col items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                        <button 
                          type="button"
                          onClick={() => handleEditUstadzSelect(ust)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center space-x-1 border border-transparent hover:border-indigo-100 text-3xs font-extrabold"
                          title="Edit Info Ustadz"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="md:hidden">Ubah Info</span>
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleDeleteUstadz(ust)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center space-x-1 border border-transparent hover:border-rose-100 text-3xs font-extrabold"
                          title="Hapus / Keluarkan Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="md:hidden">Hapus Guru</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* USTADZ EDIT FORM */}
              {editingUstadz ? (
                <form onSubmit={handleUpdateUstadzSubmit} className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200 text-xxs font-bold space-y-3.5 h-fit">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-[10px] uppercase font-black tracking-widest text-teal-950">Nama & Spec Edit</span>
                    <button type="button" onClick={() => setEditingUstadz(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4.5 h-4.5" /></button>
                  </div>

                  <div>
                    <label className="block text-3xs uppercase text-slate-500 mb-1">Nama Ustadz / Ustadzah</label>
                    <input 
                      type="text"
                      value={editUName}
                      onChange={(e) => setEditUName(e.target.value)}
                      required
                      className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs uppercase text-slate-500 mb-1">Singkatan / Initials</label>
                    <input 
                      type="text"
                      value={editUInit}
                      onChange={(e) => setEditUInit(e.target.value)}
                      required
                      maxLength={4}
                      className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 font-mono tracking-widest text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs uppercase text-slate-500 mb-1">Keahlian Kajian</label>
                    <input 
                      type="text"
                      value={editUSpec}
                      onChange={(e) => setEditUSpec(e.target.value)}
                      required
                      className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs uppercase text-slate-500 mb-1">Deskripsi Tambahan</label>
                    <textarea 
                      rows={5}
                      value={editUDesc}
                      onChange={(e) => setEditUDesc(e.target.value)}
                      required
                      className="w-full bg-white p-2.5 border border-slate-200 rounded-lg resize-none focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xs uppercase tracking-widest text-[#2c3e50] font-black flex items-center gap-1">
                        <span>🔑</span> Kata Sandi / Password Guru
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                          let gPassword = "";
                          for (let i = 0; i < 8; i++) {
                            gPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setTempPasswordUstadz(gPassword);
                        }}
                        className="text-[9px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 px-2.5 py-1 rounded-md border border-sky-200 transition cursor-pointer select-none"
                      >
                        🔄 Generate Sandi Acak
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Sandi baru..."
                          value={tempPasswordUstadz}
                          onChange={(e) => setTempPasswordUstadz(e.target.value)}
                          className="w-full bg-white p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono text-xs text-slate-800"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!tempPasswordUstadz.trim() || tempPasswordUstadz === "Memuat sandi...") {
                            pushToast("Mohon masukkan password atau klik generate.", "error");
                            return;
                          }
                          if (!editingUstadz) return;
                          
                          if (confirm(`Ganti kata sandi guru ${editingUstadz.name} menjadi: "${tempPasswordUstadz}"?`)) {
                            try {
                              const res = await fetch("/api/admin/users/reset-password", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ username: editingUstadz.id, newPassword: tempPasswordUstadz })
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                pushToast(`Sandi untuk guru ${editingUstadz.name} berhasil diperbarui di cloud database!`, "success");
                              } else {
                                pushToast(data.error || "Gagal memperbarui kata sandi.", "error");
                              }
                            } catch {
                              pushToast("Gangguan jaringan/server bimbingan.", "error");
                            }
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap"
                      >
                        Simpan Sandi Guru
                      </button>
                    </div>
                    <div className="text-[9.5px] text-slate-400 italic mt-0.5">
                      * Sandi saat ini: <span className="font-mono font-bold select-all text-slate-600 bg-slate-100 px-1 py-0.5 rounded">{tempPasswordUstadz || "Belum dimuat / kosong"}</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-lg shadow-sm"
                  >
                    Simpan Perubahan Guru
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 select-none flex flex-col justify-center py-16 h-fit">
                  <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xxs font-bold">Ubah Rincian Ustadz</p>
                  <p className="text-3xs text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">Klik tombol pensil pada baris Ustadz sebelah kanan untuk mengedit data secara dinamis.</p>
                </div>
              )}

              {/* Segmented Class by selected ustadz list (Requirement 4) */}
              <div className="lg:col-span-3 mt-6 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <h4 className="text-xs font-black uppercase text-teal-900 tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span>👥 Hubungan Kelas & Pembagian Halaqah Santri (Bimbingan Ustadz)</span>
                </h4>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed font-semibold">
                  Daftar di bawah mengelompokkan siswa secara otomatis berdasarkan Ustadz Pembimbing harian yang dipilih oleh santri live di dashboard mereka.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {ustadzListState.map((ust) => {
                    const enrolled = students.filter(s => s.selectedUstadz === ust.name);
                    return (
                      <div key={ust.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 pb-2 mb-2.5 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-teal-950 overflow-hidden flex items-center justify-center shrink-0 border border-teal-800">
                              {ust.photoUrl ? (
                                <img src={ust.photoUrl} alt={ust.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-white font-black text-[10px]">{ust.initials}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="text-[11px] font-black text-slate-800 leading-none">{ust.name}</h5>
                              <span className="text-[9px] text-teal-700 italic font-bold block mt-1">{ust.specialization}</span>
                            </div>
                          </div>
                          <span className="text-[8.5px] shrink-0 bg-emerald-500/10 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                            {enrolled.length} Santri
                          </span>
                        </div>

                        {enrolled.length === 0 ? (
                          <p className="text-[9.5px] text-slate-400 italic font-semibold">Belum ada siswa di kelas bimbingan ini.</p>
                        ) : (
                          <ul className="text-[10px] space-y-1.5 font-sans font-semibold">
                            {enrolled.map((std, stIdx) => (
                              <li key={std.username} className="flex justify-between items-center text-slate-700 bg-slate-50/70 p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-400 text-3xs">{stIdx + 1}.</span>
                                  <div className="w-5 h-5 rounded-full bg-teal-100 overflow-hidden flex items-center justify-center shrink-0 border border-teal-200">
                                    {std.photoUrl ? (
                                      <img src={std.photoUrl} alt={std.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="text-teal-800 text-[8px] font-black">{std.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-800">{std.name}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  {std.manualUstadzAssignment ? (
                                    <span className="text-[7px] font-black text-indigo-700 bg-indigo-50 px-1 rounded" title="Memprioritaskan penugasan manual admin">MANUAL</span>
                                  ) : (
                                    <span className="text-[7px] font-black text-emerald-700 bg-emerald-50 px-1 rounded" title="Distribusi seimbang otomatis sistem">AUTO</span>
                                  )}
                                  <span className="text-[8px] font-mono text-slate-400">@{std.username}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ======================= TAB 4: VERIFIKASI PEMBELIAN MATERI PREMIUM ======================= */}
          {adminTab === "purchases" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                <span className="text-xxs font-mono text-slate-400">Arsip Pendaftaran: {materialPurchases.length} Pembelian</span>
                <button onClick={fetchMaterialPurchases} className="p-1 px-3 text-3xs font-bold text-teal-950 hover:bg-teal-900 hover:text-white border border-teal-900/30 rounded-lg flex items-center space-x-1">
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Segarkan Transaksi</span>
                </button>
              </div>

              {materialPurchases.length === 0 ? (
                <div className="bg-slate-50/50 rounded-2xl p-16 text-center border text-slate-400 text-xxs font-semibold">
                  Alhamdulillah, belum ada pengajuan transaksi pembelian materi premium yang masuk atau tertunda.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xxs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-3xs font-extrabold tracking-wider border-b border-slate-100">
                        <th className="py-3 px-4">Siswa</th>
                        <th className="py-3 px-4">Silabus / Materi</th>
                        <th className="py-3 px-4 text-center">Harga</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Bukti TF</th>
                        <th className="py-3 px-4 text-center">Aksi Keputusan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {materialPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-slate-50/40">
                          <td className="py-3 px-4">
                            <span className="text-slate-900 font-bold block text-[11px]">{purchase.studentName}</span>
                            <span className="font-mono text-slate-400 text-[9px]">@{purchase.username}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {purchase.materialTitle}
                          </td>
                          <td className="py-3 px-4 text-center text-teal-800 font-extrabold font-mono">
                            Rp {parseInt(purchase.price).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                              purchase.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                              purchase.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800 animate-pulse"
                            }`}>
                              {purchase.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {purchase.paymentReceipt ? (
                              <a 
                                href={purchase.paymentReceipt}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline font-extrabold text-[9px] flex items-center space-x-1"
                              >
                                <span>Lihat Bukti Foto</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Tanpa bukti</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center items-center space-x-1">
                              <button 
                                type="button"
                                disabled={purchase.status !== "PENDING"}
                                onClick={async () => {
                                  if (confirm(`Setujui transaksi siswa ${purchase.studentName} untuk materi ${purchase.materialTitle}? Akses materi akan segera ditawarkan.`)) {
                                    try {
                                      const res = await fetch("/api/admin/material-purchases/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ purchaseId: purchase.id, status: "VERIFIED" })
                                      });
                                      if (res.ok) {
                                        pushToast("Pembelian premium terverifikasi dengan sukses!", "success");
                                        await fetchMaterialPurchases();
                                        await fetchStudents();
                                      }
                                    } catch {
                                      pushToast("Masalah sinkronisasi.", "error");
                                    }
                                  }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-white text-[9.5px] px-2.5 py-1 rounded transition font-bold"
                              >
                                Terima
                              </button>
                              <button 
                                type="button"
                                disabled={purchase.status !== "PENDING"}
                                onClick={async () => {
                                  if (confirm(`Tolak transaksi tersebut?`)) {
                                    try {
                                      const res = await fetch("/api/admin/material-purchases/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ purchaseId: purchase.id, status: "REJECTED" })
                                      });
                                      if (res.ok) {
                                        pushToast("Transaksi pembelian materi ditolak.", "info");
                                        await fetchMaterialPurchases();
                                      }
                                    } catch {
                                      pushToast("Masalah hubungan server.", "error");
                                    }
                                  }
                                }}
                                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white text-[9.5px] px-2.5 py-1 rounded transition font-bold"
                              >
                                Tolak
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB 3: UNGGAH MATERI ======================= */}
          {adminTab === "materials" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* MATERIAL UPLOAD FORM */}
              <form onSubmit={handleUploadMaterialSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-250/60 text-xxs font-bold space-y-4 h-fit">
                <span className="text-[10px] uppercase font-black tracking-wider text-teal-950 pb-2 border-b block mb-2">Upload Syllabus Baru</span>

                <div>
                  <label className="block text-3xs uppercase text-slate-500 mb-1">Judul Syllabus</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Pengantar Ilmu Tajwid Al-Fatihah"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                    className="w-full bg-white p-2.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-3xs uppercase text-slate-500 mb-1">Deskripsi Tambahan</label>
                  <textarea 
                    rows={3}
                    placeholder="Masukkan ringkasan materi, intisari bimbingan..."
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    className="w-full bg-white p-2.5 border border-slate-200 rounded-lg resize-none"
                  />
                </div>

                <div>
                  <label className="block text-3xs uppercase text-slate-500 mb-1">Tipe File Materi</label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="upload_type" 
                        checked={uploadType === "pdf"}
                        onChange={() => setUploadType("pdf")}
                        className="text-teal-700 focus:ring-teal-500 h-4 border-slate-300"
                      />
                      <span>PDF Document</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="upload_type" 
                        checked={uploadType === "jpg"}
                        onChange={() => setUploadType("jpg")}
                        className="text-teal-700 focus:ring-teal-500 h-4 border-slate-300"
                      />
                      <span>JPG Infographic</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-3xs uppercase text-slate-500 mb-1">Pilih File (Batas 15MB)</label>
                  <div className="relative border border-dashed border-slate-300 h-28 rounded-lg hover:bg-slate-50 transition p-3 text-center flex flex-col justify-center items-center cursor-pointer">
                    <input 
                      type="file" 
                      accept={uploadType === "pdf" ? "application/pdf" : "image/*"}
                      onChange={handleMaterialFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                    <span className="text-[10px] text-slate-700 block truncate max-w-[200px]">
                      {uploadFileName ? uploadFileName : "Klik untuk pilih file"}
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-lg shadow-sm flex items-center justify-center space-x-1"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengupload ke Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Terbitkan Materi</span>
                    </>
                  )}
                </button>
              </form>

              {/* MATERIALS MANAGE TABLE */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block pb-1 border-b">Arsip Terbitan</span>
                
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-xxs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase text-3xs font-black tracking-wider border-b">
                        <th className="py-2.5 px-4">Judul / Syllabus</th>
                        <th className="py-2.5 px-4 font-mono">File Name</th>
                        <th className="py-2.5 px-4 text-center">Tipe</th>
                        <th className="py-2.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold text-slate-755">
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400 select-none">Arsip kosong.</td>
                        </tr>
                      ) : (
                        materials.map((mat) => (
                          <tr key={mat.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="text-slate-800 font-bold">{mat.title}</div>
                              <div className="text-slate-400 text-3xs mt-0.5">{mat.description || "Tanpa deskripsi."}</div>
                            </td>
                            <td className="py-3 px-4 select-all font-mono text-[9px] text-slate-500 truncate max-w-[120px]">
                              {mat.fileName}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2 rounded font-mono font-black text-3xs uppercase ${mat.type === "pdf" ? "bg-red-50 text-red-700" : "bg-sky-50 text-sky-700"}`}>
                                {mat.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button 
                                  type="button"
                                  onClick={() => setPreviewMaterial(mat)}
                                  className="p-1 px-1.5 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-teal-800 rounded transition"
                                  title="Lihat / Review File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                                  className="p-1 px-1.5 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ===================== SUB TAB: BAGIKAN LINK UMUM & TEMPLATE WHATSAPP ===================== */}
          {adminTab === "share" && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 p-6 rounded-3xl">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-3xl">🌐</span>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Akses Publik Tanpa Batas Sandbox</h4>
                    <p className="text-[10px] text-teal-800 mt-0.5 leading-snug font-semibold">
                      Tautan/link bimbingan di bawah ini terhubung langsung secara online ke Cloud Run. Semua siswa, orang tua/wali santri, maupun ustadz pendamping dapat langsung membuka di browser umum HP maupun Laptop tanpa butuh masuk ke menu edit Google AI Studio.
                    </p>
                  </div>
                </div>

                <div className="mt-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-sky-800 uppercase tracking-widest block mb-2">Tautan Publik Kelas Mengaji.ID Anda</span>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={window.location.origin} 
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl font-mono text-[11px] font-bold text-teal-950 select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(window.location.origin);
                          pushToast("Bagikan untuk membuka dashboard mu secara langsung lewat media sosial kamu; WhatsApp, IG, dst.", "success");
                        } catch (e) {
                          pushToast("Gagal menyalin otomatis.", "error");
                        }
                      }}
                      className="bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 active:scale-95 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Salin Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(window.location.origin, "_blank");
                      }}
                      className="bg-teal-950 hover:bg-black text-white px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center active:scale-95 shrink-0"
                      title="Uji Coba Buka Link Baru"
                    >
                      Uji Coba 🚀
                    </button>
                  </div>
                </div>
              </div>

              {/* WHATSAPP INVITATION MESSAGE TEMPLATE DISSEMINATOR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TEMPLATE A: FORMAT BAGI SISWA MANDIRI */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                    <span className="text-xl">👤</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Format WhatsApp Siswa / Umum</h4>
                      <p className="text-[9px] text-slate-400">Pesan langsung sapaan hangat kepada calon santri belajar mengaji</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[9px] text-slate-600 whitespace-pre-line leading-relaxed h-48 overflow-y-auto select-all text-left">
                    {`Assalamualaikum wr. wb.,

Yuk tingkatkan kelancaran bacaan Al-Qur'an dan makhraj tajwid kita melalui Kelas Bimbingan Mengaji.ID secara online! 🕋

Layanan kami:
• Koreksi Tartil Tajwid Online interaktif
• Tanya Jawab Hukum Islam & Konsultasi privat bersama Ustadz pilihan
• Buku Mushaf Al-Qur'an Digital 30 Juz gratis

Buka link belajar di bawah ini lewat Google Chrome di HP atau Laptop Anda:
${window.location.origin}

Mari mendaftar sebagai Siswa Baru sekarang secara langsung, praktis tanpa batas Sandbox!`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Assalamualaikum wr. wb.,

Yuk tingkatkan kelancaran bacaan Al-Qur'an dan makhraj tajwid kita melalui Kelas Bimbingan Mengaji.ID secara online! 🕋

Layanan kami:
• Koreksi Tartil Tajwid Online interaktif
• Tanya Jawab Hukum Islam & Konsultasi privat bersama Ustadz pilihan
• Buku Mushaf Al-Qur'an Digital 30 Juz gratis

Buka link belajar di bawah ini lewat Google Chrome di HP atau Laptop Anda:
${window.location.origin}

Mari mendaftar sebagai Siswa Baru sekarang secara langsung, praktis tanpa batas Sandbox!`;
                      try {
                        navigator.clipboard.writeText(text);
                        pushToast("Format WA Siswa berhasil disalin!", "success");
                      } catch (e) {
                        pushToast("Gagal menyalin teks WA otomatis.", "error");
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 active:scale-95 border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan WA Siswa</span>
                  </button>
                </div>

                {/* TEMPLATE B: FORMAT KELOMPOK PEMBELAJARAN / WALI SANTRI */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col space-y-3 shadow-sm">
                  <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
                    <span className="text-xl">👥</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Format WhatsApp Orang Tua / Wali</h4>
                      <p className="text-[9px] text-slate-400">Pesan bimbingan luhur untuk wali murid/anak-anak</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[9px] text-slate-650 whitespace-pre-line leading-relaxed h-48 overflow-y-auto select-all text-left">
                    {`Assalamualaikum wr. wb. Ayah/Bunda yang dirahmati Allah,

Telah dibuka pendaftaran bimbingan mengaji online Mengaji.ID untuk putra-putri tercinta. Program terstruktur dengan pemantauan khusus ustadz untuk menghasilkan lisan tajwid yang fasih. 🌸

Ayah/Bunda dapat mendaftarkan sang buah hati langsung di browser HP/PC umum secara praktis melalui link di bawah ini:
${window.location.origin}

Dapatkan bimbingan harian interaktif dan mushaf digital lengkap secara berkala. Terima kasih atas dukungan mulia membendung hidayah Qurani sejak dini.`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Assalamualaikum wr. wb. Ayah/Bunda yang dirahmati Allah,

Telah dibuka pendaftaran bimbingan mengaji online Mengaji.ID untuk putra-putri tercinta. Program terstruktur dengan pemantauan khusus ustadz untuk menghasilkan lisan tajwid yang fasih. 🌸

Ayah/Bunda dapat mendaftarkan sang buah hati langsung di browser HP/PC umum secara praktis melalui link di bawah ini:
${window.location.origin}

Dapatkan bimbingan harian interaktif dan mushaf digital lengkap secara berkala. Terima kasih atas dukungan mulia membendung hidayah Qurani sejak dini.`;
                      try {
                        navigator.clipboard.writeText(text);
                        pushToast("Format WA Orang Tua berhasil disalin!", "success");
                      } catch (e) {
                        pushToast("Gagal menyalin teks WA otomatis.", "error");
                      }
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 active:scale-95 border border-slate-200"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan WA Orang Tua</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ADMIN PREVIEW MATERIAL MODAL */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setPreviewMaterial(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 transition-colors z-20"
            >
              <span className="text-xs font-bold mr-1 bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">Tutup (ESC)</span>
            </button>

            <div className="pb-3 border-b border-slate-100 mb-4 pr-16 text-left shrink-0">
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* USTADZ DELETE CONFIRM MODAL */}
      {ustadzToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl relative text-left">
            <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Konfirmasi Hapus Guru</span>
            </h3>
            <p className="text-3xs text-slate-500 font-bold mt-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus guru <span className="text-slate-800 font-extrabold uppercase">"{ustadzToDelete.name}"</span>? 
              Tindakan ini akan mengeluarkan mereka dari sistem dan menonaktifkan akun login mereka secara permanen.
            </p>
            <div className="flex items-center justify-end space-x-2.5 mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => setUstadzToDelete(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-[10px] transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeDeleteUstadz(ustadzToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-[10px] shadow-sm transition flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Keluarkan Guru</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
