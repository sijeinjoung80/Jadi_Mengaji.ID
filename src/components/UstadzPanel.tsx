import { useState, useEffect, useRef } from "react";
import { 
  Users, CheckCircle2, Video, PhoneOff, RefreshCw, 
  VideoOff, Volume2, Award, ShieldCheck, Clock, Check,
  Send, ZoomIn, ZoomOut, RotateCcw, MessageSquare, BookOpen,
  ChevronRight, Sparkles, Layers, Info
} from "lucide-react";
import { User, Ustadz } from "../types";
import { ustadzList } from "../data";

interface UstadzPanelProps {
  currentUser: User;
  onStudentUpdated: () => void;
  pushToast: (msg: string, type: "success" | "error" | "info") => void;
}

// Same syllabus chapters shared with teacher for real-time guidance sync
const syllabusData: Record<string, { title: string; desc: string; chapters: { title: string; subtitle: string; arabic?: string; translation?: string; makhrajNotes: string[] }[] }> = {
  iqra: {
    title: "Silabus Belajar IQRA (Paket Dasar)",
    desc: "Sangat cocok untuk belajar pelafalan makhraj huruf Hijaiyah, harakat tunggal dasar, serta makhrijul huruf.",
    chapters: [
      {
        title: "Pertemuan 1: Konsisten Makhraj Halq (Tenggorokan)",
        subtitle: "Membedakan ketebalan & gesekan nafas huruf Alif (أ), Ha (ح), Kha (kh), dan 'Ain (ع)",
        arabic: "اَ   -   حَ   -   خَ   -   عَ",
        translation: "A - Ha (bersih) - Kha (parau) - 'A (tengah)",
        makhrajNotes: [
          "Hamzah/Alif: Keluar dari tenggorokan paling bawah (pangkal tenggorokan). Suara tipis murni.",
          "Ha (ح): Berasal dari tenggorokan bagian tengah. Nafas harus mengalir deras, bersih, dan berasa segar.",
          "Kha (خ): Berasal dari tenggorokan bagian atas. Terdapat sedikit getaran kasar yang lembut."
        ]
      },
      {
        title: "Pertemuan 2: Makhraj Syafataian (Dua Bibir)",
        subtitle: "Melatih bibir atas-bawah untuk huruf Ba (ب), Mim (م), Wawu (و), dan Gigi ke bibir untuk Fa (ف)",
        arabic: "بَ   -   مَ   -   وَ   -   فَ",
        translation: "Ba - Ma - Wa - Fa",
        makhrajNotes: [
          "Ba (ب): Merapatkan bibir atas-bawah secara rapat dan kuat, bersiap memantul (Qalqalah).",
          "Mim (م): Merapatkan bibir atas-bawah secara ringan disertai aliran dengung di hidung.",
          "Wawu (و): Memoncongkan bibir bulat ke depan secara total dengan rongga udara kecil di pusat."
        ]
      },
      {
        title: "Pertemuan 3: Ketukan Harakat Tunggal Pendek",
        subtitle: "Membiasakan tempo pendek tepat 1 ketukan tanpa menyeret harakat",
        arabic: "كَتَبَ  -  خَلَقَ  -  ذَهَبَ",
        translation: "Kataba - Kholaqo - Dzahaba",
        makhrajNotes: [
          "Fathah: Membuka mulut secukupnya secara tegak lurus melafalkan vokal 'a'.",
          "Hindari memperpanjang harakat fat-hah di akhir kata menjadi nada panjang."
        ]
      }
    ]
  },
  tahsin: {
    title: "Silabus TAHSIN Tajwid (Paket Menengah)",
    desc: "Mempelajari hukum pemanjangan suara (Mad Thabi'i) dan ragam ghunnah dengung nun/mim sukun.",
    chapters: [
      {
        title: "Pertemuan 1: Aturan Mad Ashli / Mad Thabi'i",
        subtitle: "Menyeimbangkan pemanjangan sepanjang 2 harakat (ketukan) secara konsisten",
        arabic: "قَالَ  -  يَقُوْلُ  -  قِيْلَ",
        translation: "Qoola (2h) - Yaquulu (2h) - Qiila (2h)",
        makhrajNotes: [
          "Mad Thabi'i terbentuk saat fathah diikuti Alif, dhammah diikuti Wawu sukun, atau kasrah diikuti Ya sukun.",
          "Panjang tepat 2 harakat (setara 1 detik lambat). Jangan menyeretnya menjadi 3 harakat.",
          "Halaqah akan melatih kebiasaan menyetop vocal tepat waktu."
        ]
      },
      {
        title: "Pertemuan 2: Mekanisme Ghunnah (Nun & Mim Mati)",
        subtitle: "Penyempurnaan Iklab, Idgham Bighunnah, dan Ikhfa Haqiqi",
        arabic: "مِنْ بَعْدِ  -  مَنْ يَقُولُ  -  عَنْ صَلَاتِهِمْ",
        translation: "Mim-ba'di (Iqlab) - May-yaquulu (Idgham) - 'An-sholaatihim (Ikhfa)",
        makhrajNotes: [
          "Ghunnah harus tertahan murni di pangkal hidung (Khaisyum) selama 2 sampai 3 ketukan dengung.",
          "Ikhfa menyamarkan nun mati ke makhraj huruf di hadapannya disertai dengung tebal/tipis sesuai hurufnya.",
          "Diskusikan bentuk bibir saat merapatkan Iqlab bersama Ustadz."
        ]
      }
    ]
  },
  tafsir: {
    title: "Silabus TAFSIR Al-Quran (Paket Lanjutan / Tafsir)",
    desc: "Kajian terstruktur ayat-ayat utama pembuka Al-Quran serta relevansinya dengan perilaku akhlak harian.",
    chapters: [
      {
        title: "Kajian Tafsir Surah Al-Fatihah Ayat 1-4",
        subtitle: "Menelaah nama agung Allah, Ar-Rahman dan Kasih Sayang Universal",
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ◎ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        translation: "Dengan nama Allah Yang Maha Pengasih Maha Penyayang. Segala puji bagi Allah, Tuhan seluruh alam.",
        makhrajNotes: [
          "Rabb: Bermakna Al-Khaliq (Pencipta), Al-Malik (Pemilik mutlak) dan Al-Mudabbir (Pengatur urusan alam).",
          "Keseimbangan rahmat dan hari pembalasan mendisiplinkan mental muslim untuk hidup di antara rasa harap (raja') dan cemas (khauf).",
          "Amalan Praktis: Memulai setiap langkah kebaikan dengan Bismillah mengundang barakah abadi."
        ]
      }
    ]
  }
};

