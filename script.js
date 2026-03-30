/**
 * Cadavre Builder - Core Logic
 * Author: Antigravity / baran-sd
 * A specialized visual constructor for tri-style character metamorphosis.
 */

// #region agent log
function __dbg(hypothesisId, location, message, data) {
  try {
    const payload = { runId: 'debug1', hypothesisId, location, message, data, timestamp: Date.now() };

    // Local fallback so we can still extract evidence even if localhost logging is blocked.
    try {
      const arr = JSON.parse(localStorage.getItem('__dbg') || '[]');
      arr.push(payload);
      localStorage.setItem('__dbg', JSON.stringify(arr.slice(-200)));
    } catch (_) {}

    // Server logging (best-effort). Do not include secrets in `data`.
    fetch('http://127.0.0.1:7242/ingest/5f537c7f-a1f2-48dd-8418-8be5c4c23762', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (_) {}
}

function __maskPollinationsUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    // Redact known auth params.
    for (const k of ['pollen_key', 'key', 'api_key']) {
      if (u.searchParams.has(k)) u.searchParams.set(k, '[redacted]');
    }
    return u.toString();
  } catch {
    return urlStr;
  }
}
// #endregion

// --- BUILDER DATA ---
const POSES = [
  { emoji: '🧍', name: 'Стоя', desc: 'stands confidently, facing forward' },
  { emoji: '🚶', name: 'Шаг', desc: 'walks mid-stride, dynamic movement' },
  { emoji: '🧎', name: 'Колено', desc: 'kneels on one knee, heroic pose' },
  { emoji: '💃', name: 'Танец', desc: 'dances gracefully with arms extended' },
  { emoji: '🙆', name: 'Руки вверх', desc: 'raises arms above head triumphantly' },
  { emoji: '🤲', name: 'Ладони', desc: 'extends hands forward, palms up, offering gesture' },
  { emoji: '🧘', name: 'Медитация', desc: 'sits cross-legged in meditation pose' },
  { emoji: '⚔️', name: 'Воин', desc: 'takes warrior battle stance, ready to fight' }
];

const STYLES = [
  { emoji: '⚙️', name: 'Steampunk', topDesc: 'brass goggles, copper pipe earrings, Victorian top hat with gears', midDesc: 'brass clockwork corset, copper pipe ribs, steam-powered heart', botDesc: 'brass mechanical leg braces, clockwork knee joints' },
  { emoji: '🤖', name: 'Cyberpunk', topDesc: 'neon circuit tattoos, chrome ear implants, holographic eye lenses', midDesc: 'chrome ribcage implants, neon veins pulsing, neural interface ports', botDesc: 'chrome mechanical legs, neon light strips, cybernetic feet' },
  { emoji: '☣️', name: 'Biopunk', topDesc: 'bio-luminescent veins, organic eye mutations, living tissue', midDesc: 'bio-organic armor plates, pulsing bioluminescent organs, living tissue merged with tech', botDesc: 'mutated organic legs, bioluminescent muscle fibers, living bone structure' },
  { emoji: '🌿', name: 'Solarpunk', topDesc: 'solar panel hair clips, living plant crown, flower circuit earrings', midDesc: 'solar cell chest plate, vines growing through ribs, photosynthesis skin', botDesc: 'root-like leg structure, solar panel knee pads, grass growing from feet' },
  { emoji: '⚡', name: 'Dieselpunk', topDesc: 'aviator goggles, riveted metal face plates, diesel exhaust pipes', midDesc: 'riveted steel chest armor, diesel engine heart, 1940s military insignias', botDesc: 'riveted metal leg armor, diesel-powered knee pistons, tank-track boot soles' },
  { emoji: '⚛️', name: 'Atompunk', topDesc: 'atomic symbol eye implants, chrome 1950s hairstyle, ray gun earrings', midDesc: 'chrome atomic chest plate, nuclear reactor core, 1950s space suit torso', botDesc: 'chrome rocket boots, atomic-powered legs' },
  { emoji: '🔧', name: 'Clockpunk', topDesc: 'Leonardo da Vinci wooden mask, brass clockwork eye mechanisms', midDesc: 'wooden clockwork ribcage, Renaissance automaton torso, brass spring mechanisms', botDesc: 'wooden gear leg mechanisms, Renaissance automaton legs' },
  { emoji: '🌑', name: 'Gothpunk', topDesc: 'dark Victorian lace veil, black metal spikes, gothic cathedral window eyes', midDesc: 'black iron corset with spikes, gothic cathedral ribcage, dark leather straps', botDesc: 'black iron leg braces, gothic spike knee guards, dark Victorian boots' },
  { emoji: '🧬', name: 'Nanopunk', topDesc: 'molecular pattern face tattoos, sleek minimalist implants', midDesc: 'nanite swarm forming armor, molecular reconstruction visible, sleek chrome torso', botDesc: 'nanite-constructed legs, molecular-level detail, hovering nanite particles' },
  { emoji: '🏜️', name: 'Sandpunk', topDesc: 'Mad Max goggles, sun-bleached scrap metal headgear', midDesc: 'scrap metal chest armor, car part ribcage, desert leather straps', botDesc: 'scrap metal leg guards, car tire knee pads, desert boots' },
  { emoji: '❄️', name: 'Frostpunk', topDesc: 'frozen metal face mask, icicle hair, coal-stained skin, fur hood', midDesc: 'steam-heated chest armor, frozen metal plates, coal furnace heart', botDesc: 'frozen mechanical legs, steam-powered heating coils, ice-encrusted boots' },
  { emoji: '🔮', name: 'Magicpunk', topDesc: 'glowing rune tattoos, crystal eye implants, arcane symbol crown', midDesc: 'magical circuit armor, glowing spell inscriptions, arcane power core', botDesc: 'rune-inscribed leg wraps, magical crystal knee joints, energy tendrils' }
];

