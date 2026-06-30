import { useState, useEffect, useRef } from "react";
import { 
  Play, Square, Video, Mic, Volume2, VideoOff, AlertTriangle, 
  Send, ZoomIn, ZoomOut, RotateCcw, MessageSquare, BookOpen, 
  ChevronRight, Sparkles, Layers, Info, Lock, Camera, MicOff, ArrowLeft
} from "lucide-react";
import { User } from "../types";
import { ustadzList } from "../data";

interface LiveSessionRoomProps {
  currentUser: User;
  onSessionCompleted: () => void;
  pushToast: (msg: string, type: "success" | "error" | "info") => void;
}

// Interactive custom high-fidelity syllabus material mapped by package levels
const syllabusData: Record<string, { title: string; desc: string; chapters: { title: string; subtitle: string; arabic?: string; translation?: string; makhrajNotes: string[] }[] }> = {
  iqra: {
    title: "Silabus Belajar IQRA (Paket Dasar)",
    desc: "Sangat cocok untuk belajar pelafalan makhraj huruf Hijaiyah, harakat tunggal dasar, serta makhrijul huruf.",
    chapters: [
      {
        title: "Pertemuan 1: Konsisten Makhraj Halq (Tenggorokan)",
        subtitle: "Membedakan ketebalan & gesekan nafas huruf Alif (أ), Ha (ح), Kha (خ), dan 'Ain (ع)",
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

export default function LiveSessionRoom({ currentUser, onSessionCompleted, pushToast }: LiveSessionRoomProps) {
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedUstadz, setSelectedUstadz] = useState<string>(currentUser.selectedUstadz || "Ustadz Adi Hidayat");
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [micActive, setMicActive] = useState<boolean>(true);
  const [ustadzCameraActive, setUstadzCameraActive] = useState<boolean>(false);
  const [dynamicUstadz, setDynamicUstadz] = useState<any[]>([]);

  // Lobby setup states (Requirement 1)
  const [lobbyActive, setLobbyActive] = useState<boolean>(false);
  const [lobbyUstadz, setLobbyUstadz] = useState<string>("");
  const [lobbyStudentName, setLobbyStudentName] = useState<string>(currentUser.name);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Custom states added for live session enhancements
  const [ustadzZoom, setUstadzZoom] = useState<number>(1.0);
  const [studentZoom, setStudentZoom] = useState<number>(1.0);
  const [activeRightTab, setActiveRightTab] = useState<"chat" | "materi">("chat");
  const [roomMessages, setRoomMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState<string>( "");
  const [selectedLevel, setSelectedLevel] = useState<string>("iqra");
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  
  // Custom non-blocking confirmation dialog state (Requirement 4)
  const [confirmAction, setConfirmAction] = useState<'batal' | 'selesai' | null>(null);
  const [showClassSummary, setShowClassSummary] = useState<boolean>(false);
  const [summaryType, setSummaryType] = useState<'batal' | 'selesai' | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-switch Level based on student's package if set
  useEffect(() => {
    if (currentUser?.package) {
      const p = currentUser.package.toLowerCase();
      if (p.includes("basic") || p.includes("iqra")) {
        setSelectedLevel("iqra");
      } else if (p.includes("tahsin") || p.includes("tajwid")) {
        setSelectedLevel("tahsin");
      } else if (p.includes("tafsir")) {
        setSelectedLevel("tafsir");
      }
    }
  }, [currentUser?.package]);

  // Keep selectedUstadz synced with currentUser.selectedUstadz if updated
  useEffect(() => {
    if (currentUser?.selectedUstadz) {
      setSelectedUstadz(currentUser.selectedUstadz);
    }
  }, [currentUser?.selectedUstadz]);

  // Load dynamic list of ustadz with periodic sync
  useEffect(() => {
    const loadUstadz = async () => {
      try {
        const res = await fetch("/api/ustadz");
        if (res.ok) {
          const data = await res.json();
          if (data.ustadz && data.ustadz.length > 0) {
            setDynamicUstadz(data.ustadz);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat list Ustadz dinamis:", err);
      }
    };
    loadUstadz();
    const interval = setInterval(loadUstadz, 4000);
    return () => clearInterval(interval);
  }, []);

  // Poll classroom chat messages
  const loadRoomMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setRoomMessages(data.messages);
        }
      }
    } catch (e) {
      console.warn("Error loading chat messages inside active room:", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadRoomMessages();
      const interval = setInterval(loadRoomMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Auto-scroll chat internally to bottom without moving the browser window/viewport
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages, activeRightTab]);

  // Poll active session status from server to detect teacher joining
  useEffect(() => {
    if (!isActive) {
      setUstadzCameraActive(false);
      return;
    }

    const fetchSessionStatus = async () => {
      try {
        const res = await fetch("/api/active-sessions");
        if (res.ok) {
          const data = await res.json();
          const list = data.sessions || [];
          const mySession = list.find((s: any) => s.studentUsername === currentUser.username.toLowerCase());
          if (mySession) {
            setUstadzCameraActive(!!mySession.ustadzCameraActive);
            if (mySession.sharedMaterial) {
              const sharedL = mySession.sharedMaterial;
              const sharedC = mySession.sharedMaterialChapter !== undefined ? Number(mySession.sharedMaterialChapter) : 0;
              setSelectedLevel(sharedL);
              setSelectedChapterIdx(sharedC);
              if (activeRightTab !== "materi") {
                setActiveRightTab("materi");
                pushToast(`Ustadz menampilkan materi "${syllabusData[sharedL]?.chapters[sharedC]?.title || 'Pelajaran'}" secara real-time!`, "info");
              }
            }
          } else {
            setUstadzCameraActive(false);
          }
        }
      } catch (e) {
        console.warn("Gagal sinkronisasi ustadz camera status:", e);
      }
    };

    fetchSessionStatus();
    const interval = setInterval(fetchSessionStatus, 3000);
    return () => clearInterval(interval);
  }, [isActive, currentUser.username]);

  // Synchronize preferred ustadz in state if modified externally
  useEffect(() => {
    if (currentUser.selectedUstadz) {
      setSelectedUstadz(currentUser.selectedUstadz);
    }
  }, [currentUser.selectedUstadz]);

  const handleUstadzChange = async (ustadzName: string) => {
    setSelectedUstadz(ustadzName);
    try {
      await fetch("/api/students/select-ustadz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          ustadzId: ustadzName
        })
      });
    } catch (err) {
      console.warn("Gagal merekam ustadz pilihan ke database", err);
    }
  };

  // Genuine camera activation + clean room hook supporting lobby setup preview
  useEffect(() => {
    const shouldStream = (isActive || lobbyActive) && cameraActive;
    if (shouldStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: micActive })
        .then((stream) => {
          localStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Akses izin kamera di-block/gagal: ", err);
          if (isActive) {
            pushToast("Sistem mendeteksi kamera tidak terhubung atau ditolak. Mohon aktifkan izin kamera & audio di peramban Anda.", "error");
          }
        });
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((tk) => tk.stop());
        localStreamRef.current = null;
      }
    }
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((tk) => tk.stop());
        localStreamRef.current = null;
      }
    };
  }, [isActive, lobbyActive, cameraActive, micActive]);

  useEffect(() => {
    if (isActive && sessionTimeLeft !== null) {
      timerRef.current = setInterval(() => {
        setSessionTimeLeft((prev) => {
          if (prev !== null && prev > 1) {
            return prev - 1;
          } else {
            handleCompleteSessionAuto();
            return null;
          }
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, sessionTimeLeft]);

  const enterLobby = (ustadzName: string) => {
    if ((currentUser.remainingMeetings || 0) <= 0) {
      pushToast("Kuota pertemuan Anda habis! Silakan lakukan pembelian paket baru.", "error");
      return;
    }
    setLobbyUstadz(ustadzName);
    setLobbyStudentName(currentUser.name);
    setLobbyActive(true);
  };

  const handleTestAudio = () => {
    try {
      const u = new SpeechSynthesisUtterance("Tes audio bimbingan sukses. Hubungan suara aktif dan sangat jelas.");
      u.lang = "id-ID";
      u.volume = 1.0;
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
      pushToast("Suara uji coba berhasil dibunyikan! Hubungan audio aktif.", "success");
    } catch (err) {
      pushToast("Gagal membunyikan uji coba suara beralih ke browser.", "error");
    }
  };

  const startSession = async (overrideUstadz?: string) => {
    const activeUstadz = overrideUstadz || selectedUstadz;
    if ((currentUser.remainingMeetings || 0) <= 0) {
      pushToast("Kuota pertemuan Anda habis! Silakan lakukan pembelian paket baru.", "error");
      return;
    }
    setSelectedUstadz(activeUstadz);
    setSessionTimeLeft(1800); // 30 minutes = 1800 seconds
    setIsActive(true);
    setLobbyActive(false); // Cleanly turn off lobby
    setUstadzZoom(1.0);
    setStudentZoom(1.0);
    pushToast(`Halaqah Kelas bersama ${activeUstadz} dimulai! Audio & Kamera Anda siaga.`, "success");

    // Also persist chosen ustadz in start
    try {
      await fetch("/api/students/select-ustadz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          ustadzId: activeUstadz
        })
      });

      // Start the live session room globally on the backend
      await fetch("/api/active-sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          studentName: lobbyStudentName || currentUser.name,
          selectedUstadz: activeUstadz
        })
      });
    } catch (err) {
      console.warn("Gagal merekam ustadz pilihan ke database", err);
    }
  };

  const handleCompleteSessionAuto = async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      await fetch("/api/active-sessions/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username })
      });
    } catch {}

    pushToast("Mabruk! Sesi bimbingan 30 menit tuntas diselesaikan.", "success");
    onSessionCompleted();
  };

  const stopAndSkipSession = async () => {
    setConfirmAction('selesai');
  };

  const cancelSessionWithoutDeduct = async () => {
    setConfirmAction('batal');
  };

  const executeStopAndSkipSession = async () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    try {
      await fetch("/api/active-sessions/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username })
      });
    } catch {}

    onSessionCompleted();
    setConfirmAction(null);
    setSummaryType('selesai');
    setShowClassSummary(true);
  };

  const executeCancelSessionWithoutDeduct = async () => {
    setIsActive(false);
    setSessionTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await fetch("/api/active-sessions/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username })
      });
    } catch {}

    setConfirmAction(null);
    setSummaryType('batal');
    setShowClassSummary(true);
    pushToast("Sesi bimbingan dibatalkan dari ruang kelas.", "info");
  };

  // Submit dynamic text message in room chat
  const handleSendRoomChatMsg = async (e: any) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    const currentMsgText = newMsgText.trim();
    setNewMsgText("");

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ustadz: selectedUstadz,
          subject: "Halaqah Live Room Chat",
          sender: currentUser.name,
          senderUid: currentUser.username,
          text: currentMsgText
        })
      });
      loadRoomMessages();
    } catch (err) {
      console.error("Gagal mengirim pesan chat:", err);
    }
  };

  // Zoom control helpers
  const adjustZoom = (target: "ustadz" | "student", type: "in" | "out" | "reset") => {
    if (target === "ustadz") {
      setUstadzZoom((prev) => {
        if (type === "in") return Math.min(prev + 0.25, 3.0);
        if (type === "out") return Math.max(prev - 0.25, 0.75);
        return 1.0;
      });
    } else {
      setStudentZoom((prev) => {
        if (type === "in") return Math.min(prev + 0.25, 3.0);
        if (type === "out") return Math.max(prev - 0.25, 0.75);
        return 1.0;
      });
    }
    pushToast(`Disesuaikan skala zoom kamera ${target === "ustadz" ? "Guru" : "Santri"}`, "info");
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Filter messages belonging to this student-teacher classroom environment
  const filteredChat = roomMessages.filter((m) => {
    return m.ustadz === selectedUstadz && 
           (m.senderUid === currentUser.username || m.senderUid === currentUser.id || m.senderUid === "gemini-ai" || m.sender === selectedUstadz || m.senderUid === "anonymous");
  });

  return (
    <div id="live-session-room" className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm">
      {/* Custom Non-blocking Dialog Overlay */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-350 max-w-md w-full p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  {confirmAction === 'batal' ? "Batalkan Sesi Hari Ini?" : "Sudahi Kelas Bimbingan?"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  {confirmAction === 'batal' 
                    ? "Apakah Anda ingin membatalkan sesi belajar sekarang? Progress waktu saat ini akan di-reset/terhapus, namun sisa kuota bimbingan Anda tetap utuh." 
                    : "Apakah Anda ingin menyudahi bimbingan sekarang dan mencatatkan penyelesaian ketuntasan belajar 1 sesi? Sisa kuota pertemuan Anda akan berkurang sebanyak 1 sesi."}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xxs space-y-1.5 font-extrabold text-slate-600">
              <div className="flex justify-between">
                <span>Kuota Saat Ini:</span>
                <span className="text-slate-900 font-extrabold">{currentUser.remainingMeetings ?? 0} Sesi</span>
              </div>
              <div className="flex justify-between">
                <span>Setelah Sesi Ini:</span>
                <span className={confirmAction === 'selesai' ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                  {confirmAction === 'selesai' ? `${Math.max(0, (currentUser.remainingMeetings || 1) - 1)} Sesi` : `${currentUser.remainingMeetings ?? 0} Sesi (Tetap)`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-[10px] font-black tracking-wider uppercase border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition cursor-pointer"
              >
                Kembali Belajar
              </button>
              <button
                type="button"
                onClick={confirmAction === 'batal' ? executeCancelSessionWithoutDeduct : executeStopAndSkipSession}
                className={`px-4 py-2 text-[10px] font-black tracking-wider uppercase rounded-xl transition text-white shadow-xs cursor-pointer ${
                  confirmAction === 'batal' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                }`}
              >
                {confirmAction === 'batal' ? "Ya, Batalkan Sesi" : "Ya, Selesaikan Sesi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-5">
        <div>
          <h4 className="flex items-center space-x-2 text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping mr-1" />
            <span>Kelas Halaqah Tatap Muka 30 Menit</span>
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">Gunakan kuota Anda untuk memulai bimbingan, chat, tatap muka, dan silabus terpadu.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 font-mono">
            Sisa Pertemuan: {currentUser.remainingMeetings || 0} / {currentUser.totalMeetings || 0}
          </span>
        </div>
      </div>

      {showClassSummary ? (
        <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 text-left max-w-2xl mx-auto animate-fade-in">
          
          <div className="text-center space-y-2">
            {summaryType === 'selesai' ? (
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-200">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 mx-auto border border-slate-200">
                <RotateCcw className="w-6 h-6 text-slate-500" />
              </div>
            )}
            
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest pt-1">
              {summaryType === 'selesai' ? "BARAKALLAHU FIIK - BIMBINGAN SELESAI" : "SESI BELAJAR DIBATALKAN"}
            </h3>
            <p className="text-[10px] text-slate-500 max-w-md mx-auto">
              {summaryType === 'selesai' 
                ? "Alhamdulillah, bimbingan halaqah live 30 menit Anda telah resmi tuntas diselesaikan dengan baik hari ini." 
                : "Sesi kelas bimbingan telah dibatalkan. Kemajuan waktu Anda saat ini di-reset kembali."}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3.5 text-left">
              <span className="text-[10px] font-black text-teal-850 uppercase tracking-wider block border-b border-slate-200 pb-1.5">📊 Status Sisa Pertemuan</span>
              <div className="space-y-1.5 text-xs font-bold text-slate-650">
                <div className="flex justify-between text-xxs">
                  <span>Ustadz Pembimbing:</span>
                  <span className="text-slate-800 font-extrabold">{selectedUstadz}</span>
                </div>
                <div className="flex justify-between text-xxs">
                  <span>Status Kurangan Kuota:</span>
                  <span className={summaryType === 'selesai' ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                    {summaryType === 'selesai' ? "Minus 1 Kuota Sesi" : "Utuh (Tidak Berkurang)"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2 text-slate-800 font-extrabold text-xxs">
                  <span>Sisa Batas Pertemuan:</span>
                  <span className="text-emerald-700 font-black">
                    {currentUser.remainingMeetings} Sesi Siswa
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left border-l-0 md:border-l border-slate-200 md:pl-4">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block border-b border-slate-200 pb-1.5">📖 Silabus Terbaru</span>
              <div className="text-left">
                <h5 className="text-[10px] font-black text-slate-850">{syllabusData[selectedLevel]?.title || "Materi Mengaji"}</h5>
                <p style={{ fontSize: "8.5px" }} className="text-slate-400 leading-normal mt-0.5">{syllabusData[selectedLevel]?.desc}</p>
                <div className="mt-2.5 inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 text-[8px] font-extrabold px-2 py-0.5 rounded border border-emerald-100">
                  <span>🎯 Bab {selectedChapterIdx + 1}: {syllabusData[selectedLevel]?.chapters[selectedChapterIdx]?.title || "Pelajaran"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-teal-50/50 border border-teal-100/50 p-3 rounded-xl text-center">
            <p className="text-teal-950 font-medium text-[9px] italic leading-relaxed">
              {summaryType === 'selesai'
                ? `"Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." Semoga bimbingan ini membawa keberkahan dan kefasihan membaca makharijul huruf.`
                : `"Mudahkanlah dan jangan mempersulit, gembirakanlah dan jangan membuat mereka lari." Mari persiapkan waktu dan mental Anda kembali untuk sesi bimbingan berikutnya.`}
            </p>
          </div>

          <div className="text-center pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setShowClassSummary(false);
                setSummaryType(null);
              }}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition cursor-pointer"
            >
              Kembali Ke Dashboard Utama
            </button>
          </div>

        </div>
      ) : isActive && sessionTimeLeft !== null ? (
        <div className="space-y-5 animate-fade-in">
          
          {/* MULTI COLUMN CLASSROOM - 2/3 VIDEO CAMERA STREAM & 1/3 ACTIVE SERVICES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT AREA: CAMERA & STREAMS (2/3 Grid) */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. TEACHER VIDEO PANEL */}
                <div className="relative bg-gradient-to-br from-slate-950 to-teal-900 aspect-video rounded-2xl overflow-hidden shadow-inner border border-teal-700/50 flex flex-col justify-between">
                  
                  {/* Top Bar overlays */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
                    <span className="text-[7.5px] font-extrabold font-mono tracking-widest text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full select-none">
                      STREAM GURU (ZOOMABLE)
                    </span>
                    <span className="text-[8px] font-black text-white bg-teal-900/90 px-1.5 py-0.5 rounded">
                      Skala: {ustadzZoom.toFixed(2)}x
                    </span>
                  </div>

                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {ustadzCameraActive ? (
                      <div className="absolute inset-0 w-full h-full bg-black">
                        <span className="absolute top-8 right-2 text-white font-mono font-bold text-[7px] tracking-wider px-1.5 py-0.5 rounded-full animate-pulse z-30 bg-rose-600 bg-rose-600/95">
                          🔴 GURU SEDANG LIVE
                        </span>
                        
                        {/* Interactive zoom-supported render view */}
                        <video
                          id="real-ustadz-cam-feed-player"
                          autoPlay
                          playsInline
                          style={{ transform: `scale(${ustadzZoom})`, transition: "all 0.2s" }}
                          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none scale-x-[-1] z-10"
                          ref={(el) => {
                            if (el) {
                              navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                                .then((stream) => {
                                  if (el.srcObject !== stream) el.srcObject = stream;
                                })
                                .catch(() => {
                                  // Quietly allow simulation if native triggers are busy/denied
                                });
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 select-none z-10 p-4">
                        <div className="w-14 h-14 bg-emerald-700/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center animate-pulse text-3xl font-serif">
                          ﷽
                        </div>
                        <div>
                          <h5 className="text-[11px] font-black text-white">{selectedUstadz}</h5>
                          <p className="text-[8px] text-emerald-400 tracking-wide mt-1 animate-pulse">Menyimak setoran bacaan & mad tajwid Anda...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Glass panel name overlay */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/85 p-2 rounded-xl border border-teal-500/20 text-left z-20 max-w-[85%]">
                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest block">GURU PEMBIMBING</span>
                    <h6 className="text-[10px] font-black text-white leading-none truncate">{selectedUstadz}</h6>
                    <span style={{ fontSize: "6.5px" }} className="text-teal-300 font-mono font-extrabold block mt-0.5">
                      Klik kontrol zoom di bawah untuk perjelas makhraj/bibir
                    </span>
                  </div>

                  {/* Individual ZOOM Controls for Ustadz Screen */}
                  <div className="absolute bottom-2 right-2 bg-slate-950/90 py-1.5 px-2 rounded-xl border border-teal-500/30 flex items-center space-x-1 z-30">
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "out")}
                      className="p-1 hover:bg-slate-800 text-teal-300 rounded font-black text-xs"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "reset")}
                      className="p-1 hover:bg-slate-800 text-teal-400 rounded font-black"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("ustadz", "in")}
                      className="p-1 hover:bg-slate-800 text-teal-300 rounded font-black text-xs"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                </div>

                {/* 2. STUDENT VIDEO PANEL */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex flex-col justify-between">
                  
                  {/* Top Bar overlays */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
                    <span className="text-[7.5px] font-extrabold font-mono tracking-widest text-amber-400 bg-slate-900/80 px-2 py-0.5 rounded-full select-none">
                      KAMERA SANTRI (LIVE)
                    </span>
                    <span className="text-[8px] font-black text-white bg-slate-800 px-1.5 py-0.5 rounded">
                      Skala: {studentZoom.toFixed(2)}x
                    </span>
                  </div>

                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {cameraActive ? (
                      <div className="absolute inset-0 w-full h-full">
                        <video 
                          id="real-student-cam-kelas"
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          style={{ transform: `scale(${studentZoom})`, transition: "all 0.2s" }}
                          className="absolute inset-0 w-full h-full object-cover z-0" 
                        />
                      </div>
                    ) : (
                      <div className="text-slate-500 text-center space-y-1.5 z-10 p-4">
                        <VideoOff className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
                        <p className="text-[9px] font-bold text-slate-400">Kamera dinonaktifkan</p>
                      </div>
                    )}
                  </div>

                  {/* Floating info strip */}
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1.5 rounded-lg border border-slate-800 text-left z-10 max-w-[85%]">
                    <h6 className="text-[9.5px] font-bold text-white leading-none">{lobbyStudentName || currentUser.name}</h6>
                    <span style={{ fontSize: "6.5px" }} className="text-emerald-400 font-mono tracking-wider font-extrabold block mt-0.5 animate-pulse">● KAMERA AKTIF</span>
                  </div>

                  {/* Zoom controls for student’s own feed */}
                  <div className="absolute bottom-2 right-2 bg-slate-950/90 py-1.5 px-2 rounded-xl border border-slate-800 flex items-center space-x-1 z-35">
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "out")}
                      className="p-1 hover:bg-slate-850 text-slate-300 rounded"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "reset")}
                      className="p-1 hover:bg-slate-850 text-slate-400 rounded"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustZoom("student", "in")}
                      className="p-1 hover:bg-slate-850 text-slate-300 rounded"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Microphone & video togglers */}
                  <div className="absolute bottom-10 left-2 flex space-x-1.5 z-20 bg-slate-950/60 p-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setCameraActive(!cameraActive)}
                      className={`p-1 rounded ${cameraActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-rose-400"} text-[8px]`}
                    >
                      {cameraActive ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMicActive(!micActive)}
                      className={`p-1 rounded ${micActive ? "bg-emerald-600 text-white" : "bg-slate-800 text-rose-450"} text-[8px]`}
                    >
                      <Mic className="w-3 h-3" />
                    </button>
                  </div>

                </div>

              </div>

              {/* ACTIVE SESSION CONTROLS / TIMER */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border-2 border-emerald-400 font-mono text-base font-black text-emerald-300 tracking-wider">
                    {formatTime(sessionTimeLeft)}
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Masa Aktif Kelas</span>
                    <h5 className="text-[11px] font-black text-slate-800 leading-tight">Sedang bimbingan langsung dengan video</h5>
                    <p className="text-[9px] text-slate-500">Materi & bimbingan kelas akan memotong kuota otomatis.</p>
                  </div>
                </div>

                <div className="flex space-x-1.5 w-full sm:w-auto shrink-0">
                  <button 
                    type="button"
                    onClick={cancelSessionWithoutDeduct}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-rose-50 border border-rose-150 hover:bg-rose-100 rounded-lg text-[9px] font-extrabold text-rose-600 transition"
                  >
                    Batal Sesi
                  </button>
                  <button 
                    type="button"
                    onClick={stopAndSkipSession}
                    className="flex-1 sm:flex-initial px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[9.5px] transition flex items-center justify-center space-x-1"
                  >
                    <Square className="w-2.5 h-2.5 fill-current text-white/95" />
                    <span>Selesai Kelas (Potong Kuota)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT AREA: INTEGRATED COLUMN CLIENT SERVICES (1/3 Grid) */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col h-[400px] lg:h-auto overflow-hidden">
              
              {/* TAB SELECTOR HEADER */}
              <div className="bg-slate-100/80 border-b border-slate-200 p-1 flex justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveRightTab("chat")}
                  className={`flex-1 py-2 rounded-xl font-extrabold text-xxs transition-all flex items-center justify-center space-x-1.5 ${
                    activeRightTab === "chat"
                      ? "bg-white text-slate-850 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>💬 Kolom Chat Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRightTab("materi");
                    loadRoomMessages();
                  }}
                  className={`flex-1 py-2 rounded-xl font-extrabold text-xxs transition-all flex items-center justify-center space-x-1.5 ${
                    activeRightTab === "materi"
                      ? "bg-white text-slate-850 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📚 Silabus & Materi</span>
                </button>
              </div>

              {/* TAB PANEL 1: CHAT SYSTEM */}
              {activeRightTab === "chat" && (
                <div className="flex flex-col flex-1 min-h-0 bg-white">
                  
                  {/* Chat message frame */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-left h-[260px] lg:h-[300px]">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-xxs leading-relaxed text-emerald-900 mb-2">
                      <span className="font-extrabold block mb-0.5">💡 Chat Interaktif Kelas 2 Arah:</span>
                      Kirimkan teks rujukan ayat, pertanyaan maut tajwid, atau tulisan latin untuk langsung disimak oleh {selectedUstadz}.
                    </div>

                    {filteredChat.length === 0 ? (
                      <div className="text-center py-10 opacity-60 text-slate-400">
                        <MessageSquare className="w-6 h-6 mx-auto text-slate-350 stroke-1" />
                        <p style={{ fontSize: "9px" }} className="mt-1 font-semibold">Belum ada obrolan aktif.</p>
                        <p style={{ fontSize: "8px" }} className="text-slate-400 mt-0.5">Ketik sapaan untuk memulai diskusi chat.</p>
                      </div>
                    ) : (
                      filteredChat.map((msg, index) => {
                        const isSiswa = msg.senderUid === currentUser.username;
                        return (
                          <div 
                            key={msg.id || index} 
                            className={`flex flex-col ${isSiswa ? "items-end" : "items-start"}`}
                          >
                            <span style={{ fontSize: "7.5px" }} className="text-slate-400 font-bold mb-0.5 uppercase px-1">
                              {isSiswa ? "Anda" : selectedUstadz} • {msg.timestamp}
                            </span>
                            <div className={`p-2 rounded-2xl text-[10.5px] leading-relaxed max-w-[85%] shadow-2xs ${
                              isSiswa 
                                ? "bg-emerald-600 text-white rounded-tr-none" 
                                : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                            }`}>
                              <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Form trigger box */}
                  <form onSubmit={handleSendRoomChatMsg} className="p-2 bg-slate-50 border-t border-slate-100 flex items-center space-x-1.5 shrink-0">
                    <input 
                      type="text"
                      placeholder="Tulis pesan bimbingan..."
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xxs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button 
                      type="submit"
                      disabled={!newMsgText.trim()}
                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-all shrink-0"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>

                </div>
              )}

              {/* TAB PANEL 2: AUTOMATIC MATCHING SYLLABUS DATA */}
              {activeRightTab === "materi" && (
                <div className="flex-1 overflow-y-auto bg-white p-3 space-y-3.5 text-left h-[260px] lg:h-[300px]">
                  
                  <div className="flex items-center space-x-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/50">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-wider">Fokus Program:</span>
                    
                    {/* Manual level selector so client can look at other folders if they ask */}
                    <select 
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-white border text-[8.5px] font-extrabold text-teal-900 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="iqra">IQRA (Dasar)</option>
                      <option value="tahsin">TAHSIN (Tajwid)</option>
                      <option value="tafsir">TAFSIR (Tafsir)</option>
                    </select>
                  </div>

                  {/* Level Header Info */}
                  <div className="bg-emerald-50 bg-emerald-50/20 p-3 rounded-2xl border border-emerald-500/10">
                    <h5 className="text-[10px] font-extrabold text-emerald-950 flex items-center space-x-1 uppercase">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{syllabusData[selectedLevel].title}</span>
                    </h5>
                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                      {syllabusData[selectedLevel].desc}
                    </p>
                  </div>

                  {/* Chapter Interactive Picker Accordions */}
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Daftar Bab / Pertemuan</span>
                    {syllabusData[selectedLevel].chapters.map((ch, idx) => {
                      const isOpened = selectedChapterIdx === idx;
                      return (
                        <div 
                          key={idx}
                          className={`border rounded-xl transition duration-150 overflow-hidden ${
                            isOpened 
                              ? "border-emerald-500 bg-emerald-50/5" 
                              : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedChapterIdx(idx)}
                            className="w-full p-2.5 flex items-start justify-between text-left ease-in"
                          >
                            <div>
                              <h6 className="text-[10px] font-black text-slate-800 leading-tight block">
                                {ch.title}
                              </h6>
                              <span style={{ fontSize: "8px" }} className="text-slate-400 block mt-0.5 leading-tight lines-1 truncate">
                                {ch.subtitle}
                              </span>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0 transform transition-transform ${isOpened ? "rotate-90 text-emerald-600" : ""}`} />
                          </button>

                          {isOpened && (
                            <div className="p-3 bg-white border-t border-slate-100 space-y-2.5 animate-fade-in">
                              
                              {ch.arabic && (
                                <div className="p-3 text-center bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="text-lg font-serif text-slate-900 block tracking-widest leading-loose" dir="rtl">
                                    {ch.arabic}
                                  </span>
                                  {ch.translation && (
                                    <span style={{ fontSize: "8.5px" }} className="text-slate-500 block font-mono italic mt-1.5">
                                      {ch.translation}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div>
                                <span className="text-[7.5px] font-black text-emerald-800 uppercase tracking-widest block mb-1.5 flex items-center space-x-1">
                                  <Info className="w-2.5 h-2.5" />
                                  <span>Petunjuk Pelafalan & Makhraj:</span>
                                </span>
                                <ul style={{ fontSize: "9.5px" }} className="space-y-1 text-slate-600 leading-relaxed list-disc list-inside">
                                  {ch.makhrajNotes.map((note, nIdx) => (
                                    <li key={nIdx} className="pl-1 text-slate-500">
                                      {note}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewMsgText(`Ustadz, mohon koreksi bacaan saya untuk bab: "${ch.title}" dengan materi "${ch.arabic || ''}"`);
                                  setActiveRightTab("chat");
                                }}
                                className="w-full py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-lg text-[9px] font-extrabold transition-all"
                              >
                                Tanyakan koreksi bab ini ke Ustadz 💬
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
      ) : lobbyActive ? (
        <div className="space-y-6 text-left animate-fade-in bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                onClick={() => setLobbyActive(false)}
                className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-sm font-black text-slate-855 uppercase tracking-wider">Persiapan Bimbingan (Lobby)</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Konfigurasi & verifikasi kelengkapan profil belajar Anda sebelum masuk kelas</p>
              </div>
            </div>
            
            <div className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
              Status: Siap Gabung
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* LEFT COLUMN: INFORMATION & FORM FIELDS */}
            <div className="space-y-4 text-left">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3.5 text-left">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block border-b border-slate-100 pb-2 text-left">📋 Rincian Siswa & Kelas</span>
                
                {/* 1. Kolom Nama Siswa */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[9.5px] font-extrabold uppercase text-slate-500 tracking-wider">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    value={lobbyStudentName}
                    onChange={(e) => setLobbyStudentName(e.target.value)}
                    placeholder="Masukkan nama untuk bimbingan"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:outline-none p-2.5 rounded-xl text-xs font-bold text-slate-800 transition"
                  />
                  <p className="text-[8.5px] text-slate-400">Guru akan menyapa Anda dengan nama ini.</p>
                </div>

                {/* 2. Nama Gurunya / Ustadz */}
                <div className="space-y-1 text-left">
                  <span className="text-[9.5px] font-extrabold uppercase text-slate-500 tracking-wider block">Ustadz Pembimbing Pilihan</span>
                  <div className="bg-teal-50/50 border border-teal-100/60 p-2.5 rounded-xl text-xs font-black text-teal-900 flex items-center space-x-2">
                    <span>🕌</span>
                    <span>{lobbyUstadz}</span>
                  </div>
                </div>

                {/* 3. Paket Belajar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase text-slate-500 tracking-wider block">Paket Belajar Aktif</span>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-black text-slate-700">
                      {(currentUser.package || "MENGGALI IQRA (BASIC)").toUpperCase().replace("_", " ")}
                    </div>
                  </div>

                  {/* 4. Paket yang sudah dipakai */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase text-slate-500 tracking-wider block">Total Sesi Terpakai</span>
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10.5px] font-extrabold text-slate-700">
                      {currentUser.sessionsCompleted ?? 0} Sesi Selesai <span className="text-slate-400 font-normal">({currentUser.remainingMeetings ?? 0} Sisa)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Silabus yang akan dipelajari sesuai paket */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3 text-left">
                <div className="text-left">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block border-b border-slate-100 pb-2 mb-2 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>📖 Silabus Sesuai Paket Anda</span>
                  </span>
                  <h6 className="text-[11.5px] font-extrabold text-slate-800">{syllabusData[selectedLevel]?.title}</h6>
                  <p className="text-[9.5px] text-slate-500 leading-normal mt-0.5">{syllabusData[selectedLevel]?.desc}</p>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {syllabusData[selectedLevel]?.chapters.map((ch, idx) => (
                    <div key={idx} className="bg-slate-50 hover:bg-emerald-50/20 p-2 rounded-xl border border-slate-200/40 text-[10px] flex items-start space-x-2 transition">
                      <span className="bg-emerald-100 text-emerald-800 w-4 h-4 rounded-full flex items-center justify-center font-extrabold shrink-0 mt-0.5 text-[8.5px]">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <h6 className="font-extrabold text-slate-700 leading-tight truncate">{ch.title}</h6>
                        <p style={{ fontSize: "8px" }} className="text-slate-400 leading-tight mt-0.5 truncate">{ch.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: INTERACTIVE VIDEOPREVIEW, MICROPHON CONTROLS, AUDIO TEST */}
            <div className="space-y-4 text-left">
              <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-white space-y-4">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block border-b border-slate-800 pb-2 text-left">🎥 Pengaturan Perangkat Anda</span>
                
                {/* Visual stream preview */}
                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800 flex flex-col justify-center items-center">
                  <video
                    ref={lobbyVideoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                  
                  {!cameraActive && (
                    <div className="relative z-10 text-center space-y-1">
                      <VideoOff className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
                      <p className="text-[9.5px] text-slate-400 font-bold">Kamera dinonaktifkan</p>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="absolute bottom-2 left-2 bg-emerald-950/80 text-emerald-300 font-mono text-[7px] font-black tracking-wider px-2 py-0.5 rounded border border-emerald-800 z-10 uppercase animate-pulse">
                      ● Kamera Siaga
                    </div>
                  )}
                </div>

                {/* Cam & Audio switches */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`p-2.5 rounded-xl border font-bold text-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      cameraActive 
                        ? "bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-slate-850" 
                        : "bg-rose-950/30 border-rose-900/40 text-rose-455 hover:bg-rose-955/50"
                    }`}
                  >
                    {cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                    <span>Kamera: {cameraActive ? "ON" : "OFF"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMicActive(!micActive)}
                    className={`p-2.5 rounded-xl border font-bold text-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      micActive 
                        ? "bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-slate-850" 
                        : "bg-rose-950/30 border-rose-900/40 text-rose-455 hover:bg-rose-955/50"
                    }`}
                  >
                    {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>Suara: {micActive ? "ON" : "OFF"}</span>
                  </button>
                </div>

                {/* AUDIO TEST BUTTON (Requirement 4) */}
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850 flex items-center justify-between text-left">
                  <div className="pr-2 text-left">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Uji Coba Hubungan Suara</span>
                    <p style={{ fontSize: "8px" }} className="text-slate-500 leading-tight mt-0.5">Pastikan volume speaker Anda terdengar oleh kedua belah pihak</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className="bg-teal-900/60 hover:bg-teal-850 text-teal-300 border border-teal-800 text-3xs font-black px-3 py-2 rounded-xl transition uppercase tracking-wide shrink-0 cursor-pointer"
                  >
                    🔊 Test Suara
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* ACTIONS TRIGGER */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setLobbyActive(false)}
              className="px-5 py-3 border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 rounded-xl text-3xs font-black transition uppercase tracking-widest cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => startSession(lobbyUstadz)}
              className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-3xs font-black transition uppercase tracking-widest shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              Mulai & Gabung Kelas Halaqah ⚡
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-5 text-center bg-emerald-50/40 border border-emerald-100/50 rounded-2xl">
            <h5 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1">
              Pilihan Guru / Ustadz Pembimbing Anda
            </h5>
            <p className="text-2xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              Silakan pilih ustadz/guru bimbingan Anda di bawah ini. Ketika Anda mengeklik 
              <strong className="text-emerald-800"> "Masuk Kelas Belajar"</strong>, Anda akan langsung terhubung ke ruang bimbingan tatap muka live video streaming 30 menit secara instan!
            </p>
          </div>

          {/* GRID OF TEACHERS FOR IMMEDIATE ENTRY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {(dynamicUstadz.length > 0 ? dynamicUstadz : ustadzList).map((u, idx) => {
              const isSelected = selectedUstadz === u.name;
              const hasChosenTeacher = !!currentUser.selectedUstadz;
              const isLocked = hasChosenTeacher && currentUser.selectedUstadz !== u.name;

              return (
                <div 
                  key={idx} 
                  className={`relative p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    isLocked 
                      ? "border-slate-200 bg-slate-50/50 opacity-60"
                      : isSelected 
                        ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20" 
                        : "border-slate-200/50 hover:border-slate-300 bg-white"
                  }`}
                >
                  {isLocked && (
                    <span style={{ fontSize: '8px' }} className="absolute -top-2 right-6 bg-slate-500 text-white font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Kelas Lain Terkunci</span>
                    </span>
                  )}

                  {isSelected && (
                    <span style={{ fontSize: '8px' }} className="absolute -top-2 left-6 bg-emerald-600 text-white font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full shadow">
                      Pilihan Aktif Anda
                    </span>
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-teal-50 text-teal-900 border border-teal-100 rounded-xl flex items-center justify-center font-extrabold text-xs">
                        {u.initials || "UST"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 leading-tight">{u.name}</h4>
                        <span style={{ fontSize: "9px" }} className="text-teal-800 font-semibold block mt-1">{u.specialization}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: "10.5px" }} className="text-slate-500 leading-relaxed min-h-[50px] mb-2">
                      {u.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => enterLobby(u.name)}
                    disabled={(currentUser.remainingMeetings || 0) <= 0 || isLocked}
                    className={`mt-4 w-full py-2.5 rounded-xl text-2xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow ${
                      isLocked
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-none shadow-none"
                        : (currentUser.remainingMeetings || 0) <= 0
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border-none"
                          : isSelected
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                            : "bg-slate-50 hover:bg-teal-950 hover:text-white text-teal-900 border border-slate-100"
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Kelas Terkunci</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Masuk Kelas Belajar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {(currentUser.remainingMeetings || 0) <= 0 && (
            <div className="max-w-xs mx-auto border border-amber-200 bg-amber-50 rounded-xl p-3 text-[10px] text-amber-800 leading-normal flex items-start space-x-1.5 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>Kuota Anda habis (0). Harap lakukan pengisian ulang dengan membeli paket di bawah untuk mengaktifkan sesi.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
