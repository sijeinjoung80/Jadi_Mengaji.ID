import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc, 
  deleteDoc 
} from "firebase/firestore";
import firebaseConfigRaw from "./firebase-applet-config.json";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Global CORS & pre-flight middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Lazy Firestore database bootstrap to prevent unhandled top-level Vercel serverless function errors
let databaseBootstrapPromise: Promise<void> | null = null;
const lazyBootstrapDatabase = async () => {
  if (!databaseBootstrapPromise) {
    console.log("Initializing database connection from request handler...");
    databaseBootstrapPromise = bootstrapDb().catch(err => {
      console.error("Delayed/Lazy database bootstrap failed:", err);
      databaseBootstrapPromise = null; // reset to retry on next request
      throw err;
    });
  }
  return databaseBootstrapPromise;
};

// Global DB bootstrap middleware for safe data connection warm-up
app.use(async (req, res, next) => {
  try {
    await lazyBootstrapDatabase();
    next();
  } catch (error: any) {
    console.error("Database connection initialization failure during request:", error);
    res.status(500).json({
      error: "Gagal menghubungkan atau menginisialisasi database utama (Firestore).",
      details: error.message || error.toString()
    });
  }
});

// Initialize Gemini SDK with telemetry agent
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Initialize Firebase with the generated config
let APP_ID = "0a1ceeb6-61f1-48d9-9789-828f4f9e8cf9";
let firebaseConfig: any = firebaseConfigRaw;

// Allow environment variables to override for flexibility (e.g. customized deployments)
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
  firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    appId: process.env.FIREBASE_APP_ID || "",
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || "(default)",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    measurementId: ""
  };
}

if (firebaseConfig && firebaseConfig.firestoreDatabaseId) {
  const parts = firebaseConfig.firestoreDatabaseId.split("ai-studio-");
  if (parts.length > 1) {
    APP_ID = parts[1];
  }
}

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Error Handling Infrastructure
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "server-auth-context",
      email: "server@mengaji.id",
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper: Check and dynamically expire demo premium accounts (limit to 10 minutes)
async function checkAndExpireDemoPremium(userRef: any, userData: any) {
  if (!userData) return userData;

  const isDemo = userData.demoPremiumActivated || 
                 (userData.activationCode && userData.activationCode.toUpperCase().includes("DEMO"));

  if (isDemo && userData.paymentStatus === "VERIFIED") {
    // If not initialized yet, initialize the start and expiry now
    if (!userData.demoPremiumStartedAt) {
      const updatedUser = {
        ...userData,
        demoPremiumActivated: true,
        demoPremiumStartedAt: Date.now(),
        demoPremiumExpiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes limit
      };
      await setDoc(userRef, updatedUser);
      return updatedUser;
    }

    // Checking if already expired
    if (userData.demoPremiumExpiresAt && Date.now() > userData.demoPremiumExpiresAt) {
      const expiredUser = {
        ...userData,
        paymentStatus: "EXPIRED",
        remainingMeetings: 0
      };
      await setDoc(userRef, expiredUser);
      return expiredUser;
    }
  }
  return userData;
}

// Bootstrap default administrator & demo student profiles
async function bootstrapDb() {
  const usersPath = `artifacts/${APP_ID}/public/data/users`;
  const msgsPath = `artifacts/${APP_ID}/public/data/messages`;
  const ustadzPath = `artifacts/${APP_ID}/public/data/ustadz`;

  try {
    const adminRef = doc(db, usersPath, "admin");
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        id: "admin",
        name: "Cloud Admin",
        username: "admin",
        email: "chin.joung80@gmail.com",
        role: "Admin",
        password: "admin1juta$",
        createdAt: Date.now(),
        // Defaults
        package: "LEVEL_3",
        totalMeetings: 999,
        remainingMeetings: 999,
        paymentStatus: "VERIFIED",
        paymentReceipt: "",
        activationCode: "",
        sessionsCompleted: 0
      });
    } else {
      // Auto-update credentials and roles to prevent database value drifts
      await setDoc(adminRef, {
        email: "chin.joung80@gmail.com",
        role: "Admin",
        username: "admin",
        password: "admin1juta$"
      }, { merge: true });
    }

    const demoRef = doc(db, usersPath, "siswa");
    const demoSnap = await getDoc(demoRef);
    if (!demoSnap.exists()) {
      await setDoc(demoRef, {
        id: "siswa",
        name: "Siswa Demo",
        username: "siswa",
        email: "siswa@mengaji.id",
        role: "Siswa",
        password: "123",
        createdAt: Date.now(),
        // Defaults
        package: "LEVEL_1",
        totalMeetings: 3,
        remainingMeetings: 3,
        paymentStatus: "VERIFIED",
        paymentReceipt: "",
        activationCode: "MNG-DEMO-CODE",
        sessionsCompleted: 0
      });
    } else {
      await setDoc(demoRef, {
        role: "Siswa",
        password: "123"
      }, { merge: true });
    }

    // Bootstrap default ustadz list
    const defaultUstadz = [
      {
        id: "uah",
        name: "Ustadz Adi Hidayat",
        initials: "UAH",
        specialization: "Tahsin, Tajwid & Ilmu Tafsir",
        desc: "Pakar Metode Hafalan Al-Qur'an dan Tarbiyah Islam. Alumnus Kuliyyah Dakwah Islamiyyah Libya."
      },
      {
        id: "uas",
        name: "Ustadz Abdul Somad",
        initials: "UAS",
        specialization: "Hukum Fiqih & Hadits",
        desc: "Pakar Ilmu Fiqih, Hadits, dan Sejarah Peradaban Islam. Alumnus Universitas Al-Azhar Mesir."
      },
      {
        id: "uhm",
        name: "Ustadzah Hana Miranda",
        initials: "UHM",
        specialization: "Fiqih Wanita & parenting",
        desc: "Spesialisasi Kajian Hukum Islam Wanita (Kewanitaan), Fiqih Keluarga, dan Parenting Islami."
      },
      {
        id: "guru",
        name: "Ustadz Guru Demo",
        initials: "UGD",
        specialization: "Tahsin & Tajwid Interaktif",
        desc: "Akun pengajar demo untuk simulasi pembelajaran harian, halaqah live, dan asisten murid."
      }
    ];

    for (const u of defaultUstadz) {
      const uRef = doc(db, ustadzPath, u.id);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) {
        await setDoc(uRef, u);
      }

      // Ensure they also exist in users collection for logging in
      const uUserRef = doc(db, usersPath, u.id);
      const uUserSnap = await getDoc(uUserRef);
      if (!uUserSnap.exists()) {
        await setDoc(uUserRef, {
          id: u.id,
          name: u.name,
          username: u.id,
          email: `${u.id}@mengaji.id`,
          role: "Ustadz",
          password: "123",
          createdAt: Date.now(),
          package: "USTADZ_ROLE",
          totalMeetings: 9999,
          remainingMeetings: 9999,
          paymentStatus: "VERIFIED",
          paymentReceipt: "",
          activationCode: "",
          sessionsCompleted: 0,
          selectedUstadz: u.name
        });
      } else {
        await setDoc(uUserRef, {
          role: "Ustadz",
          password: "123"
        }, { merge: true });
      }
    }

    const messagesColl = collection(db, msgsPath);
    const msgsSnap = await getDocs(messagesColl);
    if (msgsSnap.empty) {
      await addDoc(messagesColl, {
        id: "initial-msg-1",
        ustadz: "Ustadz Adi Hidayat",
        subject: "Penyambutan",
        sender: "Ustadz Adi Hidayat",
        senderUid: "gemini-ai",
        text: "Selamat datang di Mengaji.ID! Saya Ustadz Adi Hidayat, siap membimbing Anda menyempurnakan tajwid dan hafalan Al-Qur'an.",
        timestamp: "08:15",
        timestampMs: Date.now() - 3600000,
        isFromUstadz: true,
      });
    }
    console.log("Cloud Datastore bootstrapped successfully!");
  } catch (error) {
    console.error("Bootstrapping Firestore error:", error);
  }
}