const ATMOSPHERES = [
  { emoji: '🌙', name: 'Night', desc: 'dark night with neon reflections, moody atmosphere' },
  { emoji: '🌅', name: 'Sunset', desc: 'apocalyptic sunset with orange and red dramatic sky' },
  { emoji: '🌊', name: 'Ocean', desc: 'underwater depths with murky industrial lighting' },
  { emoji: '🏭', name: 'Factory', desc: 'industrial factory with smoke, steam, and sparks' },
  { emoji: '⚡', name: 'Storm', desc: 'electrical storm with lightning and heavy rain' },
  { emoji: '🏚️', name: 'Ruins', desc: 'post-apocalyptic overgrown ruins' },
  { emoji: '🌆', name: 'City', desc: 'dystopian megacity with towering neon skyscrapers' },
  { emoji: '🔥🔥', name: 'Flame', desc: 'industrial forges with burning flames and embers' }
];

// --- APP STATE ---
let lastImageUrl = '';
let lastAgentPrompt = '';

let builderSelections = {
  gender: null,
  pose: null,
  topStyle: null,
  middleStyle: null,
  bottomStyle: null,
  atmosphere: null
};

// --- INITIALIZATION ---
function init() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const search = new URLSearchParams(window.location.search);
  const k = hash.get('api_key');
  const kSearchApiKey = search.get('api_key');
  const kSearchKey = search.get('key');
  __dbg('H0', 'script.js:init', 'security context', {
    protocol: location.protocol,
    origin: location.origin,
    isSecureContext: window.isSecureContext,
    hasHashApiKey: Boolean(k),
    hasSearchApiKey: Boolean(kSearchApiKey),
    hasSearchKeyParam: Boolean(kSearchKey),
    hasStoredKey: Boolean(localStorage.getItem('pollen_key'))
  });
  
  if (k) {
    localStorage.setItem('pollen_key', k);
    history.replaceState(null, '', location.pathname + location.search);
  }
  
  const key = localStorage.getItem('pollen_key');
  if (key) { showApp(key); } else { showConnect(); }

  initBuilderGrids();
  setupEventListeners();
}

