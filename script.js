/**
 * AI Image Agent - Core Logic (Elite Version)
 * Based on original code by baran-sd
 * Fully restored Cadavre Exquis instructions & Z-Image support
 * FIX: Authenticated Image loading via Blob to avoid "Loading Error"
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

const MODEL_MAP = {
  'gemini': 'p7',
  'grok': 'openai', 
  'openai': 'openai',
  'claude': 'claude',
  'mistral': 'mistral'
};

let lastImageUrl = '';
let lastAgentPrompt = '';
let currentImageObjectUrl = '';

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
  setupEventListeners();
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
    if (!r.ok) throw new Error('Balance API error');
    const d = await r.json();
    const bal = d.balance !== undefined ? d.balance : (d.pollen !== undefined ? d.pollen : '—');
    document.getElementById('badge').textContent = `🔌 ${bal} Pollen`;
  } catch (e) {
    console.error('Balance fetch failed', e);
    document.getElementById('badge').textContent = '🔌 — Pollen';
  }
}

function setupEventListeners() {
    document.getElementById('connect-btn').onclick = () => {
        const redirectUrl = encodeURIComponent(location.href);
        location.href = `https://enter.pollinations.ai/authorize?redirect_url=${redirectUrl}&app_key=pk_WEQH2XRadxYUEgQt&models=zimage,flux,grok-imagine,nanobanana-2,gptimage,seedream5,klein&budget=100&expiry=30`;
    };

    document.getElementById('disconnect-btn').onclick = () => {
        localStorage.removeItem('pollen_key');
        location.reload();
    };

    document.getElementById('gen-btn').onclick = () => runAgent();
    document.getElementById('regen-btn').onclick = () => runAgent();
    document.getElementById('chain-btn').onclick = () => runAgent(true);

    document.getElementById('dl-btn').onclick = () => window.open(lastImageUrl);
    document.getElementById('cp-btn').onclick = () => {
        navigator.clipboard.writeText(lastImageUrl);
        const b = document.getElementById('cp-btn');
        const t = b.innerHTML;
        b.innerHTML = '<i data-lucide="check"></i> Copied!';
        lucide.createIcons();
        setTimeout(() => { b.innerHTML = t; lucide.createIcons(); }, 2000);
    };

    document.getElementById('log-toggle').onclick = () => {
        const body = document.getElementById('log-body');
        const arrow = document.getElementById('log-arrow');
        body.classList.toggle('open');
        arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
    };
}

function initPresets() {
  const pst = document.querySelectorAll('.preset-btn');
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
  const imgModel = document.getElementById('img-model').value;
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
      userTask = `Continue the visual story based on this previous scene: ${lastAgentPrompt}. Evolve it further with new surreal details while maintaining the tri-style metamorphosis logic.`;
  }

  if (!userTask) {
    userTaskInput.focus();
    return;
  }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  setUILoading();
  
  const statusMsg = isChain ? "⛓️ Агент продолжает цепочку..." : `🤖 ${selectedModel} пишет промпт...`;
  setStatus(statusMsg);
  btn.innerHTML = '<span class="loading-spin"></span> Processing...';

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
          { role: 'system', content: sysPrompt || 'You are an expert image prompt engineer.' },
          { role: 'user', content: userTask }
        ],
        seed: seed,
        temperature: 0.7
      }),
      signal: getTimeoutSignal(45000)
    });

    if (!res.ok) throw new Error(`LLM Error ${res.status}`);
    const data = await res.json();
    finalPrompt = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
    
  } catch (e) {
    console.error('LLM Failed', e);
    finalPrompt = userTask;
    setStatus('⚠️ LLM ошибка, использую оригинал...');
  }
  
  lastAgentPrompt = finalPrompt;
  setStatus('🎨 Генерирую картинку...');
  
  const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?model=${imgModel}&width=${w}&height=${h}&seed=${seed}&nologo=true`;
  const imgElement = document.getElementById('result-img');
  
  try {
    // We use fetch with Authorization header to handle private/paid models like Z-Image
    const imgRes = await fetch(imgUrl, {
      headers: {
        ...(key ? { 'Authorization': `Bearer ${key}` } : {})
      }
    });

    if (!imgRes.ok) throw new Error("Image Generation Failed");

    const blob = await imgRes.blob();
    
    // Revoke previous URL to avoid memory leaks
    if (currentImageObjectUrl) URL.revokeObjectURL(currentImageObjectUrl);
    
    currentImageObjectUrl = URL.createObjectURL(blob);
    
    imgElement.onload = () => {
        document.getElementById('spinner').classList.add('hidden');
        document.getElementById('status').classList.add('hidden');
        imgElement.classList.remove('hidden');
        document.getElementById('img-overlay').classList.remove('hidden');
        document.getElementById('prompt-log').classList.remove('hidden');
        document.getElementById('log-body').textContent = finalPrompt;
        
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="sparkles"></i>✨ Run Agent';
        lucide.createIcons();
        fetchBalance(key);
    };

    imgElement.onerror = () => {
        document.getElementById('spinner').classList.add('hidden');
        setStatus('❌ Ошибка отрисовки');
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="sparkles"></i>✨ Run Agent';
        lucide.createIcons();
    };

    imgElement.src = currentImageObjectUrl;
    lastImageUrl = imgUrl; // Keep original URL for download/copy

  } catch (e) {
    console.error('Image Generation Failed', e);
    document.getElementById('spinner').classList.add('hidden');
    setStatus('❌ Ошибка загрузки: проверьте баланс');
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="sparkles"></i>✨ Run Agent';
    lucide.createIcons();
  }
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

init();
