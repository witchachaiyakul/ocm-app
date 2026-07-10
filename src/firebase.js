// src/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxvHXLgdb5FeQS1mW2d4ke9kjdz-i1e54",
    authDomain: "ocm-kbs.firebaseapp.com",
    projectId: "ocm-kbs",
    storageBucket: "ocm-kbs.firebasestorage.app",
    messagingSenderId: "632841277737",
    appId: "1:632841277737:web:20735a0544bc3b759d6738"
};

const app = initializeApp(firebaseConfig);

// 🌟 แก้ไขจุดบกพร่อง: ส่งออกตัวแปร db ให้ไฟล์ index.html ดึงข้อมูลสมาชิกผู้เรียนและคลาสเรียนได้
export const db = getFirestore(app);

// ฟังก์ชันดึงข้อมูลเพลงตาม Document ID
export async function fetchSongData(songId) {
    const docRef = doc(db, "songs", songId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    }
    throw new Error("ไม่พบโครงสร้างข้อมูลเพลงนี้บนระบบ Cloud Firestore");
}

export async function fetchSongsCatalog() {
    const songsRef = collection(db, "songs");
    const snapshot = await getDocs(songsRef);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

export async function fetchUserProfile(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return { id: userSnap.id, ...userSnap.data() };
}

export async function saveUserProfile(userId, profileData) {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, profileData, { merge: true });
    return { id: userId, ...profileData };
}

// ฟังก์ชันเสริมรองรับโครงสร้างขยายตัวดึงข้อมูลการจัดกลุ่มวงดนตรี
export async function fetchBandSession(bandId, songId) {
    const songRef = doc(db, "songs", songId);
    const bandRef = doc(db, "bands", bandId, "settings", "current"); 
    
    const [songSnap, bandSnap] = await Promise.all([getDoc(songRef), getDoc(bandRef)]);
    
    return {
        song: songSnap.exists() ? songSnap.data() : null,
        bandSettings: bandSnap.exists() ? bandSnap.data() : null
    };
}