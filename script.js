const els = {
  youtubeUrl: document.getElementById('youtubeUrl'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  clearBtn: document.getElementById('clearBtn'),
  status: document.getElementById('status'),
  chatMeta: document.getElementById('chatMeta'),
  chatFrame: document.getElementById('chatFrame'),
};

const state = {
  running: false,
  videoId: null,
  embedDomain: null,
};

function setStatus(text, mode = 'info') {
  const prefix = mode === 'error' ? 'Hata: ' : mode === 'ok' ? 'OK: ' : '';
  els.status.textContent = `${prefix}${text}`;
  if (mode === 'error') {
    els.status.style.borderColor = 'rgba(239, 68, 68, 0.45)';
  } else if (mode === 'ok') {
    els.status.style.borderColor = 'rgba(34, 197, 94, 0.45)';
  } else {
    els.status.style.borderColor = 'rgba(255, 255, 255, 0.12)';
  }
}

function setMetaText() {
  const bits = [];
  if (state.videoId) bits.push(`videoId: ${state.videoId}`);
  if (state.embedDomain) bits.push(`domain: ${state.embedDomain}`);
  if (state.running) bits.push('çalışıyor');
  els.chatMeta.textContent = bits.join(' · ');
}

function isProbablyVideoId(value) {
  return /^[a-zA-Z0-9_-]{10,20}$/.test(value);
}

function extractVideoId(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (isProbablyVideoId(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) return parts[1];
      if (parts[0] === 'live' && parts[1]) return parts[1];
      if (parts[0] === 'embed' && parts[1]) return parts[1];
    }
  } catch {
    return null;
  }

  return null;
}

function stopViewing() {
  state.running = false;
  state.videoId = null;
  if (els.chatFrame) els.chatFrame.src = '';
  els.startBtn.disabled = false;
  els.stopBtn.disabled = true;
  setMetaText();
}

function getEmbedDomain() {
  const host = window.location.hostname;
  return host || 'localhost';
}

function isFileMode() {
  return window.location.protocol === 'file:';
}

function buildChatEmbedSrc(videoId, embedDomain) {
  const url = new URL('https://www.youtube.com/live_chat');
  url.searchParams.set('v', videoId);
  url.searchParams.set('embed_domain', embedDomain);
  return url.toString();
}

async function start() {
  const urlInput = (els.youtubeUrl.value || '').trim();

  const videoId = extractVideoId(urlInput);
  if (!videoId) {
    setStatus('YouTube URL geçersiz. Örnek: https://www.youtube.com/watch?v=VIDEO_ID', 'error');
    return;
  }

  stopViewing();
  state.videoId = videoId;
  state.embedDomain = getEmbedDomain();

  if (isFileMode()) {
    const chatUrl = `https://www.youtube.com/live_chat?v=${encodeURIComponent(state.videoId)}`;
    if (els.chatFrame) {
      els.chatFrame.src = '';
      els.chatFrame.srcdoc = `<!doctype html><html lang="tr"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Chat</title></head><body style="margin:0;font-family:system-ui;background:#0b0b0b;color:#fff;display:grid;place-items:center;padding:16px;"><div style="max-width:520px;text-align:center;line-height:1.4;"><div style="font-weight:700;margin-bottom:8px;">Chat iframe görünmüyor olabilir</div><div style="opacity:0.85;font-size:14px;">Sayfa <b>file://</b> olarak açıldığı için YouTube embed izin vermeyebilir. En iyi çözüm: sayfayı <b>localhost</b> üzerinden aç.</div><div style="margin-top:14px;"><a href="${chatUrl}" target="_blank" rel="noreferrer" style="display:inline-block;background:#e30a17;color:#fff;text-decoration:none;padding:10px 12px;border-radius:10px;">Chat’i yeni sekmede aç</a></div></div></body></html>`;
    }

    els.startBtn.disabled = false;
    els.stopBtn.disabled = true;
    setMetaText();
    setStatus('Chat embed için bu dosyayı localhost üzerinden açmalısın (file:// olmamalı).', 'error');
    return;
  }

  els.startBtn.disabled = true;
  els.stopBtn.disabled = false;

  try {
    const src = buildChatEmbedSrc(state.videoId, state.embedDomain);
    if (els.chatFrame) els.chatFrame.src = src;
    state.running = true;
    setMetaText();
    setStatus('Chat iframe yüklendi. (Mesajlar YouTube tarafından gösterilir.)', 'ok');
  } catch (err) {
    setStatus(err?.message || 'Başlatılamadı.', 'error');
    stopViewing();
  }
}

function clearChat() {
  stopViewing();
  if (els.chatFrame) els.chatFrame.src = '';
  setStatus('Temizlendi.', 'ok');
}

els.startBtn.addEventListener('click', () => {
  start();
});

els.stopBtn.addEventListener('click', () => {
  setStatus('Durduruldu.', 'info');
  stopViewing();
});

els.clearBtn.addEventListener('click', () => {
  clearChat();
});

els.youtubeUrl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') start();
});

setStatus('YouTube canlı yayın URL girip Başlat’a bas.', 'info');
setMetaText();
