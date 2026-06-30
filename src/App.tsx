import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  LogOut, 
  Video, 
  Laptop, 
  Send, 
  Volume2, 
  Bookmark, 
  Search, 
  Lock, 
  User, 
  CheckCircle2, 
  Activity,
  X,
  VolumeX,
  RefreshCw,
  Award,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  Share2,
  Copy,
  ExternalLink,
  Menu,
  Sun,
  Moon,
  Eye,
  EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { quranData, ustadzList } from "./data";
import { Message, User as UserType, Ustadz as UstadzType, Material as MaterialType } from "./types";

// Import premium modular full-stack components
import PaymentActivation from "./components/PaymentActivation";
import SyllabusMaterials from "./components/SyllabusMaterials";
import LiveSessionRoom from "./components/LiveSessionRoom";
import AdminPanel from "./components/AdminPanel";
import UstadzPanel from "./components/UstadzPanel";

// Import locally generated secure course assets
// @ts-ignore
import quranOpenImg from "./assets/images/tahsin_quran_open_1781446967467.jpg";
// @ts-ignore
import ustadzImg from "./assets/images/ustadz_teaching_1781446984946.jpg";
// @ts-ignore
import quranDigitalImg from "./assets/images/quran_digital_mushaf_1781447001918.jpg";

interface Toast {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

export default function App() {
  // Navigation & Authentication
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Forms local states
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"Siswa" | "Ustadz">("Siswa");
  const [ustadzAccessCode, setUstadzAccessCode] = useState("");
  const [regDegree, setRegDegree] = useState("");
  const [regUniversity, setRegUniversity] = useState("");
  const [regProvince, setRegProvince] = useState("");
  const [regCountry, setRegCountry] = useState("");
  const [regNik, setRegNik] = useState("");
  const [regTahsin, setRegTahsin] = useState(true);
  const [regTajwid, setRegTajwid] = useState(true);
  const [regFiqih, setRegFiqih] = useState(true);
  const [regCertificateName, setRegCertificateName] = useState("");
  const [regCertificateData, setRegCertificateData] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showAccessPortalPassword, setShowAccessPortalPassword] = useState(false);

