/* app.js - Combined full application script
   Supports demo mode (localStorage) and real mode (Firestore + Firebase Storage).
   Make sure Firebase is initialized in your HTML when not using demo mode.
*/

// Read demo flag from URL
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true';
let currentUser = null;

// Demo seed data (attendance + bunks) and users
const DEMO = {
  users: [
    { id: 'demo_user', name: 'You (Demo)' },
    { id: 'u1', name: 'Amit' },
    { id: 'u2', name: 'Priya' }
  ],
  attendance: (function () {
    const a = [];
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      a.push({ date: iso, status: Math.random() < 0.25 ? 'bunk' : 'attend' });
    }
    return a;
  })(),
  bunks: (function () {
    const s = ['Math', 'Physics', 'CS', 'Chem'];
    const b = [];
    for (let i = 0; i < 25; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 3);
      b.push({
        id: 'b' + i,
        subject: s[i % 4],
        date: d.toISOString().slice(0, 10),
        reason: 'Demo seed',
        proofUrl: 'assets/proof_sample.png',
        timestamp: d.getTime()
      });
    }
    return b;
  })()
};

// expose DEMO for debugging if needed
window.__DEMO_DATA__ = DEMO;

// Utility helpers
function el(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html.trim();
  return tmp.firstChild;
}
function byId(id) { return document.getElementById(id); }

function showUserInfo(u) {
  if (!u) {
    if (byId('userName')) byId('userName').textContent = 'Guest';
    if (byId('userEmail')) byId('userEmail').textContent = '';
  } else {
    if (byId('userName')) byId('userName').textContent = u.displayName || u.name || 'Demo User';
    if (byId('userEmail')) byId('userEmail').textContent = u.email || 'demo@bunkbank.com';
  }
}

// Initialization of authentication and demo fallbacks
function initAuth() {
  if (isDemoMode) {
    // Ensure demo bunks are seeded into localStorage if not present
    if (!localStorage.getItem('demo_bunks')) {
      localStorage.setItem('demo_bunks', JSON.stringify(window.__DEMO_DATA__.bunks || []));
    }
    currentUser = { uid: 'offline_demo', displayName: 'Demo Viewer' };
    showUserInfo(currentUser);
    loadTab('dashboard');
    return;
  }

  // Real Firebase auth path. Assumes firebase/auth is loaded & initialized.
  if (!window.firebase || !window.firebase.auth) {
    console.warn('Firebase not found. Falling back to demo mode. Use ?demo=true or include Firebase config.');
    window.location.search = '?demo=true';
    return;
  }

  const auth = firebase.auth();
  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      showUserInfo(user);
      loadTab('dashboard');
    } else {
      // if not logged in, redirect to index (login)
      window.location.href = 'index.html';
    }
  });

  // logout button
  const logoutBtn = byId('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));
  }
}

function setupMenu() {
  document.querySelectorAll('.menuBtn').forEach(btn => {
    btn.addEventListener('click', () => loadTab(btn.dataset.tab));
  });
}

function loadTab(tab) {
  const c = byId('tabContent');
  if (!c) return console.error('No tabContent element found');
  c.innerHTML = '';
  switch (tab) {
    case 'dashboard': return renderDashboard();
    case 'add': return renderAddBunk();
    case 'withdraw': return renderWithdraw();
    case 'statement': return renderStatement();
    case 'charts': return renderCharts();
    case 'heatmap': return renderHeatmap();
    case 'profile': return renderProfile();
    case 'leaderboard': return renderLeaderboard();
    default:
      c.innerHTML = '<h2>Not found</h2>';
  }
}

