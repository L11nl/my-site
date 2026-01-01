// Firebase SDKs (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ✅ Firebase config (مالك)
const firebaseConfig = {
  apiKey: "AIzaSyC4Q4qTILDP4eYuo8OpER_NQ4udj5lXSwM",
  authDomain: "nabeel-abd.firebaseapp.com",
  projectId: "nabeel-abd",
  storageBucket: "nabeel-abd.firebasestorage.app",
  messagingSenderId: "397355019788",
  appId: "1:397355019788:web:9d1961a81f62d06f44c829",
  measurementId: "G-9ES5BKWRVH"
};

// ✅ نفس القائمة للجميع (بدون روابط/Rooms)
const ROOM_ID = "global";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------- UI ----------
const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");
const nameInput = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

// ---------- 3D Tilt ----------
const tiltCard = document.getElementById("tiltCard");
(function initTilt() {
  if (!tiltCard) return;
  const max = 10;
  const reset = () => {
    tiltCard.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
  };
  const onMove = (e) => {
    const rect = tiltCard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * (max * 2);
    const rotX = -(y - 0.5) * (max * 2);
    tiltCard.style.transform =
      `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(0)`;
  };
  reset();
  tiltCard.addEventListener("pointermove", onMove);
  tiltCard.addEventListener("pointerleave", reset);
  tiltCard.addEventListener("pointercancel", reset);
})();

// ---------- Helpers ----------
function setMsg(text, type = "muted") {
  msgEl.className = type;
  msgEl.textContent = text || "";
}
function setStatus(text, type = "muted") {
  statusEl.className = `badge ${type}`;
  statusEl.textContent = text || "";
}

// ---------- Add name ----------
async function addName() {
  const name = (nameInput.value || "").trim();
  if (!name) return setMsg("اكتب اسم أولاً.", "err");

  const user = auth.currentUser;
  if (!user) return setMsg("انتظر شوي… جاري تسجيل الدخول.", "err");

  addBtn.disabled = true;
  setMsg("جاري الإضافة…", "muted");

  try {
    const colRef = collection(db, "rooms", ROOM_ID, "names");

    // ✅ نخزن وقت ثابت بالأرقام حتى ما يختفي بعد التحديث
    await addDoc(colRef, {
      name,
      createdAt: serverTimestamp(),
      createdAtMs: Date.now(),
      createdBy: user.uid
    });

    nameInput.value = "";
    setMsg("تمت الإضافة ✅", "ok");
  } catch (err) {
    console.error(err);
    setMsg("صار خطأ بالإضافة. تأكد من قواعد Firestore.", "err");
  } finally {
    addBtn.disabled = false;
  }
}

addBtn.addEventListener("click", addName);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addName();
});

// ---------- Auth + Realtime ----------
setStatus("جاري الاتصال…", "muted");

signInAnonymously(auth).catch((e) => {
  console.error(e);
  setStatus("فشل تسجيل الدخول", "err");
  setMsg("تأكد Anonymous Auth مفعّل.", "err");
});

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  setStatus("متصل ✅", "ok");

  const colRef = collection(db, "rooms", ROOM_ID, "names");

  // ✅ نرتب على createdAtMs (ثابت) حتى ما تختفي الأسماء
  const q = query(colRef, orderBy("createdAtMs", "desc"), limit(300));

  onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    countEl.textContent = String(snap.size);

    snap.forEach((doc) => {
      const li = document.createElement("li");
      li.textContent = doc.data().name ?? "";
      listEl.appendChild(li);
    });
  });
});
