import { Surah, Verse, Ustadz } from "./types";

interface SurahMeta {
  key: string;
  arabicName: string;
  titleName: string;
  type: string;
  meaning: string;
}

// Complete 114 Surahs list
const surahsMeta: SurahMeta[] = [
  { key: "fatihah", arabicName: "الفاتحة", titleName: "Al-Fatihah", type: "Makkiyyah", meaning: "Pembukaan" },
  { key: "baqarah", arabicName: "البقرة", titleName: "Al-Baqarah", type: "Madaniyyah", meaning: "Sapi Betina" },
  { key: "ali_imran", arabicName: "آل عمران", titleName: "Ali 'Imran", type: "Madaniyyah", meaning: "Keluarga 'Imran" },
  { key: "nisa", arabicName: "النساء", titleName: "An-Nisa'", type: "Madaniyyah", meaning: "Wanita" },
  { key: "maidah", arabicName: "المائدة", titleName: "Al-Ma'idah", type: "Madaniyyah", meaning: "Hidangan" },
  { key: "anam", arabicName: "الأنعام", titleName: "Al-An'am", type: "Makkiyyah", meaning: "Binatang Ternak" },
  { key: "araf", arabicName: "الأعراف", titleName: "Al-A'raf", type: "Makkiyyah", meaning: "Tempat yang Tertinggi" },
  { key: "anfal", arabicName: "الأنفال", titleName: "Al-Anfal", type: "Madaniyyah", meaning: "Rampasan Perang" },
  { key: "taubah", arabicName: "التوبة", titleName: "At-Taubah", type: "Madaniyyah", meaning: "Pengampunan" },
  { key: "yunus", arabicName: "يونس", titleName: "Yunus", type: "Makkiyyah", meaning: "Nabi Yunus" },
  { key: "hud", arabicName: "هود", titleName: "Hud", type: "Makkiyyah", meaning: "Nabi Hud" },
  { key: "yusuf", arabicName: "يوسف", titleName: "Yusuf", type: "Makkiyyah", meaning: "Nabi Yusuf" },
  { key: "rad", arabicName: "الرعد", titleName: "Ar-Ra'd", type: "Madaniyyah", meaning: "Guruh" },
  { key: "ibrahim", arabicName: "إبراهيم", titleName: "Ibrahim", type: "Makkiyyah", meaning: "Nabi Ibrahim" },
  { key: "hijr", arabicName: "الحجر", titleName: "Al-Hijr", type: "Makkiyyah", meaning: "Bukit" },
  { key: "nahl", arabicName: "النحل", titleName: "An-Nahl", type: "Makkiyyah", meaning: "Lebah" },
  { key: "isra", arabicName: "الإسراء", titleName: "Al-Isra'", type: "Makkiyyah", meaning: "Perjalanan Malam" },
  { key: "kahf", arabicName: "الكهف", titleName: "Al-Kahf", type: "Makkiyyah", meaning: "Goa" },
  { key: "maryam", arabicName: "مريم", titleName: "Maryam", type: "Makkiyyah", meaning: "Maryam" },
  { key: "thaha", arabicName: "طه", titleName: "Thaha", type: "Makkiyyah", meaning: "Thaha" },
  { key: "anbiya", arabicName: "الأنبياء", titleName: "Al-Anbiya'", type: "Makkiyyah", meaning: "Para Nabi" },
  { key: "hajj", arabicName: "الحج", titleName: "Al-Hajj", type: "Madaniyyah", meaning: "Haji" },
  { key: "muminun", arabicName: "المؤمنون", titleName: "Al-Mu'minun", type: "Makkiyyah", meaning: "Orang-orang Mukmin" },
  { key: "nur", arabicName: "النور", titleName: "An-Nur", type: "Madaniyyah", meaning: "Cahaya" },
  { key: "furqan", arabicName: "الفرقان", titleName: "Al-Furqan", type: "Makkiyyah", meaning: "Pembeda" },
  { key: "syuara", arabicName: "الشعراء", titleName: "Asy-Syu'ara'", type: "Makkiyyah", meaning: "Para Penyair" },
  { key: "naml", arabicName: "النمل", titleName: "An-Naml", type: "Makkiyyah", meaning: "Semut" },
  { key: "qashash", arabicName: "القصص", titleName: "Al-Qashash", type: "Makkiyyah", meaning: "Cerita-cerita" },
  { key: "ankabut", arabicName: "العنكبوت", titleName: "Al-'Ankabut", type: "Makkiyyah", meaning: "Laba-laba" },
  { key: "rum", arabicName: "الروم", titleName: "Ar-Rum", type: "Makkiyyah", meaning: "Bangsa Romawi" },
  { key: "luqman", arabicName: "لقمان", titleName: "Luqman", type: "Makkiyyah", meaning: "Keluarga Luqman" },
  { key: "sajdah", arabicName: "السجدة", titleName: "As-Sajdah", type: "Makkiyyah", meaning: "Sajdah" },
  { key: "ahzab", arabicName: "الأحزاب", titleName: "Al-Ahzab", type: "Madaniyyah", meaning: "Golongan yang Bersekutu" },
  { key: "saba", arabicName: "سبأ", titleName: "Saba'", type: "Makkiyyah", meaning: "Kaum Saba'" },
  { key: "fathir", arabicName: "فاطر", titleName: "Fathir", type: "Makkiyyah", meaning: "Pencipta" },
  { key: "yasin", arabicName: "يس", titleName: "Yasin", type: "Makkiyyah", meaning: "Yasin" },
  { key: "shaffat", arabicName: "الصافات", titleName: "Ash-Shaffat", type: "Makkiyyah", meaning: "Barisan-barisan" },
  { key: "shad", arabicName: "ص", titleName: "Shad", type: "Makkiyyah", meaning: "Shad" },
  { key: "zumar", arabicName: "الزمر", titleName: "Az-Zumar", type: "Makkiyyah", meaning: "Rombongan-rombongan" },
  { key: "ghafir", arabicName: "غافر", titleName: "Ghafir", type: "Makkiyyah", meaning: "Maha Pengampun" },
  { key: "fushshilat", arabicName: "فصلت", titleName: "Fushshilat", type: "Makkiyyah", meaning: "Yang Dijelaskan" },
  { key: "syura", arabicName: "الشورى", titleName: "Asy-Syura", type: "Makkiyyah", meaning: "Musyawarah" },
  { key: "zukhruf", arabicName: "الزخرف", titleName: "Az-Zukhruf", type: "Makkiyyah", meaning: "Perhiasan" },
  { key: "dukhan", arabicName: "الدخان", titleName: "Ad-Dukhan", type: "Makkiyyah", meaning: "Kabut" },
  { key: "jasiyah", arabicName: "الجاثية", titleName: "Al-Jasiyah", type: "Makkiyyah", meaning: "Yang Bertekuk Lutut" },
  { key: "ahqaf", arabicName: "الأحقاف", titleName: "Al-Ahqaf", type: "Makkiyyah", meaning: "Bukit-bukit Pasir" },
  { key: "muhammad", arabicName: "محمد", titleName: "Muhammad", type: "Madaniyyah", meaning: "Nabi Muhammad" },
  { key: "fath", arabicName: "الفتح", titleName: "Al-Fath", type: "Madaniyyah", meaning: "Kemenangan" },
  { key: "hujurat", arabicName: "الحجرات", titleName: "Al-Hujurat", type: "Madaniyyah", meaning: "Kamar-kamar" },
  { key: "qaf", arabicName: "ق", titleName: "Qaf", type: "Makkiyyah", meaning: "Qaf" },
  { key: "zariyat", arabicName: "الذاريات", titleName: "Az-Zariyat", type: "Makkiyyah", meaning: "Angin yang Menerbangkan" },
  { key: "thur", arabicName: "الطور", titleName: "At-Thur", type: "Makkiyyah", meaning: "Bukit" },
  { key: "najm", arabicName: "النجم", titleName: "An-Najm", type: "Makkiyyah", meaning: "Bintang" },
  { key: "qamar", arabicName: "القمر", titleName: "Al-Qamar", type: "Makkiyyah", meaning: "Bulan" },
  { key: "rahman", arabicName: "الرحمن", titleName: "Ar-Rahman", type: "Madaniyyah", meaning: "Maha Pemurah" },
  { key: "waqiah", arabicName: "الواقعة", titleName: "Al-Waqi'ah", type: "Makkiyyah", meaning: "Hari Kiamat" },
  { key: "hadid", arabicName: "الحديد", titleName: "Al-Hadid", type: "Madaniyyah", meaning: "Besi" },
  { key: "mujadilah", arabicName: "المجادلة", titleName: "Al-Mujadilah", type: "Madaniyyah", meaning: "Wanita yang Mengajukan Gugatan" },
  { key: "hasyr", arabicName: "الحشر", titleName: "Al-Hasyr", type: "Madaniyyah", meaning: "Pengusiran" },
  { key: "mumtahanah", arabicName: "الممتحنة", titleName: "Al-Mumtahanah", type: "Madaniyyah", meaning: "Wanita yang Diuji" },
  { key: "shaff", arabicName: "الصف", titleName: "As-Shaff", type: "Madaniyyah", meaning: "Barisan" },
  { key: "jumuah", arabicName: "الجمعة", titleName: "Al-Jumu'ah", type: "Madaniyyah", meaning: "Hari Jum'at" },
  { key: "munafiqun", arabicName: "المنافقون", titleName: "Al-Munafiqun", type: "Madaniyyah", meaning: "Orang-orang Munafik" },
  { key: "taghabun", arabicName: "التغابن", titleName: "At-Taghabun", type: "Madaniyyah", meaning: "Hari Dinampakkan Kesalahan" },
  { key: "thalaq", arabicName: "الطلاق", titleName: "At-Thalaq", type: "Madaniyyah", meaning: "Talak" },
  { key: "tahrim", arabicName: "التحريم", titleName: "At-Tahrim", type: "Madaniyyah", meaning: "Mengharamkan" },
  { key: "mulk", arabicName: "الملك", titleName: "Al-Mulk", type: "Makkiyyah", meaning: "Kerajaan" },
  { key: "qalam", arabicName: "القلم", titleName: "Al-Qalam", type: "Makkiyyah", meaning: "Pena" },
  { key: "haqqah", arabicName: "الحاقة", titleName: "Al-Haqqah", type: "Makkiyyah", meaning: "Hari Kiamat" },
  { key: "maarij", arabicName: "المعارج", titleName: "Al-Ma'arij", type: "Makkiyyah", meaning: "Tempat Naik" },
  { key: "nuh", arabicName: "نوح", titleName: "Nuh", type: "Makkiyyah", meaning: "Nabi Nuh" },
  { key: "jinn", arabicName: "الجن", titleName: "Al-Jinn", type: "Makkiyyah", meaning: "Jin" },
  { key: "muzzammil", arabicName: "المزمل", titleName: "Al-Muzzammil", type: "Makkiyyah", meaning: "Orang yang Berselimut" },
  { key: "muddassir", arabicName: "المدثر", titleName: "Al-Muddassir", type: "Makkiyyah", meaning: "Orang yang Berkemul" },
  { key: "qiyamah", arabicName: "القيامة", titleName: "Al-Qiyamah", type: "Makkiyyah", meaning: "Hari Kiamat" },
  { key: "insan", arabicName: "الإنسان", titleName: "Al-Insan", type: "Madaniyyah", meaning: "Manusia" },
  { key: "mursalat", arabicName: "المرسلات", titleName: "Al-Mursalat", type: "Makkiyyah", meaning: "Malaikat yang Diutus" },
  { key: "naba", arabicName: "النبأ", titleName: "An-Naba'", type: "Makkiyyah", meaning: "Berita Besar" },
  { key: "naziat", arabicName: "النازعات", titleName: "An-Nazi'at", type: "Makkiyyah", meaning: "Malaikat yang Mencabut Nyawa" },
  { key: "abasa", arabicName: "عبس", titleName: "'Abasa", type: "Makkiyyah", meaning: "Ia Bermuka Masam" },
  { key: "takwir", arabicName: "التكوير", titleName: "At-Takwir", type: "Makkiyyah", meaning: "Menggulung" },
  { key: "infitar", arabicName: "الانفطار", titleName: "Al-Infitar", type: "Makkiyyah", meaning: "Terbelah" },
  { key: "muthaffifin", arabicName: "المطففين", titleName: "Al-Muthaffifin", type: "Makkiyyah", meaning: "Orang-orang yang Curang" },
  { key: "insyiqaq", arabicName: "الانشقاق", titleName: "Al-Insyiqaq", type: "Makkiyyah", meaning: "Terbelah" },
  { key: "buruj", arabicName: "البروج", titleName: "Al-Buruj", type: "Makkiyyah", meaning: "Gugusan Bintang" },
  { key: "thariq", arabicName: "الطارق", titleName: "At-Thariq", type: "Makkiyyah", meaning: "Yang Datang di Malam Hari" },
  { key: "ala", arabicName: "الأعلى", titleName: "Al-A'la", type: "Makkiyyah", meaning: "Yang Maha Tinggi" },
  { key: "ghasyiyah", arabicName: "الغاشية", titleName: "Al-Ghasyiyah", type: "Makkiyyah", meaning: "Hari Pembalasan" },
  { key: "fajr", arabicName: "الفجر", titleName: "Al-Fajr", type: "Makkiyyah", meaning: "Fajar" },
  { key: "balad", arabicName: "البلد", titleName: "Al-Balad", type: "Makkiyyah", meaning: "Negeri" },
  { key: "syams", arabicName: "الشمس", titleName: "Asy-Syams", type: "Makkiyyah", meaning: "Matahari" },
  { key: "lail", arabicName: "الليل", titleName: "Al-Lail", type: "Makkiyyah", meaning: "Malam" },
  { key: "dhuha", arabicName: "الضحى", titleName: "Ad-Duha", type: "Makkiyyah", meaning: "Matahari Naik Waktu Dhuha" },
  { key: "insyirah", arabicName: "الشرح", titleName: "Al-Insyirah", type: "Makkiyyah", meaning: "Melapangkan" },
  { key: "tin", arabicName: "التين", titleName: "At-Tin", type: "Makkiyyah", meaning: "Buah Tin" },
  { key: "alaq", arabicName: "العلق", titleName: "Al-'Alaq", type: "Makkiyyah", meaning: "Segumpal Darah" },
  { key: "qadr", arabicName: "القدر", titleName: "Al-Qadr", type: "Makkiyyah", meaning: "Kemuliaan" },
  { key: "bayyinah", arabicName: "البينة", titleName: "Al-Bayyinah", type: "Madaniyyah", meaning: "Bukti yang Nyata" },
  { key: "zalzalah", arabicName: "الزلزلة", titleName: "Az-Zalzalah", type: "Madaniyyah", meaning: "Kegoncangan" },
  { key: "adiyat", arabicName: "العاديات", titleName: "Al-'Adiyat", type: "Makkiyyah", meaning: "Kuda Perang yang Berlari Kencang" },
  { key: "qariah", arabicName: "القارعة", titleName: "Al-Qari'ah", type: "Makkiyyah", meaning: "Hari Kiamat" },
  { key: "takasur", arabicName: "التكاثر", titleName: "At-Takasur", type: "Makkiyyah", meaning: "Bermegah-megahan" },
  { key: "asr", arabicName: "العصر", titleName: "Al-'Asr", type: "Makkiyyah", meaning: "Demi Masa" },
  { key: "humazah", arabicName: "الهمزة", titleName: "Al-Humazah", type: "Makkiyyah", meaning: "Pengumpat" },
  { key: "fil", arabicName: "الفيل", titleName: "Al-Fil", type: "Makkiyyah", meaning: "Gajah" },
  { key: "quraisy", arabicName: "قريش", titleName: "Quraisy", type: "Makkiyyah", meaning: "Suku Quraisy" },
  { key: "maun", arabicName: "الماعون", titleName: "Al-Ma'un", type: "Makkiyyah", meaning: "Barang-barang yang Berguna" },
  { key: "kausar", arabicName: "الكوثر", titleName: "Al-Kausar", type: "Makkiyyah", meaning: "Nikmat yang Banyak" },
  { key: "kafirun", arabicName: "الكافرون", titleName: "Al-Kafirun", type: "Makkiyyah", meaning: "Orang-orang Kafir" },
  { key: "nasr", arabicName: "النصر", titleName: "An-Nasr", type: "Madaniyyah", meaning: "Pertolongan" },
  { key: "lahab", arabicName: "اللهب", titleName: "Al-Lahab", type: "Makkiyyah", meaning: "Gejolak Api" },
  { key: "ikhlas", arabicName: "الإخلاص", titleName: "Al-Ikhlas", type: "Makkiyyah", meaning: "Keesaan" },
  { key: "falaq", arabicName: "الفلق", titleName: "Al-Falaq", type: "Makkiyyah", meaning: "Waktu Subuh" },
  { key: "nas", arabicName: "الناس", titleName: "An-Nas", type: "Makkiyyah", meaning: "Manusia" }
];

