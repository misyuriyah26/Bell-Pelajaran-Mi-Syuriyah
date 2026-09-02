import { BellEvent, SchoolProfile, BellSettings } from '../types';

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: "MI Syuriyah Pebatan",
  shortName: "Bel Syuriyah",
  tagline: "Madrasah Ibtidaiyah Unggul, Berakhlak Mulia, & Berprestasi",
  level: "Madrasah Ibtidaiyah (MI)",
  npsn: "60709823",
  address: "Jl. Raya Pebatan No. 26, Kec. Jatibarang, Kab. Brebes, Jawa Tengah",
  headmaster: "Ustadz H. Ahmad Syakir, S.Pd.I",
  phone: "(0283) 617-XXXX",
  academicYear: "2026/2027",
  logoUrl: "/app-icon.jpg",
  faviconUrl: "/icon-192.png"
};

export const DEFAULT_SETTINGS: BellSettings = {
  masterVolume: 0.9,
  chimeVolume: 0.95,
  ttsVolume: 0.9,
  ttsRate: 1.0,
  ttsPitch: 1.0,
  preferredVoiceId: '',
  preferredVoiceEn: '',
  preferredVoiceAr: '',
  voicePersona: 'ustadz',
  echo: {
    enabled: true,
    preset: 'hallway',
    delayTime: 0.28,
    feedback: 0.38,
    wetLevel: 0.32,
    filterFreq: 2400
  },
  playPreChirp: true,
  realisticVoiceEnhance: true,
  defaultChimeType: 'westminster',
  isMuted: false,
  holidayMode: false,
  holidayNote: 'Hari Libur Resmi Madrasah',
  holidayDates: [],
  activePreset: 'standard',
  themePreset: 'professional_slate',
  autoPlayAudioUnlocked: false,
  showVisualNotification: true
};

