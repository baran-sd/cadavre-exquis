/**
 * AI Image Agent - Core Logic (Unified Elite Version)
 * Author: Antigravity / baran-sd
 * Integrates Cadavre Exquis Visual Builder and Classic Agent.
 */

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

const PRESETS = {
  cadavre: `You are an expert AI image prompt engineer specializing in Cadavre Exquis tri-style metamorphosis art. The user will describe a subject and 3 styles (Top/Middle/Bottom). Write a hyper-detailed image prompt where ONE character transforms seamlessly TOP→MIDDLE→BOTTOM through the 3 styles, like watercolor ink dissolving. NO hard borders. Each zone 5-7 specific visual details. End with: Cinematic 8k, photorealistic, seamless gradient metamorphosis. Return ONLY the prompt text.`,
  realism: `You are a photography and photorealism expert AI prompt engineer. Transform the user's request into an ultra-realistic photograph prompt. Include: camera model, lens, aperture, ISO, lighting setup, location, textures, color grading. Use: RAW photo, photorealistic, 8k. Return ONLY the prompt text.`,
  anime: `You are an anime and manga visual art AI prompt engineer. Transform the user's request into a detailed anime-style image prompt. Include: art style reference, character details, cel shading, vibrant colors. Use: anime style, Detailed. Return ONLY the prompt text.`,
  concept: `You are a concept art AI prompt engineer. Transform the user's request into professional concept art. Include: Arstation style, mood, color palette, lighting. Use: concept art, digital painting, artstation. Return ONLY the prompt text.`,
  logo: `You are a logo designer. Transform the user's request into a logo prompt. Include: minimalist style, colors, symbol, typography. Return ONLY the prompt text.`,
  custom: ''
};

const MODEL_MAP = {
  'gemini': 'p7',
  'grok': 'openai', 
  'openai': 'openai',
  'claude': 'claude',
  'mistral': 'mistral'
};

// --- APP STATE ---
let activeMode = 'classic'; // 'classic' or 'builder'
let lastImageUrl = '';
let lastAgentPrompt = '';
let currentImageObjectUrl = '';

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
  const k = hash.get('api_key');
  
  if (k) {
    localStorage.setItem('pollen_key', k);
    history.replaceState(null, '', location.pathname + location.search);
  }
  
  const key = localStorage.getItem('pollen_key');
  if (key) { showApp(key); } else { showConnect(); }

  initTabs();
  initClassicMode();
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
  document.getElementById('sys-prompt').value = PRESETS.cadavre;
  fetchBalance(key);
}

// --- TABS & NAVIGATION ---
function initTabs() {
  const btnClassic = document.getElementById('tab-classic');
  const btnBuilder = document.getElementById('tab-builder');
  const panelClassic = document.getElementById('panel-classic');
  const panelBuilder = document.getElementById('panel-builder');

  btnClassic.onclick = () => {
    activeMode = 'classic';
    btnClassic.className = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-background shadow-sm';
    btnBuilder.className = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground';
    panelClassic.classList.remove('hidden');
    panelBuilder.classList.add('hidden');
  };

  btnBuilder.onclick = () => {
    activeMode = 'builder';
    btnBuilder.className = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-background shadow-sm';
    btnClassic.className = 'px-4 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground';
    panelBuilder.classList.remove('hidden');
    panelClassic.classList.add('hidden');
  };
}

// --- CLASSIC MODE ---
function initClassicMode() {
  const pst = document.querySelectorAll('.preset-btn');
  pst.forEach(btn => {
    btn.onclick = () => {
      pst.forEach(b => b.classList.remove('active', 'bg-blue-600', 'text-white'));
      btn.classList.add('active', 'bg-blue-600', 'text-white');
      const id = btn.dataset.id;
      document.getElementById('sys-prompt').value = PRESETS[id] || '';
      if (id === 'custom') document.getElementById('sys-prompt').focus();
    };
  });
}