export default function UstadzPanel({ currentUser, onStudentUpdated, pushToast }: UstadzPanelProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<User[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // Teaching Slot Availability States
  const [myAvailableSlots, setMyAvailableSlots] = useState<string[]>([]);
  const [customSlotInput, setCustomSlotInput] = useState<string>("");
  const [isSavingAvailability, setIsSavingAvailability] = useState<boolean>(false);

  // Load ustadz custom slots
  const fetchUstadzAvailability = async () => {
    try {
      const res = await fetch("/api/ustadz");
      if (res.ok) {
        const data = await res.json();
        if (data.ustadz) {
          const me = data.ustadz.find((u: any) => 
            (u.id || "").toLowerCase() === (currentUser.username || "").toLowerCase() ||
            (u.name || "").toLowerCase() === (currentUser.name || "").toLowerCase()
          );
          if (me && me.availableSlots && Array.isArray(me.availableSlots)) {
            setMyAvailableSlots(me.availableSlots);
          } else {
            // Default pre-populated list
            setMyAvailableSlots(["Pagi (08:00 - 10:00)", "Siang (13:00 - 15:00)", "Sore (16:00 - 18:00)", "Malam (19:30 - 21:00)"]);
          }
        }
      }
    } catch (e) {
      console.warn("Gagal mengambil ketersediaan guru:", e);
    }
  };

  useEffect(() => {
    fetchUstadzAvailability();
  }, [currentUser?.username]);

  const handleToggleSlot = (slot: string) => {
    setMyAvailableSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      } else {
        return [...prev, slot];
      }
    });
  };

  const handleAddCustomSlot = () => {
    if (!customSlotInput.trim()) return;
    const txt = customSlotInput.trim();
    if (myAvailableSlots.includes(txt)) {
      pushToast("Slot waktu tersebut sudah ada.", "info");
      return;
    }
    setMyAvailableSlots((prev) => [...prev, txt]);
    setCustomSlotInput("");
    pushToast(`Sukses menambah jam custom: "${txt}"`, "success");
  };

  const handleSaveAvailability = async () => {
    setIsSavingAvailability(true);
    try {
      const uId = (currentUser.username || "").toLowerCase();
      const res = await fetch("/api/ustadz/update-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ustadzId: uId, availableSlots: myAvailableSlots })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast("Sukses! Ketersediaan waktu mengajar Anda telah diatur dan disimpan. Sekarang siswa bimbingan Anda hanya dapat memilih di antara jam slot ini.", "success");
        onStudentUpdated();
      } else {
        pushToast(data.error || "Gagal menyimpan ketersediaan waktu.", "error");
      }
    } catch {
      pushToast("Gangguan koneksi ke server.", "error");
    } finally {
      setIsSavingAvailability(false);
    }
  };
  
  // Camera streams
  const [ustadzCamActive, setUstadzCamActive] = useState<boolean>(false);
  const [ustadzMicActive, setUstadzMicActive] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Enhancements for Teacher Live Class
  const [studentZoom, setStudentZoom] = useState<number>(1.0);
  const [ustadzZoom, setUstadzZoom] = useState<number>(1.0);
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "materi">("chat");
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<string>("iqra");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);

  // Fetch student listings
  const fetchData = async () => {
    try {
      const resStudents = await fetch("/api/admin/students");
      const studentsData = await resStudents.json();
      
      const resSessions = await fetch("/api/active-sessions");
      const sessionsData = await resSessions.json();

      if (resStudents.ok && studentsData.students) {
        setStudents(studentsData.students);
      }
      if (resSessions.ok && sessionsData.sessions) {
        setActiveSessions(sessionsData.sessions);
      }
    } catch (e) {
      console.error("Gagal melakukan penarikan data ustadz panel", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll chat messages for active bimbingan
  const loadRoomMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setRoomMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn("Gagal sinkron chat guru:", err);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      loadRoomMessages();
      const interval = setInterval(loadRoomMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession?.studentUsername]);

  // Auto-scroll chat internally to bottom without moving the browser window/viewport
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages, activeRightTab]);

  // Adjust zoom for teacher or student stream
  const adjustZoom = (target: "student" | "ustadz", type: "in" | "out" | "reset") => {
    if (target === "student") {
      setStudentZoom((prev) => {
        if (type === "in") return Math.min(prev + 0.25, 3.0);
        if (type === "out") return Math.max(prev - 0.25, 0.75);
        return 1.0;
      });
    } else {
      setUstadzZoom((prev) => {
        if (type === "in") return Math.min(prev + 0.25, 3.0);
        if (type === "out") return Math.max(prev - 0.25, 0.75);
        return 1.0;
      });
    }
    pushToast(`Zoom kamera ${target === "student" ? "Santri" : "Guru"} disesuaikan.`, "info");
  };

  // Filter students who have selected this Ustadz
  const myStudents = students.filter(student => {
    if (!student.selectedUstadz) return false;
    return student.selectedUstadz.toLowerCase().includes(currentUser.name.toLowerCase()) || 
           currentUser.name.toLowerCase().includes(student.selectedUstadz.toLowerCase()) ||
           student.selectedUstadz.toLowerCase().includes(currentUser.username.toLowerCase());
  });

  // Start teaching (connect webcam/mic)
  const handleStartTeaching = async (session: any) => {
    setSelectedSession(session);
    setUstadzCamActive(true);
    setStudentZoom(1.0);
    setUstadzZoom(1.0);
    setNewMsgText("");

    // Detect and select corresponding syllabus based on student package
    const matchedStud = students.find(s => s.username === session.studentUsername);
    if (matchedStud && matchedStud.package) {
      const p = matchedStud.package.toLowerCase();
      if (p.includes("basic") || p.includes("iqra")) {
        setSelectedLevel("iqra");
      } else if (p.includes("tahsin") || p.includes("tajwid")) {
        setSelectedLevel("tahsin");
      } else if (p.includes("tafsir")) {
        setSelectedLevel("tafsir");
      }
    }

    pushToast(`Menghubungkan ke Kelas Halaqah ${session.studentName}...`, "info");
    
    // Toggle active session status on server too
    try {
      await fetch("/api/active-sessions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: session.studentUsername,
          ustadzCameraActive: true,
          ustadzMicActive: true
        })
      });
    } catch (err) {
      console.error(err);
    }

    // Try starting physical camera
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        pushToast("Masukan video berhasil disimulasikan (Izin kamera ditolak/bentrok).", "info");
      }
    }, 400);
  };

  // Stop teaching / close classroom connection
  const handleStopTeaching = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (selectedSession) {
      try {
        await fetch("/api/active-sessions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: selectedSession.studentUsername,
            ustadzCameraActive: false,
            ustadzMicActive: false
          })
        });
      } catch (e) {}
    }

    setUstadzCamActive(false);
    setSelectedSession(null);
    pushToast("Koneksi bimbingan live telah diputus.", "info");
    await fetchData();
  };

  // Submit chat text message as teacher
  const handleSendTeacherChatMsg = async (e: any) => {
    e.preventDefault();
    if (!newMsgText.trim() || !selectedSession) return;

    const textToSend = newMsgText.trim();
    setNewMsgText("");

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ustadz: selectedSession.selectedUstadz || currentUser.name,
          subject: "Halaqah Live Room Chat (Ustadz)",
          sender: currentUser.name,
          senderUid: currentUser.username, // sender is ustadz username
          text: textToSend
        })
      });
      loadRoomMessages();
    } catch (err) {
      console.error("Gagal mengirim pesan sebagai ustadz:", err);
    }
  };

  // Toggle Camera trigger
  const toggleCamera = async () => {
    const newState = !ustadzCamActive;
    setUstadzCamActive(newState);
    
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = newState);
    }

    if (selectedSession) {
      try {
        await fetch("/api/active-sessions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: selectedSession.studentUsername,
            ustadzCameraActive: newState
          })
        });
      } catch (e) {}
    }
  };

  // Toggle Mic trigger
  const toggleMic = async () => {
    const newState = !ustadzMicActive;
    setUstadzMicActive(newState);
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = newState);
    }

    if (selectedSession) {
      try {
        await fetch("/api/active-sessions/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: selectedSession.studentUsername,
            ustadzMicActive: newState
          })
        });
      } catch (e) {}
    }
  };

  // Real-Time Material Sharing controls (Requirement 3)
  const handleShareMaterial = async (level: string, chapterIdx: number) => {
    if (!selectedSession) {
      pushToast("Harap hubungkan bimbingan aktif terlebih dahulu.", "error");
      return;
    }
    try {
      const res = await fetch("/api/active-sessions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedSession.studentUsername,
          sharedMaterial: level,
          sharedMaterialChapter: chapterIdx
        })
      });
      if (res.ok) {
        pushToast(`Materi bimbingan "${syllabusData[level].chapters[chapterIdx].title}" berhasil dibagikan & ditampilkan secara real-time pada layar santri!`, "success");
      } else {
        pushToast("Gagal membagikan materi.", "error");
      }
    } catch (e) {
      pushToast("Kesalahan koneksi saat membagikan materi secara real-time.", "error");
    }
  };

  const handleStopShareMaterial = async () => {
    if (!selectedSession) return;
    try {
      const res = await fetch("/api/active-sessions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedSession.studentUsername,
          sharedMaterial: "",
          sharedMaterialChapter: 0
        })
      });
      if (res.ok) {
        pushToast("Materi dihentikan penampilannya dari layar murid.", "info");
      }
    } catch (e) {}
  };

  // Selesaikan & Ambil Kuota (Deduct 1 meeting from the student)
  const handleSelesaikanKuotaSiswa = async () => {
    if (!selectedSession) return;
    
    if (!confirm(`Nyatakan bimbingan ${selectedSession.studentName} selesai? Tindakan ini akan memotong 1 sisa kuota pertemuan siswa.`)) {
      return;
    }

    try {
      const res = await fetch("/api/sessions/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedSession.studentUsername }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        pushToast(`Mabruk! Sesi bimbingan resmi tuntas. Kuota ${selectedSession.studentName} berhasil terpotong.`, "success");
        
        // Remove or stop the active session
        await fetch("/api/active-sessions/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: selectedSession.studentUsername }),
        });

        handleStopTeaching();
        onStudentUpdated();
      }
    } catch (error) {
      pushToast("Gagal melakukan penuntasan kuota.", "error");
    }
  };

  // Batalkan Sesi Ustadz
  const handleBatalkanSesiUstadz = async () => {
    if (!selectedSession) return;
    if (confirm("Batalkan sesi belajar saat ini? Progress waktu berjalan akan di-reset tanpa pengurangan kuota bimbingan santri.")) {
      try {
        await fetch("/api/active-sessions/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: selectedSession.studentUsername })
        });
        pushToast("Sesi dibatalkan berhasil disinkronkan.", "info");
        handleStopTeaching();
      } catch (err) {
        console.warn("Error stopping session", err);
      }
    }
  };

  // Filter classroom messages
  const uNameMatch = selectedSession?.selectedUstadz || currentUser.name;
  const filteredChat = roomMessages.filter((m) => {
    return m.ustadz === uNameMatch && 
           (m.senderUid === selectedSession?.studentUsername || m.senderUid === selectedSession?.username || m.senderUid === "gemini-ai" || m.senderUid === currentUser.username || m.senderUid === "anonymous");
  });

  return (
    <div id="ustadz-panel-container" className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="relative bg-gradient-to-r from-teal-500 via-indigo-600 to-pink-500 rounded-3xl p-6 text-white text-left overflow-hidden shadow-lg border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-teal-300 bg-teal-950/70 py-1 px-3 rounded-full border border-teal-800 font-mono inline-block">
              Kelas Pengajar 🕌
            </span>
            <h1 className="text-lg font-black mt-2">DOKUMEN KELAS GURU & PEMBINA</h1>
            <p className="text-xxs md:text-xs text-teal-100/80 mt-1 max-w-xl leading-relaxed">
              Selamat berdedikasi membimbing para santri di platform mengaji digital Mengaji.ID. Pantau kehadiran, lihat waktu belajar pilihan mereka, dan pimpin ruang bimbingan tatap muka dua arah.
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0 text-center">
            <h4 className="font-mono text-xl font-black text-amber-400">{myStudents.length}</h4>
            <span className="text-[9px] font-bold text-slate-300 block uppercase mt-0.5">Siswa Bimbingan</span>
          </div>
        </div>
        <span className="absolute right-0 bottom-0 text-9xl opacity-5 select-none pointer-events-none transform translate-y-6">🕌</span>
      </div>

      {/* CORE CONTROL SHEET */}
      {selectedSession ? (
        
        // ACTIVE TWO-WAY LIVE CLASSROOM
        <div id="active-live-call-room" className="bg-slate-900 p-6 rounded-3xl border border-rose-800/20 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <div className="flex items-center space-x-2 text-left">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Halaqah Live Sedang Berlangsung</h2>
              </div>
              <p className="text-2xs text-slate-400 mt-1 text-left">
                Siswa: <strong className="text-emerald-400">{selectedSession.studentName}</strong> | Sesi: <span className="text-amber-400 font-extrabold">LIVE BIMBINGAN</span>
              </p>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleSelesaikanKuotaSiswa}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xs px-3.5 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-emerald-900/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesaikan & Ambil Kuota</span>
              </button>
              <button
                onClick={handleBatalkanSesiUstadz}
                className="bg-slate-800 hover:bg-rose-955 hover:text-rose-455 text-slate-350 font-bold text-2xs px-3.5 py-2.5 rounded-xl transition"
              >
                Batalkan Sesi
              </button>
            </div>
          </div>

          {/* DUAL COLUMN - 2/3 VIDEO STREAMS & 1/3 CLIENT SERVICES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT STREAM CONTAINER (2/3 Grid Area) */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. STUDENT SCREEN (Live Feed with interactive zoom) */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex flex-col justify-between">
                  
                  {/* Top Bar Status */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
                    <span className="text-[7.5px] font-extrabold font-mono tracking-widest text-amber-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 uppercase">
                      UMPAN SANTRI SENTRAL (ZOOMABLE)
                    </span>
                    <span className="text-[8px] font-black text-white bg-slate-800 px-1.5 py-0.5 rounded">
                      Skala: {studentZoom.toFixed(2)}x
                    </span>
                  </div>

                  {/* Centered screen content wrapper */}
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                      
                      {/* Interactive zoom-supported simulation */}
                      <div 
                        style={{ transform: `scale(${studentZoom})`, transition: "all 0.2s" }}
                        className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-3xl font-serif rounded-full flex items-center justify-center animate-pulse mb-2"
                      >
                        📖
                      </div>
                      
                      <h5 className="text-xs font-black text-white">{selectedSession.studentName}</h5>
                      <span className="text-[7.5px] text-teal-300 font-mono tracking-wider font-extrabold block mt-0.5 animate-pulse">
                        Menghubungkan suara mikrofon & video santri...
                      </span>

                      {/* Wave audio animations */}
                      <div className="flex items-end justify-center space-x-0.5 h-3 opacity-30 mt-2">
                        <span className="w-0.5 bg-sky-400 h-1 rounded animate-bounce delay-100" />
                        <span className="w-0.5 bg-sky-400 h-3 rounded animate-bounce" />
                        <span className="w-0.5 bg-sky-400 h-2 rounded animate-bounce delay-300" />
                      </div>

                    </div>
                  </div>

                  {/* Individual student zoom controllers */}
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 py-1.5 px-2 rounded-xl border border-slate-800 flex items-center space-x-1 z-35">
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "out")}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded font-black text-xs"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "reset")}
                      className="p-1 hover:bg-slate-800 text-slate-400 rounded font-black"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "in")}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded font-black text-xs"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                </div>

                {/* 2. USTADZ SCREEN (Your live camera feed with interactive zoom) */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-teal-800 flex flex-col justify-between">
                  
                  {/* Top Bar status */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
                    <span className="text-[7.5px] font-extrabold font-mono tracking-widest text-emerald-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-850 uppercase">
                      KAMERA GURU (LIVE PREVIEW)
                    </span>
                    <span className="text-[8px] font-black text-white bg-slate-850 px-1.5 py-0.5 rounded">
                      Skala: {ustadzZoom.toFixed(2)}x
                    </span>
                  </div>

                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {ustadzCamActive ? (
                      <div className="absolute inset-0 w-full h-full">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{ transform: `scale(${ustadzZoom})`, transition: "all 0.2s" }}
                          className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]"
                        />
                        <div className="absolute bottom-16 right-2 bg-emerald-950/95 text-emerald-350 px-2.5 py-1 rounded-xl text-[7px] font-bold border border-emerald-500/20 font-mono tracking-wider z-20 flex items-center animate-pulse">
                          ● KAMERA NYALA
                        </div>
                      </div>
                    ) : (
                      <div className="text-center z-10 space-y-1.5 p-4 select-none">
                        <VideoOff className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
                        <p className="text-[9px] text-slate-400 font-bold">Kamera Anda saat ini mati</p>
                      </div>
                    )}
                  </div>

                  {/* Zoom controls for teacher's outer camera */}
                  <div className="absolute bottom-2 right-2 bg-slate-900/90 py-1.5 px-2 rounded-xl border border-slate-800 flex items-center space-x-1 z-35">
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "out")}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded font-black text-xs"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "reset")}
                      className="p-1 hover:bg-slate-800 text-slate-400 rounded font-black"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "in")}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded font-black text-xs"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Audio camera switches */}
                  <div className="absolute bottom-2 left-2 flex space-x-1.5 z-25">
                    <button
                      onClick={toggleCamera}
                      className={`p-1.5 rounded transition ${ustadzCamActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={toggleMic}
                      className={`p-1.5 rounded transition ${ustadzMicActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300"}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>

              {/* Bottom footer bar */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-medium text-left">
                  Gunakan tombol makhraj di kanan untuk panduan pengajaran materi.
                </span>
                <button
                  onClick={handleStopTeaching}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 px-3.5 py-1.5 rounded-lg font-black text-[9.5px] transition flex items-center space-x-1"
                >
                  <PhoneOff className="w-3 h-3" />
                  <span>Putus Hubungan Kelas</span>
                </button>
              </div>

            </div>

            {/* RIGHT SIDEBAR: CHATS & INTEGRATED GUIDE SLATE (1/3 Grid Area) */}
            <div className="lg:col-span-1 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[380px] lg:h-auto overflow-hidden">
              
              {/* Tab options selector */}
              <div className="bg-slate-900 border-b border-slate-800 p-1 flex justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveRightTab("chat")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] transition-all flex items-center justify-center space-x-1.5 ${
                    activeRightTab === "chat"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  <span>💬 Kolom Chat Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightTab("materi")}
                  className={`flex-1 py-1.5 rounded-lg font-black text-[10px] transition-all flex items-center justify-center space-x-1.5 ${
                    activeRightTab === "materi"
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3 h-3 text-emerald-400" />
                  <span>📚 Panduan Silabus</span>
                </button>
              </div>

              {/* SERVICE SUB-WINDOW 1: LIVE COLLATERAL CLASSES CHAT */}
              {activeRightTab === "chat" && (
                <div className="flex flex-col flex-1 min-h-0 bg-slate-900">
                  
                  {/* Chat scrolling log */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-left h-[240px] lg:h-[285px]">
                    <div className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl p-2.5 text-[9.5px] leading-relaxed text-emerald-300">
                      <span className="font-bold block mb-0.5">💬 Obrolan Langsung Santri:</span>
                      Ketikkan tanggapan, koreksi mad, rujukan surat atau sapaan hangat kepada {selectedSession.studentName}.
                    </div>

                    {filteredChat.length === 0 ? (
                      <div className="text-center py-12 opacity-50 text-slate-500">
                        <MessageSquare className="w-5 h-5 mx-auto text-slate-600" />
                        <p className="text-[9px] mt-1">Belum ada obrolan terbaru.</p>
                      </div>
                    ) : (
                      filteredChat.map((msg, index) => {
                        const isSaya = msg.senderUid === currentUser.username;
                        return (
                          <div 
                            key={msg.id || index} 
                            className={`flex flex-col ${isSaya ? "items-end" : "items-start"}`}
                          >
                            <span style={{ fontSize: "7px" }} className="text-slate-500 font-bold mb-0.5 uppercase px-1">
                              {isSaya ? "Anda (Ustadz)" : msg.sender} • {msg.timestamp}
                            </span>
                            <div className={`p-2 rounded-xl text-[10px] leading-relaxed max-w-[85%] ${
                              isSaya 
                                ? "bg-emerald-600 text-white rounded-tr-none" 
                                : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"
                            }`}>
                              <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick message form writer */}
                  <form onSubmit={handleSendTeacherChatMsg} className="p-2 bg-slate-950 border-t border-slate-850 flex items-center space-x-1.5 shrink-0">
                    <input 
                      type="text"
                      placeholder="Ketikan respon ustadz..."
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xxs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button 
                      type="submit"
                      disabled={!newMsgText.trim()}
                      className="p-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>

                </div>
              )}

              {/* SERVICE SUB-WINDOW 2: TEACHER ALIGNED REFERENCE MATERIAL */}
              {activeRightTab === "materi" && (
                <div className="flex-1 overflow-y-auto bg-slate-900 p-3 space-y-3 text-left h-[240px] lg:h-[285px]">
                  
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[8px] font-black uppercase text-slate-400">Pilih Silabus Pembahasan:</span>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-[8px] font-black text-emerald-400 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="iqra">IQRA (Dasar)</option>
                      <option value="tahsin">TAHSIN (Tajwid)</option>
                      <option value="tafsir">TAFSIR (Kajian)</option>
                    </select>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/60">
                    <h6 className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{syllabusData[selectedLevel].title}</h6>
                    <p style={{ fontSize: "8.5px" }} className="text-slate-400 mt-1 leading-relaxed">
                      {syllabusData[selectedLevel].desc}
                    </p>
                  </div>

                  {/* Chapter picker Accordion list */}
                  <div className="space-y-1.5">
                    {syllabusData[selectedLevel].chapters.map((ch, idx) => {
                      const isOpened = selectedChapterIdx === idx;
                      return (
                        <div 
                          key={idx}
                          className={`border rounded-xl transition duration-150 overflow-hidden ${
                            isOpened 
                              ? "border-emerald-500 bg-slate-950" 
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedChapterIdx(idx)}
                            className="w-full p-2 flex items-start justify-between text-left"
                          >
                            <div className="pr-2">
                              <h6 className="text-[9.5px] font-black text-slate-200 leading-tight">
                                {ch.title}
                              </h6>
                              <span style={{ fontSize: "7.5px" }} className="text-slate-500 block mt-0.5 leading-tight line-clamp-1 truncate selection:bg-slate-50">
                                {ch.subtitle}
                              </span>
                            </div>
                            <ChevronRight className={`w-3 h-3 text-slate-500 mt-0.5 shrink-0 transform transition-transform ${isOpened ? "rotate-90 text-emerald-400" : ""}`} />
                          </button>

                          {isOpened && (
                            <div className="p-2.5 bg-slate-950 border-t border-slate-850 space-y-2">
                              
                              {ch.arabic && (
                                <div className="p-2.5 text-center bg-slate-900 rounded-lg border border-slate-800/50" dir="rtl">
                                  <span className="text-base font-serif text-slate-200 block tracking-widest leading-loose">
                                    {ch.arabic}
                                  </span>
                                  {ch.translation && (
                                    <span style={{ fontSize: "8px" }} className="text-slate-400 block font-mono italic mt-1.5" dir="ltr">
                                      {ch.translation}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div>
                                <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest block mb-1 flex items-center space-x-1">
                                  <Info className="w-2.5 h-2.5" />
                                  <span>Panduan Mulut & Koreksi:</span>
                                </span>
                                <ul style={{ fontSize: "8.5px" }} className="space-y-1 text-slate-400 leading-normal list-disc list-inside">
                                  {ch.makhrajNotes.map((note, nIdx) => (
                                    <li key={nIdx} className="pl-1 text-slate-400">
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewMsgText(`Mari kita setorkan / ulas materi bab: "${ch.title}" dengan bacaan "${ch.arabic || ''}"`);
                                  setActiveRightTab("chat");
                                }}
                                className="w-full py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 rounded text-[8px] font-black tracking-wide mb-1.5"
                              >
                                Tulis materi ini ke chat kelas 💬
                              </button>

                              <button
                                type="button"
                                onClick={() => handleShareMaterial(selectedLevel, idx)}
                                className="w-full py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[8px] font-black tracking-wide flex items-center justify-center space-x-1 mb-1"
                              >
                                <span>📺 Tampilkan / Share Materi secara Real-time</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleStopShareMaterial}
                                className="w-full py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[7.5px] font-bold tracking-wide"
                              >
                                Hentikan Share Real-time
                              </button>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      ) : (
        // DASHBOARD NORMAL SHEET
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1: ACTIVE LIVE MONITORS */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-[10px] font-black text-rose-800 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full uppercase tracking-wider block self-start">
                Live Halaqah Monitor
              </span>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-3">Santri Sedang Menunggu</h3>
              <p className="text-[11px] text-slate-450 mt-1 pb-4 leading-normal border-b border-slate-100">
                Santri yang memulai kelas harian jarak jauh akan tampil di bawah ini. Hubungkan segera bimbingan dua arah Anda!
              </p>

              <div className="mt-4 space-y-3 flex-1">
                {activeSessions.filter(s => {
                  return s.selectedUstadz.toLowerCase().includes(currentUser.name.toLowerCase()) || 
                         currentUser.name.toLowerCase().includes(s.selectedUstadz.toLowerCase()) ||
                         s.selectedUstadz.toLowerCase().includes(currentUser.username.toLowerCase());
                }).length === 0 ? (
                  <div className="text-center py-10 animate-fade-in">
                    <VideoOff className="w-8 h-8 text-slate-350 mx-auto animate-pulse" />
                    <p className="text-2xs font-extrabold text-slate-400 mt-2.5 uppercase tracking-wide">Belum Ada Sesi Aktif</p>
                    <p className="text-[10px] text-slate-400 mt-1">Santri akan tampil ketika memulai kelas bimbingan live.</p>
                  </div>
                ) : (
                  activeSessions.filter(s => {
                    return s.selectedUstadz.toLowerCase().includes(currentUser.name.toLowerCase()) || 
                           currentUser.name.toLowerCase().includes(s.selectedUstadz.toLowerCase()) ||
                           s.selectedUstadz.toLowerCase().includes(currentUser.username.toLowerCase());
                  }).map((sess) => (
                    <div key={sess.id} className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/5 to-amber-500/5 border border-rose-500/15 text-left flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-800 leading-none">{sess.studentName}</h5>
                          <span className="text-[9px] text-rose-700 bg-rose-100/50 px-1.5 py-0.5 rounded-md font-mono mt-1 inline-block animate-pulse font-bold">● MENANTI LIVE</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-lg">WIB</span>
                      </div>
                      <button
                        onClick={() => handleStartTeaching(sess)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xxs py-2 rounded-xl transition flex items-center justify-center space-x-1.5"
                      >
                        <Video className="w-3.5 h-3.5 shrink-0" />
                        <span>Hubungkan Live Kamera & Mic</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 1 SUB-SECTION 2: TEACHING SLOT AVAILABILITY CONTROL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Ketersediaan Waktu Belajar (Siswa)</h3>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-normal">
                Centang slot waktu yang Anda miliki kosong/tersedia. Siswa bimbingan Anda hanya akan dapat memilih jam yang telah Anda nyatakan aktif di bawah ini secara otomatis.
              </p>

              <div className="space-y-2 pt-1">
                {["Pagi (08:00 - 10:00)", "Siang (13:00 - 15:00)", "Sore (16:00 - 18:00)", "Malam (19:30 - 21:00)"].map((slot) => {
                  const isChecked = myAvailableSlots.includes(slot);
                  return (
                    <label key={slot} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-amber-500/5 cursor-pointer transition select-none">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSlot(slot)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="text-[11px] font-bold text-slate-700">{slot}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isChecked ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                        {isChecked ? "Tersedia" : "Tutup"}
                      </span>
                    </label>
                  );
                })}

                {/* Render any additional custom slots */}
                {myAvailableSlots.filter(s => !["Pagi (08:00 - 10:00)", "Siang (13:00 - 15:00)", "Sore (16:00 - 18:00)", "Malam (19:30 - 21:00)"].includes(s)).map((slot) => {
                  return (
                    <label key={slot} className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50/50 cursor-pointer transition select-none">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox"
                          checked={true}
                          onChange={() => handleToggleSlot(slot)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                        />
                        <span className="text-[11px] font-bold text-slate-700">{slot}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Custom
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Custom custom slots adder */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Tambah Jam Custom:</span>
                <div className="flex space-x-2">
                  <input 
                    type="text"
                    placeholder="Contoh: Subuh (05:00 - 06:00)"
                    value={customSlotInput}
                    onChange={(e) => setCustomSlotInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button 
                    type="button"
                    onClick={handleAddCustomSlot}
                    className="bg-slate-900 hover:bg-slate-950 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-xxs uppercase tracking-wider transition"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAvailability}
                disabled={isSavingAvailability}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xxs py-3.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/10"
              >
                {isSavingAvailability ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Ketersediaan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Jadwal Guru Resmi</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLUMN 2: STUDENT MANAGEMENT (ROMBONGAN BELAJAR) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">ROMBONGAN BELAJAR ANDA</h3>
                  <p className="text-2xs text-slate-400 mt-0.5">Daftar Santri yang mempercayakan Anda sebagai guru pembimbing live.</p>
                </div>
                <button
                  onClick={fetchData}
                  className="p-2 text-slate-400 hover:text-teal-800 transition"
                  title="Segarkan Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-10 text-slate-400 text-2xs animate-pulse">
                  <span>Memuat rombongan belajar santri...</span>
                </div>
              ) : myStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed rounded-3xl p-6">
                  <span className="text-4xl">👥</span>
                  <p className="text-xxs font-extrabold text-slate-500 mt-3 uppercase tracking-wider">Rombongan Belajar Kosong</p>
                  <p className="text-[11px] text-slate-440 mt-1">Belum ada siswa yang mendaftar atau memilih Anda dalam kelas bimbingan pilihan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest font-black py-1.5 px-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
                    <span>Nama Ustadz: {currentUser.name}</span>
                    <span className="text-[9px] text-teal-850 font-bold bg-teal-100/50 px-2 rounded-md">{myStudents.length} Santri</span>
                  </div>

                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="py-2.5 px-3 text-2xs uppercase tracking-wider w-8">No</th>
                        <th className="py-2.5 px-3 text-2xs uppercase tracking-wider">Santri / Akun</th>
                        <th className="py-2.5 px-3 text-2xs uppercase tracking-wider">Paket Kelas & Pertemuan</th>
                        <th className="py-2.5 px-3 text-2xs uppercase tracking-wider">Waktu Belajar Rutin</th>
                        <th className="py-2.5 px-w text-2xs uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myStudents.map((stud, idx) => (
                        <tr key={stud.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-400">{idx + 1}.</td>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-800">{stud.name}</div>
                            <div className="text-[9px] text-slate-400">@{stud.username}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-[9.5px] font-black text-teal-800">{(stud.package || "LEVEL_1").replace("_", " ")}</div>
                            <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                              Sisa: <strong className="text-slate-800">{stud.remainingMeetings ?? 0}</strong> / <span className="text-slate-400">{stud.totalMeetings ?? 0}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-black text-rose-900 drop-shadow-sm flex items-center space-x-1.5 mt-1.5">
                            <Clock className="w-3.5 h-3.5 text-rose-700" />
                            <span>{stud.studyTime || "Belum Diatur Siswa"}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${stud.paymentStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800 border border-emerald-250" : "bg-teal-50 text-teal-800 border border-teal-100"}`}>
                              {stud.paymentStatus === "VERIFIED" ? "Aktif" : "Tertunda"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 text-3xs font-medium rounded-xl border border-emerald-100 text-left">
                    Sisa pertemuan santri akan berkurang terus secara otomatis ketika ustadz melakukan penuntasan mengajar dan mengklik tombol "Selesaikan & Ambil Kuota" setelah ketuntasan waktu belajar.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