// Keep student private teacher assignments dynamically rebalanced (Gojek-Style Auto Matchmaking)
async function runAutoAssignment() {
  try {
    const usersPath = `artifacts/${APP_ID}/public/data/users`;
    const ustadzPath = `artifacts/${APP_ID}/public/data/ustadz`;

    // Fetch all active teachers (Ustadz)
    const uColl = collection(db, ustadzPath);
    const uSnap = await getDocs(uColl);
    const teachers = uSnap.docs.map(doc => doc.data());

    if (teachers.length === 0) {
      console.log("[Auto-Assignment] No teachers available yet.");
      return;
    }

    // Fetch all active students (role === "Siswa")
    const usersColl = collection(db, usersPath);
    const usersSnap = await getDocs(usersColl);
    const studentsAll = usersSnap.docs.map(doc => doc.data());
    const students = studentsAll.filter(u => u.role === "Siswa");

    if (students.length === 0) {
      console.log("[Auto-Assignment] No students registered yet.");
      return;
    }

    // Determine manual vs auto assignments
    const manualStudents = students.filter(s => s.manualUstadzAssignment === true && s.selectedUstadz);
    const autoStudents = students.filter(s => s.manualUstadzAssignment !== true);

    // Initialize teacher load counts
    const teacherStudentCounts: Record<string, number> = {};
    for (const t of teachers) {
      teacherStudentCounts[t.name] = 0;
    }

    // Process manual assignments count first
    for (const s of manualStudents) {
      const matchedTeacher = teachers.find(t => 
        t.name.toLowerCase() === s.selectedUstadz.toLowerCase() || 
        t.id.toLowerCase() === s.selectedUstadz.toLowerCase()
      );
      if (matchedTeacher) {
        teacherStudentCounts[matchedTeacher.name] = (teacherStudentCounts[matchedTeacher.name] || 0) + 1;
      }
    }

    // Sort auto-assigned students chronologically by registration date to guarantee stability
    autoStudents.sort((a, b) => {
      const valA = a.createdAt || 0;
      const valB = b.createdAt || 0;
      if (valA !== valB) return valA - valB;
      return a.username.localeCompare(b.username);
    });

    // Allocate each autoStudent to the teacher with the minimum load
    for (const s of autoStudents) {
      let chosenTeacher = teachers[0];
      let minCount = teacherStudentCounts[chosenTeacher.name] ?? 0;

      for (const t of teachers) {
        const count = teacherStudentCounts[t.name] ?? 0;
        if (count < minCount) {
          minCount = count;
          chosenTeacher = t;
        }
      }

      // If current ustadz does not match chosen, update it
      if (s.selectedUstadz !== chosenTeacher.name) {
        const studentRef = doc(db, usersPath, s.username.toLowerCase());
        await setDoc(studentRef, {
          selectedUstadz: chosenTeacher.name,
          manualUstadzAssignment: false
        }, { merge: true });
        
        // Update local reference to avoid stale passes
        s.selectedUstadz = chosenTeacher.name;
        s.manualUstadzAssignment = false;
        console.log(`[Auto-Assignment] @${s.username} otomatis mendapatkan Guru: ${chosenTeacher.name}`);
      }

      // Update that teacher's count
      teacherStudentCounts[chosenTeacher.name] = (teacherStudentCounts[chosenTeacher.name] || 0) + 1;
    }

    console.log("[Auto-Assignment] Rebalanced distribution loads: ", teacherStudentCounts);
  } catch (err) {
    console.error("[Auto-Assignment] Failed to perform even teacher routing:", err);
  }
}

// ==================== API ROUTE ENDPOINTS ====================

// API Health Check
app.get("/api/health", async (req, res) => {
  let firestoreStatus = "unknown";
  let firestoreError: any = null;

  try {
    const adminRef = doc(db, `artifacts/${APP_ID}/public/data/users`, "admin");
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      firestoreStatus = "connected (admin exists)";
    } else {
      firestoreStatus = "connected (admin not found)";
    }
  } catch (err: any) {
    firestoreStatus = "failed";
    firestoreError = {
      message: err.message,
      code: err.code,
      stack: err.stack ? err.stack.toString() : null
    };
  }

  res.json({ 
    status: "ok", 
    firestore: firestoreStatus,
    firestoreError: firestoreError,
    projectId: firebaseConfig.projectId,
    serverTime: new Date().toISOString() 
  });
});

// Auth Register Student via Cloud Firestore
app.post("/api/auth/register", async (req, res) => {
  const { 
    name, 
    username, 
    email, 
    password, 
    role, 
    selectedUstadz, 
    ustadzAccessCode,
    degree,
    university,
    province,
    country,
    nik,
    qualificationTahsin,
    qualificationTajwid,
    qualificationFiqih,
    certificateName,
    certificateData
  } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: "Semua field harus diisi dengan lengkap." });
  }

  const lowercaseUsername = username.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, "");
  if (!lowercaseUsername || lowercaseUsername.length < 3) {
    return res.status(400).json({ error: "ID Pengguna / Username tidak valid. Harus minimal 3 karakter yang terdiri dari huruf kecil, angka, garis bawah (_), atau strip (-)." });
  }
  const usersPath = `artifacts/${APP_ID}/public/data/users`;

  try {
    // Check if user exists
    const userDocRef = doc(db, usersPath, lowercaseUsername);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return res.status(400).json({ error: "ID Pengguna ini sudah terdaftar!" });
    }

    // Check all values to prevent duplicate email
    const usersCollRef = collection(db, usersPath);
    const usersSnapshot = await getDocs(usersCollRef);
    const emailExists = usersSnapshot.docs.some(docDoc => {
      const data = docDoc.data();
      return data.email && data.email.toLowerCase() === email.trim().toLowerCase();
    });

    if (emailExists) {
      return res.status(400).json({ error: "Alamat email ini sudah terdaftar!" });
    }

    const assignedRole = role || "Siswa";

    if (assignedRole === "Ustadz") {
      const trimmedCode = (ustadzAccessCode || "").trim();
      if (trimmedCode !== "Guru1$") {
        return res.status(400).json({
          error: "Pendaftaran Guru ditolak! Kode Akses Guru salah atau tidak valid."
        });
      }
      if (!degree || !degree.trim()) {
        return res.status(400).json({ error: "Lulusan (Degree) wajib diisi untuk pendaftaran Guru." });
      }
      if (!university || !university.trim()) {
        return res.status(400).json({ error: "Universitas wajib diisi untuk pendaftaran Guru." });
      }
      if (!province || !province.trim()) {
        return res.status(400).json({ error: "Provinsi domisili sesuai data kependudukan wajib diisi." });
      }
      if (!country || !country.trim()) {
        return res.status(400).json({ error: "Negara domisili sesuai data kependudukan wajib diisi." });
      }
      if (!nik || !nik.trim()) {
        return res.status(400).json({ error: "Nomor Induk Kependudukan (NIK) wajib diisi sesuai KTP." });
      }
    }

    const newUser = {
      id: "user_" + Date.now(),
      name: name.trim(),
      username: lowercaseUsername,
      email: email.trim(),
      password: password,
      role: assignedRole,
      createdAt: Date.now(),
      // Payment/package defaults
      package: assignedRole === "Ustadz" ? "USTADZ_ROLE" : "BELUM_AKTIF",
      totalMeetings: assignedRole === "Ustadz" ? 9999 : 0,
      remainingMeetings: assignedRole === "Ustadz" ? 9999 : 0,
      paymentStatus: assignedRole === "Ustadz" ? "VERIFIED" : "UNPAID",
      paymentReceipt: "",
      activationCode: "",
      sessionsCompleted: 0,
      selectedUstadz: selectedUstadz || name.trim(), // Identify themselves or selected Ustadz
      // Strict Guru Credentials
      nik: assignedRole === "Ustadz" ? (nik || "").trim() : "",
      province: assignedRole === "Ustadz" ? (province || "").trim() : "",
      country: assignedRole === "Ustadz" ? (country || "").trim() : "",
      degree: assignedRole === "Ustadz" ? (degree || "").trim() : "",
      university: assignedRole === "Ustadz" ? (university || "").trim() : "",
      qualificationTahsin: assignedRole === "Ustadz" ? !!qualificationTahsin : false,
      qualificationTajwid: assignedRole === "Ustadz" ? !!qualificationTajwid : false,
      qualificationFiqih: assignedRole === "Ustadz" ? !!qualificationFiqih : false,
      certificateName: assignedRole === "Ustadz" ? (certificateName || "").trim() : "",
      certificateData: assignedRole === "Ustadz" ? (certificateData || "").trim() : "",
    };

    await setDoc(userDocRef, newUser);

    // If registered as Ustadz, auto-insert them into the dynamic ustadz collection
    if (assignedRole === "Ustadz") {
      const ustadzId = lowercaseUsername;
      const ustadzPath = `artifacts/${APP_ID}/public/data/ustadz`;
      const ustadzDocRef = doc(db, ustadzPath, ustadzId);
      
      const nameParts = name.trim().split(" ");
      const initials = nameParts.map(p => p.charAt(0)).join("").toUpperCase().substring(0, 3);
      
      const specList = [
        qualificationTahsin ? "Tahsin" : "",
        qualificationTajwid ? "Tajwid" : "",
        qualificationFiqih ? "Fiqih" : ""
      ].filter(Boolean);

      await setDoc(ustadzDocRef, {
        id: ustadzId,
        name: name.trim(),
        initials: initials || "GURU",
        specialization: specList.join(", ") || "Tahsin, Tajwid & Fiqih",
        desc: `Pengajar Al-Qur'an bersertifikat Mengaji.ID. Lulusan ${degree ? degree.trim() : "S1"} dari ${university ? university.trim() : "Universitas"}.`,
        email: email.trim(),
        nik: (nik || "").trim(),
        province: (province || "").trim(),
        country: (country || "").trim(),
        degree: (degree || "").trim(),
        university: (university || "").trim(),
        qualificationTahsin: !!qualificationTahsin,
        qualificationTajwid: !!qualificationTajwid,
        qualificationFiqih: !!qualificationFiqih,
        certificateName: (certificateName || "").trim(),
        certificateData: (certificateData || "").trim(),
      });
    }

    if (assignedRole === "Siswa") {
      await runAutoAssignment();
    }

    // Retrieve fresh user document in case selectedUstadz was updated by the auto-balancer
    const freshUserSnap = await getDoc(userDocRef);
    const finalUser = freshUserSnap.exists() ? freshUserSnap.data() : newUser;

    res.status(201).json({ 
      success: true, 
      user: finalUser
    });

  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ error: "Gagal memproses pendaftaran online ke Cloud database." });
  }
});