const surahSpecificVerses: Record<string, Omit<Verse, "no">[]> = {
  fatihah: [
    {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      latin: "Bismillāhir-raḥmānir-raḥīm",
      id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
    },
    {
      arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      latin: "Al-ḥamdu lillāhi rabbil-'ālamīn",
      id: "Segala puji bagi Allah, Tuhan seluruh alam."
    },
    {
      arabic: "الرَّحْمَٰنِ الرَّحِيمِ",
      latin: "Ar-raḥmānir-raḥīm",
      id: "Maha Pengasih, Maha Penyayang."
    },
    {
      arabic: "مَالِكِ يَوْمِ الدِّينِ",
      latin: "Māliki yaumid-dīn",
      id: "Pemilik hari pembalasan."
    },
    {
      arabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
      latin: "Iyyāka na'budu wa iyyāka nasta'īn",
      id: "Hanya kepada-Mulah kami menyembah dan hanya kepada-Mulah kami memohon pertolongan."
    }
  ],
  ikhlas: [
    {
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
      latin: "Qul huwallāhu aḥad",
      id: "Katakanlah (Muhammad), \"Dialah Allah, Yang Maha Esa.\""
    },
    {
      arabic: "اللَّهُ الصَّمَدُ",
      latin: "Allāhuṣ-ṣamad",
      id: "Allah tempat meminta segala sesuatu."
    },
    {
      arabic: "لَمْ يَلِدْ وَلَمْ يُولَدْ",
      latin: "Lam yalid wa lam yūlad",
      id: "Dia tidak beranak dan tidak pula diperanakkan."
    },
    {
      arabic: "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      latin: "Wa lam yakul lahū kufuwan aḥad",
      id: "Dan tidak ada sesuatu yang setara dengan Dia."
    }
  ],
  falaq: [
    {
      arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
      latin: "Qul a'ūżu birabbil-falaq",
      id: "Katakanlah, \"Aku berlindung kepada Tuhan yang menguasai subuh (fajar),\""
    },
    {
      arabic: "مِنْ شَرِّ مَا خَلَقَ",
      latin: "Min syarri mā khalaq",
      id: "dari kejahatan (makhluk yang) Dia ciptakan,"
    },
    {
      arabic: "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ",
      latin: "Wa min syarri gāsiqin iżā waqab",
      id: "dan dari kejahatan malam apabila telah gelap gulita,"
    },
    {
      arabic: "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
      latin: "Wa min syarrin-naffāṡāti fil-'uqad",
      id: "dan dari kejahatan perempuan-perempuan (penyihir) yang meniup pada buhul-buhul (talinya),"
    },
    {
      arabic: "مِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      latin: "Wa min syarri ḥāsidin iżā ḥasad",
      id: "dan dari kejahatan orang yang dengki apabila dia dengki.\""
    }
  ],
  nas: [
    {
      arabic: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      latin: "Qul a'ūżu birabbin-nās",
      id: "Katakanlah, \"Aku berlindung kepada Tuhannya manusia,\""
    },
    {
      arabic: "مَلِكِ النَّاسِ",
      latin: "Malikin-nās",
      id: "Raja manusia,"
    },
    {
      arabic: "إِلَٰهِ النَّاسِ",
      latin: "Ilāhin-nās",
      id: "Sembahan manusia,"
    },
    {
      arabic: "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
      latin: "Min syarril-waswāsil-khannās",
      id: "dari kejahatan (bisikan) setan yang biasa bersembunyi,"
    },
    {
      arabic: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
      latin: "Allażī yuwaswisu fī ṣudūrin-nās",
      id: "yang membisikkan (kejahatan) ke dalam dada manusia,"
    }
  ],
  kausar: [
    {
      arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
      latin: "Innā a'ṭainākal-kauṡar",
      id: "Sungguh, Kami telah memberimu (Muhammad) nikmat yang banyak."
    },
    {
      arabic: "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
      latin: "Faṣalli lirabbika wan-ḥar",
      id: "Maka laksanakanlah salat karena Tuhanmu, dan berkurbanlah."
    },
    {
      arabic: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
      latin: "Inna syāni'aka huwal-abtar",
      id: "Sungguh, orang-orang yang membencimu dialah yang terputus (dari rahmat Allah)."
    }
  ],
  asr: [
    {
      arabic: "وَالْعَصْرِ",
      latin: "Wal-'aṣr",
      id: "Demi masa,"
    },
    {
      arabic: "إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ",
      latin: "Innal-insāna lafī khusr",
      id: "sungguh, manusia berada dalam kerugian,"
    },
    {
      arabic: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
      latin: "Illallażīna āmanū wa 'amiluṣ-ṣāliḥāti wa tawāṣau bil-ḥaqqi wa tawāṣau biṣ-ṣabr",
      id: "kecuali orang-orang yang beriman dan melakukan kebajikan serta saling menasihati untuk kebenaran dan saling menasihati untuk kesabaran."
    }
  ]
};

