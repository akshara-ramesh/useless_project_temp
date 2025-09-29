// app.js - simplified (see README for usage)

const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true';
let currentUser = null;
const DEMO_USERS = [
  {id:'u_amit', name:'Amit', bunks: 34},
  {id:'u_priya', name:'Priya', bunks: 28},
  {id:'u_rahul', name:'Rahul', bunks: 22},
  {id:'u_sneha', name:'Sneha', bunks: 18},
  {id:'u_ankit', name:'Ankit', bunks: 15},
  {id:'u_kavya', name:'Kavya', bunks: 12},
  {id:'u_arjun', name:'Arjun', bunks: 9},
  {id:'demo_user', name:'You (Demo)', bunks: 20}
];

function el(html){ const tmp=document.createElement('div'); tmp.innerHTML=html.trim(); return tmp.firstChild; }
function byId(id){ return document.getElementById(id); }

function showUserInfo(user){ const nameEl = byId('userName'); const emailEl = byId('userEmail'); const photoEl = byId('userPhoto'); if(!user){ nameEl.textContent = 'Guest'; emailEl.textContent=''; photoEl.classList.add('hidden'); } else { nameEl.textContent = user.displayName || user.name || 'Demo User'; emailEl.textContent = user.email || ''; if(user.photoURL) { photoEl.src = user.photoURL; photoEl.classList.remove('hidden'); } } }

function initAuth(){ if(isDemoMode){ currentUser = { uid:'offline_demo', displayName:'Demo Viewer' }; showUserInfo(currentUser); loadTab('dashboard'); return; }
  auth.onAuthStateChanged(async user => { if(user){ currentUser = user; showUserInfo(user); loadTab('dashboard'); } else { window.location.href = 'index.html'; } });
  document.getElementById('logoutBtn').addEventListener('click', ()=> { auth.signOut().then(()=> window.location.href = 'index.html'); }); }

function setupMenu(){ document.querySelectorAll('.menuBtn').forEach(btn=>{ btn.addEventListener('click', ()=> { const tab = btn.dataset.tab; if(tab === 'chatbot') window.location.href = 'chatbot.html'; else loadTab(tab); }); }); }

let currentTab = 'dashboard';
function loadTab(tab){ currentTab = tab; const c = byId('tabContent'); c.innerHTML = '<h2>Loading…</h2>'; switch(tab){ case 'dashboard': renderDashboard(); break; case 'add': renderAddBunk(); break; case 'withdraw': renderWithdraw(); break; case 'statement': renderStatement(); break; case 'leaderboard': renderLeaderboard(); break; case 'heatmap': renderHeatmap(); break; case 'profile': renderProfile(); break; case 'settings': renderSettings(); break; default: c.innerHTML = '<h2>Not found</h2>'; } }

async function addBunk(subject, date, reason){ if(isDemoMode){ const bunks = JSON.parse(localStorage.getItem('demo_bunks')||'[]'); bunks.unshift({id:'d'+Date.now(), subject, date, reason, timestamp: Date.now()}); localStorage.setItem('demo_bunks', JSON.stringify(bunks)); return; } await db.collection('bunks').add({ userId: currentUser.uid, subject, date, reason, timestamp: firebase.firestore.FieldValue.serverTimestamp() }); }

async function removeBunk(bunkId){ if(isDemoMode){ let bunks = JSON.parse(localStorage.getItem('demo_bunks')||'[]'); bunks = bunks.filter(b=> b.id !== bunkId); localStorage.setItem('demo_bunks', JSON.stringify(bunks)); return; } await db.collection('bunks').doc(bunkId).delete(); }

async function fetchUserBunks(){ if(isDemoMode) return JSON.parse(localStorage.getItem('demo_bunks')||'[]'); const snap = await db.collection('bunks').where('userId','==',currentUser.uid).orderBy('timestamp','desc').get(); return snap.docs.map(d=> ({ id:d.id, ...d.data() })); }

async function countUserBunks(userId){ if(isDemoMode) return (JSON.parse(localStorage.getItem('demo_bunks')||'[]')).length; const snap = await db.collection('bunks').where('userId','==',userId).get(); return snap.size; }

function computeLevel(bunks){ if(bunks >= 100) return {level:5, name:'Legend'}; if(bunks >= 50) return {level:4, name:'Master of Disguise'}; if(bunks >= 30) return {level:3, name:'Advanced Bunker'}; if(bunks >= 15) return {level:2, name:'Intermediate Bunker'}; if(bunks >= 5) return {level:1, name:'Beginner Bunker'}; return {level:0, name:'Novice'}; }

