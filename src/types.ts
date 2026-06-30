export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  password?: string;
  photoUrl?: string;
  studyTime?: string;
  lastReadSurah?: string;
  lastReadVerse?: number;
  updatedAt?: number;
  // New subscription fields
  package?: string;
  totalMeetings?: number;
  remainingMeetings?: number;
  paymentStatus?: string;
  paymentReceipt?: string;
  activationCode?: string;
  sessionsCompleted?: number;
  sessionHistory?: string[];
  selectedUstadz?: string;
  manualUstadzAssignment?: boolean;
  purchasedMaterials?: string[];
  demoPremiumActivated?: boolean;
  demoPremiumStartedAt?: number;
  demoPremiumExpiresAt?: number;
  // Kependudukan & Academics (highly strict for Ustadz registration)
  nik?: string;
  province?: string;
  country?: string;
  degree?: string;
  university?: string;
  qualificationTahsin?: boolean;
  qualificationTajwid?: boolean;
  qualificationFiqih?: boolean;
  certificateName?: string;
  certificateData?: string;
}

export interface Message {
  id: string;
  ustadz: string;
  subject: string;
  sender: string;
  senderUid: string;
  text: string;
  timestamp: string;
  timestampMs: number;
  isFromUstadz: boolean;
}

export interface Verse {
  no: number;
  arabic: string;
  latin: string;
  id: string;
}

export interface Surah {
  key: string;
  title: string;
  subtitle: string;
  verses: Verse[];
}

export interface Ustadz {
  id: string;
  name: string;
  initials: string;
  specialization: string;
  desc: string;
  photoUrl?: string;
  email?: string;
  nik?: string;
  province?: string;
  country?: string;
  degree?: string;
  university?: string;
  qualificationTahsin?: boolean;
  qualificationTajwid?: boolean;
  qualificationFiqih?: boolean;
  certificateName?: string;
  certificateData?: string;
  availableSlots?: string[];
}

export interface Material {
  id: string;
  title: string;
  type: "pdf" | "jpg";
  fileName: string;
  fileData: string; // base64 string
  description?: string;
  uploadedAt: number;
  price?: number; // 0 or undefined means Free
}

export interface MaterialPurchase {
  id: string;
  username: string;
  studentName: string;
  materialId: string;
  materialTitle: string;
  price: number;
  paymentReceipt?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  timestamp: number;
}