// Auth Login Student via Cloud Firestore
app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: "Masukkan nama pengguna/email dan sandi." });
  }

  const cleanId = identifier.trim().toLowerCase();
  const usersPath = `artifacts/${APP_ID}/public/data/users`;

  try {
    const usersColl = collection(db, usersPath);
    const snapshot = await getDocs(usersColl);
    
    const matchedDoc = snapshot.docs.find(docDoc => {
      const u = docDoc.data();
      return (u.username === cleanId || (u.email && u.email.toLowerCase() === cleanId)) && u.password === password;
    });

    if (!matchedDoc) {
      return res.status(401).json({ error: "Rincian masuk salah! Silakan coba lagi." });
    }

    const matchedUser = matchedDoc.data();
    const matchedUsername = (matchedUser.username || matchedDoc.id || "").trim();
    if (!matchedUsername) {
      return res.status(400).json({ error: "Data nama pengguna tidak valid atau kosong di database." });
    }
    const userRef = doc(db, usersPath, matchedUsername.toLowerCase());
    const checkedUser = await checkAndExpireDemoPremium(userRef, matchedUser);
    res.json({
      success: true,
      user: {
        ...checkedUser,
        id: checkedUser.id,
        name: checkedUser.name,
        username: checkedUser.username,
        email: checkedUser.email,
        role: checkedUser.role,
        package: checkedUser.package || "BELUM_AKTIF",
        totalMeetings: checkedUser.totalMeetings || 0,
        remainingMeetings: checkedUser.remainingMeetings || 0,
        paymentStatus: checkedUser.paymentStatus || "UNPAID",
        paymentReceipt: checkedUser.paymentReceipt || "",
        activationCode: checkedUser.activationCode || "",
        sessionsCompleted: checkedUser.sessionsCompleted || 0,
        photoUrl: checkedUser.photoUrl || "",
        selectedUstadz: checkedUser.selectedUstadz || "",
        demoPremiumActivated: checkedUser.demoPremiumActivated || false,
        demoPremiumStartedAt: checkedUser.demoPremiumStartedAt || 0,
        demoPremiumExpiresAt: checkedUser.demoPremiumExpiresAt || 0,
      },
    });

  } catch (error) {
    console.error("Login user error:", error);
    res.status(500).json({ error: "Gagal berinteraksi dengan Cloud database." });
  }
});

// Save Last Read Surah Progress via Cloud Firestore
app.post("/api/progress/save", async (req, res) => {
  const { username, surahTitle } = req.body;
  if (!username || !surahTitle) {
    return res.status(400).json({ error: "Username dan Judul Surah dibutuhkan." });
  }

  const lowercaseUser = username.toLowerCase();
  const progressDocPath = `artifacts/${APP_ID}/users/${lowercaseUser}/progress/lastRead`;

  try {
    await setDoc(doc(db, progressDocPath), {
      surah: surahTitle,
      timestamp: Date.now()
    });
    res.json({ success: true, progress: surahTitle });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, progressDocPath);
  }
});

// Get Progress via Cloud Firestore
app.get("/api/progress/get/:username", async (req, res) => {
  const username = req.params.username.toLowerCase();
  const progressDocPath = `artifacts/${APP_ID}/users/${username}/progress/lastRead`;

  try {
    const snap = await getDoc(doc(db, progressDocPath));
    if (snap.exists()) {
      res.json({ progress: snap.data().surah });
    } else {
      res.json({ progress: "Al-Fatihah" });
    }
  } catch (error) {
    res.json({ progress: "Al-Fatihah" });
  }
});

// Fetch All Messages directly from Firestore and sort in JS
app.get("/api/messages", async (req, res) => {
  const msgsPath = `artifacts/${APP_ID}/public/data/messages`;

  try {
    const coll = collection(db, msgsPath);
    const snap = await getDocs(coll);
    const messages = snap.docs.map(d => d.data());
    
    // Sort chronologically
    messages.sort((a: any, b: any) => (a.timestampMs || 0) - (b.timestampMs || 0));

    res.json({ messages });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, msgsPath);
  }
});