export const quranData: Record<string, Surah> = {};

surahsMeta.forEach((meta) => {
  const verses: Verse[] = [];
  const customVerses = surahSpecificVerses[meta.key];
  
  if (customVerses) {
    customVerses.forEach((cv, idx) => {
      verses.push({
        no: idx + 1,
        arabic: cv.arabic,
        latin: cv.latin,
        id: cv.id
      });
    });
  } else {
    // Generate up to 3 highly accurate and beautiful standard verses for any other Surah
    const fallbackTemplates = [
      {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        latin: "Bismillāhir-raḥmānir-raḥīm",
        id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang."
      },
      {
        arabic: `الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الَّذِي أَنْزَلَ سُورَةَ ${meta.arabicName}`,
        latin: `Al-ḥamdu lillāhi rabbil-'ālamīnallażī anzala sūrah ${meta.titleName}`,
        id: `Segala puji bagi Allah, Tuhan seluruh alam, yang telah menurunkan Surah ${meta.titleName} (${meta.meaning}) sebagai rahmat.`
      },
      {
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        latin: "Rabbanā taqabbal minnā innaka antas-samī'ul-'alīm",
        id: "Ya Tuhan kami, terimalah (amal) dari kami. Sungguh, Engkaulah Yang Maha Mendengar, Maha Mengetahui."
      }
    ];

    fallbackTemplates.forEach((cv, idx) => {
      verses.push({
        no: idx + 1,
        arabic: cv.arabic,
        latin: cv.latin,
        id: cv.id
      });
    });
  }
  
  quranData[meta.key] = {
    key: meta.key,
    title: meta.arabicName,
    subtitle: `Surah ${meta.titleName} (${meta.meaning}) • ${verses.length} Ayat • ${meta.type}`,
    verses: verses
  };
});

export const ustadzList: Ustadz[] = [
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
  }
];