function renderDashboard(){ const c = byId('tabContent'); c.innerHTML = ''; c.appendChild(el('<h2>Dashboard</h2>')); const stats = el(`<div class="grid grid-cols-3 gap-4 mt-4">    <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Bunks Saved</div><div id="statBunks" class="text-xl font-semibold">—</div></div>    <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Level</div><div id="statLevel" class="text-xl font-semibold">—</div></div>    <div class="p-4 rounded bg-slate-50"><div class="text-sm text-slate-500">Next in</div><div id="statNext" class="text-xl font-semibold">—</div></div>  </div>`); c.appendChild(stats); const quick = el('<div class="mt-4"><button id="quickAdd" class="px-3 py-1 rounded bg-blue-600 text-white">Deposit Bunk</button><button id="openHeat" class="ml-2 px-3 py-1 rounded border">View Heatmap</button></div>'); c.appendChild(quick); document.getElementById('quickAdd').addEventListener('click', ()=> loadTab('add')); document.getElementById('openHeat').addEventListener('click', ()=> loadTab('heatmap'));
  (async ()=>{ const bunks = await countUserBunks(isDemoMode ? 'offline_demo' : currentUser.uid); byId('statBunks').textContent = bunks; const lv = computeLevel(bunks); byId('statLevel').textContent = lv.name; const nextThresh = (lv.level===0) ? 5 : (lv.level===1?15: (lv.level===2?30: (lv.level===3?50:100))); byId('statNext').textContent = Math.max(0, nextThresh - bunks) + ' bunks'; })(); }

function renderAddBunk(){ const c = byId('tabContent'); c.innerHTML = '<h2>Deposit a Bunk</h2>'; const form = el(`<form id="addForm" class="mt-4"><input id="s_subject" class="w-full p-2 border rounded mt-2" placeholder="Subject" required /><input id="s_date" type="date" class="w-full p-2 border rounded mt-2" required /><input id="s_reason" class="w-full p-2 border rounded mt-2" placeholder="Reason (optional)" /><div class="mt-3"><button class="px-3 py-1 rounded bg-blue-600 text-white">Deposit Bunk</button></div></form>`); c.appendChild(form); form.querySelector('#addForm').addEventListener('submit', async (e)=>{ e.preventDefault(); const subject = form.querySelector('#s_subject').value.trim(); const date = form.querySelector('#s_date').value; const reason = form.querySelector('#s_reason').value.trim(); if(!subject || !date) return alert('Please fill subject and date'); await addBunk(subject, date, reason || '—'); alert('Bunk deposited!'); loadTab('dashboard'); }); }

function renderWithdraw(){ const c = byId('tabContent'); c.innerHTML = '<h2>Withdraw a Bunk</h2><p class="text-slate-500">Select a bunk to withdraw (remove).</p>'; fetchUserBunks().then(bunks=>{ if(!bunks || bunks.length===0) return c.appendChild(el('<p>No bunks to withdraw.</p>')); const list = el('<ul class="mt-4 space-y-2"></ul>'); bunks.forEach(b=>{ const li = el(`<li class="p-3 rounded bg-slate-50 flex justify-between items-center"><div><div class="font-semibold">${b.subject}</div><div class="text-sm text-slate-500">${b.date} • ${b.reason||''}</div></div></li>`); const btn = el('<button class="px-2 py-1 text-sm rounded border">Withdraw</button>'); btn.addEventListener('click', async ()=> { if(!confirm('Withdraw this bunk?')) return; await removeBunk(b.id); alert('Bunk withdrawn.'); loadTab('withdraw'); }); li.appendChild(btn); list.appendChild(li); }); c.appendChild(list); }); }

function renderStatement(){ const c = byId('tabContent'); c.innerHTML = '<h2>Bunk Statement</h2>'; fetchUserBunks().then(bunks=>{ if(!bunks || bunks.length===0) return c.appendChild(el('<p>No bunks yet — deposit a bunk!</p>')); const list = el('<ul class="mt-4 space-y-2"></ul>'); bunks.forEach(b=>{ const time = b.timestamp && b.timestamp.seconds ? new Date(b.timestamp.seconds*1000).toLocaleString() : (b.timestamp ? new Date(b.timestamp).toLocaleString() : ''); list.appendChild(el(`<li class="p-3 rounded bg-slate-50"><div class="font-semibold">${b.subject}</div><div class="text-sm text-slate-500">${b.date} • ${b.reason||''} • ${time}</div></li>`)); }); c.appendChild(list); }); }