export const DEFAULT_BELL_SCHEDULES: BellEvent[] = [
  {
    id: 'bell-01',
    time: '06:45',
    name: 'Bel Persiapan & Tadarus Pagi',
    category: 'upacara',
    days: [1, 2, 3, 4, 6], // Sen, Sel, Rab, Kam, Sab
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Perhatian seluruh siswa-siswi MI Syuriyah Pebatan. Waktu tadarus Al-Qur\'an dan asmaul husna pagi akan segera dimulai. Silakan menempati ruang kelas dengan rapi.',
      en: 'Attention all students of MI Syuriyah Pebatan. The morning Quran recitation and Asmaul Husna will begin shortly. Please sit neatly in your classroom.',
      ar: 'انتباه لجميع تلاميذ وتلميذات مدرسة سورية بيباتان. ستبدأ تلاوة القرآن الكريم وأسماء الله الحسنى صباحًا. يرجى الجلوس في الفصول بأدب ونظام.'
    }
  },
  {
    id: 'bell-01-jumat',
    time: '06:45',
    name: 'Bel Senam Pagi & Sholawat Bersama',
    category: 'upacara',
    days: [5], // Jumat
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Selamat pagi, selamat hari Jumat yang penuh berkah. Seluruh santri dan guru dipersilakan berkumpul di halaman madrasah untuk senam pagi dan sholawat bersama.',
      en: 'Good morning and blessed Friday. All students and teachers are requested to gather in the school yard for morning exercises and collective prayer.',
      ar: 'صباح الخير وجمعة مباركة. يرجى من جميع التلاميذ والمعلمين التجمع في ساحة المدرسة للنشاط الصباحي والصلاة على النبي.'
    }
  },
  {
    id: 'bell-02',
    time: '07:00',
    name: 'Bel Masuk Jam Ke-1 (Mulai KBM)',
    category: 'masuk',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Bel masuk kelas telah berbunyi. Jam pelajaran pertama segera dimulai. Mari kita awali pembelajaran hari ini dengan membaca doa bersama.',
      en: 'The school bell has rung. The first lesson is about to begin. Let us start our learning today by reciting prayers together.',
      ar: 'دق جرس الدخول. ستبدأ الحصة الأولى الآن. هيا بنا نفتتح درسنا اليوم بقراءة الدعاء معًا.'
    }
  },
  {
    id: 'bell-03',
    time: '07:35',
    name: 'Bel Ganti Jam Ke-2',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran pertama telah selesai. Sekarang masuk jam pelajaran kedua. Bapak dan ibu guru dipersilakan memasuki ruang kelas.',
      en: 'The first lesson is over. It is now time for the second period. Teachers, please proceed to your respective classrooms.',
      ar: 'انتهت الحصة الأولى. حان الآن وقت الحصة الثانية. يتفضل المعلمون والمعلمات بالدخول إلى الفصول.'
    }
  },
  {
    id: 'bell-04',
    time: '08:10',
    name: 'Bel Ganti Jam Ke-3',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran kedua telah selesai. Sekarang masuk jam pelajaran ketiga. Tetap semangat dalam menuntut ilmu.',
      en: 'The second lesson is finished. We are now entering the third period. Keep enthusiastic in seeking knowledge.',
      ar: 'انتهت الحصة الثانية. حان الآن وقت الحصة الثالثة. حافظوا على حماسكم في طلب العلم.'
    }
  },
  {
    id: 'bell-05',
    time: '08:45',
    name: 'Bel Ganti Jam Ke-4',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran ketiga telah selesai. Sekarang masuk jam pelajaran keempat.',
      en: 'The third period is over. It is now time for the fourth lesson period.',
      ar: 'انتهت الحصة الثالثة. حان الآن موعد الحصة الرابعة.'
    }
  },
  {
    id: 'bell-05-jumat',
    time: '08:45',
    name: 'Bel Istirahat & Sholat Dhuha (Jumat)',
    category: 'dhuha',
    days: [5], // Jumat
    enabled: true,
    chimeType: 'dingdong',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat dan sholat dhuha hari Jumat telah tiba. Silakan berwudhu dan menunaikan sholat dhuha di musholla madrasah.',
      en: 'Break time and Friday Dhuha prayer has arrived. Please take ablution and perform Dhuha prayer in the prayer hall.',
      ar: 'حان وقت الاستراحة وصلاة الضحى ليوم الجمعة. تفضلوا بالوضوء وأداء صلاة الضحى في المصلى.'
    }
  },
  {
    id: 'bell-06',
    time: '09:20',
    name: 'Bel Istirahat 1 & Sholat Dhuha',
    category: 'dhuha',
    days: [1, 2, 3, 4, 6],
    enabled: true,
    chimeType: 'dingdong',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat pertama dan sholat dhuha berjamaah telah tiba. Mari menuju musholla untuk menunaikan sholat dhuha.',
      en: 'First break and congregational Dhuha prayer time has arrived. Let us proceed to the school musalla for prayer.',
      ar: 'حان وقت الاستراحة الأولى وصلاة الضحى جماعة. هيا بنا إلى مصلى المدرسة لأداء صلاة الضحى.'
    }
  },
  {
    id: 'bell-07-jumat',
    time: '09:15',
    name: 'Bel Masuk Jam Ke-4 Pasca Dhuha (Jumat)',
    category: 'masuk',
    days: [5],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat hari Jumat telah selesai. Silakan seluruh siswa kembali ke kelas untuk melanjutkan pelajaran.',
      en: 'Friday break time has ended. All students, please return to your classrooms to continue lessons.',
      ar: 'انتهت استراحة يوم الجمعة. يرجى من جميع التلاميذ العودة إلى الفصول لمواصلة الدروس.'
    }
  },
  {
    id: 'bell-07',
    time: '09:50',
    name: 'Bel Masuk Pasca Istirahat 1 (Jam Ke-5)',
    category: 'masuk',
    days: [1, 2, 3, 4, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat pertama telah selesai. Seluruh siswa dipersilakan masuk kembali ke kelas masing-masing dengan tertib.',
      en: 'The first break time is finished. All students are kindly requested to enter their classrooms in an orderly manner.',
      ar: 'انتهت الاستراحة الأولى. يرجى من جميع التلاميذ والتلميذات الدخول إلى فصولهم بنظام.'
    }
  },
  {
    id: 'bell-08-jumat',
    time: '09:50',
    name: 'Bel Ganti Jam Ke-5 (Jumat)',
    category: 'ganti_jam',
    days: [5],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran keempat selesai. Sekarang masuk jam kelima.',
      en: 'The fourth lesson is over. Now entering the fifth lesson period.',
      ar: 'انتهت الحصة الرابعة. حان وقت الحصة الخامسة.'
    }
  },
  {
    id: 'bell-08',
    time: '10:25',
    name: 'Bel Ganti Jam Ke-6',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran kelima telah selesai. Sekarang masuk jam pelajaran keenam.',
      en: 'The fifth period has ended. It is now time for the sixth lesson period.',
      ar: 'انتهت الحصة الخامسة. حان الآن موعد الحصة السادسة.'
    }
  },
  {
    id: 'bell-pulang-jumat',
    time: '10:30',
    name: 'Bel Pulang Hari Jumat (Persiapan Sholat Jumat)',
    category: 'pulang',
    days: [5],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Pelajaran hari Jumat telah selesai. Bersiaplah untuk menunaikan ibadah sholat Jumat di masjid masing-masing. Berhati-hatilah di jalan pulang. Wassalamu\'alaikum warahmatullah.',
      en: 'Friday classes have ended. Prepare for the Friday congregational prayer at the mosque. Have a safe journey home. Wassalamu\'alaikum warahmatullah.',
      ar: 'انتهت دروس يوم الجمعة. استعدوا لأداء صلاة الجمعة في المسجد. رافقتكم السلامة في طريقكم. والسلام عليكم ورحمة الله.'
    }
  },
  {
    id: 'bell-09',
    time: '11:00',
    name: 'Bel Ganti Jam Ke-7',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Jam pelajaran keenam telah selesai. Sekarang masuk jam pelajaran ketujuh.',
      en: 'The sixth period is finished. Now entering the seventh lesson period.',
      ar: 'انتهت الحصة السادسة. حان الآن وقت الحصة السابعة.'
    }
  },
  {
    id: 'bell-10',
    time: '11:35',
    name: 'Bel Istirahat 2 & Sholat Dzuhur Berjamaah',
    category: 'dzuhur',
    days: [1, 2, 3, 4],
    enabled: true,
    chimeType: 'dingdong',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat kedua dan sholat dzuhur berjamaah telah tiba. Mari mengambil air wudhu dan segera menuju musholla madrasah.',
      en: 'Second break and Zuhr congregational prayer time has arrived. Please perform ablution and proceed to the school musalla.',
      ar: 'حان وقت الاستراحة الثانية وصلاة الظهر جماعة. فلنتوضأ ونتوجه سريعًا إلى مصلى المدرسة.'
    }
  },
  {
    id: 'bell-pulang-sabtu',
    time: '11:45',
    name: 'Bel Pulang Hari Sabtu',
    category: 'pulang',
    days: [6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Kegiatan madrasah hari Sabtu telah selesai. Selamat berakhir pekan dan salam hormat untuk keluarga di rumah. Wassalamu\'alaikum warahmatullahi wabarakatuh.',
      en: 'Saturday school activities are completed. Have a wonderful weekend and warm regards to your families. Wassalamu\'alaikum warahmatullahi wabarakatuh.',
      ar: 'انتهت أنشطة المدرسة ليوم السبت. عطلة نهاية أسبوع سعيدة وتحياتنا لأسركم الكريمة. والسلام عليكم ورحمة الله وبركاته.'
    }
  },
  {
    id: 'bell-11',
    time: '12:15',
    name: 'Bel Masuk Pasca Sholat Dzuhur',
    category: 'masuk',
    days: [1, 2, 3, 4],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu sholat dzuhur dan istirahat telah selesai. Seluruh siswa dipersilakan masuk kembali ke kelas untuk jam pelajaran terakhir.',
      en: 'Zuhr prayer and break time has concluded. All students, please return to your classrooms for the final lesson.',
      ar: 'انتهى وقت صلاة الظهر والاستراحة. يتفضل جميع الطلاب بالدخول إلى فصولهم للحصة الأخيرة.'
    }
  },
  {
    id: 'bell-12',
    time: '12:50',
    name: 'Bel Pelajaran Selesai & Doa Pulang',
    category: 'pulang',
    days: [1, 2, 3, 4],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Alhamdulillah, kegiatan belajar mengajar hari ini telah selesai. Rapikan tempat duduk dan peralatan belajar, lalu berdoalah sebelum meninggalkan kelas. Hati-hati di jalan.',
      en: 'Alhamdulillah, learning activities for today have finished. Please tidy your desks and recite the closing prayer before leaving. Safe journey home.',
      ar: 'الحمد لله، انتهت الدروس لهذا اليوم. رتبوا مقاعدكم وأدواتكم، وادعوا دعاء كفارة المجلس قبل الخروج. رافقتكم السلامة.'
    }
  }
];