// --- Data layer: fetch/save bunks --- //
async function fetchUserBunks() {
  if (isDemoMode) {
    const s = localStorage.getItem('demo_bunks');
    return JSON.parse(s || JSON.stringify(window.__DEMO_DATA__.bunks || []));
  }

  // Real Firestore fetch
  const db = firebase.firestore();
  const snap = await db.collection('bunks')
    .where('userId', '==', currentUser.uid)
    .orderBy('timestamp', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function saveDemoBunks(bunks) {
  localStorage.setItem('demo_bunks', JSON.stringify(bunks));
}

async function countUserBunks() {
  if (isDemoMode) {
    const s = localStorage.getItem('demo_bunks') || JSON.stringify(window.__DEMO_DATA__.bunks || []);
    return JSON.parse(s).length;
  }
  const db = firebase.firestore();
  const snap = await db.collection('bunks').where('userId', '==', currentUser.uid).get();
  return snap.size;
}

// --- Render: Add bunk --- //
function renderAddBunk() {
  const c = byId('tabContent');
  c.appendChild(el('<h2>Deposit a Bunk</h2>'));

  const form = el(`
    <form id="addForm" class="mt-4">
      <input id="s_subject" class="w-full p-2 border rounded mt-2" placeholder="Subject" required />
      <input id="s_date" type="date" class="w-full p-2 border rounded mt-2" required />
      <input id="s_reason" class="w-full p-2 border rounded mt-2" placeholder="Reason (optional)" />
      <label class="mt-2 block text-sm">Proof (optional)</label>
      <input id="s_proof" type="file" accept="image/*" class="mt-1" />
      <div class="mt-3"><button class="px-3 py-1 rounded bg-blue-600 text-white">Deposit Bunk</button></div>
    </form>
  `);

  c.appendChild(form);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const subject = form.querySelector('#s_subject').value.trim();
    const date = form.querySelector('#s_date').value;
    const reason = form.querySelector('#s_reason').value.trim();
    const proofFile = form.querySelector('#s_proof').files[0];

    if (!subject || !date) {
      return alert('Please fill subject and date.');
    }

    if (isDemoMode) {
      const bunks = await fetchUserBunks();
      const id = 'd' + Date.now();
      const proofUrl = proofFile ? URL.createObjectURL(proofFile) : 'assets/proof_sample.png';
      bunks.unshift({ id, subject, date, reason, proofUrl, timestamp: Date.now() });
      saveDemoBunks(bunks);
      alert('Bunk deposited in demo mode!');
      loadTab('dashboard');
    } else {
      try {
        const db = firebase.firestore();
        let proofUrl = '';
        if (proofFile) {
          const storageRef = firebase.storage().ref();
          const proofRef = storageRef.child(`proofs/${currentUser.uid}/${Date.now()}_${proofFile.name}`);
          await proofRef.put(proofFile);
          proofUrl = await proofRef.getDownloadURL();
        }

        await db.collection('bunks').add({
          userId: currentUser.uid,
          subject,
          date,
          reason,
          proofUrl,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Bunk deposited successfully!');
        loadTab('dashboard');
      } catch (err) {
        alert('Error saving bunk: ' + (err.message || err));
      }
    }
  });
}

// --- Remove bunk (demo or real) --- //
async function removeBunk(bunkId) {
  if (!bunkId) return;
  if (isDemoMode) {
    let bunks = await fetchUserBunks();
    bunks = bunks.filter(b => b.id !== bunkId);
    saveDemoBunks(bunks);
    alert('Bunk removed (demo mode)');
    loadTab('statement');
  } else {
    try {
      const db = firebase.firestore();
      await db.collection('bunks').doc(bunkId).delete();
      alert('Bunk removed successfully!');
      loadTab('statement');
    } catch (err) {
      alert('Error removing bunk: ' + (err.message || err));
    }
  }
}

// --- Dashboard --- //
async function renderDashboard() {
  const c = byId('tabContent');
  c.appendChild(el('<h2>Dashboard</h2>'));

  try {
    const bunks = await fetchUserBunks();
    const bunkCount = bunks.length || 0;
    const name = currentUser?.displayName || currentUser?.name || 'User';

    let html = `
      <p>Welcome to your dashboard, <strong>${name}</strong>.</p>
      <p>You have deposited <strong>${bunkCount}</strong> bunks.</p>
      <h3 class="mt-4">Recent Bunks</h3>
      <ul>
        ${bunks.slice(0, 5).map(b => `
          <li><strong>${escapeHtml(b.subject)}</strong> on ${escapeHtml(b.date)} ${b.reason ? `- ${escapeHtml(b.reason)}` : ''}</li>
        `).join('')}
      </ul>
    `;

    c.innerHTML += html;
  } catch (err) {
    c.innerHTML += `<p class="text-red-600">Error loading dashboard: ${err.message}</p>`;
  }
}

// --- Statement --- //
async function renderStatement() {
  const c = byId('tabContent');
  c.appendChild(el('<h2>Statement</h2>'));

  const bunks = await fetchUserBunks();

  if (!bunks || bunks.length === 0) {
    c.innerHTML += '<p>No bunks to show.</p>';
    return;
  }

  const list = el('<ul class="bunk-list"></ul>');
  bunks.forEach(bunk => {
    const li = el(`
      <li class="bunk-item border p-2 mb-2 rounded flex justify-between items-center">
        <div>
          <strong>${escapeHtml(bunk.subject)}</strong> on ${escapeHtml(bunk.date)}<br/>
          <small>${escapeHtml(bunk.reason || '')}</small>
        </div>
        <div>
          ${bunk.proofUrl ? `<img src="${escapeHtml(bunk.proofUrl)}" alt="Proof" style="max-width:50px; max-height:50px; margin-right:10px;" />` : ''}
          <button data-id="${bunk.id}" class="removeBunkBtn px-2 py-1 bg-red-600 text-white rounded">Remove</button>
        </div>
      </li>
    `);
    list.appendChild(li);
  });
  c.appendChild(list);

  // Setup remove bunk button listeners
  c.querySelectorAll('.removeBunkBtn').forEach(btn => {
    btn.addEventListener('click', e => {
      const bunkId = e.target.dataset.id;
      if (confirm('Are you sure you want to remove this bunk?')) {
        removeBunk(bunkId);
      }
    });
  });
}

// --- Withdraw (placeholder) --- //
function renderWithdraw() {
  const c = byId('tabContent');
  c.innerHTML = `<h2>Withdraw Bunks</h2><p>Withdraw bunk functionality coming soon.</p>`;
}

// --- Charts: simple subject-count bar chart --- //
async function renderCharts() {
  const c = byId('tabContent');
  c.appendChild(el('<h2>Charts</h2>'));
  c.appendChild(el('<p>Subject-wise bunk counts (simple bar chart)</p>'));

  const bunks = await fetchUserBunks();

  // Count by subject
  const counts = {};
  (bunks || []).forEach(b => {
    const s = b.subject || 'Unknown';
    counts[s] = (counts[s] || 0) + 1;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 300;
  c.appendChild(canvas);

  drawBarChart(canvas, counts);
}

// minimal bar chart using canvas (no external libs)
function drawBarChart(canvas, counts) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const labels = Object.keys(counts);
  const values = labels.map(l => counts[l]);
  const maxVal = Math.max(1, ...values);

  const padding = 40;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;
  const barWidth = chartWidth / labels.length * 0.6;
  const gap = chartWidth / labels.length * 0.4;

  // axes
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  // bars & labels
  labels.forEach((lab, i) => {
    const val = values[i];
    const x = padding + i * (barWidth + gap) + gap / 2;
    const barH = (val / maxVal) * (chartHeight - 20);
    const y = padding + chartHeight - barH;

    // bar (default color)
    ctx.fillStyle = '#777';
    ctx.fillRect(x, y, barWidth, barH);

    // label
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lab, x + barWidth / 2, padding + chartHeight + 15);

    // value
    ctx.fillText(String(val), x + barWidth / 2, y - 6);
  });
}

// --- Heatmap (attendance) --- //
async function renderHeatmap() {
  const c = byId('tabContent');
  c.appendChild(el('<h2>Heatmap</h2>'));
  const container = el('<div id="heatmapWrap" class="mt-3"></div>');
  c.appendChild(container);

  let attendance = [];

  if (isDemoMode) {
    attendance = window.__DEMO_DATA__.attendance || [];
  } else {
    // Try fetch attendance collection for real users (if you have one)
    try {
      const db = firebase.firestore();
      const snap = await db.collection('attendance').where('userId', '==', currentUser.uid).orderBy('date', 'asc').get();
      attendance = snap.docs.map(d => d.data());
    } catch (err) {
      // fallback
      attendance = [];
    }
  }

  if (!attendance || attendance.length === 0) {
    container.innerHTML = '<p>No attendance data to show for heatmap.</p>';
    return;
  }

  const canvas = document.createElement('canvas');
  // simple grid days x weeks
  const cell = 12;
  const cols = Math.ceil(attendance.length / 7);
  canvas.width = cols * (cell + 2) + 20;
  canvas.height = 7 * (cell + 2) + 20;
  container.appendChild(canvas);

  drawHeatmapCanvas(canvas, attendance);
}

function drawHeatmapCanvas(canvas, attendance) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cell = 12;
  const padding = 10;
  // Map attendance by index to cells (week-wise columns)
  attendance.forEach((item, idx) => {
    const week = Math.floor(idx / 7);
    const day = idx % 7;
    const x = padding + week * (cell + 2);
    const y = padding + day * (cell + 2);

    // choose color based on status
    const status = item.status || 'attend';
    let alpha = 0.1;
    if (status === 'bunk') alpha = 0.9;
    else if (status === 'attend') alpha = 0.2;

    ctx.fillStyle = `rgba(34,34,150,${alpha})`;
    ctx.fillRect(x, y, cell, cell);

    // optional: date hint on hover would require DOM elements, skip for simplicity
  });
}

// --- Profile placeholder --- //
function renderProfile() {
  const c = byId('tabContent');
  c.innerHTML = `<h2>Profile</h2><p>User profile details here.</p>`;
}

// --- Leaderboard (demo or real aggregated) --- //
async function renderLeaderboard() {
  const c = byId('tabContent');
  c.appendChild(el('<h2 class="text-2xl font-semibold mb-4">🏆 Leaderboard</h2>'));

  if (isDemoMode) {
    const demoLeaderboard = [
      { name: "Alex", bunks: 32, level: "Gold" },
      { name: "Maya", bunks: 29, level: "Gold" },
      { name: "Sam", bunks: 22, level: "Silver" },
      { name: "Priya", bunks: 18, level: "Silver" },
      { name: "Rohan", bunks: 15, level: "Bronze" }
    ];
    let html = `
      <table class="w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-300 p-2">Rank</th>
            <th class="border border-gray-300 p-2">Name</th>
            <th class="border border-gray-300 p-2">Bunks</th>
            <th class="border border-gray-300 p-2">Level</th>
          </tr>
        </thead>
        <tbody>
          ${demoLeaderboard
            .sort((a, b) => b.bunks - a.bunks)
            .map((user, idx) => `
              <tr>
                <td class="border border-gray-300 p-2 text-center">${idx + 1}</td>
                <td class="border border-gray-300 p-2">${escapeHtml(user.name)}</td>
                <td class="border border-gray-300 p-2 text-center">${user.bunks}</td>
                <td class="border border-gray-300 p-2 text-center">${user.level}</td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    `;
    c.innerHTML += html;
  } else {
    try {
      const db = firebase.firestore();
      const usersRef = db.collection('users');
      const bunksRef = db.collection('bunks');

      // Fetch all bunks (NOTE: for large apps use aggregation or cloud function)
      const bunksSnap = await bunksRef.get();

      const bunkCounts = {};
      bunksSnap.forEach(doc => {
        const bunk = doc.data();
        if (bunk.userId) {
          bunkCounts[bunk.userId] = (bunkCounts[bunk.userId] || 0) + 1;
        }
      });

      const userIds = Object.keys(bunkCounts);
      const userPromises = userIds.map(uid => usersRef.doc(uid).get());
      const userDocs = await Promise.all(userPromises);

      const leaderboard = userDocs.map((doc, idx) => {
        const data = doc.data() || {};
        const bunks = bunkCounts[userIds[idx]] || 0;
        let level = 'Bronze';
        if (bunks >= 30) level = 'Gold';
        else if (bunks >= 15) level = 'Silver';
        return {
          name: data.displayName || data.name || 'Unknown',
          bunks,
          level
        };
      });

      leaderboard.sort((a, b) => b.bunks - a.bunks);

      let html = `
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 p-2">Rank</th>
              <th class="border border-gray-300 p-2">Name</th>
              <th class="border border-gray-300 p-2">Bunks</th>
              <th class="border border-gray-300 p-2">Level</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.map((user, idx) => `
              <tr>
                <td class="border border-gray-300 p-2 text-center">${idx + 1}</td>
                <td class="border border-gray-300 p-2">${escapeHtml(user.name)}</td>
                <td class="border border-gray-300 p-2 text-center">${user.bunks}</td>
                <td class="border border-gray-300 p-2 text-center">${user.level}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      c.innerHTML += html;

    } catch (err) {
      c.innerHTML += `<p class="text-red-600">Failed to load leaderboard: ${escapeHtml(err.message || err)}</p>`;
    }
  }
}

// --- small helpers --- //
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Initialize app on DOM ready --- //
document.addEventListener('DOMContentLoaded', () => {
  setupMenu();
  initAuth();
});