// --- BUILDER MODE ---
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
    const r = await fetch('https://gen.pollinations.ai/account/balance', { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error();
    const d = await r.json();
    document.getElementById('badge').textContent = `🔌 ${d.balance ?? d.pollen ?? '—'} Pollen`;
  } catch (e) {
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
  const imgModel = document.getElementById('img-model').value;
  const [w, h] = document.getElementById('aspect').value.split(':');
  const seedVal = document.getElementById('seed-input').value;
  const seed = seedVal ? parseInt(seedVal) : Math.floor(Math.random() * 999999);

  let finalPrompt = '';

  setUILoading();

  if (activeMode === 'classic') {
    const sysPrompt = document.getElementById('sys-prompt').value.trim();
    let userTask = document.getElementById('user-task').value.trim();

    if (isChain) userTask = `Continue this visual story: ${lastAgentPrompt}. Evolve it further with new surreal details.`;
    if (!userTask) { setStatus('❌ Введи задачу!'); return; }
    
    setStatus(isChain ? "⛓️ Продолжаю цепочку..." : "🤖 Агент пишет промпт...");
    
    try {
      const selectedModel = document.getElementById('llm-model').value;
      const llmModel = MODEL_MAP[selectedModel] || selectedModel;
      const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { 'Authorization': `Bearer ${key}` } : {}) },
        body: JSON.stringify({
          model: llmModel,
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userTask }],
          seed: seed, temperature: 0.7
        })
      });
      const data = await res.json();
      finalPrompt = data.choices[0].message.content.trim();
    } catch (e) {
      finalPrompt = userTask;
      setStatus('⚠️ LLM Error, using literal input');
    }
  } else {
    // BUILDER MODE
    if (!builderSelections.gender || builderSelections.pose === null) {
      document.getElementById('placeholder').classList.remove('hidden');
      document.getElementById('loading-state').classList.add('hidden');
      alert('⚠️ Select character gender and pose first!');
      return;
    }
    const g = builderSelections.gender === 'male' ? 'handsom man' : 'beautiful woman';
    const p = POSES[builderSelections.pose].desc;
    const tS = builderSelections.topStyle !== null ? STYLES[builderSelections.topStyle] : null;
    const mS = builderSelections.middleStyle !== null ? STYLES[builderSelections.middleStyle] : null;
    const bS = builderSelections.bottomStyle !== null ? STYLES[builderSelections.bottomStyle] : null;
    const atm = builderSelections.atmosphere !== null ? ATMOSPHERES[builderSelections.atmosphere].desc : '';

    finalPrompt = `Stunning full-body portrait of a single ${g}, ${p}. THREE SEAMLESS STYLE ZONES: `;
    if (tS) finalPrompt += `TOP: ${tS.name} (${tS.topDesc}). `;
    if (mS) finalPrompt += `MIDDLE: ${mS.name} (${mS.midDesc}). `;
    if (bS) finalPrompt += `BOTTOM: ${bS.name} (${bS.botDesc}). `;
    finalPrompt += `Seamless transition gradients, identical facial features, same character throughout. Atmosphere: ${atm}. Photorealistic 8k vertical.`;
  }

  // IMAGE GENERATION
  lastAgentPrompt = finalPrompt;
  setStatus('🎨 Генерирую картинку...');
  
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=${imgModel}&width=${w}&height=${h}&seed=${seed}&nologo=true`;
  const imgElement = document.getElementById('result-img');

  try {
    // Authenticated Fetch Flow (Handling private models)
    const imgRes = await fetch(imgUrl, { headers: { ...(key ? { 'Authorization': `Bearer ${key}` } : {}) } });
    if (!imgRes.ok) throw new Error();
    const blob = await imgRes.blob();
    if (currentImageObjectUrl) URL.revokeObjectURL(currentImageObjectUrl);
    currentImageObjectUrl = URL.createObjectURL(blob);
    
    imgElement.onload = () => {
      document.getElementById('loading-state').classList.add('hidden');
      imgElement.classList.remove('hidden');
      document.getElementById('img-overlay').classList.remove('hidden');
      document.getElementById('prompt-log').classList.remove('hidden');
      document.getElementById('log-body').textContent = finalPrompt;
      lastImageUrl = imgUrl;
      fetchBalance(key);
    };
    imgElement.src = currentImageObjectUrl;
  } catch (e) {
    setStatus('❌ Generation Failed. Check balance.');
  }
}

function setUILoading() {
  document.getElementById('placeholder').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('result-img').classList.add('hidden');
  document.getElementById('img-overlay').classList.add('hidden');
  setStatus('🤖 Initializing...');
}

function setStatus(msg) { document.getElementById('status').textContent = msg; }

init();