function generateStaticUstadzReply(ustadz: string, sender: string, text: string): string {
  const lowercaseText = (text || "").toLowerCase();
  let advice = "";

  if (ustadz === "Ustadz Adi Hidayat") {
    if (lowercaseText.includes("fatihah") || lowercaseText.includes("mengaji") || lowercaseText.includes("baca") || lowercaseText.includes("bimbingan")) {
      advice = `Mengenai makhraj dan kelancaran bacaan Surat Al-Fatihah, hendaknya ananda fahami bahwa Surat Al-Fatihah terdiri dari 7 ayat luhur (QS. Al-Fatihah [1] ayat 1-7) yang merupakan rukun salat. Usahakan untuk melatih makhraj huruf "hamzah" [أ] dan "ha" [ح] secara kontras dan benar di bimbingan live kita.`;
    } else if (lowercaseText.includes("tajwid") || lowercaseText.includes("hukum") || lowercaseText.includes("nun")) {
      advice = `Hukum tajwid adalah mahkota pembacaan Al-Qur'an (QS. Al-Muzzammil [73] ayat 4: "Dan bacalah Al-Qur'an itu dengan perlahan/tartil"). Perhatikan baik-baik letak bertemunya Nun Sukun atau Tanwin dengan huruf tenggorokan yang kita sebut Izhar, jelaskan dan usahakan tidak mendengung.`;
    } else {
      advice = `Setiap langkah ananda mempelajari kalam Allah adalah perjuangan mulia yang sangat agung. Sesuai tuntunan Rasulullah SAW, jadikan pembelajaran Al-Qur'an ini pembuka pintu hidayah dan ketenangan batin ananda di setiap aktivitas harian dhohir maupun batin (QS. Al-Baqarah [2] ayat 186).`;
    }
    return `Assalamu'akaikum Warahmatullahi Wabarakatuh, Ananda ${sender} yang dirahmati Allah. Semoga limpahan taufik dan hidayah-Nya senantiasa membersamai langkah kita.

Alhamdulillah, pertanyaan ananda sangat baik dan mendalam. ${advice}

Semoga Allah SWT mengistiqomahkan hati ananda serta menganugerahi kefasihan lisan untuk melantunkan ayat suci-Nya.

---
*Sesi bimbingan konsultasi ini didukung secara komprehensif oleh teknologi kecerdasan buatan (Ustadz AI) bimbingan luhur untuk menyajikan penuntusan pemahaman dengan presisi.*`;
  } else if (ustadz === "Ustadz Abdul Somad") {
    if (lowercaseText.includes("fatihah") || lowercaseText.includes("mengaji") || lowercaseText.includes("baca") || lowercaseText.includes("bimbingan")) {
      advice = `Meluruskan makharijul huruf Al-Fatihah hukumnya fardhu 'ain menurut ijma' para ulama Mazhab Syafi'i karena kegagalan membaca rukun qouliyah merusak sahnya salat. Fokuskan makhraj huruf 'Ain [ع] bersih dari hidung dan ucapkan dengan mantap.`;
    } else if (lowercaseText.includes("tajwid") || lowercaseText.includes("hukum") || lowercaseText.includes("nun")) {
      advice = `Ulama ahli qiraat menjelaskan tajwid menjaga lisan dari kesalahan fatal menyimpang makna (lahnul jali). Bacalah tartil, amalkan Idgham Bighunnah dengan dengung yang sempurna ditahan 2-3 harakat.`;
    } else {
      advice = `Niat awal adalah benteng ibadah. Sebagaimana termaksud dalam kitab hadits Al-Arba'in, niatkan semata menjemput keridaan Allah SWT agar ilmu ini memandu amal shaleh ananda sekeluarga di dunia maupun di akhirat kelak.`;
    }
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda ${sender} yang baik. Semoga Allah SWT merahmati ananda beserta seluruh keluarga tercinta.

Pertanyaan yang sangat penting, luruskan niat kita dalam mengkaji ilmu. ${advice}

Semoga Allah mengokohkan ketetapan langkah ananda, melancarkan lisan, serta mempermudah segala urusan ibadah kita. Amin ya rabbal alamin.

---
*Sesi bimbingan bincang-bincang ini didukung secara komprehensif oleh teknologi kecerdasan buatan (Ustadz AI) bimbingan luhur untuk menyajikan penuntusan pemahaman dengan presisi.*`;
  } else {
    // Ustadzah Hana Miranda
    if (lowercaseText.includes("fatihah") || lowercaseText.includes("mengaji") || lowercaseText.includes("baca") || lowercaseText.includes("bimbingan")) {
      advice = `Membaca Al-Qur'an dengan benar sangat bagus dipelajari sejak dini ya, Nak. Al-Fatihah adalah pembuka segala kebaikan. Latihlah pernapasan perut agar tidak terputus di tengah ayat saat mengaji bersama Ustadzah nanti.`;
    } else if (lowercaseText.includes("tajwid") || lowercaseText.includes("hukum") || lowercaseText.includes("nun")) {
      advice = `Mempelajari hukum tajwid itu menyenangkan, sayang. Seperti hukum Ikhfa, kita samarkan suaranya dengan lembut bagai hembusan angin. Jangan tergesa-gesa membacanya, nikmati keindahan setiap harakatnya.`;
    } else {
      advice = `Niat yang murni akan meringankan proses belajar ananda. Teruskan semangat luar biasa ini ya, Nak. Belajar mengaji akan menenangkan batin dan membuka begitu banyak pintu keberkahan dalam keluarga kita tercinta.`;
    }
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda ${sender} sayang yang dirahmati Allah SWT. Senang sekali bisa bersua dengan ketulusan hati ananda untuk belajar.

Aduhai nak, indahnya pertanyaanmu, Ustadzah terharu mendengarnya. ${advice}

Ustadzah doakan semoga putri/putra dan ananda sendiri dimudahkan Allah SWT, dianugerahkan ingatan yang kuat, serta hati yang lapang dalam memeluk cahaya Al-Qur'an.

---
*Sesi bimbingan bincang-bincang ini didukung secara komprehensif oleh teknologi kecerdasan buatan (Ustadz AI) bimbingan luhur untuk menyajikan penuntusan pemahaman dengan presisi.*`;
  }
}

// Submit New Message from Santri and Trigger Ustadz response
app.post("/api/messages/send", async (req, res) => {
  const { ustadz, subject, sender, senderUid, text } = req.body;

  if (!ustadz || !sender || !text) {
    return res.status(400).json({ error: "Kirim parameter pesan yang lengkap." });
  }

  const msgsPath = `artifacts/${APP_ID}/public/data/messages`;

  try {
    const userMsg = {
      id: "msg_" + Date.now(),
      ustadz: ustadz,
      subject: subject || "Konsultasi Santri",
      sender: sender,
      senderUid: senderUid || "anonymous",
      text: text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      timestampMs: Date.now(),
      isFromUstadz: false,
    };

    const coll = collection(db, msgsPath);
    await addDoc(coll, userMsg);

    res.json({ success: true, userMessage: userMsg });

    // Trigger AI response asynchrounously which writes to the shared Firestore ledger
    setTimeout(async () => {
      try {
        let ustadzPersona = "";
        let ustadzGreetingIdea = "";
        let ustadzHelpQuestion = "";

        if (ustadz === "Ustadz Adi Hidayat") {
          ustadzPersona =
            "Anda adalah Ustadz Adi Hidayat, Lc., M.A. (UAH), seorang ulama pakar Al-Qur'an, Hadits, Tafsir dan Tarbiyah. Sifat perkataan Anda santun, runut, ilmiah, mendalam, dan meneduhkan kalbu. Anda selalu merujuk pada nama surah dan ayat Al-Qur'an spesifik (misal: 'QS. Al-Baqarah [2] ayat 183'). Sampaikan bimbingan dalam bahasa Indonesia yang tenang, luhur, dan sangat tertata rapi.";
          ustadzGreetingIdea = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda ${sender} yang dirahmati Allah. Semoga limpahan taufik dan hidayah-Nya senantiasa membersamai langkah kita.`;
          ustadzHelpQuestion = "Ada yang bisa Ustadz bantu untuk mempermudah pemahaman atau amalan ibadah ananda saat ini? Ataukah ada hal lain yang berkecamuk dalam pikiran yang ingin ananda diskusikan?";
        } else if (ustadz === "Ustadz Abdul Somad") {
          ustadzPersona =
            "Anda adalah Ustadz Abdul Somad, Lc., M.A., Ph.D. (UAS), ahli hadits dan hukum syariah Islam Mazhab Syafi'i. Sifat perkataan Anda tegas, lugas, bersahaja, dipenuhi rujukan hadits shahih (Bukhari/Muslim), dan terkadang diselingi analogi cerdas. Berikan nasihat tulus mencerahkan.";
          ustadzGreetingIdea = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda ${sender} yang baik. Semoga Allah SWT merahmati ananda beserta seluruh keluarga tercinta.`;
          ustadzHelpQuestion = "Apa ada hal yang bisa Ustadz bantu uraikan hukum syariat atau pengamalannya? Atau ananda mempunyai pertanyaan lain yang masih mengganjal di dalam dada?";
        } else {
          ustadzPersona =
            "Anda adalah Ustadzah Hana Miranda, M.Ag., seorang ustadzah ahli fikih kewanitaan, keluarga, dan parenting Islami. Sifat perkataan Anda sangat lembut, keibuan, dipenuhi rasa empati, menyejukkan batin, dan memotivasi santri untuk gigih belajar.";
          ustadzGreetingIdea = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Ananda ${sender} sayang yang dirahmati Allah SWT. Senang sekali bisa bersua dengan ketulusan hati ananda untuk belajar.`;
          ustadzHelpQuestion = "Ada yang bisa Ustadzah bantu untuk menemani proses belajar atau membimbing putra-putri serta amalan harian ananda? Jangan sungkan untuk berbagi jika memiliki pertanyaan lainnya ya, Nak.";
        }

        const systemInstructionCombined = `${ustadzPersona}

Aturan respon cerdas:
1. CUKUP JAWAB SESUAI DENGAN PERTANYAAN SAJA OKE. TIDAK USAH PANJANG LEBAR. Jawaban Anda wajib SANGAT SINGKAT (maksimal 2 kalimat pendek), padat, langsung to-the-point menjawab esensi pertanyaan tanpa basa-basi atau kutipan sejarah panjang. 
2. Hilangkan penjelasan berputar-putar. Sampaikan nasihat inti seketika dengan tegas, lugas, dan santun.
3. Mulailah respon dengan sapaan hangat Islami singkat: "${ustadzGreetingIdea}".
4. Akhiri bimbingan singkat dengan satu kalimat untaian doa ringkas yang relevan untuk ananda ${sender}.
5. Berikan pembatas garis '---' di baris terbawah lalu cantumkan footnote eksklusif ini:
   "*Sesi bimbingan bincang-bincang ini didukung secara komprehensif oleh teknologi kecerdasan buatan (Ustadz AI) bimbingan luhur untuk menyajikan penuntusan pemahaman dengan presisi.*"`;

        let aiReplyText = "";

        if (ai) {
          try {
            const geminiRes = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: `Ajukan pertanyaan bimbingan berikut dari santri bernama ${sender}: "${text}". Tanggapi seolah-olah Anda benar-benar adalah ${ustadz}, berikan nasihat Islami terbaik yang super cerdas, langsung menjawab pertanyaan dengan lugas, santun, dan meneduhkan hati agar santri terus semangat belajar mengaji.`,
              config: {
                systemInstruction: systemInstructionCombined,
                temperature: 0.65,
              },
            });
            aiReplyText = geminiRes.text || "Terima kasih atas pertanyaannya. Mari senantiasa mendekat pada ketentuan-Nya.";
          } catch (modelErr) {
            console.error("Gemini API generation failed, resorting to static fallback:", modelErr);
            aiReplyText = generateStaticUstadzReply(ustadz, sender, text);
          }
        } else {
          aiReplyText = `Assalamu'alaikum Warahmatullahi Wabarakatuh. Semoga Allah SWT merahmati ananda ${sender} beserta keluarga tercinta dalam menuntut ilmu mulia ini.

Belajar mengaji adalah perjalanan spiritual agung. Rasulullah SAW bersabda: "Sebaik-baik kalian adalah orang yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari). Niatkan setiap tarikan napas ananda murni karena ibadah kepada Allah SWT untuk menjemput rida dan keberkahan-Nya yang luar biasa dalam beraktivitas sehari-hari.

Semoga Allah SWT senantiasa memudahkan langkah ananda agar istikamah dan diberikan kemantapan hati dalam memahami petunjuk hidup yang luhur ini.

---
*Sesi bimbingan konsultasi ini didukung secara komprehensif oleh teknologi kecerdasan buatan (Ustadz AI) super cerdas untuk menyajikan penelusuran rujukan dengan presisi.*`;
        }

        const ustadzMsg = {
          id: "msg_" + (Date.now() + 1),
          ustadz: ustadz,
          subject: subject || "Balasan Konsultasi",
          sender: ustadz,
          senderUid: "gemini-ai",
          text: aiReplyText,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          timestampMs: Date.now() + 10,
          isFromUstadz: true,
        };

        await addDoc(coll, ustadzMsg);

      } catch (innerErr) {
        console.error("Gemini Response Generation Error:", innerErr);
      }
    }, 1500);

  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgsPath);
  }
});