function showConnect() {
  document.getElementById('connect-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp(key) {
  document.getElementById('connect-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  // Balance endpoint is not available; leave badge as default.
}

// --- BUILDER UI ---
function initBuilderGrids() {
  // Poses
  const poseGrid = document.getElementById('poseGrid');
  POSES.forEach((p, i) => {
    const btn = createGridBtn(p.emoji, p.name);
    btn.onclick = () => {
      document.querySelectorAll('#poseGrid .gender-btn').forEach(b => b.classList.remove('btn-selected'));
      builderSelections.pose = i;
      btn.classList.add('btn-selected');
    };
    poseGrid.appendChild(btn);
  });

  // Styles
  ['top', 'middle', 'bottom'].forEach(zone => {
    const grid = document.getElementById(`${zone}Style`);
    STYLES.forEach((s, i) => {
      const btn = createGridBtn(s.emoji, s.name);
      btn.onclick = () => {
        grid.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('btn-selected'));
        builderSelections[`${zone}Style`] = i;
        btn.classList.add('btn-selected');
      };
      grid.appendChild(btn);
    });
  });

  // Atmosphere
  const atmGrid = document.getElementById('atmGrid');
  ATMOSPHERES.forEach((a, i) => {
    const btn = createGridBtn(a.emoji, a.name);
    btn.onclick = () => {
      document.querySelectorAll('#atmGrid .gender-btn').forEach(b => b.classList.remove('btn-selected'));
      builderSelections.atmosphere = i;
      btn.classList.add('btn-selected');
    };
    atmGrid.appendChild(btn);
  });
}

function createGridBtn(emoji, name) {
  const btn = document.createElement('button');
  btn.className = 'gender-btn flex flex-col items-center gap-1 glass-card p-2 rounded-lg hover:bg-secondary transition-all border border-transparent';
  btn.innerHTML = `<span class="text-xl">${emoji}</span><span class="text-[10px] font-bold uppercase truncate w-full">${name}</span>`;
  return btn;
}

function selectGender(gender) {
  builderSelections.gender = gender;
  document.getElementById('genderMale').classList.toggle('btn-selected', gender === 'male');
  document.getElementById('genderFemale').classList.toggle('btn-selected', gender === 'female');
}

// --- CORE UTILS ---
async function fetchBalance(key) {
  try {
    __dbg('H4', 'script.js:fetchBalance', 'requesting balance', {
      endpoint: 'https://gen.pollinations.ai/pollen',
      hasKey: Boolean(key),
      keyPrefix: key ? String(key).slice(0, 3) : null
    });
    const r = await fetch('https://gen.pollinations.ai/pollen', { headers: { Authorization: `Bearer ${key}` } });
    __dbg('H4', 'script.js:fetchBalance', 'balance response', { ok: r.ok, status: r.status });
    if (!r.ok) throw new Error();
    const d = await r.json();
    const balance = d.balance ?? d.pollen ?? d.total_pollen ?? '—';
    document.getElementById('badge').textContent = `🔌 ${balance} Pollen`;
  } catch (e) {
    __dbg('H4', 'script.js:fetchBalance', 'balance failed', {
      errorName: e?.name || null,
      errorMessage: e?.message || String(e)
    });
    document.getElementById('badge').textContent = '🔌 — Pollen';
  }
}

function setupEventListeners() {
  document.getElementById('connect-btn').onclick = () => {
    const redirectUrl = encodeURIComponent(location.href);
    location.href = `https://enter.pollinations.ai/authorize?redirect_url=${redirectUrl}&app_key=pk_WEQH2XRadxYUEgQt&models=zimage,flux,grok-imagine,nanobanana-2,gptimage,seedream5,klein&budget=100&expiry=30`;
  };
  document.getElementById('disconnect-btn').onclick = () => { localStorage.removeItem('pollen_key'); location.reload(); };
  document.getElementById('gen-btn').onclick = () => runAgent();
  document.getElementById('chain-btn').onclick = () => runAgent(true);
  document.getElementById('dl-btn').onclick = () => window.open(lastImageUrl);
  document.getElementById('cp-btn').onclick = () => {
    navigator.clipboard.writeText(lastImageUrl);
    alert('Link copied to clipboard!');
  };
  document.getElementById('log-toggle').onclick = () => {
    document.getElementById('log-body').classList.toggle('hidden');
  };
}

// --- GENERATION LOGIC ---
async function runAgent(isChain = false) {
  const key = localStorage.getItem('pollen_key');
  __dbg('H5', 'script.js:runAgent', 'runAgent start', {
    isChain,
    hasKey: Boolean(key),
    keyPrefix: key ? String(key).slice(0, 3) : null,
    selection: {
      gender: builderSelections.gender,
      poseIndex: builderSelections.pose
    }
  });
  
  if (!key) {
    alert("🌌 Please connect your Pollinations account first!");
    showConnect();
    return;
  }

  // VALIDATION
  if (!builderSelections.gender || builderSelections.pose === null) {
    alert('⚠️ Select character gender and pose first!');
    return;
  }

  const imgModel = document.getElementById('img-model').value;
  const [w, h] = document.getElementById('aspect').value.split(':');
  const seedVal = document.getElementById('seed-input').value;
  const seed = seedVal ? parseInt(seedVal) : Math.floor(Math.random() * 999999);

  // START UI
  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Building...';
  setUILoading();

  // CONSTRUCT PROMPT
  const g = builderSelections.gender === 'male' ? 'handsome man' : 'beautiful woman';
  const p = POSES[builderSelections.pose].desc;
  const tS = builderSelections.topStyle !== null ? STYLES[builderSelections.topStyle] : null;
  const mS = builderSelections.middleStyle !== null ? STYLES[builderSelections.middleStyle] : null;
  const bS = builderSelections.bottomStyle !== null ? STYLES[builderSelections.bottomStyle] : null;
  const atm = builderSelections.atmosphere !== null ? ATMOSPHERES[builderSelections.atmosphere].desc : '';

  let finalPrompt = `Stunning full-body portrait of a single ${g}, ${p}. THREE SEAMLESS STYLE ZONES: `;
  if (tS) finalPrompt += `TOP: ${tS.name} (${tS.topDesc}). `;
  if (mS) finalPrompt += `MIDDLE: ${mS.name} (${mS.midDesc}). `;
  if (bS) finalPrompt += `BOTTOM: ${bS.name} (${bS.botDesc}). `;
  finalPrompt += `Seamless transition gradients, identical facial features, same character throughout. Atmosphere: ${atm}. Photorealistic 8k vertical.`;
  
  if (isChain) {
    finalPrompt = `Continuous metamorphosis: ${lastAgentPrompt}. Now blending into: ${finalPrompt}. Seamless integration.`;
  }

  // Show prompt log
  document.getElementById('prompt-log').classList.remove('hidden');
  document.getElementById('log-body').textContent = finalPrompt;

  console.log("Final Prompt for Gen:", finalPrompt);
  setStatus('🎨 Генерирую картинку...');
  
  // Pollinations API docs:
  // - Image endpoint: GET /image/{prompt} on https://gen.pollinations.ai
  // - Auth: Authorization header or query param `?key=...`
  let apiUrl =
    `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}` +
    `?model=${encodeURIComponent(imgModel)}` +
    `&width=${encodeURIComponent(w)}` +
    `&height=${encodeURIComponent(h)}` +
    `&seed=${encodeURIComponent(seed)}` +
    `&nologo=true&safe=true`;
  if (key) apiUrl += `&key=${encodeURIComponent(key)}`;
  __dbg('H1', 'script.js:runAgent', 'constructed image url', {
    maskedUrl: __maskPollinationsUrl(apiUrl),
    hasPollenKeyParam: apiUrl.includes('pollen_key='),
    hasKeyParam: apiUrl.includes('key=')
  });
  
  console.log("Requesting URL:", __maskPollinationsUrl(apiUrl));
  
  const imgElement = document.getElementById('result-img');

  imgElement.onload = () => {
    console.log("Image loaded successfully!");
    __dbg('H2', 'script.js:img.onload', 'image loaded', {
      src: __maskPollinationsUrl(imgElement.currentSrc || imgElement.src || '')
    });
    document.getElementById('loading-state').classList.add('hidden');
    imgElement.classList.remove('hidden');
    document.getElementById('img-overlay').classList.remove('hidden');
    lastImageUrl = apiUrl;
    lastAgentPrompt = finalPrompt;
    
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles" class="w-6 h-6"></i> GENERATE CHARACTER';
    lucide.createIcons();
  };

  imgElement.onerror = (e) => {
    console.error("❌ Image failed to load from URL:", __maskPollinationsUrl(apiUrl));
    console.error("Error event:", e);
    __dbg('H2', 'script.js:img.onerror', 'image failed', {
      src: __maskPollinationsUrl(imgElement.currentSrc || imgElement.src || apiUrl),
      eventType: e?.type || null
    });
    setStatus("❌ Generation failed. Check console for details.");
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('placeholder').classList.remove('hidden');
    
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles" class="w-6 h-6"></i> GENERATE CHARACTER';
    lucide.createIcons();
  };

  // Add cache-busting and actually trigger the request
  imgElement.src = apiUrl + '&t=' + Date.now();
}

function setUILoading() {
  document.getElementById('placeholder').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('result-img').classList.add('hidden');
  document.getElementById('img-overlay').classList.add('hidden');
  setStatus('🤖 Initializing Character...');
}

function setStatus(msg) { document.getElementById('status').textContent = msg; }

init();
