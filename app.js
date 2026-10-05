const $ = (id) => document.getElementById(id);
const statusEl = $('status');
const copyBtn = $('copy');
const preview = $('preview');

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

async function loadShared() {
  const cache = await caches.open('share-v1');
  const metaRes = await cache.match('meta');
  if (!metaRes) return null;
  const meta = await metaRes.json();
  const fileRes = await cache.match('file');
  const file = fileRes ? await fileRes.blob() : null;
  return { meta, file };
}

async function clearShared() {
  const cache = await caches.open('share-v1');
  await cache.delete('meta');
  await cache.delete('file');
}

// Clipboard only reliably accepts image/png; convert anything else.
async function toPng(blob) {
  if (blob.type === 'image/png') return blob;
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext('2d').drawImage(bmp, 0, 0);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG conversion failed'))), 'image/png'));
}

function textOf({ title, text, url }) {
  const parts = [text, url].filter(Boolean);
  if (!parts.length && title) parts.push(title);
  return parts.join('\n');
}

async function copy(shared) {
  if (shared.file && shared.file.type.startsWith('image/')) {
    const png = await toPng(shared.file);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return 'Image copied ✓';
  }
  await navigator.clipboard.writeText(textOf(shared.meta));
  return 'Copied ✓';
}

async function finish(msg) {
  statusEl.textContent = msg;
  copyBtn.hidden = true;
  await clearShared();
  // Only works if the browser allows it (script-opened windows); otherwise the ✓ screen stays.
  setTimeout(() => window.close(), 600);
}

async function main() {
  if (!new URLSearchParams(location.search).has('shared')) return;
  $('hint').hidden = true;
  const shared = await loadShared();
  if (!shared) { statusEl.textContent = 'Nothing to copy.'; return; }
  if (shared.file) {
    preview.src = URL.createObjectURL(shared.file);
    preview.hidden = false;
  }
  statusEl.textContent = shared.file ? 'Shared image' : textOf(shared.meta) || 'Nothing to copy.';
  try {
    await finish(await copy(shared));
  } catch (err) {
    // Browser blocked the write without a user gesture: ask for one tap.
    copyBtn.hidden = false;
    copyBtn.onclick = async () => {
      try { await finish(await copy(shared)); }
      catch (e) { statusEl.textContent = 'Copy failed: ' + e.message; }
    };
  }
}

main();