// Text to Speech (TTS) Endpoint
app.post("/api/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Teks terjemahan dibutuhkan." });
  }

  if (!ai) {
    return res.status(400).json({ error: "Gemini API Key belum terpasang di rahasia server." });
  }

  const promptInstruction = `Bacakan terjemahan Al-Qur'an ini secara perlahan, khusyuk, teduh, dengan intonasi hangat, tenang, dan tartil yang damai: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptInstruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Sulafat" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ base64Audio });
    } else {
      res.status(500).json({ error: "Gagal menghasilkan audio dari Gemini TTS" });
    }
  } catch (err: any) {
    console.error("Gemini TTS Server Error:", err);
    res.status(500).json({ error: err.message || "Gagal memproses ucapan." });
  }
});

// ==================== NEW FEATURES: ADMIN & PAYMENT API ENDPOINTS ====================

// GET: Fetch Ustadz dynamic list
app.get("/api/ustadz", async (req, res) => {
  const ustadzPath = `artifacts/${APP_ID}/public/data/ustadz`;
  const usersPath = `artifacts/${APP_ID}/public/data/users`;
  try {
    const coll = collection(db, ustadzPath);
    const snap = await getDocs(coll);
    
    // Map with document id to always guarantee existence of a unique valid id representing the document
    const list = snap.docs.map(u => ({
      id: u.id,
      ...u.data()
    }));

    // Fetch and connect photoUrl and other kependudukan/degree info from users collection for each Ustadz
    const updatedList = await Promise.all(list.map(async (ust: any) => {
      try {
        const uId = (ust.id || "").toLowerCase();
        if (uId) {
          const uUserRef = doc(db, usersPath, uId);
          const uUserSnap = await getDoc(uUserRef);
          if (uUserSnap.exists()) {
            const uUserData = uUserSnap.data();
            if (uUserData.photoUrl) {
              ust.photoUrl = uUserData.photoUrl;
            }
            // Join rigorous resident and credential criteria
            ust.email = uUserData.email || ust.email || "";
            ust.nik = uUserData.nik || ust.nik || "";
            ust.province = uUserData.province || ust.province || "";
            ust.country = uUserData.country || ust.country || "";
            ust.degree = uUserData.degree || ust.degree || "";
            ust.university = uUserData.university || ust.university || "";
            ust.qualificationTahsin = uUserData.qualificationTahsin !== undefined ? uUserData.qualificationTahsin : ust.qualificationTahsin;
            ust.qualificationTajwid = uUserData.qualificationTajwid !== undefined ? uUserData.qualificationTajwid : ust.qualificationTajwid;
            ust.qualificationFiqih = uUserData.qualificationFiqih !== undefined ? uUserData.qualificationFiqih : ust.qualificationFiqih;
            ust.certificateName = uUserData.certificateName || ust.certificateName || "";
            ust.certificateData = uUserData.certificateData || ust.certificateData || "";
          }
        }
      } catch (err) {
        console.error("Gagal memetakan foto profil ustadz:", ust.id, err);
      }
      return ust;
    }));

    // Sort logically by ID so order is consistent
    updatedList.sort((a: any, b: any) => (a.id || "").localeCompare(b.id || ""));
    res.json({ ustadz: updatedList });
  } catch (error) {
    console.error("Gagal memuat daftar Ustadz:", error);
    res.status(500).json({ error: "Gagal memuat daftar Ustadz." });
  }
});

// POST: Admin update Ustadz details (Requirement 1)
app.post("/api/admin/ustadz/update", async (req, res) => {
  const { id, name, initials, specialization, desc } = req.body;
  if (!id || !name || !initials || !specialization || !desc) {
    return res.status(400).json({ error: "Semua parameter Ustadz wajib diisi." });
  }
  const ustadzDocPath = `artifacts/${APP_ID}/public/data/ustadz/${id.toLowerCase()}`;
  try {
    await setDoc(doc(db, ustadzDocPath), { id, name, initials, specialization, desc }, { merge: true });
    res.json({ success: true, message: `Berhasil merubah data guru ${name}!` });
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan perubahan data Ustadz." });
  }
});

// POST: Update Ustadz teaching slot availability (Ketersediaan waktu guru oleh sistem)
app.post("/api/ustadz/update-availability", async (req, res) => {
  const { ustadzId, availableSlots } = req.body;
  if (!ustadzId || !Array.isArray(availableSlots)) {
    return res.status(400).json({ error: "Ustadz ID dan daftar ketersediaan waktu wajib diisi." });
  }
  const ustadzDocPath = `artifacts/${APP_ID}/public/data/ustadz/${ustadzId.toLowerCase()}`;
  try {
    await setDoc(doc(db, ustadzDocPath), { availableSlots }, { merge: true });
    res.json({ success: true, message: "Ketersediaan waktu mengajar Anda berhasil diperbarui di server!" });
  } catch (error) {
    console.error("Gagal memperbarui ketersediaan waktu mengajar:", error);
    res.status(500).json({ error: "Gagal menyimpan ketersediaan waktu mengajar pada server." });
  }
});

// POST: Admin delete/remove Ustadz
app.post("/api/admin/ustadz/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID Guru/Ustadz wajib dilampirkan." });
  }

  const ustadzDocPath = `artifacts/${APP_ID}/public/data/ustadz/${id.toLowerCase()}`;
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${id.toLowerCase()}`;

  try {
    // Delete from ustadz collection
    await deleteDoc(doc(db, ustadzDocPath));
    
    // Also delete from users collection for full removal consistency
    await deleteDoc(doc(db, userDocPath));

    res.json({ success: true, message: "Guru / Ustadz berhasil dikeluarkan dari sistem." });
  } catch (error: any) {
    console.error("Gagal menghapus Ustadz:", error);
    res.status(500).json({ error: "Gagal menghapus data guru dari Cloud Firestore." });
  }
});