function renderLeaderboard(){ const c = byId('tabContent'); c.innerHTML = '<h2>Leaderboard</h2><p class="text-slate-500">Top bunkers</p>'; if(isDemoMode){ const wrap = el('<div class="mt-4 space-y-2"></div>'); DEMO_USERS.sort((a,b)=>b.bunks-a.bunks).forEach((u,i)=> wrap.appendChild(el(`<div class="p-3 rounded bg-slate-50 flex justify-between"><div>#${i+1} ${u.name}</div><div>${u.bunks} bunks</div></div>`))); c.appendChild(wrap); } else { db.collection('bunks').get().then(snapshot=>{ const map = {}; snapshot.forEach(d=> { const data = d.data(); if(!data.userId) return; map[data.userId] = (map[data.userId]||0)+1; }); const arr = Object.keys(map).map(uid=>({uid,bunks:map[uid]})); arr.sort((a,b)=>b.bunks-a.bunks); const wrap = el('<div class="mt-4 space-y-2"></div>'); if(arr.length===0){ DEMO_USERS.forEach((u,i)=> wrap.appendChild(el(`<div class="p-3 rounded bg-slate-50 flex justify-between"><div>#${i+1} ${u.name}</div><div>${u.bunks} bunks</div></div>`))); c.appendChild(wrap); } else { Promise.all(arr.slice(0,10).map(async (item, i) => { const doc = await db.collection('users').doc(item.uid).get(); const name = (doc.exists && doc.data().name) ? doc.data().name : ('User '+item.uid.slice(0,6)); return `<div class="p-3 rounded bg-slate-50 flex justify-between"><div>#${i+1} ${name}</div><div>${item.bunks} bunks</div></div>`; })).then(htmls => { wrap.innerHTML = htmls.join(''); c.appendChild(wrap); }); } }).catch(err=>{ const wrap = el('<div class="mt-4 space-y-2"></div>'); DEMO_USERS.forEach((u,i)=> wrap.appendChild(el(`<div class="p-3 rounded bg-slate-50 flex justify-between"><div>#${i+1} ${u.name}</div><div>${u.bunks} bunks</div></div>`))); c.appendChild(wrap); }); } }

function renderHeatmap(){ const c = byId('tabContent'); c.innerHTML = '<h2>Attendance Heatmap</h2><p class="text-slate-500">Green = attended, Red = bunked</p>'; const wrap = el('<div class="mt-4 grid gap-1" style="grid-template-columns: repeat(12, 1fr);"></div>'); c.appendChild(wrap); let attendances = []; if(isDemoMode){ attendances = JSON.parse(localStorage.getItem('demo_attendance')||'[]'); } else { db.collection('attendance').where('userId','==',currentUser.uid).get().then(snap=>{ attendances = snap.docs.map(d=>d.data()); buildHeatmap(attendances, wrap); }); return; } buildHeatmap(attendances, wrap); }

function buildHeatmap(attendances, wrap){ const map = {}; attendances.forEach(a => { map[a.date] = a.status; }); const today = new Date(); for(let i=83;i>=0;i--){ const dt = new Date(today); dt.setDate(today.getDate() - i); const key = dt.toISOString().slice(0,10); const status = map[key] || 'none'; const color = status==='attend' ? 'bg-green-400' : (status==='bunk' ? 'bg-rose-400' : 'bg-slate-200'); wrap.appendChild(el(`<div title="${key}" style="height:20px" class="${color} rounded"></div>`)); } }

function renderProfile(){ const c = byId('tabContent'); c.innerHTML = '<h2>Profile</h2>'; (async ()=>{ const bunks = await countUserBunks(isDemoMode ? 'offline_demo' : currentUser.uid); const lv = computeLevel(bunks); c.appendChild(el(`<div class="mt-4 p-4 rounded bg-slate-50"><div class="font-semibold">${currentUser.displayName || 'Demo User'}</div><div class="text-sm text-slate-500">Level: ${lv.name}</div><div class="text-sm text-slate-500">Bunks: ${bunks}</div></div>`)); })(); }

function renderSettings(){ const c = byId('tabContent'); c.innerHTML = '<h2>Settings</h2><p class="text-slate-500">Manage preferences.</p>'; }

document.addEventListener('DOMContentLoaded', ()=>{ setupMenu(); initAuth(); });