export const PRESET_EXAM_SCHEDULES: BellEvent[] = [
  {
    id: 'exam-01',
    time: '07:00',
    name: 'Bel Masuk Ruang Ujian & Pengarahan Pengawas',
    category: 'masuk',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Perhatian seluruh peserta asesmen dan ujian MI Syuriyah Pebatan. Silakan memasuki ruang ujian masing-masing dengan tenang dan tertib.',
      en: 'Attention all examination candidates. Please enter your examination rooms quietly and in an orderly manner.',
      ar: 'انتباه لجميع الطلاب المشاركين في الامتحانات. يرجى الدخول إلى قاعات الامتحان بهدوء ونظام.'
    }
  },
  {
    id: 'exam-02',
    time: '07:30',
    name: 'Bel Mulai Pengerjaan Ujian Sesi 1',
    category: 'custom',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu pengerjaan ujian sesi pertama dimulai. Kerjakan soal dengan jujur, teliti, dan mandiri. Selamat mengerjakan.',
      en: 'The first examination session has begun. Work on your papers honestly, carefully, and independently. Good luck.',
      ar: 'بدأ وقت الامتحان للجلسة الأولى. أرجو الإجابة بأمانة ودقة وتوكل على الله. بالتوفيق والنجاح.'
    }
  },
  {
    id: 'exam-03',
    time: '09:00',
    name: 'Bel Selesai Ujian Sesi 1 & Istirahat',
    category: 'istirahat',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'dingdong',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu pengerjaan sesi pertama telah selesai. Letakkan alat tulis dan kumpulkan lembar jawaban kepada pengawas. Selamat beristirahat.',
      en: 'The first session time has ended. Please put down your pens and submit your answer sheets to the proctor. Enjoy your break.',
      ar: 'انتهى وقت الجلسة الأولى. ضعوا أقلامكم وسلموا أوراق الإجابة إلى المراقب. استراحة طيبة.'
    }
  },
  {
    id: 'exam-04',
    time: '09:30',
    name: 'Bel Masuk Ujian Sesi 2',
    category: 'masuk',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Waktu istirahat selesai. Seluruh peserta ujian silakan memasuki ruang ujian untuk sesi kedua.',
      en: 'Break time is over. All candidates, please enter your examination rooms for the second session.',
      ar: 'انتهت الاستراحة. تفضلوا بالدخول إلى قاعات الامتحان للجلسة الثانية.'
    }
  },
  {
    id: 'exam-05',
    time: '11:00',
    name: 'Bel Selesai Ujian Sesi 2 & Pulang',
    category: 'pulang',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Asesmen hari ini telah selesai. Semoga mendapatkan hasil yang memuaskan dan berkah. Belajarlah kembali di rumah untuk materi esok hari.',
      en: 'Today\'s examination is concluded. We wish you great and blessed results. Please prepare at home for tomorrow.',
      ar: 'انتهت امتحانات هذا اليوم. نتمنى لكم التوفيق والدرجات العالية المباركة. راجعوا دروس الغد في بيوتكم.'
    }
  }
];