// POST: Admin generates/resets a password for any user (student or teacher)
app.post("/api/admin/users/reset-password", async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: "Username dan password baru wajib diisi." });
  }

  const lowercaseUsername = username.toLowerCase().trim();
  const usersPath = `artifacts/${APP_ID}/public/data/users`;
  const userDocPath = `${usersPath}/${lowercaseUsername}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Akun pengguna tidak ditemukan." });
    }

    await setDoc(userRef, { password: newPassword }, { merge: true });

    res.json({ success: true, message: `Password untuk ${username} berhasil diperbarui.` });
  } catch (error: any) {
    console.error("Gagal mereset password:", error);
    res.status(500).json({ error: "Gagal menyetel ulang password di Cloud Firestore." });
  }
});

// GET: Admin fetches user password by username
app.get("/api/admin/users/get-password", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: "Username wajib diisi." });
  }

  const cleanUsername = (username as string).toLowerCase().trim();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${cleanUsername}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Akun pengguna tidak ditemukan." });
    }

    const userData = userSnap.data();
    res.json({ success: true, password: userData.password || "Tidak diatur" });
  } catch (error: any) {
    console.error("Gagal mengambil password:", error);
    res.status(500).json({ error: "Gagal mengambil password santri/guru." });
  }
});

// GET: Fetch Syllabus Materials (Requirement 3)
app.get("/api/materials", async (req, res) => {
  const materialsPath = `artifacts/${APP_ID}/public/data/materials`;
  try {
    const coll = collection(db, materialsPath);
    const snap = await getDocs(coll);
    const list = snap.docs.map(m => m.data());
    list.sort((a: any, b: any) => (b.uploadedAt || 0) - (a.uploadedAt || 0));
    res.json({ materials: list });
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat materi syllabus." });
  }
});

// POST: Admin upload syllabus material (PDF/JPG) (Requirement 3)
app.post("/api/admin/materials/upload", async (req, res) => {
  const { title, type, fileName, fileData, description } = req.body;
  if (!title || !type || !fileName || !fileData) {
    return res.status(400).json({ error: "Semua komponen materi wajib lengkap." });
  }
  const materialId = "mat_" + Date.now();
  const materialDocPath = `artifacts/${APP_ID}/public/data/materials/${materialId}`;
  try {
    const newMaterial = {
      id: materialId,
      title: title.trim(),
      type: type, // "pdf" | "jpg"
      fileName: fileName,
      fileData: fileData, // Base64 encoding
      description: description || "",
      uploadedAt: Date.now()
    };
    await setDoc(doc(db, materialDocPath), newMaterial);
    res.status(201).json({ success: true, material: newMaterial });
  } catch (error) {
    console.error("Upload material error:", error);
    res.status(500).json({ error: "Gagal mengupload materi baru ke Cloud storage." });
  }
});

// POST: Admin delete learning material
app.post("/api/admin/materials/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "ID materi dibutuhkan." });
  }
  const materialDocPath = `artifacts/${APP_ID}/public/data/materials/${id}`;
  try {
    await deleteDoc(doc(db, materialDocPath));
    res.json({ success: true, message: "Materi berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus materi dari Cloud." });
  }
});

// POST: Student submits checkout proof (Requirement 4 & 5)
app.post("/api/payment/submit", async (req, res) => {
  const { username, packageLevel, receiptData } = req.body;
  if (!username || !packageLevel || !receiptData) {
    return res.status(400).json({ error: "Isian checkout tidak boleh kosong." });
  }

  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const userData = userSnap.data();

    // No activation code is pre-generated anymore as per user request.
    // The code will be generated only after manual admin clearance/verification.
    await setDoc(userRef, {
      ...userData,
      package: packageLevel,
      paymentStatus: "PENDING",
      paymentReceipt: receiptData,
      activationCode: "", // empty until approved manually by admin
      sessionsCompleted: userData.sessionsCompleted || 0
    });

    // Post to the consultation message board on behalf of AI MengajiID
    const messagesColl = collection(db, `artifacts/${APP_ID}/public/data/messages`);
    await addDoc(messagesColl, {
      id: "msg_pay_" + Date.now(),
      ustadz: "AI Mengaji.ID",
      subject: "Aktivasi Belajar",
      sender: "AI Mengaji.ID",
      senderUid: "gemini-ai",
      text: `Assalamu'alaikum wr. wb., ananda ${userData.name}.\n\nKami telah menerima unggahan bukti transfer pembayaran Anda untuk paket pembelajaran ${packageLevel.replace("_", " ")} pada rekening BSI an. Jaenudin.\n\nSesuai prosedur bimbingan, bukti transaksi Anda saat ini sedang dalam proses verifikasi manual oleh Admin. Kode unik aktivasi akan segera diterbitkan di sini begitu data pembayaran dinyatakan valid. Terima kasih atas pengertiannya!`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      timestampMs: Date.now(),
      isFromUstadz: true
    });

    res.json({ success: true, activationCode: "" });
  } catch (error) {
    console.error("Submit payment error: ", error);
    res.status(500).json({ error: "Gagal menyimpan rincian checkout santri." });
  }
});

// POST: Student activates unique code (Requirement 4 & 5)
app.post("/api/payment/activate", async (req, res) => {
  const { username, code } = req.body;
  if (!username || !code) {
    return res.status(400).json({ error: "Mohon isi nama pengguna dan kode aktivasi unik." });
  }

  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const userData = userSnap.data();

    // Verify code matches what was generated
    if (!userData.activationCode || userData.activationCode.trim() !== code.trim()) {
      return res.status(400).json({ error: "Kode Unik Aktivasi salah! Silakan periksa kembali." });
    }

    // Set meetings quota depending on level
    let meetings = 0;
    if (userData.package === "LEVEL_1") meetings = 3;
    else if (userData.package === "LEVEL_2") meetings = 6;
    else if (userData.package === "LEVEL_3") meetings = 8;
    else {
      // In case they put level 1 code manually
      if (code.includes("L1")) meetings = 3;
      else if (code.includes("L2")) meetings = 6;
      else if (code.includes("L3")) meetings = 8;
      else meetings = 3; // fallback
    }

    const updatedUser = {
      ...userData,
      paymentStatus: "VERIFIED",
      totalMeetings: meetings,
      remainingMeetings: meetings,
      sessionsCompleted: 0
    };

    await setDoc(userRef, updatedUser);

    res.json({
      success: true,
      message: "Selamat! Seluruh fitur belajar premium Anda telah AKTIF sepenuhnya.",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengaktifkan kode belajar." });
  }
});

// POST: Direct bypass endpoint for instant demo activation
app.post("/api/payment/bypass", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username wajib diisi." });
  }

  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const userData = userSnap.data();
    
    // Guard: Prevent duplicate activation or bypassing an already used email account
    if (userData.demoPremiumActivated) {
      return res.status(400).json({ 
        error: "Batas percobaan akun demo premium Anda (10 menit) telah kedaluwarsa atau sedang berjalan. Satu alamat email/akun hanya diperbolehkan menggunakannya sekali." 
      });
    }

    const updatedUser = {
      ...userData,
      package: userData.package || "LEVEL_3",
      paymentStatus: "VERIFIED",
      totalMeetings: 8,
      remainingMeetings: 8,
      activationCode: "MNG-DEMO-BYPASS",
      sessionsCompleted: 0,
      demoPremiumActivated: true,
      demoPremiumStartedAt: Date.now(),
      demoPremiumExpiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes limit
    };

    await setDoc(userRef, updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Bypass error:", error);
    res.status(500).json({ error: "Gagal mengaktifkan bypass demo." });
  }
});

// POST: Deduct user sessions when 30 min meeting completes (Requirement 6)
app.post("/api/sessions/deduct", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username wajib diisi." });
  }
  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    const uData = userSnap.data();
    const currentRemaining = uData.remainingMeetings || 0;
    const currentCompleted = uData.sessionsCompleted || 0;
    const history = uData.sessionHistory || [];

    if (currentRemaining <= 0) {
      return res.status(400).json({ error: "Sisa pertemuan Anda telah habis (0). Silakan beli paket baru." });
    }

    const wibFormatted = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short"
    }) + " WIB";

    const newLog = `Bimbingan level ${uData.package ? uData.package.replace("_", " ") : "1"} tuntas pada ${wibFormatted}`;

    const updatedUser = {
      ...uData,
      remainingMeetings: currentRemaining - 1,
      sessionsCompleted: currentCompleted + 1,
      sessionHistory: [...history, newLog]
    };
    await setDoc(userRef, updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengurangi quota pelajaran siswa." });
  }
});

