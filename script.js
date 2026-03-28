/**
 * AI Image Agent - Core Logic
 * Based on original code by baran-sd
 * Upgraded with Chain Generation (Cadavre Exquis) & Premium Experience
 */

const PRESETS = {
  cadavre: `You are an expert AI image prompt engineer specializing in Cadavre Exquis tri-style metamorphosis art. The user will describe a subject and 3 styles (Top/Middle/Bottom). Write a hyper-detailed image prompt where ONE character transforms seamlessly TOP→MIDDLE→BOTTOM through the 3 styles, like watercolor ink dissolving. NO hard borders. Each zone 5-7 specific visual details. End with: Cinematic 8k, photorealistic, seamless gradient metamorphosis. Return ONLY the prompt text.`,
  realism: `You are a photography and photorealism expert AI prompt engineer. Transform the user's request into an ultra-realistic photograph prompt. Include: camera model, lens, aperture, ISO, lighting setup, location, textures, color grading. Use: RAW photo, photorealistic, 8k, no illustration. Return ONLY the prompt text.`,
  anime: `You are an anime and manga visual art AI prompt engineer. Transform the user's request into a detailed anime-style image prompt. Include: art style reference, character details, cel shading, vibrant colors, dynamic composition, background atmosphere. Use: anime style, manga illustration, cel shaded, vibrant, detailed. Return ONLY the prompt text.`,
  concept: `You are a concept art and game art AI prompt engineer. Transform the user's request into a professional concept art prompt. Include: environment or character details, artistic style (Artstation), mood, color palette, lighting, perspective. Use: concept art, digital painting, artstation, highly detailed, professional. Return ONLY the prompt text.`,
  logo: `You are a logo and brand identity AI prompt engineer. Transform the user's request into a logo design prompt. Include: style (minimalist/geometric/vintage/modern), colors, symbol, typography, negative space. Use: logo design, vector style, clean, professional, white background. Return ONLY the prompt text.`,
  product: `You are a product photography AI prompt engineer. Transform the user's request into a commercial product photography prompt. Include: product placement, surface material, lighting, shadows, color scheme, luxury feel. Use: product photography, commercial, studio lighting, 8k, photorealistic. Return ONLY the prompt text.`,
  custom: ''
};

// Maps internal model labels to Pollinations AI actual model IDs
const MODEL_MAP = {
  'gemini': 'p7',  
  'grok': 'openai', 
  'openai': 'openai',
  'claude': 'claude',
  'mistral': 'mistral'
};

let lastImageUrl = '';
let lastAgentPrompt = '';

function init() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const k = hash.get('api_key');
  
  if (k) {
    localStorage.setItem('pollen_key', k);
    history.replaceState(null, '', location.pathname + location.search);
  }
  
  const key = localStorage.getItem('pollen_key');
  if (key) {
    showApp(key);
  } else {
    showConnect();
  }
  initPresets();
  setupChainButton();
}

