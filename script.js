/**
 * Cadavre Builder - Core Logic
 * Author: Antigravity / baran-sd
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
  const k = hash.get('api_key');
  
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
  const connectScreen = document.getElementById('connect-screen');
  const appScreen = document.getElementById('app');
  if(connectScreen) connectScreen.classList.remove('hidden');
  if(appScreen) appScreen.classList.add('hidden');
}

function showApp(key) {
  const connectScreen = document.getElementById('connect-screen');
  const appScreen = document.getElementById('app');
  if(connectScreen) connectScreen.classList.add('hidden');
  if(appScreen) appScreen.classList.remove('hidden');
  fetchBalance(key);
}

// --- BUILDER UI ---
function initBuilderGrids() {
  const poseGrid = document.getElementById('poseGrid');
  if (poseGrid) {
    POSES.forEach((p, i) => {
      const btn = createGridBtn(p.emoji, p.name);
      btn.onclick = () => {
        document.querySelectorAll('#poseGrid .gender-btn').forEach(b => b.classList.remove('btn-selected'));
        builderSelections.pose = i;
        btn.classList.add('btn-selected');
      };
      poseGrid.appendChild(btn);
    });
  }

  ['top', 'middle', 'bottom'].forEach(zone => {
    const grid = document.getElementById(`${zone}Style`);
    if (grid) {
      STYLES.forEach((s, i) => {
        const btn = createGridBtn(s.emoji, s.name);
        btn.onclick = () => {
          grid.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('btn-selected'));
          builderSelections[`${zone}Style`] = i;
          btn.classList.add('btn-selected');
        };
        grid.appendChild(btn);
      });
    }
  });

  const atmGrid = document.getElementById('atmGrid');
  if (atmGrid) {
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
}

function createGridBtn(emoji, name) {
  const btn = document.createElement('button');
  btn.className = 'gender-btn flex flex-col items-center gap-1 glass-card p-2 rounded-lg hover:bg-secondary transition-all border border-transparent';
  btn.innerHTML = `<span class="text-xl">${emoji}</span><span class="text-[10px] font-bold uppercase truncate w-full">${name}</span>`;
  return btn;
}

// Reikalinga funkcija HTML mygtukams
window.selectGender = function(gender) {
  builderSelections.gender = gender;
  document.getElementById('genderMale').classList.toggle('btn-selected', gender === 'male');
  document.getElementById('genderFemale').classList.toggle('btn-selected', gender === 'female');
};

async function fetchBalance(key) {
  try {
    const r = await fetch('https://gen.pollinations.ai/pollen', { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error();
    const d = await r.json();
    const balance = d.balance ?? d.pollen ?? d.total_pollen ?? '—';
    document.getElementById('badge').textContent = `🔌 ${balance} Pollen`;
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

async function runAgent(isChain = false) {
  const key = localStorage.getItem('pollen_key');
  if (!key) {
    alert("🌌 Please connect your Pollinations account first!");
    showConnect();
    return;
  }

  if (!builderSelections.gender || builderSelections.pose === null) {
    alert('⚠️ Select character gender and pose first!');
    return;
  }

  const imgModel = document.getElementById('img-model').value;
  const aspectValue = document.getElementById('aspect').value;
  const [w, h] = aspectValue.split(':');
  const seedVal = document.getElementById('seed-input').value;
  const seed = seedVal ? parseInt(seedVal) : Math.floor(Math.random() * 999999);

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Building...';
  setUILoading();

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
  
  if (isChain && lastAgentPrompt) {
    finalPrompt = `Continuous metamorphosis: ${lastAgentPrompt}. Now blending into: ${finalPrompt}. Seamless integration.`;
  }

  document.getElementById('prompt-log').classList.remove('hidden');
  document.getElementById('log-body').textContent = finalPrompt;

  setStatus('🎨 Генерирую картинку...');
  
  let imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=${imgModel}&width=${w}&height=${h}&seed=${seed}&nologo=true&safe=true&pollen_key=${key}`;
  
  const imgElement = document.getElementById('result-img');

  imgElement.onload = () => {
    document.getElementById('loading-state').classList.add('hidden');
    imgElement.classList.remove('hidden');
    document.getElementById('img-overlay').classList.remove('hidden');
    lastImageUrl = imgUrl;
    lastAgentPrompt = finalPrompt;
    
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles" class="w-6 h-6"></i> GENERATE CHARACTER';
    if (window.lucide) lucide.createIcons();
    fetchBalance(key);
  };

  imgElement.onerror = () => {
    setStatus("❌ Image load failed. Check your Pollen balance.");
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('placeholder').classList.remove('hidden');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles" class="w-6 h-6"></i> GENERATE CHARACTER';
    if (window.lucide) lucide.createIcons();
  };

  imgElement.src = imgUrl;
}

function setUILoading() {
  document.getElementById('placeholder').classList.add('hidden');
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('result-img').classList.add('hidden');
  document.getElementById('img-overlay').classList.add('hidden');
  setStatus('🤖 Initializing Character...');
}

function setStatus(msg) { 
  const statusEl = document.getElementById('status');
  if(statusEl) statusEl.textContent = msg; 
}

// Paleidžiame inicializaciją
init();
