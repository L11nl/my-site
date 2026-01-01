// Firebase SDKs (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// 🔹 Firebase config (مالك)
const firebaseConfig = {
  apiKey: "AIzaSyC4Q4qTILDP4eYuo8OpER_NQ4udj5lXSwM",
  authDomain: "nabeel-abd.firebaseapp.com",
  projectId: "nabeel-abd",
  storageBucket: "nabeel-abd.firebasestorage.app",
  messagingSenderId: "397355019788",
  appId: "1:397355019788:web:9d1961a81f62d06f44c829",
  measurementId: "G-9ES5BKWRVH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------- Helpers ----------
function getRoomId() {
  const url = new URL(location.href);
  let room = url.searchParams.get("room");

  if (!room) {
    room = (crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)
    ).replaceAll("-", "").slice(0, 10);

    url.searchParams.set("room", room);
    history.replaceState({}, "", url.toString());
  }
  return room;
}

function setMsg(text, type = "muted") {
  const el = document.getElementById("msg");
  el.className = type === "ok" ? "ok" : type === "err" ? "err" : "muted";
  el.textContent = text || "";
}

// ---------- UI Elements ----------
const roomIdEl = document.getElementById("roomId");
const statusEl = document.getElementById("status");
const shareLinkEl = document.getElementById("shareLink");
const copyBtn = document.getElementById("copyBtn");
const newRoomBtn = document.getElementById("newRoomBtn");
const nameInput = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

// ---------- Room ----------
const roomId = getRoomId();
roomIdEl.textContent = roomId;
shareLinkEl.value = location.href;

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    setMsg("تم نسخ الرابط ✅", "ok");
  } catch {
    shareLinkEl.select();
    document.execCommand("copy");
    setMsg("انسخ الرابط من الحقل بالأعلى ✅", "ok");
  }
});

newRoomBtn.addEventListener("click", () => {
  const url = new URL(location.href);
  url.searchParams.delete("room");
  location.href = url.toString();
});

addBtn.addEventListener("click", addName);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addName();
});

async function addName() {
  const name = (nameInput.value || "").trim();
  if (!name) return setMsg("اكتب اسم أولاً.", "err");

  const user = auth.currentUser;
  if (!user) return setMsg("انتظر شوي… جاري تسجيل الدخول.", "err");

  addBtn.disabled = true;
  setMsg("جاري الإضافة…");

  try {
    const col = collection(db, "rooms", roomId, "names");
    await addDoc(col, {
      name,
      createdAt: serverTimestamp(),
      createdBy: user.uid
    });
    nameInput.value = "";
    setMsg("تمت الإضافة ✅", "ok");
  } catch (err) {
    console.error(err);
    setMsg("صار خطأ بالإضافة.", "err");
  } finally {
    addBtn.disabled = false;
  }
}

// ---------- Auth + Realtime ----------
statusEl.textContent = "تسجيل دخول…";

signInAnonymously(auth).catch(() => {
  statusEl.textContent = "فشل تسجيل الدخول";
  statusEl.className = "err";
});

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  statusEl.textContent = "متصل ✅";
  statusEl.className = "ok";

  const col = collection(db, "rooms", roomId, "names");
  const q = query(col, orderBy("createdAt", "desc"), limit(200));

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
