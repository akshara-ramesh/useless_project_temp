// chatbot.js - uses backend proxy at /api/excuse (server must be running)
function byId(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', ()=> {
  // 1. Local/Canned Excuse Generator (No API)
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

  // 2. Gemini API Excuse Generator (via /api/excuse backend proxy)
  if(byId('genBtn')) {
    byId('genBtn').addEventListener('click', async ()=> {
      const subj = byId('subject').value || 'class';
      const tone = byId('tone').value || 'casual';
      const result = byId('result');
      
      result.innerHTML = '<div class="p-4 rounded bg-slate-50">Generating…</div>';
      
      try {
      const resp = await fetch('/api/gemini-excuse', {
      method: 'POST', 
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ subject: subj, tone })
      });
        
        if(!resp.ok) throw new Error('Server error: ' + resp.statusText);
        
        const data = await resp.json();
        console.log('API response:', data); // LOGS RESPONSE TO BROWSER CONSOLE

        const text = data.excuse || 'No response';
        const model = data.model || 'unknown'; // DISPLAYS THE MODEL NAME
        
        result.innerHTML = `
          <div class="p-4 rounded bg-slate-50">
            <strong>AI Excuse:</strong>
            <p>${text}</p>
            <div class="text-xs text-gray-500 mt-1 mb-2">(Model: ${model})</div>
            <div class="mt-2"><button id="copyBtn" class="px-2 py-1 rounded border">Copy</button></div>
          </div>
        `;

        document.getElementById('copyBtn').addEventListener('click', ()=> navigator.clipboard.writeText(text));
        
      } catch(err) {
        result.innerHTML = '<div class="p-4 rounded bg-rose-50 text-rose-700">Error: ' + err.message + '</div>';
      }
    });
  }

});