export const PRESET_RAMADHAN_SCHEDULES: BellEvent[] = [
  {
    id: 'ram-01',
    time: '07:30',
    name: 'Bel Masuk & Sholat Dhuha Awal Pagi',
    category: 'masuk',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Marhaban ya Ramadhan. Bel masuk madrasah telah berbunyi. Mari awali pagi dengan sholat Dhuha dan tadarus bersama.',
      en: 'Welcome blessed Ramadan. The school bell has rung. Let us begin our morning with Dhuha prayer and collective Quran recitation.',
      ar: 'مرحبًا يا رمضان. دق جرس المدرسة. هيا نبدأ الصباح بصلاة الضحى وتلاوة القرآن المبارك.'
    }
  },
  {
    id: 'ram-02',
    time: '08:00',
    name: 'Bel Mulai KBM Pesantren Kilat Ramadhan',
    category: 'ganti_jam',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'three_tone',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Kegiatan pembelajaran dan pendalaman materi keislaman Ramadhan dimulai.',
      en: 'Ramadan Islamic studies learning activity has started.',
      ar: 'بدأت الدروس الإسلامية والأنشطة الرمضانية المباركة.'
    }
  },
  {
    id: 'ram-03',
    time: '11:00',
    name: 'Bel Pulang Khusus Ramadhan & Sholat Dzuhur',
    category: 'pulang',
    days: [1, 2, 3, 4, 5, 6],
    enabled: true,
    chimeType: 'westminster',
    repeatChime: 1,
    playChime: true,
    playTTS: true,
    announcements: {
      id: 'Kegiatan madrasah Ramadhan hari ini telah selesai. Selamat menjalankan ibadah puasa dengan penuh kesabaran dan keikhlasan.',
      en: 'Today\'s Ramadan school session is completed. Wishing you a blessed and patient fasting day.',
      ar: 'انتهى دوام المدرسة لشهر رمضان المبارك اليوم. صيامًا مقبولًا وذنبًا مغفورًا بإذن الله.'
    }
  }
];
