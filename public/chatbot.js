// chatbot.js - uses backend proxy at /api/excuse (server must be running)
function byId(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', ()=> {
  if(byId('genLocalBtn')) {
    byId('genLocalBtn').addEventListener('click', ()=> {
      const subj = byId('subject').value || 'class';
      const tone = byId('tone').value || 'casual';
      const canned = [
        "Had a bad migraine and couldn't make it.",
        "Family emergency came up, had to leave town.",
        "Was stuck helping a friend in an urgent situation.",
        "Fever — went to see a doctor, will share notes."
      ];
      let exc = canned[Math.floor(Math.random()*canned.length)];
      if(tone==='formal') exc = 'I regret to inform you that ' + exc.toLowerCase();
      byId('result').innerHTML = `<div class="p-4 rounded bg-slate-50"><strong>Excuse:</strong><p>${exc}</p><div class="mt-2"><button id="copyBtn" class="px-2 py-1 rounded border">Copy</button></div></div>`;
      document.getElementById('copyBtn').addEventListener('click', ()=> navigator.clipboard.writeText(exc));
    });
  }

  if(byId('genBtn')) {
    byId('genBtn').addEventListener('click', async ()=> {
      const subj = byId('subject').value || 'class';
      const tone = byId('tone').value || 'casual';
      const result = byId('result');
      result.innerHTML = '<div class="p-4 rounded bg-slate-50">Generating…</div>';
      try {
        const resp = await fetch('/api/excuse', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ subject: subj, tone })
        });
        if(!resp.ok) throw new Error('Server error: ' + resp.statusText);
        const data = await resp.json();
        const text = data.excuse || 'No response';
        result.innerHTML = `<div class="p-4 rounded bg-slate-50"><strong>AI Excuse:</strong><p>${text}</p><div class="mt-2"><button id="copyBtn" class="px-2 py-1 rounded border">Copy</button></div></div>`;
        document.getElementById('copyBtn').addEventListener('click', ()=> navigator.clipboard.writeText(text));
      } catch(err) {
        result.innerHTML = '<div class="p-4 rounded bg-rose-50 text-rose-700">Error: ' + err.message + '</div>';
      }
    });
  }

  if (byId('genOnlineBtn')) {
  byId('genOnlineBtn').addEventListener('click', async () => {
    const result = byId('result');
    result.innerHTML = '<div class="p-4 rounded bg-slate-50">Generating…</div>';
    try {
      const resp = await fetch('https://excuser-three.vercel.app/v1/excuse/college/');
      if (!resp.ok) throw new Error('API error: ' + resp.statusText);
      const data = await resp.json();
      if (!Array.isArray(data) || !data.length || !data[0].excuse) {
        throw new Error("No excuse found in the response");
      }
      const text = data[0].excuse;
      result.innerHTML = `<div class="p-4 rounded bg-slate-50"><strong>AI Excuse (Free API):</strong><p>${text}</p>
        <div class="mt-2"><button id="copyBtn" class="px-2 py-1 rounded border">Copy</button></div></div>`;
      document.getElementById('copyBtn').addEventListener('click', () => navigator.clipboard.writeText(text));
    } catch (err) {
      result.innerHTML = `<div class="p-4 rounded bg-rose-50 text-rose-700">Error: ${err.message}</div>`;
    }
  });
}



});