function showConnect() {
  document.getElementById('connect-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp(key) {
  document.getElementById('connect-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.body.style.alignItems = 'flex-start';
  document.getElementById('sys-prompt').value = PRESETS.cadavre;
  fetchBalance(key);
}

async function fetchBalance(key) {
  try {
    const r = await fetch('https://gen.pollinations.ai/account/balance', {
      headers: { Authorization: `Bearer ${key}` }
    });
    const d = await r.json();
    document.getElementById('badge').textContent = `${d.balance} Pollen`;
  } catch (e) {
    console.error('Balance fetch failed', e);
  }
}

// --- Event Listeners ---
document.getElementById('connect-btn').onclick = () => {
  const redirectUrl = encodeURIComponent(location.href);
  location.href = `https://enter.pollinations.ai/authorize?redirect_url=${redirectUrl}&app_key=pk_WEQH2XRadxYUEgQt&models=zimage,flux,grok-imagine,nanobanana-2,gptimage,seedream5,klein&budget=100&expiry=30`;
};

document.getElementById('disconnect-btn').onclick = () => {
  localStorage.removeItem('pollen_key');
  location.reload();
};

function initPresets() {
  const pst = document.querySelectorAll('.preset-btn');
  if (!pst.length) return;
  pst.forEach(btn => {
    btn.onclick = () => {
      pst.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.dataset.id;
      document.getElementById('sys-prompt').value = PRESETS[id] || '';
      if (id === 'custom') document.getElementById('sys-prompt').focus();
    };
  });
}

document.getElementById('gen-btn').onclick = () => runAgent();

// Polyfill for AbortSignal.timeout
function getTimeoutSignal(ms) {
    if (AbortSignal.timeout) return AbortSignal.timeout(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

async function runAgent(isChain = false) {
  const key = localStorage.getItem('pollen_key');
  const sysPromptInput = document.getElementById('sys-prompt');
  const userTaskInput = document.getElementById('user-task');
  const selectedModel = document.getElementById('llm-model').value;
  const llmModel = MODEL_MAP[selectedModel] || selectedModel;
  
  const imgModelInput = document.getElementById('img-model').value;
  const imgModel = imgModelInput === 'zimage' ? 'turbo' : imgModelInput;
  
  const [w, h] = document.getElementById('aspect').value.split(':');
  const seedVal = document.getElementById('seed-input').value;
  const seed = seedVal ? parseInt(seedVal) : Math.floor(Math.random() * 999999);

  let sysPrompt = sysPromptInput.value.trim();
  let userTask = userTaskInput.value.trim();

  if (isChain) {
      if (!lastAgentPrompt) {
          setStatus('⚠️ Start with a base image first!');
          return;
      }
      userTask = `Now evolve this visual description: "${lastAgentPrompt}". Transform the scene further, add more surreal details, and maintain the Cadavre Exquis metamorphosis.`;
  }

  if (!userTask) {
    userTaskInput.focus();
    return;
  }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  setUILoading();
  
  const statusMsg = isChain ? "⛓️ Chaining metamorphosis..." : `🤖 Prompting ${selectedModel}...`;
  setStatus(statusMsg);
  btn.innerHTML = isChain ? '<span class="loading-spin"></span> Chaining...' : '<span class="loading-spin"></span> Writing...';

  let finalPrompt = '';
  try {
    const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { 'Authorization': `Bearer ${key}` } : {})
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: 'system', content: sysPrompt || 'You are an expert image prompt engineer. Return ONLY the enhanced prompt.' },
          { role: 'user', content: userTask }
        ],
        seed: seed,
        temperature: 0.7
      }),
      signal: getTimeoutSignal(35000)
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`LLM Error ${res.status}`);
    }

    const data = await res.json();
    finalPrompt = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    
  } catch (e) {
    console.error('LLM Failed', e);
    finalPrompt = userTask;
    setStatus('⚠️ LLM Error - Using original task');
  }
  
  lastAgentPrompt = finalPrompt;
  setStatus('🎨 Generating visual masterpiece...');
  btn.innerHTML = '<span class="loading-spin"></span> Painting...';
  
  const imgUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?model=${imgModel}&width=${w}&height=${h}&seed=${seed}&nologo=true`;
  const imgElement = document.getElementById('result-img');
  
  imgElement.onload = () => {
    document.getElementById('spinner').classList.add('hidden');
    document.getElementById('status').classList.add('hidden');
    imgElement.classList.remove('hidden');
    document.getElementById('img-overlay').classList.remove('hidden');
    document.getElementById('prompt-log').classList.remove('hidden');
    document.getElementById('log-body').textContent = finalPrompt;
    
    btn.disabled = false;
    btn.innerHTML = '✨ Run Agent';
    fetchBalance(key);
  };

  imgElement.onerror = () => {
    document.getElementById('spinner').classList.add('hidden');
    setStatus('❌ Generation Error');
    btn.disabled = false;
    btn.innerHTML = '✨ Run Agent';
  };

  imgElement.src = imgUrl;
  lastImageUrl = imgUrl;
}

function setupChainButton() {
    document.getElementById('chain-btn').onclick = () => runAgent(true);
    document.getElementById('regen-btn').onclick = () => runAgent();
}

function setUILoading() {
  document.getElementById('placeholder').classList.add('hidden');
  document.getElementById('result-img').classList.add('hidden');
  document.getElementById('img-overlay').classList.add('hidden');
  document.getElementById('prompt-log').classList.add('hidden');
  document.getElementById('spinner').classList.remove('hidden');
  document.getElementById('status').classList.remove('hidden');
}

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

document.getElementById('dl-btn').onclick = () => window.open(lastImageUrl);
document.getElementById('cp-btn').onclick = () => {
  navigator.clipboard.writeText(lastImageUrl);
  const b = document.getElementById('cp-btn');
  const t = b.innerHTML;
  b.innerHTML = '✅ Copied!';
  setTimeout(() => b.innerHTML = t, 2000);
};

document.getElementById('log-toggle').onclick = () => {
  const body = document.getElementById('log-body');
  const arrow = document.getElementById('log-arrow');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
};

init();
