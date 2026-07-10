// เปลี่ยนมาใช้การดึงฟังก์ชันแบบเฉพาะเจาะจง (Modular CommonJS) เพื่อรองรับ Node.js v22
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// โหลดไฟล์คีย์ลับ (ต้องมั่นใจว่าไฟล์อยู่ในโฟลเดอร์ ocm-app และชื่อนี้เป๊ะๆ)
const serviceAccount = require('./serviceAccountKey.json');

// เริ่มต้นระบบ Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// โครงสร้างข้อมูลแกนจังหวะ (Beat-Based Timeline) เพลง Die With A Smile
const songData = {
  title: "Die With A Smile - Bruno Mars & Lady Gaga",
  bpm: 158,
  timeSignature: "4/4",
  totalBeats: 32,
  
  chordsTimeline: [
    { beat: 0, chord: "Dmaj7" },
    { beat: 4, chord: "Amaj7" },
    { beat: 8, chord: "Dmaj7" },
    { beat: 12, chord: "Amaj7" },
    { beat: 14, chord: "C#m7" },
    { beat: 16, chord: "Dmaj7" },
    { beat: 20, chord: "Amaj7" },
    { beat: 24, chord: "C#m7" },
    { beat: 28, chord: "F#sus4" }
  ],

  lyricsTimeline: [
    { startBeat: 0, endBeat: 3, text: "Where you and I had to say goodbye" },
    { startBeat: 4, endBeat: 7, text: "And I don't know what it all means" },
    { startBeat: 8, endBeat: 11, text: "But since I survived, I realized" },
    { startBeat: 12, endBeat: 15, text: "Wherever you go, that's where I'll follow" },
    { startBeat: 16, endBeat: 23, text: "Nobody's promised tomorrow..." },
    { startBeat: 24, endBeat: 31, text: "So I'm gonna love you every night like it's the last night" }
  ]
};

async function uploadSong() {
  try {
    const docRef = db.collection('songs').doc('die_with_a_smile');
    await docRef.set(songData);
    console.log("🚀 [OCM Cloud] นำเข้าโครงสร้างเพลง 'Die With A Smile' แบบ Beat-Based สำเร็จแล้ว!");
    process.exit(0);
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการอัปโหลด:", error);
    process.exit(1);
  }
}

uploadSong();