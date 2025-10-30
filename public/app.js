// Top: Import everything just once!
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  addDoc, collection, getDocs, query, where, orderBy, doc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let currentUser = null;

// AUTH
onAuthStateChanged(auth, user => {
  if (!user) window.location.href = "index.html";
  else {
    currentUser = user;
    showUserInfo(user);
    setupMenu();
    loadTab('dashboard');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = "index.html");
});

// DOM helpers
function el(html) { const tmp = document.createElement("div"); tmp.innerHTML = html.trim(); return tmp.firstChild; }
function byId(id) { return document.getElementById(id); }

// Show user info
function showUserInfo(user) {
  byId('userName').textContent = user.displayName || user.email || 'User';
  byId('userEmail').textContent = user.email || '';
  if (user.photoURL) {
    byId('userPhoto').src = user.photoURL;
    byId('userPhoto').classList.remove('hidden');
  } else {
    byId('userPhoto').classList.add('hidden');
  }
}

// Menu
function setupMenu() {
  document.querySelectorAll('.menuBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === 'chatbot') window.location.href = "chatbot.html";
      else loadTab(tab);
    });
  });
}

// Tab loader
let currentTab = 'dashboard';
function loadTab(tab) {
  currentTab = tab;
  const c = byId('tabContent');
  c.innerHTML = '<h2>Loading…</h2>';
  switch(tab) {
    case 'dashboard': renderDashboard(); break;
    case 'add': renderAddBunk(); break;
    case 'withdraw': renderWithdraw(); break;
    case 'statement': renderStatement(); break;
    case 'leaderboard': renderLeaderboard(); break;
    case 'heatmap': renderHeatmap(); break;
    case 'profile': renderProfile(); break;
    case 'settings': renderSettings(); break;
    default: c.innerHTML = '<h2>Not found</h2>';
  }
}

// Data functions (Firestore only!)
async function addBunk(subject, date, reason){
  await addDoc(collection(db, "bunks"), {
    userId: currentUser.uid,
    subject, date, reason,
    timestamp: new Date()
  });
}

async function removeBunk(bunkId){
  await deleteDoc(doc(db, "bunks", bunkId));
}

async function fetchUserBunks(){
  const q = query(
    collection(db, "bunks"),
    where("userId", "==", currentUser.uid),
    orderBy("timestamp", "desc")
  );
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log('Fetched user bunks:', results);
  return results;
}


async function countUserBunks(userId){
  const q = query(collection(db, "bunks"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.size;
}

function computeLevel(bunks){
  if (bunks >= 100) return {level:5, name:'Legend'};
  if (bunks >= 50) return {level:4, name:'Master of Disguise'};
  if (bunks >= 30) return {level:3, name:'Advanced Bunker'};
  if (bunks >= 15) return {level:2, name:'Intermediate Bunker'};
  if (bunks >= 5) return {level:1, name:'Beginner Bunker'};
  return {level:0, name:'Novice'};
}

// Render functions
function renderDashboard(){
  const c = byId('tabContent');
  c.innerHTML = '';
  c.appendChild(el('<h2>Dashboard</h2>'));
  const stats = el(`
    <div class="grid grid-cols-3 gap-4 mt-4">
      <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Bunks Saved</div><div id="statBunks" class="text-xl font-semibold">—</div></div>
      <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Level</div><div id="statLevel" class="text-xl font-semibold">—</div></div>
      <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Next in</div><div id="statNext" class="text-xl font-semibold">—</div></div>
    </div>`);
  c.appendChild(stats);
  const quick = el('<div class="mt-4"><button id="quickAdd" class="px-3 py-1 rounded bg-blue-600 text-white">Deposit Bunk</button><button id="openHeat" class="ml-2 px-3 py-1 rounded border">View Heatmap</button></div>');
  c.appendChild(quick);
  document.getElementById('quickAdd').addEventListener('click',()=>loadTab('add'));
  document.getElementById('openHeat').addEventListener('click',()=>loadTab('heatmap'));
  (async ()=>{
    const bunks = await countUserBunks(currentUser.uid);
    byId('statBunks').textContent = bunks;
    const lv = computeLevel(bunks);
    byId('statLevel').textContent = lv.name;
    const nextThresh = (lv.level===0) ? 5 : (lv.level===1?15: (lv.level===2?30: (lv.level===3?50:100)));
    byId('statNext').textContent = Math.max(0, nextThresh-bunks)+' bunks';
  })();
}

function renderAddBunk(){
  const c = byId('tabContent');
  c.innerHTML = '<h2>Deposit a Bunk</h2>';
  const form = el(`<form id="addForm" class="mt-4">
    <input id="s_subject" class="w-full p-2 border rounded mt-2" placeholder="Subject" required />
    <input id="s_date" type="date" class="w-full p-2 border rounded mt-2" required />
    <input id="s_reason" class="w-full p-2 border rounded mt-2" placeholder="Reason (optional)" />
    <div class="mt-3"><button class="px-3 py-1 rounded bg-blue-600 text-white">Deposit Bunk</button></div>
  </form>`);
  c.appendChild(form);

  // Here, just use "form", not form.querySelector
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const subject = form.querySelector('#s_subject').value.trim();
    const date = form.querySelector('#s_date').value;
    const reason = form.querySelector('#s_reason').value.trim();
    if(!subject || !date) return alert('Please fill subject and date');
    await addBunk(subject, date, reason || '—');
    alert('Bunk deposited!');
    loadTab('dashboard');
  });
}