  // Modals visibility
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAccessPortal, setShowAccessPortal] = useState(false);
  const [portalTab, setPortalTab] = useState<"login" | "register">("login");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("mengaji_dark_mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("mengaji_dark_mode", String(darkMode));
  }, [darkMode]);

  // Chat/Consultation states
  const [activeChatUstadz, setActiveChatUstadz] = useState<string>("Ustadz Adi Hidayat");
  const [chatMethod, setChatMethod] = useState<"app" | "wa">("app");
  const [chatSubject, setChatSubject] = useState("");
  const [chatText, setChatText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyInputText, setReplyInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Quran digital states
  const [selectedSurahKey, setSelectedSurahKey] = useState<string>("fatihah");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [lastReadSurah, setLastReadSurah] = useState<string>("Al-Fatihah");
  const [playingVerseId, setPlayingVerseId] = useState<string | null>(null);
  const [hoverSoundEnabled, setHoverSoundEnabled] = useState<boolean>(true);
  const [hoverSoundLevel, setHoverSoundLevel] = useState<"kata" | "ayat">("kata");
  const [hoveredActiveText, setHoveredActiveText] = useState<string>("");

  // System states
  const [isConnecting, setIsConnecting] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dynamicUstadzList, setDynamicUstadzList] = useState<any[]>([]);
  const [demoTimeLeft, setDemoTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!currentUser || !currentUser.demoPremiumActivated || currentUser.paymentStatus !== "VERIFIED") {
      setDemoTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const expiresAt = currentUser.demoPremiumExpiresAt || 0;
      const remains = expiresAt - Date.now();
      if (remains <= 0) {
        clearInterval(interval);
        setDemoTimeLeft("WAKTU HABIS");
        refreshUserData();
      } else {
        const minutes = Math.floor(remains / 60000);
        const seconds = Math.floor((remains % 60000) / 1000);
        setDemoTimeLeft(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.username, currentUser?.demoPremiumExpiresAt, currentUser?.paymentStatus]);

  // Monitor and load dynamic ustadz listings
  const fetchDynamicUstadz = async () => {
    try {
      const res = await fetch("/api/ustadz");
      if (res.ok) {
        const data = await res.json();
        if (data.ustadz && data.ustadz.length > 0) {
          setDynamicUstadzList(data.ustadz);
        }
      }
    } catch (err) {
      console.warn("Gagal sinkron data ustadz:", err);
    }
  };

  useEffect(() => {
    fetchDynamicUstadz();
    const interval = setInterval(fetchDynamicUstadz, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // Speech fallbacks
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Trigger brief floating notifications
  const pushToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Synchronize latest user profile state with database
  const refreshUserData = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/students/profile/${currentUser.username}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("mengaji_session", JSON.stringify(data.user));
        }
      }
    } catch (err) {
      console.warn("Gagal sinkron data user sesaat.", err);
    }
  };

  // On boot authentication restorer & Realtime Database sync
  useEffect(() => {
    // Restore session
    const saved = localStorage.getItem("mengaji_session");
    const loggedOut = localStorage.getItem("mengaji_logged_out");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);
        syncProgress(u.username);
      } catch (e) {
        localStorage.removeItem("mengaji_session");
      }
    } else if (loggedOut !== "true") {
      // Auto-login to default premium student profile immediately
      const defaultUser = {
        id: "ahmad_mujahid",
        username: "ahmad_mujahid",
        name: "Ahmad Mujahid (Santri Utama)",
        email: "ahmad@mengaji.id",
        password: "ahmad",
        role: "Siswa",
        package: "Paket_Mengaji",
        selectedUstadz: "Ustadz Adi Hidayat",
        remainingMeetings: 12,
        sessionsCompleted: 4,
        studyTime: "Malam (19:30 - 21:00)",
        paymentStatus: "VERIFIED",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150",
        demoPremiumActivated: true,
        demoPremiumExpiresAt: Date.now() + 1000 * 60 * 60 * 24 * 300,
        createdAt: Date.now()
      };
      setCurrentUser(defaultUser);
      localStorage.setItem("mengaji_session", JSON.stringify(defaultUser));
      syncProgress("ahmad_mujahid");
      pushToast("Selamat datang! Anda otomatis masuk dengan akun Santri Utama.", "success");
    }

    // Health check checkmark
    fetch("/api/health")
      .then((res) => res.json())
      .then(() => {
        setIsConnecting(false);
      })
      .catch(() => {
        setIsConnecting(false);
      });
  }, []);

  // Poll database messages updates every 3 seconds for simulated realtime multi-user activity
  useEffect(() => {
    const fetchMessages = () => {
      fetch("/api/messages")
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch((err) => console.error("Gagal sinkron data obrolan:", err));
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Periodic background sync of currentUser details to reflect payment/meeting status immediately
  useEffect(() => {
    if (!currentUser) return;
    const syncUser = async () => {
      try {
        const res = await fetch(`/api/students/profile/${currentUser.username}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const me = data.user;
            if (
              me.paymentStatus !== currentUser.paymentStatus ||
              me.remainingMeetings !== currentUser.remainingMeetings ||
              me.sessionsCompleted !== currentUser.sessionsCompleted ||
              me.package !== currentUser.package ||
              me.selectedUstadz !== currentUser.selectedUstadz ||
              me.photoUrl !== currentUser.photoUrl
            ) {
              setCurrentUser(me);
              localStorage.setItem("mengaji_session", JSON.stringify(me));
            }
          }
        }
      } catch (err) {
        console.warn("Background user sync failed", err);
      }
    };
    syncUser();
    const interval = setInterval(syncUser, 4000);
    return () => clearInterval(interval);
  }, [currentUser?.username, currentUser?.paymentStatus, currentUser?.remainingMeetings, currentUser?.sessionsCompleted, currentUser?.package, currentUser?.selectedUstadz, currentUser?.photoUrl]);

  // Monitor typing indicators whenever an unanswered user query is logged
  useEffect(() => {
    const activeUstadzMsgs = messages.filter((m) => m.ustadz === activeChatUstadz);
    if (activeUstadzMsgs.length > 0) {
      const last = activeUstadzMsgs[activeUstadzMsgs.length - 1];
      if (!last.isFromUstadz && last.senderUid !== "gemini-ai") {
        setIsTyping(true);
        return;
      }
    }
    setIsTyping(false);
  }, [messages, activeChatUstadz]);

  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  const handleUpdateProfileSchedule = async (newTime: string) => {
    if (!currentUser) return;
    setIsUpdatingSchedule(true);
    try {
      const res = await fetch("/api/students/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username, studyTime: newTime })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast("Berhasil memperbarui pilihan jadwal bimbingan Anda!", "success");
        setCurrentUser(data.user);
        localStorage.setItem("mengaji_session", JSON.stringify(data.user));
      } else {
        pushToast(data.error || "Gagal memperbarui jadwal.", "error");
      }
    } catch {
      pushToast("Gagal memperbarui karena gangguan jaringan.", "error");
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const handleUpdateProfilePhoto = async (newPhotoUrl: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/students/profile/update-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username, photoUrl: newPhotoUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pushToast("Foto profil Anda berhasil diubah!", "success");
        setCurrentUser(data.user);
        localStorage.setItem("mengaji_session", JSON.stringify(data.user));
      } else {
        pushToast(data.error || "Gagal mengubah foto profil.", "error");
      }
    } catch {
      pushToast("Gangguan komunikasi ke server saat ubah foto.", "error");
    }
  };

  // Synchronize student's reading progression
  const syncProgress = (username: string) => {
    fetch(`/api/progress/get/${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.progress) {
          setLastReadSurah(data.progress);
        }
      })
      .catch((err) => console.error("Error progress:", err));
  };

  // Core Login flow
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      pushToast("Mohon isi semua isian masuk.", "error");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPassword }),
      });

      let data: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON Response body:", text);
        pushToast(`Server mengembalikan respon non-JSON (Status: ${res.status}). Hubungi developer atau cek akun database Anda.`, "error");
        return;
      }

      if (res.ok && data.success) {
        localStorage.removeItem("mengaji_logged_out");
        setCurrentUser(data.user);
        localStorage.setItem("mengaji_session", JSON.stringify(data.user));
        syncProgress(data.user.username);
        pushToast(`Selamat datang kembali, ${data.user.name}!`, "success");
        setLoginId("");
        setLoginPassword("");
      } else {
        pushToast(data.error || "Gagal masuk.", "error");
      }
    } catch (e: any) {
      console.error("Login connection error details:", e);
      pushToast(`Koneksi server terganggu: ${e.message || "Failed to reach server"}`, "error");
    }
  };

  // Authentication registration flow
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName || !regUsername || !regEmail || !regPassword) {
      pushToast("Isi data registrasi lengkap.", "error");
      return;
    }

    if (regRole === "Ustadz") {
      if (!regDegree || !regDegree.trim()) {
        pushToast("Lulusan wajib diisi untuk pendaftaran Guru.", "error");
        return;
      }
      if (!regUniversity || !regUniversity.trim()) {
        pushToast("Universitas wajib diisi untuk pendaftaran Guru.", "error");
        return;
      }
      if (!regProvince || !regProvince.trim()) {
        pushToast("Provinsi domisili kependudukan wajib diisi.", "error");
        return;
      }
      if (!regCountry || !regCountry.trim()) {
        pushToast("Negara domisili kependudukan wajib diisi.", "error");
        return;
      }
      if (!regNik || !regNik.trim()) {
        pushToast("NIK sesuai kependudukan wajib diisi.", "error");
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          username: regUsername,
          email: regEmail,
          password: regPassword,
          role: regRole,
          ustadzAccessCode: ustadzAccessCode,
          degree: regDegree,
          university: regUniversity,
          province: regProvince,
          country: regCountry,
          nik: regNik,
          qualificationTahsin: regTahsin,
          qualificationTajwid: regTajwid,
          qualificationFiqih: regFiqih,
          certificateName: regCertificateName,
          certificateData: regCertificateData
        }),
      });

      let data: any;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON Registration Response:", text);
        pushToast(`Gagal mendaftar (Status Server: ${res.status}). Silakan coba lagi.`, "error");
        return;
      }

      if (res.ok && data.success) {
        pushToast(`Akun dengan peran ${regRole} berhasil terdaftar!`, "success");
        fetchDynamicUstadz();
        setShowRegisterModal(false);
        setLoginId(regUsername);
        setLoginPassword(regPassword);
        // Reset fields
        setRegName("");
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegRole("Siswa");
        setUstadzAccessCode("");
        setRegDegree("");
        setRegUniversity("");
        setRegProvince("");
        setRegCountry("");
        setRegNik("");
        setRegTahsin(true);
        setRegTajwid(true);
        setRegFiqih(true);
        setRegCertificateName("");
        setRegCertificateData("");
      } else {
        pushToast(data.error || "Gagal membuat akun.", "error");
      }
    } catch (e: any) {
      console.error("Registration connection error details:", e);
      pushToast(`Koneksi gagal saat mendaftar: ${e.message || "Endpoint unreachable"}`, "error");
    }
  };

  // Reset password state handler
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetNewPassword) {
      pushToast("Isi rincian pemulihan sandi.", "error");
      return;
    }
    // Simulation / Local updates on matching email
    pushToast("Memproses permintaan pemulihan sandi Anda...", "info");
    setTimeout(() => {
      pushToast("Sandi baru Anda berhasil disimpan. Silakan masuk menggunakan password baru.", "success");
      setShowResetModal(false);
      setResetEmail("");
      setResetNewPassword("");
    }, 1500);
  };

  // Save read progression via digital Bookmark
  const bookmarkSurah = async (surahTitle: string) => {
    setLastReadSurah(surahTitle);
    if (!currentUser) {
      pushToast(`Progress ${surahTitle} disimpan sementara di browser Anda.`, "info");
      return;
    }

    try {
      const res = await fetch("/api/progress/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser.username, surahTitle }),
      });
      if (res.ok) {
        pushToast(`Tanda baca terakhir dipindahkan ke ${surahTitle}!`, "success");
      }
    } catch (e) {
      pushToast("Progress gagal disinkronkan ke server cloud.", "error");
    }
  };

  // Send Direct Message / Consult with Ustadz (AI + WhatsApp support)
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatText) return;

    if (chatMethod === "wa") {
      const phones: Record<string, string> = {
        "Ustadz Adi Hidayat": "6281234567890",
        "Ustadz Abdul Somad": "6289876543210",
        "Ustadzah Hana Miranda": "6281112223334",
      };
      const phone = phones[activeChatUstadz] || "6281234567890";
      const fullText = `Assalamu'alaikum ${activeChatUstadz},\n\nSaya ingin berkonsultasi mengenai hal berikut:\n"${chatText}"`;
      const encoded = encodeURIComponent(fullText);
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, "_blank");
      setShowChatModal(false);
      setChatText("");
      setChatSubject("");
      return;
    }

    if (!currentUser) {
      pushToast("Silakan masuk terlebih dahulu untuk menggunakan In-App Chat.", "error");
      return;
    }

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ustadz: activeChatUstadz,
          subject: chatSubject || "Konsultasi Syariah",
          sender: currentUser.name,
          senderUid: currentUser.id,
          text: chatText,
        }),
      });

      if (res.ok) {
        pushToast("Konsultasi Anda terkirim secara online ke Cloud!", "success");
        setChatText("");
        setChatSubject("");
        setShowChatModal(false);
        setActiveTab("messages");
      } else {
        pushToast("Gagal mengirim pertanyaan.", "error");
      }
    } catch (err) {
      pushToast("Gagal terhubung ke Cloud server.", "error");
    }
  };

  // Send reply within Chat Box Directly
  const handleSendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyInputText.trim() || !currentUser) return;

    const textToSend = replyInputText;
    setReplyInputText("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ustadz: activeChatUstadz,
          subject: "Balasan Diskusi",
          sender: currentUser.name,
          senderUid: currentUser.id,
          text: textToSend,
        }),
      });

      if (res.ok) {
        pushToast("Balasan terkirim!", "success");
      }
    } catch (e) {
      pushToast("Gagal mengirimkan balasan.", "error");
    }
  };

  // Arabic Recitation Audio Helper for Pointer Hover Settings
  const speakArabic = (text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any previous speaking elements immediately so it's snappy
    window.speechSynthesis.cancel();
    
    const cleanText = text.trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar-SA"; // Arabic
    utterance.rate = 0.65;     // slower rate for clear tajwid and phonetic precision
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  // Helper function to segment Arabic text into individual letters combined with their harakat
  const segmentArabicLetters = (text: string) => {
    const chars = Array.from(text);
    const segments: string[] = [];
    let temp = "";
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (c === " ") {
        if (temp) { segments.push(temp); temp = ""; }
        // Keep spaces separate so we output spaces in between letters
        segments.push(" ");
        continue;
      }
      
      const code = c.charCodeAt(0);
      // Diacritics (harakat, shadda, sukun, tanween, super alif, etc) range
      const isDiacritic = (code >= 0x064B && code <= 0x065F) || code === 0x0670 || code === 0x0615 || (code >= 0x0610 && code <= 0x061A);
      
      if (isDiacritic && temp) {
        temp += c;
      } else {
        if (temp) {
          segments.push(temp);
        }
        temp = c;
      }
    }
    if (temp) {
      segments.push(temp);
    }
    return segments;
  };

  // Play digital translation recitation audibly via Gemini TTS or Local fallbacks
  const playTTS = async (verseText: string, verseKey: string) => {
    // If already playing this, stop it
    if (playingVerseId === verseKey) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
      window.speechSynthesis.cancel();
      setPlayingVerseId(null);
      return;
    }

    setPlayingVerseId(verseKey);
    pushToast("Menyiapkan audio penjelasan tartil keteduhan...", "info");

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: verseText }),
      });
      const data = await res.json();

      if (res.ok && data.base64Audio) {
        const audioUrl = `data:audio/wav;base64,${data.base64Audio}`;
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        audio.play();
        audio.onended = () => {
          setPlayingVerseId(null);
        };
      } else {
        throw new Error("Gagal rendering audio Gemini, beralih ke Fallback.");
      }
    } catch (e) {
      console.warn("TTS beralih ke Native Web SpeechSynthesis API");
      // Fallback to browser's SpeechSynthesis Voice
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(verseText);
      utterance.lang = "id-ID";
      utterance.rate = 0.85; // slightly slower for tranquil, clear guidance
      utterance.onend = () => {
        setPlayingVerseId(null);
      };
      utterance.onerror = () => {
        setPlayingVerseId(null);
        pushToast("Gagal menyuarakan terjemahan. Coba lagi.", "error");
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  // Reset database murni (Hanya Admin Dev)
  const resetEntireDb = async () => {
    if (!confirm("Apakah Anda yakin ingin memulihkan database sistem ke kondisi pabrik? Semua akun tambahan & pesan akan dihapus.")) {
      return;
    }
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.ok) {
        pushToast("Database online berhasil di-murnikan kembali!", "success");
        logout();
      }
    } catch (e) {
      pushToast("Gagal mereset database.", "error");
    }
  };

  // Logout process
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("mengaji_session");
    localStorage.setItem("mengaji_logged_out", "true");
    setShowAccessPortal(false);
    pushToast("Berhasil keluar dari sesi belajar.", "info");
  };

  // Copy public link helper
  const handleCopyPublicLink = () => {
    try {
      const publicOrigin = window.location.origin;
      navigator.clipboard.writeText(publicOrigin);
      pushToast("Bagikan untuk membuka dashboard mu secara langsung lewat media sosial kamu; WhatsApp, IG, dst.", "success");
    } catch (e) {
      pushToast("Gagal menyalin tautan otomatis.", "error");
    }
  };

  // Quran filtering algorithm
  const currentSurah = quranData[selectedSurahKey];
  const filteredQuranList = Object.keys(quranData).filter((key) => {
    const s = quranData[key];
    const matchName = s.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchVerses = s.verses.some(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.latin.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return searchQuery === "" || matchName || matchVerses;
  });

  return (
    <div 
      id="mengajiid-app-frame" 
      className={`min-h-screen flex flex-col md:flex-row antialiased font-sans transition-colors duration-300 ${
        darkMode 
          ? "bg-[#090d16] text-slate-100 dark" 
          : "bg-[#f8fafc] text-indigo-950"
      }`}
    >
      
      {/* Toast Manager Notifications Overlay */}
      <div id="toast-manager" className="fixed top-6 right-6 z-[9999] space-y-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={`p-4 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-semibold border pointer-events-auto ${
                t.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : t.type === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <div className="text-sm">
                {t.type === "success" ? "✨" : t.type === "error" ? "🛑" : "💡"}
              </div>
              <p className="flex-1 leading-relaxed">{t.msg}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MOBILE TOP BAR HEADER */}
      <header 
        id="mobile-top-bar" 
        className={`flex md:hidden items-center justify-between px-5 py-4 border-b shadow-sm z-30 sticky top-0 shrink-0 transition-colors ${
          darkMode 
            ? "bg-[#0f172a] border-slate-800 text-white" 
            : "bg-[#9cbdfa] border-sky-305 text-teal-950"
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl bg-white p-1 rounded-xl shadow-inner border border-sky-300">🕋</span>
          <div className="text-left">
            <h1 className="text-lg font-black tracking-tight leading-none text-teal-950 font-sans uppercase">Mengaji.ID</h1>
            <span className="text-[8px] text-sky-900 font-extrabold tracking-wider uppercase block mt-0.5">Tadarus & Konsultasi</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Terang / Gelap Switcher */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode ? "bg-slate-850 border-slate-700 text-amber-400" : "bg-white border-sky-300 text-slate-700 hover:bg-sky-50"
            }`}
            title="Aktifkan Mode Terang / Gelap"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Access / Profile portal clicker (Icon Orang Sejajar) */}
          <button
            type="button"
            onClick={() => setShowAccessPortal(true)}
            className="p-2 rounded-xl border border-sky-450 bg-sky-600 text-white hover:bg-sky-700 transition"
            title={currentUser ? "Profil Pengguna" : "Pintu Masuk Terpadu"}
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Hamburger menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-xl transition-all border ${
              darkMode 
                ? "bg-slate-850 text-white border-slate-700" 
                : "bg-white text-sky-955 border-sky-200"
            }`}
            title="Buka Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-red-500" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar overlay backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside 
        id="sidebar-panel" 
        className={`flex flex-col p-6 shrink-0 border-r fixed md:static top-0 bottom-0 left-0 z-50 h-full md:h-auto w-64 transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${
          darkMode 
            ? "bg-[#0c1322] border-slate-800 text-slate-200" 
            : "bg-white border-slate-200/80 text-slate-800"
        }`}
      >
        <div id="brand-logo" className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl bg-slate-900 border border-amber-500/20 p-2.5 rounded-2xl shadow-xs shrink-0 select-none">🕋</span>
            <div className="text-left">
              <h1 className="text-2xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white font-sans uppercase">Mengaji.ID</h1>
              <span className="text-[9px] text-[#2563eb] dark:text-sky-400 font-black tracking-wider uppercase block mt-1">Tadarus & Konsultasi</span>
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Dynamic Connected User Card */}
        <div id="user-info-card" className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center space-x-3 border border-slate-200/60 dark:border-slate-850 shadow-xs">
          {currentUser && currentUser.photoUrl ? (
            <img 
              src={currentUser.photoUrl} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-lg border border-slate-300 dark:border-slate-600 shadow-inner shrink-0 leading-none">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : "T"}
            </div>
          )}
          <div className="overflow-hidden flex-1 text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {currentUser ? currentUser.name : "Tamu Pelajar"}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
              {currentUser 
                ? (currentUser.role === "Admin" 
                   ? "Cloud Admin 👑" 
                   : currentUser.role === "Ustadz" 
                     ? "Ustadz / Pengajar 🕌" 
                     : `Siswa (${(currentUser.package || "Belum Aktif").split("_").join(" ")})`)
                : "Siswa Biasa"}
            </span>
            {currentUser && currentUser.demoPremiumActivated && currentUser.paymentStatus === "VERIFIED" && demoTimeLeft && (
              <span className="text-[9px] text-amber-600 font-extrabold tracking-wider block mt-1 animate-pulse font-mono">
                ⏱️ Demo: {demoTimeLeft}
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav buttons */}
        <nav id="nav-navigation-menu" className="flex-1 space-y-1.5 font-sans">
          {currentUser?.role === "Ustadz" && (
            <button
              onClick={() => {
                setActiveTab("ustadz-panel");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "ustadz-panel"
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                  : "hover:bg-slate-50 dark:hover:bg-slate-850/40 text-slate-600 dark:text-slate-350"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="flex-1">Kelas Pengajar 🕌</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "dashboard"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                : "hover:bg-slate-50 dark:hover:bg-slate-850/40 text-slate-600 dark:text-slate-350"
            }`}
          >
            <Activity className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="flex-1">Kajian Terkini</span>
          </button>

          <button
            onClick={() => {
              if (currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED") {
                pushToast("Fitur terkunci! Silakan aktifkan Kelas Bimbingan Premium Anda pada panel pembayaran.", "error");
                return;
              }
              setActiveTab("quran");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "quran"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                : "hover:bg-slate-50 dark:hover:bg-slate-855/40 text-slate-600 dark:text-slate-350"
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="flex-1">Al-Qur'an Digital</span>
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED" && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                pushToast("Silakan masuk terlebih dahulu untuk membuka Pesan.", "error");
                return;
              }
              if (currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED") {
                pushToast("Fitur terkunci! Silakan aktifkan Kelas Bimbingan Premium Anda pada panel pembayaran.", "error");
                return;
              }
              setActiveTab("messages");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "messages"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                : "hover:bg-slate-50 dark:hover:bg-slate-855/40 text-slate-600 dark:text-slate-350"
            }`}
          >
            <div className="relative flex items-center shrink-0">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              {messages.filter((m) => m.ustadz === activeChatUstadz).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-heartbeat" />
              )}
            </div>
            <span className="flex-1 pl-2.5">Ruang Konsultasi</span>
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED" && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
          </button>

          <button
            onClick={() => {
              if (currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED") {
                pushToast("Fitur terkunci! Silakan aktifkan Kelas Bimbingan Premium Anda pada panel pembayaran.", "error");
                return;
              }
              setActiveTab("ustadz-list");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "ustadz-list"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                : "hover:bg-slate-50 dark:hover:bg-slate-855/40 text-slate-600 dark:text-slate-350"
            }`}
          >
            <Users className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="flex-1">Daftar Guru</span>
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED" && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                pushToast("Silakan login untuk mengakses materi.", "error");
                return;
              }
              if (currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED") {
                pushToast("Fitur terkunci! Silakan aktifkan Kelas Bimbingan Premium Anda pada panel pembayaran.", "error");
                return;
              }
              setActiveTab("materials");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === "materials"
                ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                : "hover:bg-slate-50 dark:hover:bg-slate-855/40 text-slate-600 dark:text-slate-350"
            }`}
          >
            <Award className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="flex-1">Materi & Silabus</span>
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED" && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
          </button>

          {currentUser?.role === "Admin" && (
            <button
              onClick={() => {
                setActiveTab("admin");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === "admin"
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 font-extrabold border-l-4 border-sky-600 shadow-xs"
                  : "hover:bg-slate-50 dark:hover:bg-slate-855/40 text-slate-600 dark:text-slate-350"
              }`}
            >
              <GraduationCap className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Panel Admin</span>
            </button>
          )}
        </nav>

        {/* Bottom system commands */}
        <div id="sidebar-footer-commands" className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-col space-y-2.5">
          {currentUser && (
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Keluar Akun</span>
            </button>
          )}

          {currentUser?.role === "Admin" && (
            <button
              onClick={resetEntireDb}
              style={{ fontSize: "9px" }}
              className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-mono transition flex items-center justify-center space-x-2 border border-slate-200/50 dark:border-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
              <span>Reset Cloud DB</span>
            </button>
          )}

          {/* BAGIKAN LINK SEBAGAI TAUTAN UMUM */}
          <div className="bg-slate-50 dark:bg-slate-800/20 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 text-left">
            <span className="font-extrabold text-[9px] text-sky-700 dark:text-sky-400 uppercase block mb-1">🔗 Bagikan Link Kelas</span>
            <button
              onClick={handleCopyPublicLink}
              className="w-full py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center justify-center space-x-1.5 active:scale-95 text-[9px] cursor-pointer"
              title="Salin alamat web bimbingan umum"
            >
              <Share2 className="w-3 h-3 text-white" />
              <span>Salin Link Publik</span>
            </button>
          </div>

          <div 
            style={{ fontSize: "9.5px", fontFamily: "Arial, sans-serif" }} 
            className="text-slate-500 dark:text-slate-400 text-center tracking-wide font-semibold bg-slate-50/50 dark:bg-slate-800/10 py-2.5 px-2 rounded-xl border border-slate-200/40 dark:border-slate-800"
          >
            develop by Jaenudin_chin.joung80@gmail.com
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE CONTENT AREA */}
      <main id="core-workspace-container" className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col">
        
        {/* Dynamic Countdown Trial Banner */}
        {currentUser && currentUser.demoPremiumActivated && currentUser.paymentStatus === "VERIFIED" && (
          <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse shrink-0">
            <div className="flex items-center space-x-3 text-left">
              <span className="text-xl">⏱️</span>
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Akses Uji Coba Demo Premium Aktif</h4>
                <p className="text-[10px] text-amber-700 leading-tight">
                  Anda memiliki waktu terbatas 10 menit untuk mencoba seluruh fitur belajar premium Mengaji.ID.
                </p>
              </div>
            </div>
            <div className="bg-amber-600 text-white font-mono text-xs font-black px-3.5 py-1.5 rounded-2xl shadow-sm tracking-widest self-start sm:self-center">
              SISA: {demoTimeLeft || "10:00"}
            </div>
          </div>
        )}

        {/* TOP STATUS HEADER BAR */}
        <header id="status-header-bar" className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/50 dark:border-slate-800/60 pb-5 mb-8 shrink-0 gap-4">
          <div className="text-left">
            <h2 id="top-title" className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {activeTab === "dashboard" ? "Course Grid" : (
                <>
                  {activeTab === "quran" && "Mushaf Al-Qur'an Digital"}
                  {activeTab === "messages" && "Ruang Diskusi Keislaman"}
                  {activeTab === "ustadz-list" && "Guru & Pembina Mengaji"}
                  {activeTab === "materials" && "Silabus & Materi Pendukung"}
                  {activeTab === "admin" && "Halaman Pengawas Admin"}
                  {activeTab === "ustadz-panel" && "Kelas Halaqah Live Pengajar"}
                </>
              )}
            </h2>
            <p id="top-subtitle" className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
              {activeTab === "dashboard" && "Temukan silabus bimbingan mengaji silsilah hafidz Qur'an terbaik secara online."}
              {activeTab === "quran" && "Peroleh kenyamanan membaca firman Allah dengan bimbingan makhraj tajwid ustadz."}
              {activeTab === "messages" && "Konsultasi langsung santri bersama dewan ustadz bersertifikat keahlian."}
              {activeTab === "ustadz-list" && "Semua ustadz siap membimbing belajar mengaji maupun konsultasi keagamaan umum."}
              {activeTab === "materials" && "Unduh naskah PDF kajian bersertifikat dan materi infografis tajwid harian."}
              {activeTab === "admin" && "Rekapitulasi santri terdaftar, sisa pertemuan, edit data ustadz dan kelola file materi."}
              {activeTab === "ustadz-panel" && "Kelola santri bimbingan Anda, koordinasikan jadwal belajar, dan pandu bimbingan tatap muka."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {/* Dynamic Universal Search Pill (Visible in screenshot) */}
            {(activeTab === "dashboard" || activeTab === "quran" || activeTab === "ustadz-list" || activeTab === "materials") && (
              <div className="relative shrink-0 w-full xs:w-48 sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={activeTab === "dashboard" ? courseSearchQuery : searchQuery}
                  onChange={(e) => {
                    if (activeTab === "dashboard") {
                      setCourseSearchQuery(e.target.value);
                    } else {
                      setSearchQuery(e.target.value);
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-full text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>
            )}

            {/* Mode Terang / Gelap Switcher (Rounded-full in image) */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center shrink-0 w-8.5 h-8.5"
              title="Aktifkan Mode Terang / Gelap"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Pintu Masuk / Profil Pengguna (Rounded-full "Masuk / Daftar" button as seen in image) */}
            <button
              type="button"
              onClick={() => setShowAccessPortal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs transition active:scale-95 shadow-xs shrink-0 cursor-pointer"
              title={currentUser ? "Profil Pengguna" : "Pintu Masuk Terpadu"}
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentUser ? currentUser.name : "Masuk / Daftar"}</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE MIDDLE BODY */}
        <div id="tabs-routing-outlet" className="flex-1 flex flex-col">
          
          {/* ===================== TAB 1: KAJIAN TERKINI / DASHBOARD ===================== */}
          {activeTab === "dashboard" && (() => {
            const courses = [
              {
                id: "course-1",
                title: "Tahsin Qur'an with Ustadz Adi Hidayat",
                teacher: "Ustadz Adi Hidayat",
                image: quranOpenImg,
                badge: "Free",
                syllabus: ["Tahsin Quran", "Manfaat Belajar Tajwid", "Metode Makhorijul Huruf"]
              },
              {
                id: "course-2",
                title: "Tahsin Qur'an with Ustadz Adi Hidayat",
                teacher: "Ustadz Adi Hidayat",
                image: ustadzImg,
                badge: "Free",
                secondaryBadge: "Free",
                syllabus: ["Tahsin Green Courses", "Halaman Syllabus", "Syllabus Tema Syllabus"]
              },
              {
                id: "course-3",
                title: "Al-Qur'an Digital",
                teacher: "Tafsir & Tajwid",
                image: quranDigitalImg,
                badge: "Free",
                syllabus: ["Tafsir Quran Courses", "Halaman Syllabus", "Syllabus Tema Syllabus"]
              }
            ];

            const filteredCourses = courses.filter(course =>
              course.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
              course.teacher.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
              course.syllabus.some(s => s.toLowerCase().includes(courseSearchQuery.toLowerCase()))
            );

            return (
              <div className="space-y-10 flex-1 flex flex-col">
                
                {/* ===================== STUNNING BENTO COURSE GRID ===================== */}
                <div id="course-pricing-grid-section" className="animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCourses.map((course) => (
                      <div 
                        key={course.id}
                        className="bg-white dark:bg-[#0c1322] border border-slate-200/60 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-xs hover:shadow-[0_12px_36px_rgba(15,23,42,0.05)] hover:-translate-y-1 flex flex-col justify-between h-full group transition-all duration-300"
                      >
                        <div>
                          {/* Course Cover Image */}
                          <div className="p-4 pb-0 relative">
                            <div className="w-full h-44 rounded-[24px] overflow-hidden relative shadow-inner bg-slate-50 dark:bg-slate-900/40">
                              <img 
                                src={course.image} 
                                alt={course.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              {/* Overlay Badge */}
                              <div className="absolute top-4 right-4 bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
                                {course.badge}
                              </div>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="p-6 pt-4 text-left">
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-2">
                              <span>ONLINE CLASS</span>
                              <span>•</span>
                              <span className="text-[#2563eb] dark:text-sky-400 font-black">{course.teacher}</span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug font-sans group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {course.title}
                            </h3>

                            {/* Price Label (Exactly as in screenshot) */}
                            <div className="mt-4 flex items-baseline space-x-2.5">
                              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Free</span>
                              {course.secondaryBadge && (
                                <span className="text-[9px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                  {course.secondaryBadge}
                                </span>
                              )}
                            </div>

                            {/* Syllabus Pre-peek (Exactly matching white background / grey capsule) */}
                            <div className="mt-5 p-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Syllabus Pre-peek</h4>
                              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 font-semibold mb-1">
                                {course.syllabus.map((item, keyIdx) => (
                                  <li key={keyIdx} className="flex items-center space-x-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="truncate">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Button Action */}
                        <div className="p-6 pt-0">
                          <button 
                            type="button"
                            onClick={() => {
                              if (course.id === "course-3") {
                                setActiveTab("quran");
                              } else {
                                setActiveTab("ustadz-list");
                              }
                              pushToast(`Mulai belajar "${course.title}"...`, "success");
                            }}
                            className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 dark:hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl tracking-wider uppercase transition-all flex items-center justify-center space-x-2 group-hover:bg-[#2563eb] cursor-pointer"
                          >
                            <span>Mulai Belajar Sekarang</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ORIGINAL INTERACTIVE WIDGETS LOWER SECTION */}
                <div id="view-dashboard" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                
                {/* LEFT PROFILE & CONTEXT CARD */}
                <div id="col-profiles" className="lg:col-span-1 space-y-6">
                
                  {/* TAUTAN BAGIKAN INFORMASI PUBLIK (Bebas Sandbox AI Studio) */}
                  {!currentUser && (
                    <div className="bg-white border border-slate-200 p-4 rounded-3xl text-left space-y-2.5 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🌐</span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">Akses Publik Bebas Hambatan</h4>
                          <span className="text-[8.5px] text-sky-750 font-extrabold block mt-1 uppercase">Bebas dari login sandbox AI STUDIO</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-550 leading-relaxed font-semibold">
                        Aplikasi bimbingan mengaji online Mengaji.ID ini dapat langsung diakses publik menggunakan web browser biasa (Chrome, Safari, Mozilla, dll.).
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPublicLink}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] py-2 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow shadow-sky-600/10 active:scale-95 border border-sky-600/30"
                      >
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>Salin Link Umum untuk Siswa</span>
                      </button>
                    </div>
                  )}
                
                {/* LOGIN CARD (If guest) */}
                {!currentUser && (
                  <div id="login-form-widget" className={`p-6 rounded-3xl border transition-all text-left ${
                    darkMode 
                      ? "bg-[#0f172a] border-slate-800 text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]" 
                      : "bg-white border-sky-100 text-slate-850 shadow-md shadow-sky-100/30"
                  }`}>
                    {/* Header */}
                    <div className="flex items-center space-x-2.5 mb-4 border-b border-sky-100 dark:border-slate-800 pb-2.5">
                      <span className="text-xl">🕌</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-805 dark:text-white uppercase tracking-wider leading-none">Pintu Masuk Terpadu</h3>
                        <span className="text-[9px] text-sky-700 dark:text-sky-400 font-extrabold tracking-wide block mt-1 uppercase">Siswa & Ustadz Mengaji.ID</span>
                      </div>
                    </div>

                    {/* Tab Header Selector */}
                    <div className="flex border-b border-slate-150 dark:border-slate-800 mb-4">
                      <button
                        type="button"
                        onClick={() => setPortalTab("login")}
                        className={`flex-1 pb-2 font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-center text-xs ${
                          portalTab === "login"
                            ? "border-sky-600 text-sky-600 dark:text-sky-400"
                            : "border-transparent text-slate-400"
                        }`}
                      >
                        Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalTab("register")}
                        className={`flex-1 pb-2 font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-center text-xs ${
                          portalTab === "register"
                            ? "border-sky-600 text-sky-600 dark:text-sky-400"
                            : "border-transparent text-slate-400"
                        }`}
                      >
                        Daftar Baru
                      </button>
                    </div>

                    {portalTab === "login" ? (
                      /* SUB-TAB: MASUK/LOGIN */
                      <form onSubmit={async (e) => {
                        await handleLogin(e);
                      }} className="space-y-4 pt-1">
                        <div>
                          <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest text-left mb-1.5">Nama Pengguna / Email</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User className="w-4 h-4" /></span>
                            <input 
                              type="text" 
                              placeholder="username / email@gmail.com" 
                              value={loginId}
                              onChange={(e) => setLoginId(e.target.value.toLowerCase().trim())}
                              required
                              className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest text-left mb-1.5">Sandi Masuk Anda</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock className="w-4 h-4" /></span>
                            <input 
                              type={showLoginPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              required
                              className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            >
                              {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-2xs pt-1">
                          <label className="flex items-center text-slate-400 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 mr-1.5" /> 
                            <span>Ingat Sesi Saya</span>
                          </label>
                          <button type="button" onClick={() => { setShowResetModal(true); }} className="text-sky-600 dark:text-sky-400 hover:underline font-bold">Lupa Sandi?</button>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md shadow-sky-600/10 text-xs tracking-wider cursor-pointer"
                        >
                          Hubungkan Sesi Mengaji
                        </button>
                      </form>
                    ) : (
                      /* SUB-TAB: DAFTAR BARU */
                      <form onSubmit={async (e) => {
                        await handleRegister(e);
                      }} className="space-y-3.5 pt-1 text-left">
                        <div>
                          <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest mb-1 font-sans">Nama Lengkap</label>
                          <input 
                            type="text" 
                            placeholder="Masukkan nama lengkap..." 
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1 font-sans">Username Masuk (Tanpa Spasi)</label>
                          <input 
                            type="text" 
                            placeholder="username_baru" 
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1 font-sans">Surat Elektronik (Email)</label>
                          <input 
                            type="email" 
                            placeholder="nama@gmail.com" 
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1">Kata Sandi Baru (Password)</label>
                          <div className="relative">
                            <input 
                              type={showAccessPortalPassword ? "text" : "password"} 
                              placeholder="Sandi Rahasia (Min. 6 Karakter)" 
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              required
                              className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowAccessPortalPassword(!showAccessPortalPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            >
                              {showAccessPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1">Daftar sebagai Peran</label>
                          <select 
                            value={regRole} 
                            onChange={(e) => setRegRole(e.target.value as "Siswa" | "Ustadz")}
                            required
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none bg-white ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                            }`}
                          >
                            <option value="Siswa">Siswa / Santri Belajar 📖</option>
                            <option value="Ustadz">Ustadz / Ustadzah Pembina 🕌</option>
                          </select>
                        </div>

                        {regRole === "Ustadz" && (
                          <div className={`space-y-3.5 p-3.5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`}>
                            <p className={`text-[10px] font-bold ${darkMode ? "text-sky-400" : "text-emerald-800"}`}>🔒 DATA KEPENDUDUKAN & AKADEMIK GURU</p>
                            
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                                Kode Akses Guru (Wajib)
                              </label>
                              <input 
                                type="text" 
                                placeholder="Masukkan Kode Akses Guru..." 
                                value={ustadzAccessCode}
                                onChange={(e) => setUstadzAccessCode(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                              <span className="text-[8px] text-slate-400 mt-1 block">Kode Akses Pengajar Demo: <span className="font-mono font-bold text-sky-655 dark:text-sky-300">Guru1$</span></span>
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                                Nomor Induk Kependudukan / NIK (Wajib)
                              </label>
                              <input 
                                type="text" 
                                placeholder="Silakan masukkan 16 digit NIK..." 
                                value={regNik}
                                onChange={(e) => setRegNik(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Provinsi (KTP)</label>
                                <input 
                                  type="text" 
                                  placeholder="Provinsi..." 
                                  value={regProvince}
                                  onChange={(e) => setRegProvince(e.target.value)}
                                  required
                                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Negara (KTP)</label>
                                <input 
                                  type="text" 
                                  placeholder="Negara..." 
                                  value={regCountry}
                                  onChange={(e) => setRegCountry(e.target.value)}
                                  required
                                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Lulusan / Gelar (Wajib)</label>
                                <input 
                                  type="text" 
                                  placeholder="Misal: Lc., S.Ag., M.Ag" 
                                  value={regDegree}
                                  onChange={(e) => setRegDegree(e.target.value)}
                                  required
                                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Universitas (Wajib)</label>
                                <input 
                                  type="text" 
                                  placeholder="Universitas..." 
                                  value={regUniversity}
                                  onChange={(e) => setRegUniversity(e.target.value)}
                                  required
                                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                    darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                  }`}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1.5">
                                Keahlian Mengajar (Centang Kualifikasi)
                              </label>
                              <div className={`flex flex-col gap-1.5 p-2 border rounded-lg ${
                                darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                              }`}>
                                <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={regTahsin} 
                                    onChange={(e) => setRegTahsin(e.target.checked)} 
                                    className="rounded text-sky-600 focus:ring-sky-500" 
                                  />
                                  <span>Tahsin Al-Qur'an</span>
                                </label>
                                <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={regTajwid} 
                                    onChange={(e) => setRegTajwid(e.target.checked)} 
                                    className="rounded text-sky-600 focus:ring-sky-500" 
                                  />
                                  <span>Tajwid Terpadu</span>
                                </label>
                                <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={regFiqih} 
                                    onChange={(e) => setRegFiqih(e.target.checked)} 
                                    className="rounded text-sky-600 focus:ring-sky-500" 
                                  />
                                  <span>Fiqih Dasar & Ibadah</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                                Sertifikat Kompetensi / Syahadah (Tambahan / Opsional)
                              </label>
                              <div className={`border border-dashed rounded-lg p-2.5 flex flex-col items-center justify-center text-center ${
                                darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                              }`}>
                                <input 
                                  type="file" 
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setRegCertificateName(file.name);
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        setRegCertificateData(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden" 
                                  id="sidebar-reg-cert-file"
                                />
                                <label htmlFor="sidebar-reg-cert-file" className="cursor-pointer text-[10px] text-sky-600 dark:text-sky-400 font-extrabold hover:underline">
                                  {regCertificateName ? `✓ ${regCertificateName}` : "Pilih File Sertifikat..."}
                                </label>
                                <span className="text-[8px] text-slate-400 block mt-0.5">PDF/JPG Maks 2MB</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          className="w-full bg-sky-650 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md shadow-sky-600/10 text-xs tracking-wider cursor-pointer mt-2"
                        >
                          Daftar Akun Baru
                        </button>
                      </form>
                    )}

                    <div className="bg-sky-50 dark:bg-slate-850 p-3 rounded-2xl border border-sky-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 mt-4 text-left space-y-1.5 font-medium">
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                        <span>💡</span> <span>Gunakan Akun Demo Hubungan:</span>
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>Siswa Belajar:</span>
                          <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-sky-100 dark:border-slate-700">user: siswa • pass: 123</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-500">
                          <span>Guru Pembina:</span>
                          <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-sky-100 dark:border-slate-700">user: guru • pass: 123</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SIGNED PROFILE CARD (If logged in) */}
                {currentUser && (
                  <div id="profile-status-widget" className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/50">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-100">Aktif Mengaji</span>
                      <button onClick={logout} className="text-slate-400 hover:text-rose-600 transition-colors"><LogOut className="w-4 h-4" /></button>
                    </div>

                    <div className="text-center pb-5 border-b border-slate-100">
                      <div className="relative group mx-auto w-20 h-20 mb-3 cursor-pointer">
                        {currentUser.photoUrl ? (
                          <img 
                            src={currentUser.photoUrl} 
                            alt="Foto Profil" 
                            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-emerald-100/80 shadow-md group-hover:brightness-75 transition-all"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl font-black mx-auto border-4 border-emerald-50 shadow-inner group-hover:brightness-95 transition-all">
                            {currentUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full text-white text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span>GANTI FOTO</span>
                          <span className="text-[7px] text-slate-300 font-mono mt-0.5">MAKS 1.5MB</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 1500000) {
                                  pushToast("Ukuran foto atau gambar terlalu besar. Maksimal 1.5 MB.", "error");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                  const base64 = reader.result as string;
                                  try {
                                    const res = await fetch("/api/students/profile/update-photo", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        username: currentUser.username,
                                        photoUrl: base64
                                      })
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                      pushToast("Foto profil berhasil diperbarui!", "success");
                                      setCurrentUser(data.user);
                                      localStorage.setItem("mengaji_session", JSON.stringify(data.user));
                                    } else {
                                      pushToast("Gagal memperbarui foto.", "error");
                                    }
                                  } catch (err) {
                                    pushToast("Terjadi kesalahan sistem.", "error");
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-800 mt-2">{currentUser.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{currentUser.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 text-center">
                      <div 
                        onClick={() => setActiveTab("quran")}
                        className="bg-slate-50 hover:bg-emerald-50/50 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-all"
                      >
                        <Bookmark className="w-4 h-4 mx-auto text-emerald-600" />
                        <p className="text-[9px] text-slate-400 mt-1">Bookmark Terakhir</p>
                        <p className="text-xxs font-extrabold text-slate-800 mt-0.5 truncate">{lastReadSurah}</p>
                      </div>

                      <div 
                        onClick={() => setActiveTab("messages")}
                        className="bg-slate-50 hover:bg-emerald-50/50 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-all"
                      >
                        <MessageSquare className="w-4 h-4 mx-auto text-emerald-600" />
                        <p className="text-[9px] text-slate-400 mt-1">Konsultasi Saya</p>
                        <p className="text-xxs font-extrabold text-slate-800 mt-0.5">
                          {messages.filter((m) => m.senderUid === currentUser.id || m.ustadz === activeChatUstadz).length} Pesan
                        </p>
                      </div>
                    </div>

                    {/* Premium Activation Code Column / Panel (Requirement 2) */}
                    {currentUser.role === "Siswa" && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/10 border border-emerald-500/20 text-slate-800 text-left">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">Status Bimbingan</span>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${currentUser.paymentStatus === "VERIFIED" ? "bg-emerald-500 text-white" : "bg-teal-700/80 text-teal-100 animate-pulse"}`}>
                            {currentUser.paymentStatus === "VERIFIED" ? "AKTIF PREMIUM" : "Menunggu Aktif"}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mt-2 text-[10.5px]">
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="font-semibold text-xxs">Model Paket Kelas:</span>
                            <span className="font-black text-emerald-900">{(currentUser.package || "BELUM AKTIF").replace("_", " ")}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="font-semibold text-xxs">Sisa Pertemuan:</span>
                            <span className="font-black text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">{currentUser.remainingMeetings ?? 0} / {currentUser.totalMeetings ?? 0}</span>
                          </div>
                          
                          {currentUser.activationCode && (
                            <div className="bg-white border border-teal-500/10 p-2 rounded-xl mt-2.5 shadow-inner">
                              <span style={{ fontSize: "8.5px" }} className="text-slate-400 font-extrabold block uppercase tracking-tight">KODE UNIK AKTIVASI (COLUMN):</span>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono font-black text-[12px] text-teal-800 tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 select-all">{currentUser.activationCode}</span>
                                <span className="text-[8px] font-extrabold bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded">TERVERIFIKASI</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAJWID CORNER QUICK STUDY */}
                <div id="study-corner-banner" className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg border border-white/10 text-left">
                  <div className="relative z-10">
                    <span className="text-[9px] font-extrabold tracking-widest text-pink-200 uppercase">Belajar & Hafalan</span>
                    <h4 className="text-base font-bold text-white mt-1 leading-snug">Mari Mengaji Hari Ini</h4>
                    <p className="text-2xs text-slate-100 mt-2 leading-relaxed">
                      Sesuai sabda Rasulullah SAW: "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
                    </p>
                    <button 
                      onClick={() => setActiveTab("quran")}
                      className="mt-4 bg-white/20 hover:bg-white/30 text-white text-[10px] font-extrabold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 border border-white/20"
                    >
                      Buka Mus-haf Digital
                    </button>
                  </div>
                  <span className="absolute -right-8 -bottom-8 text-9xl opacity-5 font-serif select-none pointer-events-none">📖</span>
                </div>
              </div>

              {/* RIGHT SCHEDULES & RECOMMENDED USTADZ */}
              <div id="col-schedules" className="lg:col-span-2 space-y-8">
                
                {/* JADWAL KAJIAN ONLINE TABEL */}
                <div id="schedules-card-container" className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">📅</span>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Jadwal Halaqah Terdekat</h3>
                    </div>
                    <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold border border-red-100 animate-pulse">Live</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/70 text-slate-500 text-xxs uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 px-5 font-bold">Waktu & Pembimbing</th>
                          <th className="py-3 px-5 font-bold">Topik Pembahasan</th>
                          <th className="py-3 px-5 font-bold">Tautan Rapat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-slate-800">Ustadz Adi Hidayat</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Senin • 16:00 WIB (Sore)</div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 font-medium">Bimbingan Tartil Tajwid Lengkap</td>
                          <td className="py-3.5 px-5">
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  pushToast("Siswa wajib login terlebih dahulu untuk mengakses link harian.", "error");
                                  return;
                                }
                                window.open("https://zoom.us", "_blank");
                              }}
                              className="inline-flex items-center space-x-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Buka Zoom</span>
                            </button>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-slate-800">Ustadz Abdul Somad</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Rabu • 19:30 WIB (Isya)</div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600 font-medium">Tafsir Hikmah Quranis & Hadits</td>
                          <td className="py-3.5 px-5">
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  pushToast("Siswa wajib login terlebih dahulu untuk mengakses link harian.", "error");
                                  return;
                                }
                                window.open("https://meet.google.com", "_blank");
                              }}
                              className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all"
                            >
                              <Laptop className="w-3.5 h-3.5" />
                              <span>Buka GMeet</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* USTADZ PREVIEW FOR DIRECT CHAT */}
                <div id="ustadz-quick-consult" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Para Ustadz Pembimbing</h3>
                    <button onClick={() => setActiveTab("ustadz-list")} className="text-[11px] text-emerald-700 hover:underline font-bold">Lihat Semua Guru</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(dynamicUstadzList.length > 0 ? dynamicUstadzList : ustadzList).slice(0, 2).map((u, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/50 flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 bg-teal-50 text-teal-900 border border-teal-100 rounded-xl flex items-center justify-center font-extrabold text-xs mb-3">
                            {u.initials}
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-800">{u.name}</h4>
                          <p className="text-[10px] text-teal-800 font-semibold mt-1">{u.specialization}</p>
                          <p className="text-xxs text-slate-400 mt-1 lines-2 leading-relaxed">{u.desc}</p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveChatUstadz(u.name);
                            setShowChatModal(true);
                          }}
                          className="mt-4 w-full text-xxs font-extrabold text-teal-900 hover:text-white bg-slate-50 hover:bg-teal-950 py-2.5 rounded-xl text-center border border-slate-100 transition-all flex items-center justify-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Hubungi Privat</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Premium Student Payment & Verification Box */}
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus !== "VERIFIED" && (
              <PaymentActivation 
                currentUser={currentUser} 
                onActivated={(updatedUser) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem("mengaji_session", JSON.stringify(updatedUser));
                }} 
                pushToast={pushToast} 
              />
            )}

            {/* Premium Activated Student live bimbingan */}
            {currentUser && currentUser.role === "Siswa" && currentUser.paymentStatus === "VERIFIED" && (
              <LiveSessionRoom 
                currentUser={currentUser} 
                onSessionCompleted={async () => {
                  try {
                    const res = await fetch("/api/sessions/deduct", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username: currentUser.username })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.success && data.user) {
                        setCurrentUser(data.user);
                        localStorage.setItem("mengaji_session", JSON.stringify(data.user));
                        pushToast("Alhamdulillah, kuota bimbingan 30 menit berhasil tercatat dikurangi.", "success");
                      }
                    }
                  } catch (err) {
                    console.error("Error updating user session state", err);
                  }
                }} 
                pushToast={pushToast} 
              />
            )}

          </div>
        );
        })()}

          {/* ===================== TAB 2: AL-QURAN DIGITAL ===================== */}
          {activeTab === "quran" && (
            <div id="view-quran" className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in flex-1">
              
              {/* SURAH LIST SELECTOR */}
              <div id="surah-list-panel" className="lg:col-span-1 bg-white p-4 rounded-3xl shadow-sm border border-slate-200/50 space-y-3 h-fit">
                <div className="pb-3 mb-2 border-b border-slate-100">
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Pencarian Surah & Kandungan</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Cari kata/ayat..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div id="surah-buttons-group" className="space-y-1 max-h-[350px] overflow-y-auto">
                  {filteredQuranList.length === 0 ? (
                    <p className="text-xxs text-slate-400 text-center py-5">Tercatat 0 hasil.</p>
                  ) : (
                    filteredQuranList.map((key) => {
                      const s = quranData[key];
                      const active = selectedSurahKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedSurahKey(key)}
                          className={`w-full text-left p-3 rounded-xl flex justify-between items-center transition-all ${
                            active 
                              ? "bg-slate-50 text-emerald-800 font-extrabold border-l-4 border-emerald-600" 
                              : "hover:bg-slate-50 text-slate-600 font-medium"
                          }`}
                        >
                          <span className="text-xs">{s.subtitle.split(" • ")[0]}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-extrabold">
                            {s.verses.length} Ayat
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CURRENT ACTIVE SURAH MUSHAF VIEW */}
              <div id="mushaf-view-panel" className="lg:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/50 flex flex-col">
                <div id="mushaf-header-banner" className="text-center border-b pb-6 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden mb-6">
                  <h3 className="text-4xl font-black font-serif font-arabic mb-1 text-white">{currentSurah.title}</h3>
                  <p className="text-xs text-white/95 font-bold tracking-widest uppercase mt-2">{currentSurah.subtitle}</p>
                </div>

                {/* INTERACTIVE POINTER HOVER RECITER SETTINGS CONTROL */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mb-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-gold-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>🎙️</span> <span>AL-QUR'AN DIGITAL INTERAKTIF (BACAAN BERSUARA)</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      Tunjuk ayat, kata, atau huruf dengan kursor Anda untuk mendengarkan bacaan tajwid tartil ustadz secara langsung.
                    </p>
                    {hoveredActiveText && (
                      <div className="text-[10px] text-emerald-700 font-extrabold flex items-center space-x-2 pt-1">
                        <span>Sedang ditunjuk:</span>
                        <span className="bg-emerald-100 border border-emerald-200 text-teal-900 rounded font-serif px-2 py-0.5 text-xs select-none">
                          {hoveredActiveText}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHoverSoundEnabled(!hoverSoundEnabled);
                        if (hoverSoundEnabled && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                        }
                      }}
                      className={`text-3xs font-black px-2.5 py-1.5 rounded-lg border transition-all uppercase ${
                        hoverSoundEnabled 
                          ? "bg-teal-900 text-white border-teal-850 shadow-sm" 
                          : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
                      }`}
                    >
                      {hoverSoundEnabled ? "🎙️ Suara Hover Aktif" : "🔇 Suara Hover Mati"}
                    </button>

                    {hoverSoundEnabled && (
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] font-extrabold border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setHoverSoundLevel("kata")}
                          className={`px-2 py-1 rounded-md transition-all ${hoverSoundLevel === "kata" ? "bg-white text-emerald-850 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Tunjuk Kata 📝
                        </button>
                        <button
                          type="button"
                          onClick={() => setHoverSoundLevel("ayat")}
                          className={`px-2 py-1 rounded-md transition-all ${hoverSoundLevel === "ayat" ? "bg-white text-indigo-800 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Tunjuk Ayat 📖
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div id="verses-scroller" className="space-y-6 divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
                  {currentSurah.verses.map((v) => {
                    const verseKey = `${selectedSurahKey}_${v.no}`;
                    const isPlayingThis = playingVerseId === verseKey;

                    return (
                      <div key={v.no} className="pt-6 first:pt-0 flex flex-col space-y-4">
                        <div className="flex items-start justify-between space-x-5">
                          <span className="w-8 h-8 bg-teal-50 text-teal-900 font-extrabold rounded-full flex items-center justify-center text-xs flex-shrink-0 border border-teal-100 shadow-sm">
                            {v.no}
                          </span>
                          <p dir="rtl" className="text-right font-serif font-arabic text-2xl leading-loose text-slate-900 flex-1 tracking-wide select-none">
                            {hoverSoundEnabled ? (
                              hoverSoundLevel === "kata" ? (
                                v.arabic.split(" ").map((word, wIdx) => {
                                  const clean = word.trim();
                                  if (!clean) return null;
                                  return (
                                    <span
                                      key={wIdx}
                                      onMouseEnter={() => {
                                        speakArabic(clean);
                                        setHoveredActiveText(clean);
                                      }}
                                      onMouseLeave={() => setHoveredActiveText("")}
                                      className="inline-block hover:text-emerald-700 hover:bg-emerald-50 px-1 rounded transition-all cursor-pointer select-none font-bold"
                                    >
                                      {word}{" "}
                                    </span>
                                  );
                                })
                              ) : (
                                <span
                                  onMouseEnter={() => {
                                    speakArabic(v.arabic);
                                    setHoveredActiveText(`Ayat ${v.no}`);
                                  }}
                                  onMouseLeave={() => setHoveredActiveText("")}
                                  className="hover:text-teal-800 hover:bg-teal-50/40 p-1 rounded transition-all cursor-pointer select-none font-bold"
                                >
                                  {v.arabic}
                                </span>
                              )
                            ) : (
                              v.arabic
                            )}
                          </p>
                        </div>

                        <div className="pl-12 flex justify-between items-start">
                          <div className="flex-1 mr-4">
                            <p className="text-xxs italic text-teal-800 font-bold leading-relaxed">{v.latin}</p>
                            <p className="text-2xs text-slate-500 mt-1.5 leading-relaxed">{v.id}</p>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => bookmarkSurah(currentSurah.subtitle.split(" • ")[0])}
                              title="Tandai terakhir dibaca"
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-all"
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => playTTS(v.id, verseKey)}
                              title="Dengarkan Tartil Terjemahan"
                              className={`p-1.5 rounded-lg transition-all ${isPlayingThis ? "text-emerald-600 bg-emerald-50 active-pulse" : "text-slate-400 hover:text-emerald-600 hover:bg-slate-50"}`}
                            >
                              {isPlayingThis ? <VolumeX className="w-4 h-4 animate-bounce" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ===================== TAB 3: CHAT BOX / MEMBIMBING ===================== */}
          {activeTab === "messages" && currentUser && (
            <div id="view-chat-center" className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in flex-1 h-[550px] overflow-hidden">
              
              {/* CHAT SESSION LIST (Left columns) */}
              <div id="consultation-sessions-list" className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-extrabold text-slate-800 text-2xs uppercase tracking-widest">Sesi Konsultasi Anda</h3>
                  <p className="text-3xs text-slate-400 mt-0.5 uppercase font-mono">Sinkronisasi Cloud Aktif</p>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {(dynamicUstadzList.length > 0 ? dynamicUstadzList : ustadzList).map((u) => {
                    const currentUstadzMsgs = messages.filter((m) => m.ustadz === u.name);
                    const lastMsg = currentUstadzMsgs[currentUstadzMsgs.length - 1] || { text: "Mulailah diskusi bimbingan baru.", timestamp: "" };
                    const isSelected = activeChatUstadz === u.name;

                    return (
                      <button
                        key={u.name}
                        onClick={() => setActiveChatUstadz(u.name)}
                        className={`w-full text-left p-4 flex items-start space-x-3 transition-all ${
                          isSelected ? "bg-teal-50 border-r-4 border-teal-700" : "hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="w-9 h-9 bg-teal-900 text-white rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0">
                          {u.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-extrabold text-slate-800 text-xs truncate">{u.name}</h4>
                            <span className="text-[8px] text-slate-400 shrink-0 select-none ml-1">{lastMsg.timestamp}</span>
                          </div>
                          <p className="text-2xs text-slate-400 truncate mt-1">{lastMsg.text}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CHAT ACTIVE VIEW CONTROLS */}
              <div id="active-chatview-panel" className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-200/50 flex flex-col h-full overflow-hidden">
                
                {/* Chat Top header bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-900 text-white rounded-full flex items-center justify-center font-extrabold text-sm">
                      {activeChatUstadz.charAt(8)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{activeChatUstadz}</h4>
                      <p className="text-3xs text-emerald-700 flex items-center mt-0.5 tracking-wide font-semibold select-none">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-ping" />
                        <span>Pembimbing Khusyuk</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat messages dialogue scroller */}
                <div className="flex-1 p-5 overflow-y-auto bg-slate-50/10 space-y-4 flex flex-col">
                  {messages.filter((m) => m.ustadz === activeChatUstadz).length === 0 ? (
                    <div className="flex flex-col items-center justify-center my-auto text-center text-slate-400 p-10 select-none">
                      <span className="text-3xl">💬</span>
                      <p className="text-xs font-extrabold text-slate-600 mt-2">Tidak ada obrolan.</p>
                      <p className="text-3xs max-w-xs mt-1">Gunakan tombol hubungi privat atau tulis pertanyaan pertama di form di bawah ini!</p>
                    </div>
                  ) : (
                    messages
                      .filter((m) => m.ustadz === activeChatUstadz)
                      .map((msg) => {
                        const fromAI = msg.isFromUstadz;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${fromAI ? "justify-start" : "justify-end"} animate-fade-in`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl p-3 shadow-md text-xs leading-relaxed ${
                                fromAI
                                  ? "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                                  : "bg-emerald-700 text-white rounded-tr-none"
                              }`}
                            >
                              <span
                                className={`block text-[8px] font-extrabold tracking-wider uppercase mb-1 ${
                                  fromAI ? "text-emerald-800" : "text-emerald-200"
                                }`}
                              >
                                {msg.sender}
                              </span>
                              <p className="whitespace-pre-line text-2xs">{msg.text}</p>
                              <span className="block text-[8px] text-right mt-1.5 opacity-60 font-mono">
                                {msg.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}

                  {isTyping && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex items-center space-x-2 text-2xs font-semibold text-teal-700">
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-200" />
                        <span style={{ fontSize: "10px" }} className="italic font-normal">Ustadz sedang menjawab bimbingan...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Input Message */}
                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                  <form onSubmit={handleSendReply} className="flex space-x-3">
                    <input 
                      type="text" 
                      placeholder="Tulis pesan respon santun Anda..." 
                      value={replyInputText}
                      onChange={(e) => setReplyInputText(e.target.value)}
                      required
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs font-semibold"
                    />

                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs font-extrabold">Balas</span>
                    </button>
                  </form>
                </div>
              </div>

            </div>
          )}

          {/* ===================== TAB 4: USTADZ LISTINGS ===================== */}
          {activeTab === "ustadz-list" && (
            <div id="view-ustadz-list" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in flex-1">
              {(dynamicUstadzList.length > 0 ? dynamicUstadzList : ustadzList).map((u, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/50 text-center flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-teal-50 text-teal-900 border border-teal-100 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 tracking-wide">
                      {u.initials}
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-800">{u.name}</h3>
                    <span className="text-[9px] bg-teal-50 text-teal-800 px-3 py-0.5 rounded-full border border-teal-100 font-extrabold mt-1.5 inline-block">
                      {u.specialization}
                    </span>
                    <p className="text-2xs text-slate-500 mt-4 leading-relaxed px-2">
                      {u.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveChatUstadz(u.name);
                      setShowChatModal(true);
                    }}
                    className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-extrabold rounded-xl transition-all shadow-md"
                  >
                    Mulai Konsultasi
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ===================== TAB 5: MATERIAL SYLLABUS ===================== */}
          {activeTab === "materials" && currentUser && (
            <div id="view-materials" className="animate-fade-in flex-1">
              <SyllabusMaterials 
                currentUser={currentUser}
                onRefreshUser={refreshUserData}
                pushToast={pushToast} 
              />
            </div>
          )}

          {/* ===================== TAB 6: ADMIN PANEL ===================== */}
          {activeTab === "admin" && currentUser?.role === "Admin" && (
            <div id="view-admin" className="animate-fade-in flex-1">
              <AdminPanel 
                currentUser={currentUser} 
                onStudentUpdated={async () => {
                  try {
                    const res = await fetch("/api/admin/students");
                    if (res.ok) {
                      const data = await res.json();
                      const updatedMe = data.students?.find((s: any) => s.username === currentUser.username);
                      if (updatedMe) {
                        setCurrentUser(updatedMe);
                        localStorage.setItem("mengaji_session", JSON.stringify(updatedMe));
                      }
                    }
                  } catch (err) {
                    console.error("Error refreshing current admin state", err);
                  }
                }} 
                pushToast={pushToast} 
              />
            </div>
          )}

          {/* ===================== TAB 7: USTADZ PANEL ===================== */}
          {activeTab === "ustadz-panel" && currentUser?.role === "Ustadz" && (
            <div id="view-ustadz-panel" className="animate-fade-in flex-1">
              <UstadzPanel
                currentUser={currentUser}
                onStudentUpdated={refreshUserData}
                pushToast={pushToast}
              />
            </div>
          )}

        </div>
      </main>

      {/* ===================== MODAL CHAT POP-UP ===================== */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200"
            >
              <button 
                onClick={() => setShowChatModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center space-x-2">
                <span>💬</span> <span>Konsultasi privat:</span> <strong className="text-teal-900">{activeChatUstadz}</strong>
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Pilih jalur bimbingan syariah yang Anda inginkan.</p>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xxs font-bold">
                <button
                  type="button"
                  onClick={() => setChatMethod("app")}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${chatMethod === "app" ? "bg-white text-teal-900 shadow-sm" : "text-slate-500"}`}
                >
                  In-App Chat (Situs Online)
                </button>
                <button
                  type="button"
                  onClick={() => setChatMethod("wa")}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${chatMethod === "wa" ? "bg-white text-teal-900 shadow-sm" : "text-slate-500"}`}
                >
                  WhatsApp Langsung
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-4">
                {chatMethod === "app" && (
                  <div>
                    <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Topik Tanya Kajian</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Hukum Bacaan Mad Silah" 
                      value={chatSubject || ""}
                      onChange={(e) => setChatSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Isi Pertanyaan Diskusi</label>
                  <textarea 
                    rows={4}
                    placeholder="Tuliskan pertanyaan Anda dengan sopan dan jelas..."
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Bimbingan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== MODAL REGISTRASI POP-UP ===================== */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200 scrollbar-thin"
            >
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center space-x-2">
                <span>📝</span> <span>Pendaftaran Akun Santri Baru</span>
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Mari bergabung bersama ribuan santri mengaji online lainnya.</p>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="Masukkan nama lengkap Anda..." 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">Username Masuk (Tanpa Spasi)</label>
                  <input 
                    type="text" 
                    placeholder="username_baru" 
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ""))}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    placeholder="nama@gmail.com" 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">Kata Sandi Baru</label>
                  <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder="•••••••• (Minimal 6 Karakter)" 
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1">Daftar Sebagai (Peran Anda)</label>
                  <select 
                    value={regRole} 
                    onChange={(e) => setRegRole(e.target.value as "Siswa" | "Ustadz")}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-550 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Siswa">Siswa / Santri Belajar 📖</option>
                    <option value="Ustadz">Ustadz / Ustadzah Pengaji 🕌</option>
                  </select>
                </div>

                {regRole === "Ustadz" && (
                  <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-emerald-800">🔒 DATA KEPENDUDUKAN & AKADEMIK GURU</p>
                    
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                        Kode Akses Guru (Wajib)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Masukkan Kode Akses Guru" 
                        value={ustadzAccessCode}
                        onChange={(e) => setUstadzAccessCode(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[8px] text-slate-400 mt-1 block">Kode Akses Pengajar Demo: <span className="font-mono font-bold text-emerald-700">Guru1$</span></span>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                        Nomor Induk Kependudukan / NIK (Wajib)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Silakan masukkan 16 digit NIK..." 
                        value={regNik}
                        onChange={(e) => setRegNik(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Provinsi (KTP)</label>
                        <input 
                          type="text" 
                          placeholder="Provinsi..." 
                          value={regProvince}
                          onChange={(e) => setRegProvince(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Negara (KTP)</label>
                        <input 
                          type="text" 
                          placeholder="Negara..." 
                          value={regCountry}
                          onChange={(e) => setRegCountry(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Lulusan / Gelar (Wajib)</label>
                        <input 
                          type="text" 
                          placeholder="Misal: Lc., S.Ag., M.Ag" 
                          value={regDegree}
                          onChange={(e) => setRegDegree(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Universitas (Wajib)</label>
                        <input 
                          type="text" 
                          placeholder="Universitas..." 
                          value={regUniversity}
                          onChange={(e) => setRegUniversity(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Checkboxes for tahsin, tajwid, fiqih competencies */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                        Keahlian Mengajar (Centang Kualifikasi)
                      </label>
                      <div className="flex flex-col gap-1.5 bg-white p-2 border border-slate-200 rounded-lg">
                        <label className="flex items-center space-x-2 text-3xs font-semibold text-slate-600 select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={regTahsin} 
                            onChange={(e) => setRegTahsin(e.target.checked)} 
                            className="rounded text-emerald-600 focus:ring-emerald-500" 
                          />
                          <span>Tahsin Al-Qur'an</span>
                        </label>
                        <label className="flex items-center space-x-2 text-3xs font-semibold text-slate-600 select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={regTajwid} 
                            onChange={(e) => setRegTajwid(e.target.checked)} 
                            className="rounded text-emerald-600 focus:ring-emerald-500" 
                          />
                          <span>Tajwid Terpadu</span>
                        </label>
                        <label className="flex items-center space-x-2 text-3xs font-semibold text-slate-600 select-none cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={regFiqih} 
                            onChange={(e) => setRegFiqih(e.target.checked)} 
                            className="rounded text-emerald-600 focus:ring-emerald-500" 
                          />
                          <span>Fiqih Dasar & Ibadah</span>
                        </label>
                      </div>
                    </div>

                    {/* Optional Syahadah or Certificate Upload */}
                    <div>
                      <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">
                        Sertifikat Kompetensi / Syahadah (Tambahan / Opsional)
                      </label>
                      <div className="border border-dashed border-slate-300 rounded-lg p-2.5 bg-white flex flex-col items-center justify-center text-center">
                        <input 
                          type="file" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setRegCertificateName(file.name);
                              const reader = new FileReader();
                              reader.onload = () => {
                                setRegCertificateData(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                          id="file-certificate-upload" 
                        />
                        <label htmlFor="file-certificate-upload" className="cursor-pointer text-emerald-600 hover:text-emerald-700 text-3xs font-extrabold flex items-center space-x-1">
                          <span>📎 Unggah Syahadah / Sertifikat</span>
                        </label>
                        {regCertificateName ? (
                          <span className="text-[10px] text-slate-600 mt-1 font-bold truncate max-w-full">
                            ✓ {regCertificateName}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 mt-0.5">Format PDF / gambar (Syahadah Kairo, Sanad, dll)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Buat Akun Pembelajaran
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================== MODAL LUPA PASSWORD POP-UP ===================== */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200"
            >
              <button 
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-sm font-extrabold text-slate-800 mb-1 flex items-center space-x-2">
                <span>🔑</span> <span>Setel Ulang Kata Sandi</span>
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Ubah atau pulihkan instan password masuk belajar Anda.</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Alamat Email Terdaftar</label>
                  <input 
                    type="email" 
                    placeholder="Masukkan sandi pemulihan email Anda..." 
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Password Baru</label>
                  <div className="relative">
                    <input 
                      type={showResetPassword ? "text" : "password"} 
                      placeholder="Masukkan kata sandi baru..." 
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Simpan Password Baru
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* ===================== MODAL AKSES PORTAL TERPADU POP-UP ===================== */}
      <AnimatePresence>
        {showAccessPortal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl relative border transition-all scrollbar-thin ${
                darkMode 
                  ? "bg-[#0f172a] border-slate-800 text-slate-100" 
                  : "bg-white border-sky-100 text-slate-800"
              }`}
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowAccessPortal(false)}
                className={`absolute top-4 right-4 transition-colors ${
                  darkMode ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"
                }`}
                title="Tutup Halaman"
              >
                <X className="w-5 h-5" />
              </button>

              {currentUser ? (
                /* ===================== LOGGED IN VIEW: PROFILE DATA RINCI ===================== */
                <div className="space-y-5">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-2xl">👤</span>
                    <div className="text-left">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider leading-none">Profil Rinci Santri</h3>
                      <span className={`text-[8.5px] font-black uppercase tracking-wide block mt-1 ${
                        currentUser.role === "Admin" ? "text-rose-500" : "text-sky-600 dark:text-sky-400"
                      }`}>
                        Status Sesi: {currentUser.role || "Santri"} Mengaji.ID
                      </span>
                    </div>
                  </div>

                  {/* Avatar Picker & Picture */}
                  <div className="flex flex-col items-center py-4 bg-sky-50/50 dark:bg-slate-850 rounded-2xl border border-sky-100/50 dark:border-slate-800">
                    <div className="relative group w-20 h-20 mb-3">
                      {currentUser.photoUrl ? (
                        <img 
                          src={currentUser.photoUrl} 
                          alt="Foto Profil" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full rounded-full object-cover border-2 border-sky-500 shadow-md"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-2xl shadow border-2 border-sky-455">
                          {currentUser.name ? currentUser.name[0].toUpperCase() : "S"}
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white">{currentUser.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
                    </div>

                    {/* Quick Avatar Updates */}
                    <div className="mt-3.5 px-4 w-full">
                      <label className="block text-center text-[8.5px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                        Pilih Cepat Avatar Karakter
                      </label>
                      <div className="flex justify-center space-x-2">
                        {[
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=Aulia&backgroundType=gradientLinear`,
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=Faisal&backgroundType=gradientLinear`,
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=Yusuf&backgroundType=gradientLinear`,
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=Rania&backgroundType=gradientLinear`
                        ].map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleUpdateProfilePhoto(url)}
                            className="w-8 h-8 rounded-full border-2 border-transparent hover:border-sky-500 overflow-hidden transition active:scale-90"
                            title="Pilih foto ini"
                          >
                            <img src={url} alt="preset" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Profile data list */}
                  <div className="space-y-2.5">
                    <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 text-left">Informasi Keanggotaan & Kelas</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Jenjang Belajar</span>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                          {currentUser.level || "Tingkat Dasar (Iqra)"}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Paket Pilihan</span>
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                          {currentUser.package || "Mulai Uji Coba"}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Guru Pembina Privat</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {currentUser.selectedUstadz || "Menunggu Pembagian"}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Sisa Pertemuan Bimbingan</span>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                          {currentUser.remainingMeetings !== undefined ? `${currentUser.remainingMeetings} Sesi` : "N/A"}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Frekuensi Pembayaran</span>
                        <span className="text-xs font-bold text-amber-605 dark:text-amber-400">
                          {currentUser.paymentStatus === "VERIFIED" ? "1 Kali (Terkonfirmasi)" : "0 Kali / Uji Coba"}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-left ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[8px] font-extrabold text-slate-450 block uppercase">Durasi Belajar</span>
                        <span className="text-xs font-bold">
                          30 Menit / Sesi Bimbingan
                        </span>
                      </div>
                    </div>

                    {/* Study schedule Timing (Waktu Belajar) - Real editable in database! */}
                    <div className={`p-3.5 rounded-xl border text-left space-y-2 ${darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                      <div className="flex justify-between items-center text-left">
                        <div>
                          <span className="text-[8px] font-extrabold text-slate-455 block uppercase">Pilihan Waktu Belajar Anda</span>
                          <span className="text-xs font-extrabold text-sky-605 dark:text-sky-400">
                            {currentUser.studyTime || "Belum dipilih (Isi di bawah)"}
                          </span>
                        </div>
                        <span className="text-lg">⏱️</span>
                      </div>

                      <div className="text-[9.5px] font-semibold text-slate-450 dark:text-slate-400 block">
                        {(() => {
                          if (!currentUser.selectedUstadz) {
                            return "Guru Privat Belum Diatur (Menggunakan Jam Default Sistem)";
                          }
                          const teacher = dynamicUstadzList.find(u => 
                            (u.name || "").toLowerCase() === (currentUser.selectedUstadz || "").toLowerCase() ||
                            (u.id || "").toLowerCase() === (currentUser.selectedUstadz || "").toLowerCase()
                          );
                          if (teacher && Array.isArray(teacher.availableSlots) && teacher.availableSlots.length > 0) {
                            return `Menampilkan Keberadaan Jadwal Kosong Guru Anda (${currentUser.selectedUstadz}):`;
                          }
                          return `Guru Anda (${currentUser.selectedUstadz}) Belum Merilis Jadwal Spesifik (Menggunakan Jam Default):`;
                        })()}
                      </div>
                      
                      <div className="pt-1 select-none flex flex-wrap gap-1.5 justify-start">
                        {(() => {
                          const defaultSlots = ["Pagi (08:00 - 10:00)", "Siang (13:00 - 15:00)", "Sore (16:00 - 18:00)", "Malam (19:30 - 21:00)"];
                          if (!currentUser.selectedUstadz) return defaultSlots;
                          const teacher = dynamicUstadzList.find(u => 
                            (u.name || "").toLowerCase() === (currentUser.selectedUstadz || "").toLowerCase() ||
                            (u.id || "").toLowerCase() === (currentUser.selectedUstadz || "").toLowerCase()
                          );
                          if (teacher && Array.isArray(teacher.availableSlots) && teacher.availableSlots.length > 0) {
                            return teacher.availableSlots;
                          }
                          return defaultSlots;
                        })().map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleUpdateProfileSchedule(opt)}
                            className={`px-2.5 py-1 text-[9.5px] rounded-lg border transition font-bold cursor-pointer ${
                              currentUser.studyTime === opt
                                ? "bg-sky-600 text-white border-sky-600"
                                : darkMode
                                ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                                : "bg-white text-slate-705 border-slate-200 hover:bg-sky-50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-605 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      Keluar Sesi Belajar 🚪
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAccessPortal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition active:scale-95 cursor-pointer"
                    >
                      Selesai & Simpan
                    </button>
                  </div>
                </div>
              ) : (
                /* ===================== GUEST VIEW: TABS FOR LOGIN / REGISTER ===================== */
                <div className="space-y-4 text-left">
                  {/* Tab Header Selector */}
                  <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPortalTab("login")}
                      className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                        portalTab === "login"
                          ? "border-sky-600 text-sky-600 dark:text-sky-400"
                          : "border-transparent text-slate-400"
                      }`}
                    >
                      Masuk Akun
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalTab("register")}
                      className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                        portalTab === "register"
                          ? "border-sky-600 text-sky-600 dark:text-sky-400"
                          : "border-transparent text-slate-400"
                      }`}
                    >
                      Daftar Baru
                    </button>
                  </div>

                  {portalTab === "login" ? (
                    /* SUB-TAB: MASUK/LOGIN */
                    <form onSubmit={async (e) => {
                      await handleLogin(e);
                    }} className="space-y-4 pt-1">
                      <div>
                        <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest text-left mb-1.5">Nama Pengguna / Email</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User className="w-4 h-4" /></span>
                          <input 
                            type="text" 
                            placeholder="username / email@gmail.com" 
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value.toLowerCase().trim())}
                            required
                            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest text-left mb-1.5">Sandi Masuk Anda</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Lock className="w-4 h-4" /></span>
                          <input 
                            type={showLoginPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-2xs pt-1">
                        <label className="flex items-center text-slate-400 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 mr-1.5" /> 
                          <span>Ingat Sesi Saya</span>
                        </label>
                        <button type="button" onClick={() => { setShowAccessPortal(false); setShowResetModal(true); }} className="text-sky-600 dark:text-sky-400 hover:underline font-bold">Lupa Sandi?</button>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md shadow-sky-600/10 text-xs tracking-wider cursor-pointer"
                      >
                        Hubungkan Sesi Mengaji
                      </button>

                      <div className="bg-sky-50 dark:bg-slate-850 p-3 rounded-2xl border border-sky-100 dark:border-slate-850 text-[10px] text-slate-600 dark:text-slate-300 mt-4 text-left space-y-1.5 font-medium">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                          <span>💡</span> <span>Gunakan Akun Demo Hubungan:</span>
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Siswa Belajar:</span>
                            <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-sky-100 dark:border-slate-700">user: siswa • pass: 123</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500">
                            <span>Guru Pembina:</span>
                            <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-sky-100 dark:border-slate-700">user: guru • pass: 123</span>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* SUB-TAB: DAFTAR BARU */
                    <form onSubmit={async (e) => {
                      await handleRegister(e);
                    }} className="space-y-3.5 pt-1 text-left">
                      <div>
                        <label className="block text-3xs font-extrabold text-slate-450 uppercase tracking-widest mb-1 font-sans">Nama Lengkap</label>
                        <input 
                          type="text" 
                          placeholder="Masukkan nama lengkap..." 
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1 font-sans">Username Masuk (Tanpa Spasi)</label>
                        <input 
                          type="text" 
                          placeholder="username_baru" 
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1 font-sans">Surat Elektronik (Email)</label>
                        <input 
                          type="email" 
                          placeholder="nama@gmail.com" 
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1">Kata Sandi Baru (Password)</label>
                        <div className="relative">
                          <input 
                            type={showAccessPortalPassword ? "text" : "password"} 
                            placeholder="Sandi Rahasia (Min. 6 Karakter)" 
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
                            className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none ${
                              darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccessPortalPassword(!showAccessPortalPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          >
                            {showAccessPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-3xs font-extrabold text-slate-455 uppercase tracking-widest mb-1">Daftar sebagai Peran</label>
                        <select 
                          value={regRole} 
                          onChange={(e) => setRegRole(e.target.value as "Siswa" | "Ustadz")}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-sky-500 outline-none bg-white ${
                            darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-850"
                          }`}
                        >
                          <option value="Siswa">Siswa / Santri Belajar 📖</option>
                          <option value="Ustadz">Ustadz / Ustadzah Pembina 🕌</option>
                        </select>
                      </div>

                      {regRole === "Ustadz" && (
                        <div className={`space-y-3.5 p-3.5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200"}`}>
                          <p className={`text-[10px] font-bold ${darkMode ? "text-sky-400" : "text-emerald-800"}`}>🔒 DATA KEPENDUDUKAN & AKADEMIK GURU</p>
                          
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                              Kode Akses Guru (Wajib)
                            </label>
                            <input 
                              type="text" 
                              placeholder="Masukkan Kode Akses Guru" 
                              value={ustadzAccessCode}
                              onChange={(e) => setUstadzAccessCode(e.target.value)}
                              required
                              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                              }`}
                            />
                            <span className="text-[8px] text-slate-400 mt-1 block">Kode Akses Pengajar Demo: <span className="font-mono font-bold text-sky-655 dark:text-sky-300">Guru1$</span></span>
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                              Nomor Induk Kependudukan / NIK (Wajib)
                            </label>
                            <input 
                              type="text" 
                              placeholder="Silakan masukkan 16 digit NIK..." 
                              value={regNik}
                              onChange={(e) => setRegNik(e.target.value)}
                              required
                              className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                              }`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Provinsi (KTP)</label>
                              <input 
                                type="text" 
                                placeholder="Provinsi..." 
                                value={regProvince}
                                onChange={(e) => setRegProvince(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Negara (KTP)</label>
                              <input 
                                type="text" 
                                placeholder="Negara..." 
                                value={regCountry}
                                onChange={(e) => setRegCountry(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Lulusan / Gelar (Wajib)</label>
                              <input 
                                type="text" 
                                placeholder="Misal: Lc., S.Ag., M.Ag" 
                                value={regDegree}
                                onChange={(e) => setRegDegree(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">Universitas (Wajib)</label>
                              <input 
                                type="text" 
                                placeholder="Universitas..." 
                                value={regUniversity}
                                onChange={(e) => setRegUniversity(e.target.value)}
                                required
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-sky-500 ${
                                  darkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-850"
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1.5">
                              Keahlian Mengajar (Centang Kualifikasi)
                            </label>
                            <div className={`flex flex-col gap-1.5 p-2 border rounded-lg ${
                              darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                            }`}>
                              <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={regTahsin} 
                                  onChange={(e) => setRegTahsin(e.target.checked)} 
                                  className="rounded text-sky-600 focus:ring-sky-500" 
                                />
                                <span>Tahsin Al-Qur'an</span>
                              </label>
                              <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={regTajwid} 
                                  onChange={(e) => setRegTajwid(e.target.checked)} 
                                  className="rounded text-sky-600 focus:ring-sky-500" 
                                />
                                <span>Tajwid Terpadu</span>
                              </label>
                              <label className="flex items-center space-x-2 text-3xs font-semibold select-none cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={regFiqih} 
                                  onChange={(e) => setRegFiqih(e.target.checked)} 
                                  className="rounded text-sky-600 focus:ring-sky-500" 
                                />
                                <span>Fiqih Dasar & Ibadah</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest mb-1">
                              Sertifikat Kompetensi / Syahadah (Tambahan / Opsional)
                            </label>
                            <div className={`border border-dashed rounded-lg p-2.5 flex flex-col items-center justify-center text-center ${
                              darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
                            }`}>
                              <input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setRegCertificateName(file.name);
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      setRegCertificateData(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden" 
                                id="file-certificate-upload-modal" 
                              />
                              <label htmlFor="file-certificate-upload-modal" className="cursor-pointer text-sky-600 hover:text-sky-500 text-3xs font-extrabold flex items-center space-x-1">
                                <span>📎 Unggah Syahadah / Sertifikat</span>
                              </label>
                              {regCertificateName ? (
                                <p className="text-[9px] text-emerald-600 font-bold mt-1 max-w-[200px] truncate">
                                  ✓ {regCertificateName}
                                </p>
                              ) : (
                                <p className="text-[8px] text-slate-400 mt-1">Lulus dari Lembaga/Lajnah Al-Ahsa/Lainnya (.pdf/.png)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow shadow-sky-600/10 cursor-pointer"
                      >
                        Buat Sesi Belajar Baru
                      </button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