// GET: Admin fetches complete Rekap student listings (Requirement 6)
app.get("/api/admin/students", async (req, res) => {
  const usersPath = `artifacts/${APP_ID}/public/data/users`;
  try {
    // Run the Gojek-style auto balancer first to keep everything synchronized
    await runAutoAssignment();

    const coll = collection(db, usersPath);
    const snap = await getDocs(coll);
    const list = snap.docs.map(d => d.data());
    // Auto-expire dynamically if we encounter them in list
    const updatedStudents = await Promise.all(list.map(async (u: any) => {
      if (u.role === "Siswa") {
        const uRef = doc(db, usersPath, u.username.toLowerCase());
        return await checkAndExpireDemoPremium(uRef, u);
      }
      return u;
    }));

    // Filter out Admin, only show Siswa (excluding the dev admin reset if any)
    const students = updatedStudents.filter((u: any) => u.role === "Siswa");
    // Sort chronologically by registration date
    students.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data lengkap rekap siswa." });
  }
});

// POST: Admin manually approves/verifies student payment receipt and generates the activation code
app.post("/api/admin/students/verify-payment", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username siswa wajib diisi." });
  }

  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;

  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }

    const uData = userSnap.data();

    // Generate unique activation code if not exist yet
    const ranGen = Math.random().toString(36).substring(2, 8).toUpperCase();
    const lText = uData.package === "LEVEL_2" ? "L2" : uData.package === "LEVEL_3" ? "L3" : "L1";
    const code = `MNG-${lText}-${ranGen}`;

    const updatedUser = {
      ...uData,
      activationCode: code,
    };

    await setDoc(userRef, updatedUser);

    // Send the activation code to student's private board
    const messagesColl = collection(db, `artifacts/${APP_ID}/public/data/messages`);
    await addDoc(messagesColl, {
      id: "msg_pay_verified_" + Date.now(),
      ustadz: "AI Mengaji.ID",
      subject: "Bukti Transfer Terverifikasi!",
      sender: "AI Mengaji.ID",
      senderUid: "gemini-ai",
      text: `Assalamu'alaikum wr. wb., ananda ${uData.name}.\n\nAlhamdulillah, bukti transfer pembayaran Anda untuk paket pembelajaran ${uData.package.replace("_", " ")} telah **dinyatakan VALID** setelah melalui peninjauan manual oleh Admin.\n\nSistem Mengaji.ID menerbitkan KODE UNIK AKTIVASI khusus Anda:\n**${code}**\n\nSilakan salin kode unik ini dan masukkan pada panel aktivasi Anda untuk langsung meluncurkan bimbingan premium seutuhnya! Syukron katsiran.`,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      timestampMs: Date.now(),
      isFromUstadz: true
    });

    res.json({ success: true, activationCode: code });
  } catch (error) {
    console.error("Admin verify payment error:", error);
    res.status(500).json({ error: "Gagal memproses verifikasi bukti transfer manual." });
  }
});

// POST: Admin directly edits student profiles (Requirement 1 & 6)
app.post("/api/admin/students/edit", async (req, res) => {
  const { username, package: pkg, paymentStatus, totalMeetings, remainingMeetings, sessionsCompleted, selectedUstadz } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Isian username spesifik diperlukan." });
  }
  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Data siswa dimaksud tidak ada." });
    }
    const uData = userSnap.data();
    
    // Auto-generate activation code if declared active (VERIFIED) or checked out (PENDING) and doesn't have one yet
    const finalPaymentStatus = paymentStatus !== undefined ? paymentStatus : uData.paymentStatus;
    const finalPkg = pkg !== undefined ? pkg : uData.package;
    let code = uData.activationCode;
    if ((finalPaymentStatus === "VERIFIED" || finalPaymentStatus === "PENDING") && !code) {
      const ranGen = Math.random().toString(36).substring(2, 8).toUpperCase();
      const lText = finalPkg === "LEVEL_2" ? "L2" : finalPkg === "LEVEL_3" ? "L3" : "L1";
      code = `MNG-${lText}-${ranGen}`;
    }

    // Process manual selectedUstadz override
    let finalUstadz = uData.selectedUstadz;
    let isManualAssignment = uData.manualUstadzAssignment;

    if (selectedUstadz !== undefined) {
      if (selectedUstadz === "AUTO" || selectedUstadz === "") {
        finalUstadz = "";
        isManualAssignment = false; // Re-enable for auto-matchmaking
      } else {
        finalUstadz = selectedUstadz;
        isManualAssignment = true; // Mark as manual lock
      }
    }

    const updatedUser = {
      ...uData,
      package: finalPkg !== undefined ? finalPkg : uData.package,
      paymentStatus: finalPaymentStatus,
      activationCode: code,
      totalMeetings: totalMeetings !== undefined ? parseInt(totalMeetings) : (uData.totalMeetings || 0),
      remainingMeetings: remainingMeetings !== undefined ? parseInt(remainingMeetings) : (uData.remainingMeetings || 0),
      sessionsCompleted: sessionsCompleted !== undefined ? parseInt(sessionsCompleted) : (uData.sessionsCompleted || 0),
      selectedUstadz: finalUstadz,
      manualUstadzAssignment: isManualAssignment
    };
    
    await setDoc(userRef, updatedUser);

    // Run the auto assignment balancer to handle any cascading effects or auto allocation
    await runAutoAssignment();

    // Fetch the absolute final user state
    const finalSnap = await getDoc(userRef);
    const finalUserData = finalSnap.exists() ? finalSnap.data() : updatedUser;

    res.json({ success: true, user: finalUserData });
  } catch (error) {
    res.status(500).json({ error: "Gagal merubah data rekap siswa." });
  }
});

// POST: Admin manually triggers a clean system-wide rebalancing of all auto-assigned student slots
app.post("/api/admin/students/rebalance", async (req, res) => {
  try {
    await runAutoAssignment();
    res.json({ success: true, message: "Berhasil melakukan sirkulasi & saring pembagian guru otomatis!" });
  } catch (error) {
    console.error("Manual rebalance error:", error);
    res.status(500).json({ error: "Gagal memproses penyeimbangan guru otomatis." });
  }
});

// POST: Student selects their chosen Ustadz (Requirement 4)
app.post("/api/students/select-ustadz", async (req, res) => {
  const { username, ustadzId } = req.body;
  if (!username || !ustadzId) {
    return res.status(400).json({ error: "Username dan ID Ustadz harus disertakan." });
  }
  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    const uData = userSnap.data();
    const updatedUser = {
      ...uData,
      selectedUstadz: ustadzId
    };
    await setDoc(userRef, updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Gagal memilih ustadz." });
  }
});

// GET: Profile details retrieval
app.get("/api/students/profile/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const lowercaseUser = username.toLowerCase();
    const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      if (lowercaseUser === "ahmad_mujahid") {
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
        await setDoc(userRef, defaultUser);
        return res.json({ success: true, user: defaultUser });
      }
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    const userData = userSnap.data();

    // Run Gojek-style auto balancer to make sure assignments are secure and equalized
    if (userData.role === "Siswa") {
      await runAutoAssignment();
      // Refetch after possible assignment update
      const freshSnap = await getDoc(userRef);
      const freshData = freshSnap.exists() ? freshSnap.data() : userData;
      const checkedUser = await checkAndExpireDemoPremium(userRef, freshData);
      return res.json({ success: true, user: checkedUser });
    }

    const checkedUser = await checkAndExpireDemoPremium(userRef, userData);
    res.json({ success: true, user: checkedUser });
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat profil siswa." });
  }
});

// POST: Update student profile photo
app.post("/api/students/profile/update-photo", async (req, res) => {
  const { username, photoUrl } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username wajib diisi." });
  }
  try {
    const lowercaseUser = username.toLowerCase();
    const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    const userData = userSnap.data();
    userData.photoUrl = photoUrl;
    await setDoc(userRef, userData);
    res.json({ success: true, user: userData });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui foto profil." });
  }
});

// POST: Submit purchase receipt for premium study materials (Requirement 7)
app.post("/api/materials/purchase/submit", async (req, res) => {
  const { username, materialId, receiptData } = req.body;
  if (!username || !materialId || !receiptData) {
    return res.status(400).json({ error: "Data pembelian materi tidak lengkap." });
  }
  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
  const materialDocPath = `artifacts/${APP_ID}/public/data/materials/${materialId}`;
  
  try {
    const userSnap = await getDoc(doc(db, userDocPath));
    const materialSnap = await getDoc(doc(db, materialDocPath));
    if (!userSnap.exists() || !materialSnap.exists()) {
      return res.status(404).json({ error: "Data siswa atau materi tidak ditemukan." });
    }
    const uData = userSnap.data();
    const mData = materialSnap.data();
    
    const purchaseId = `${lowercaseUser}_${materialId}_pay`;
    const purchaseDocPath = `artifacts/${APP_ID}/public/data/material_purchases/${purchaseId}`;
    
    const purchaseData = {
      id: purchaseId,
      username: lowercaseUser,
      studentName: uData.name,
      materialId: materialId,
      materialTitle: mData.title,
      price: mData.price || 0,
      paymentReceipt: receiptData,
      status: "PENDING",
      timestamp: Date.now()
    };
    
    await setDoc(doc(db, purchaseDocPath), purchaseData);
    res.json({ success: true, purchase: purchaseData });
  } catch (error) {
    console.error("Submit material purchase entry error: ", error);
    res.status(500).json({ error: "Gagal memproses pengajuan pembelian materi." });
  }
});