function renderWithdraw() {
  const c = byId('tabContent');
  c.innerHTML = '<h2>Withdraw a Bunk</h2><p class="text-slate-500">Select a bunk to withdraw (remove).</p>';
  fetchUserBunks().then(bunks => {
    if (!bunks || bunks.length === 0) {
      c.appendChild(el('<p>No bunks to withdraw.</p>'));
      return;
    }
    const list = el('<ul class="mt-4 space-y-2"></ul>');
    bunks.forEach(b => {
      const li = el(
        `<li class="p-3 rounded bg-slate-50 flex justify-between items-center">
          <div>
            <div class="font-semibold">${b.subject}</div>
            <div class="text-sm text-slate-500">${b.date} • ${b.reason || ''}</div>
          </div>
        </li>`
      );
      const btn = el('<button class="px-2 py-1 text-sm rounded border">Withdraw</button>');
      btn.addEventListener('click', async () => {
        if (!confirm('Withdraw this bunk?')) return;
        await removeBunk(b.id);
        alert('Bunk withdrawn.');
        loadTab('withdraw');
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    c.appendChild(list);
  });
}


function renderStatement(){
  const c = byId('tabContent');
  c.innerHTML = '<h2>Bunk Statement</h2>';
  fetchUserBunks().then(bunks=>{
    if(!bunks || bunks.length===0) {
      return c.appendChild(el('<p>No bunks yet — deposit a bunk!</p>'));
    }
    const list = el('<ul class="mt-4 space-y-2"></ul>');
    bunks.forEach(b=>{
      // Build base entry string with required fields
      let parts = [];
      if (b.date) parts.push(b.date);
      if (b.reason) parts.push(b.reason);

      // Only add valid timestamp
      if (b.timestamp) {
        const d = new Date(b.timestamp);
        if (!isNaN(d.getTime())) {
          parts.push(d.toLocaleString());
        }
      }

      // Always join non-empty parts with " • "
      const entryLine = parts.join(' • ');

      list.appendChild(el(
        `<li class="p-3 rounded bg-slate-50">
           <div class="font-semibold">${b.subject}</div>
           <div class="text-sm text-slate-500">${entryLine}</div>
         </li>`
      ));
    });
    c.appendChild(list);
  });
}




async function renderLeaderboard(){
  const c = byId('tabContent');
  c.innerHTML = '<h2>Leaderboard</h2><p class="text-slate-500">Top bunkers</p>';
  const bunksSnap = await getDocs(collection(db, 'bunks'));
  const userBunkMap = {};
  bunksSnap.forEach(doc=>{
    const data = doc.data();
    if(!data.userId) return;
    userBunkMap[data.userId]=(userBunkMap[data.userId]||0)+1;
  });
  const userIds = Object.keys(userBunkMap);
  const sorted = userIds.map(uid=>({uid,bunks:userBunkMap[uid]})).sort((a,b)=>b.bunks-a.bunks);
  const wrap = el('<div class="mt-4 space-y-2"></div>');
  if(sorted.length===0){
    wrap.innerHTML = '<p>No users yet.</p>';
  }else{
    for(let i=0; i<Math.min(10,sorted.length); ++i){
      const item = sorted[i];
      let name = 'User '+item.uid.slice(0,6);
      try{
        const uDoc = await getDoc(doc(db,'users',item.uid));
        if(uDoc.exists() && uDoc.data().name) name = uDoc.data().name;
      }catch{}
      wrap.innerHTML += `<div class="p-3 rounded bg-slate-50 flex justify-between"><div>#${i+1} ${name}</div><div>${item.bunks} bunks</div></div>`;
    }
  }
  c.appendChild(wrap);
}

function renderHeatmap(){
  const c = byId('tabContent');
  c.innerHTML ='<h2>Attendance Heatmap</h2><p class="text-slate-500">Green = attended, Red = bunked</p>';
  const wrap = el('<div class="mt-4 grid gap-1" style="grid-template-columns: repeat(12, 1fr);"></div>'); c.appendChild(wrap);
  // Replace this with actual Firestore attendance collection/document if needed
  db.collection('attendance')
    .where('userId','==',currentUser.uid)
    .get()
    .then(snap=>{
      const attendances = snap.docs.map(d=>d.data());
      buildHeatmap(attendances,wrap);
    })
    .catch(()=>{/* fallback if needed */});
}

function buildHeatmap(attendances,wrap){
  const map = {};
  attendances.forEach(a=>{ map[a.date]=a.status; });
  const today = new Date();
  for(let i=83;i>=0;i--){
    const dt=new Date(today); dt.setDate(today.getDate()-i);
    const key=dt.toISOString().slice(0,10);
    const status=map[key]||'none';
    const color=status==='attend'?'bg-green-400':(status==='bunk'?'bg-rose-400':'bg-slate-200');
    wrap.appendChild(el(`<div title="${key}" style="height:20px" class="${color} rounded"></div>`));
  }
}

function renderProfile(){
  const c = byId('tabContent');
  c.innerHTML = '<h2>Profile</h2>';
  (async()=>{
    const bunks = await countUserBunks(currentUser.uid);
    const lv = computeLevel(bunks);
    c.appendChild(el(`<div class="mt-4 p-4 rounded bg-slate-50"><div class="font-semibold">${currentUser.displayName || currentUser.email || 'User'}</div><div class="text-sm text-slate-500">Level: ${lv.name}</div><div class="text-sm text-slate-500">Bunks: ${bunks}</div></div>`));
  })();
}

function renderSettings(){
  const c = byId('tabContent');
  c.innerHTML = '<h2>Settings</h2><p class="text-slate-500">Manage preferences.</p>';
}