// GET: Admin/Teacher fetches list of material purchases (Requirement 7)
app.get("/api/admin/material-purchases", async (req, res) => {
  const path_ = `artifacts/${APP_ID}/public/data/material_purchases`;
  try {
    const coll = collection(db, path_);
    const snap = await getDocs(coll);
    const purchases = snap.docs.map(d => d.data());
    // Sort buy timestamp
    purchases.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil daftar data pembelian materi." });
  }
});

// POST: Admin activates or rejects material purchases (Requirement 7)
app.post("/api/admin/material-purchases/verify", async (req, res) => {
  const { purchaseId, status } = req.body; // status: "VERIFIED" | "REJECTED"
  if (!purchaseId || !status) {
    return res.status(400).json({ error: "ID pembelian dan status valid dibutuhkan." });
  }
  const purchaseDocPath = `artifacts/${APP_ID}/public/data/material_purchases/${purchaseId}`;
  try {
    const purchaseRef = doc(db, purchaseDocPath);
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) {
      return res.status(404).json({ error: "Data pembelian materi tidak ditemukan." });
    }
    const pData = purchaseSnap.data();
    
    // Update purchase record status
    await setDoc(purchaseRef, { ...pData, status });
    
    if (status === "VERIFIED") {
      // Add the material ID to the student's purchasedMaterials array
      const userDocPath = `artifacts/${APP_ID}/public/data/users/${pData.username}`;
      const userRef = doc(db, userDocPath);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        const purchased = uData.purchasedMaterials || [];
        if (!purchased.includes(pData.materialId)) {
          purchased.push(pData.materialId);
        }
        await setDoc(userRef, {
          ...uData,
          purchasedMaterials: purchased
        });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Verify material purchase error: ", error);
    res.status(500).json({ error: "Gagal memverifikasi pembelian materi." });
  }
});

// POST: Update student study time schedule (Requirement 2 & 3: Waktu Belajar)
app.post("/api/students/update-schedule", async (req, res) => {
  const { username, studyTime } = req.body;
  if (!username || !studyTime) {
    return res.status(400).json({ error: "Username dan Waktu Belajar wajib diisi." });
  }
  const lowercaseUser = username.toLowerCase();
  const userDocPath = `artifacts/${APP_ID}/public/data/users/${lowercaseUser}`;
  try {
    const userRef = doc(db, userDocPath);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Siswa tidak ditemukan." });
    }
    const uData = userSnap.data();
    const updatedUser = {
      ...uData,
      studyTime: studyTime.trim()
    };
    await setDoc(userRef, updatedUser);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan jadwal belajar bimbingan." });
  }
});

// POST: Start/Join active live session (Requirement 5)
app.post("/api/active-sessions/start", async (req, res) => {
  const { username, studentName, selectedUstadz } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username dibutuhkan." });
  }
  const lowercaseUser = username.toLowerCase();
  const sPath = `artifacts/${APP_ID}/public/data/active_sessions/${lowercaseUser}`;
  try {
    const sessionData = {
      id: lowercaseUser,
      studentUsername: lowercaseUser,
      studentName: studentName || username,
      selectedUstadz: selectedUstadz || "Ustadz Adi Hidayat",
      isActive: true,
      studentCameraActive: true,
      ustadzCameraActive: false,
      studentMicActive: true,
      ustadzMicActive: false,
      createdAt: Date.now(),
      timeLeft: 1800
    };
    await setDoc(doc(db, sPath), sessionData);
    res.json({ success: true, session: sessionData });
  } catch (error) {
    res.status(500).json({ error: "Gagal memulai sesi live halaqah." });
  }
});

// POST: Stop/Cancel active live session (Requirement 6)
app.post("/api/active-sessions/stop", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username dibutuhkan." });
  }
  const lowercaseUser = username.toLowerCase();
  const sPath = `artifacts/${APP_ID}/public/data/active_sessions/${lowercaseUser}`;
  try {
    await deleteDoc(doc(db, sPath));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Gagal memberhentikan sesi live." });
  }
});

// POST: Update active session controls (Requirement 3: Ustadz camera activation)
app.post("/api/active-sessions/update", async (req, res) => {
  const { username, ustadzCameraActive, studentCameraActive, ustadzMicActive, studentMicActive, sharedMaterial, sharedMaterialChapter } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username bimbingan dibutuhkan." });
  }
  const lowercaseUser = username.toLowerCase();
  const sPath = `artifacts/${APP_ID}/public/data/active_sessions/${lowercaseUser}`;
  try {
    const sessionRef = doc(db, sPath);
    const sessionSnap = await getDoc(sessionRef);
    if (!sessionSnap.exists()) {
      return res.status(404).json({ error: "Sesi bimbingan tidak aktif." });
    }
    const currentData = sessionSnap.data();
    const updatedData = {
      ...currentData,
      ...(ustadzCameraActive !== undefined && { ustadzCameraActive }),
      ...(studentCameraActive !== undefined && { studentCameraActive }),
      ...(ustadzMicActive !== undefined && { ustadzMicActive }),
      ...(studentMicActive !== undefined && { studentMicActive }),
      ...(sharedMaterial !== undefined && { sharedMaterial }),
      ...(sharedMaterialChapter !== undefined && { sharedMaterialChapter })
    };
    await setDoc(sessionRef, updatedData);
    res.json({ success: true, session: updatedData });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate kontrol sesi live." });
  }
});

// GET: Fetch all active sessions (For Ustadz Panel Real-Time Monitoring)
app.get("/api/active-sessions", async (req, res) => {
  const sPath = `artifacts/${APP_ID}/public/data/active_sessions`;
  try {
    const coll = collection(db, sPath);
    const snap = await getDocs(coll);
    const sessions = snap.docs.map(d => d.data());
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ error: "Gagal memuat sesi bimbingan aktif." });
  }
});

// Clear and Reset Database (Admin Developers Route)
app.post("/api/admin/reset", async (req, res) => {
  const usersPath = `artifacts/${APP_ID}/public/data/users`;
  const msgsPath = `artifacts/${APP_ID}/public/data/messages`;
  const ustadzPath = `artifacts/${APP_ID}/public/data/ustadz`;
  const materialsPath = `artifacts/${APP_ID}/public/data/materials`;

  try {
    // Delete messages
    const msgsColl = collection(db, msgsPath);
    const msgsSnap = await getDocs(msgsColl);
    for (const d of msgsSnap.docs) {
      await deleteDoc(doc(db, msgsPath, d.id));
    }

    // Delete users
    const usersColl = collection(db, usersPath);
    const usersSnap = await getDocs(usersColl);
    for (const d of usersSnap.docs) {
      await deleteDoc(doc(db, usersPath, d.id));
    }

    // Delete ustadz
    const ustadzColl = collection(db, ustadzPath);
    const ustadzSnap = await getDocs(ustadzColl);
    for (const d of ustadzSnap.docs) {
      await deleteDoc(doc(db, ustadzPath, d.id));
    }

    // Delete materials
    const materialsColl = collection(db, materialsPath);
    const materialsSnap = await getDocs(materialsColl);
    for (const d of materialsSnap.docs) {
      await deleteDoc(doc(db, materialsPath, d.id));
    }

    // Bootstrap default
    await bootstrapDb();

    res.json({ success: true, message: "Database Firestore online berhasil dibersihkan!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal melakukan reset database online." });
  }
});

// Global JSON error handler to prevent HTML response on status 500
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Global unscheduled/uncaught error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Gagal berinteraksi dengan API server kami."
  });
});

// ==================== VITE & STATIC FILE ROUTING ====================

async function startServer() {
  try {
    await bootstrapDb();
  } catch (err) {
    console.error("CRITICAL: Gagal inisialisasi awal database Firestore:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server Mengaji.ID aktif di port http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
} else {
  console.log("Running on Vercel: Relying on lazy database bootstrap middle-tier for request-time initialization.");
}

export default app;
