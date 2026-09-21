// Run from apps/web: node tests/viewerToolGuides.browser.mjs
// Uses an isolated Chrome profile and real sidebar/tour components; no auth/API/Cesium.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { PotreeSidebar } from '/src/components/Map/PotreeSidebar.tsx';
import { DemoViewerTour } from '/src/components/Map/DemoViewerTour.tsx';
import '/src/index.css';
const root = createRoot(document.getElementById('root'));
const toolAction = () => { window.toolCalls++; };
window.toolCalls = 0;
window.mount = (demo = true) => root.render(<PotreeSidebar
  enableToolGuides={demo} projectName="Demo test" currentMode="none"
  headerAction={demo ? <DemoViewerTour onOpenSidebar={() => {}} /> : null}
  onModeChange={toolAction} onClear={toolAction} onClipTool={toolAction} onNavigationAction={toolAction}
  setShowModel={toolAction} setShowDom={toolAction} setShowPointCloud={toolAction}
  showModel={true} showDom={true} showPointCloud={false}
  modelOpacity={1} domOpacity={1} pointCloudOpacity={1} pointSize={1} fov={60}
  heatmapEnabled={false} heatmapProperty="height" heatmapMax={10} heatmapRangeAvailable={false}
  edlEnabled={false} edlRadius={1} edlStrength={1} edlOpacity={1}
  background="sky" quality="standard" pointBudget={1000000} minNodeSize={30}
/>);
window.mount();
`;
const result = await build({ root, configFile: false, logLevel: 'error', plugins: [tailwindcss(), {
  name: 'tool-guide-browser-fixture',
  resolveId(id) { if (id === 'tool-guide-fixture') return '\0tool-guide-fixture.jsx'; },
  load(id) { if (id === '\0tool-guide-fixture.jsx') return entry; }
}], build: { write: false, minify: false, rollupOptions: { input: 'tool-guide-fixture' } } });
const output = result.output;
const js = output.find(item => item.type === 'chunk' && item.isEntry).code;
const css = output.filter(item => item.type === 'asset' && item.fileName.endsWith('.css')).map(item => item.source).join('\n');
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/entry.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/entry.js' ? js : `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script type="module" src="/entry.js"></script></body></html>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(path.join(tmpdir(), 'viewer-tool-guides-'));
const executable = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome');
const chrome = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-pipe', `--user-data-dir=${profile}`, 'about:blank'],
{ windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '', sessionId;
const pending = new Map();
const exceptions = [];
chrome.stdio[4].on('data', chunk => {
  buffer += chunk.toString();
  let end;
  while ((end = buffer.indexOf('\0')) !== -1) {
    const message = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timeout);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  }
});
chrome.on('error', error => { for (const item of pending.values()) { clearTimeout(item.timeout); item.reject(error); } pending.clear(); });
const send = (method, params = {}, session = sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 8000);
  pending.set(id, { resolve, reject, timeout });
  chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(session ? { sessionId: session } : {}) }) + '\0');
});
const evaluate = async expression => {
  const data = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.equal(data.exceptionDetails, undefined, JSON.stringify(data.exceptionDetails));
  return data.result.value;
};
const wait = async expression => {
  for (let i = 0; i < 80; i++) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out: ${expression}\n${JSON.stringify(exceptions)}`);
};
const click = label => evaluate(`Array.from(document.querySelectorAll('.viewer-tool-guide button')).find(b => b.textContent === ${JSON.stringify(label)}).click()`);
const openGroup = async group => {
  await evaluate(`document.querySelector('[data-guide-open="${group}"]').click()`);
  await wait(`!!document.querySelector('[data-guide="${group}"]')`);
};
const storageKey = '3dmapping.demoTour.v1.completed';
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  sessionId = (await send('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}` });
  await wait(`!!document.querySelector('#demo-tour-title')`);
  assert.equal(await evaluate(`!!document.querySelector('[data-guide]')`), false, 'mini-guides never auto-open');
  await evaluate(`document.querySelectorAll('[data-guide-open]').forEach(button => button.click())`);
  assert.equal(await evaluate(`!!document.querySelector('[data-guide]')`), false, 'overview welcome blocks every mini-guide trigger');
  await evaluate(`Array.from(document.querySelectorAll('.demo-tour button')).find(b => b.textContent === 'Bỏ qua').click()`);
  await wait(`!document.querySelector('.demo-tour')`);
  assert.equal(await evaluate(`localStorage.getItem('${storageKey}')`), '1');
  const checkHighlight = async target => {
    await wait(`document.querySelector('[data-guide-highlight]')?.getAttribute('data-guide-highlight') === '${target}'`);
    assert.equal(await evaluate(`document.querySelectorAll('[data-guide-highlight]').length`), 1);
    const geometry = await evaluate(`(() => {
      const t = document.querySelector('[data-tool-guide="${target}"]').getBoundingClientRect();
      const h = document.querySelector('[data-guide-highlight]').getBoundingClientRect();
      const c = document.querySelector('.viewer-tool-guide__card').getBoundingClientRect();
      return { same: Math.abs(t.left-h.left)<1 && Math.abs(t.top-h.top)<1 && Math.abs(t.width-h.width)<1 && Math.abs(t.height-h.height)<1,
        overlap: Math.max(0,Math.min(c.right,h.right)-Math.max(c.left,h.left))*Math.max(0,Math.min(c.bottom,h.bottom)-Math.max(c.top,h.top)),
        x:t.left+t.width/2, y:t.top+t.height/2,
        cardInViewport:c.left>=0 && c.right<=innerWidth && c.top>=0 && c.bottom<=innerHeight,
        maskHoles:document.querySelectorAll('.viewer-tool-guide__mask mask rect[fill="black"]').length };
    })()`);
    assert.ok(geometry.same, `highlight matches exact control ${target}`);
    assert.equal(geometry.overlap, 0, `card avoids ${target}`);
    assert.ok(geometry.cardInViewport);
    assert.equal(geometry.maskHoles, 1, 'only one undimmed target');
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: geometry.x, y: geometry.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: geometry.x, y: geometry.y, button: 'left', clickCount: 1 });
    assert.equal(await evaluate('window.toolCalls'), 0, 'spotlight does not activate real control');
  };
  const measurementTargets = ['measure-angle','measure-point','measure-distance','measure-height','measure-circle','measure-azimuth','measure-area','measure-volume','measure-sphere','measure-profile','measure-cutFill','measure-crossSection','measure-annotation','measure-issue','measure-clear'];
  const measurementTitles = ['Góc','Điểm','Cự ly','Cao độ','Đường tròn','Phương vị','Diện tích','Thể tích','Sphere','Trắc dọc','Đào / Đắp','Trắc ngang','Ghi chú','Vấn đề','Xóa'];
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[data-tour="measurement-tools"] button[data-tool-guide]')).map(b => b.getAttribute('data-tool-guide'))`), measurementTargets, 'all 15 measurement buttons in UI order');
  const checkMeasurementTitle = async index => {
    assert.equal(await evaluate(`document.querySelector('.viewer-tool-guide h2')?.textContent`), `ĐO ĐẠC · ${measurementTitles[index]}`);
  };
  for (const [group, targets] of [
    ['measurement', measurementTargets],
    ['clipping', ['clip-box','clip-polygon','clip-plane','clip-inside','clip-outside','clip-clear']],
    ['navigation', ['navigation-earth','navigation-fps','navigation-orbit','navigation-focus','navigation-cube','navigation-anim']],
    ['display', ['layer-pointcloud','layer-model','layer-dom','layer-model-opacity','layer-model']]
  ]) {
    const total = targets.length;
    await openGroup(group);
    for (let i = 1; i <= total; i++) {
      await wait(`document.querySelector('.viewer-tool-guide__step')?.textContent.startsWith('Bước ${i} / ${total}')`);
      await checkHighlight(targets[i - 1]);
      if (group === 'measurement') await checkMeasurementTitle(i - 1);
      if (i < total) await click('Tiếp');
    }
    for (let i = total - 1; i >= 1; i--) {
      await click('Trước');
      await wait(`document.querySelector('.viewer-tool-guide__step')?.textContent.startsWith('Bước ${i} / ${total}')`);
      await checkHighlight(targets[i - 1]);
      if (group === 'measurement') await checkMeasurementTitle(i - 1);
    }
    await click('Đóng');
    await wait(`!document.querySelector('[data-guide]')`);
    assert.equal(await evaluate(`document.querySelectorAll('[data-guide-highlight], .viewer-tool-guide__mask').length`), 0);
    assert.equal(await evaluate(`document.activeElement?.getAttribute('data-guide-open')`), group);
    assert.equal(await evaluate(`localStorage.getItem('${storageKey}')`), '1');
  }
  await evaluate(`localStorage.removeItem('${storageKey}')`);
  await openGroup('measurement');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true });
  await wait(`document.querySelector('.viewer-tool-guide__card').getBoundingClientRect().right <= innerWidth`);
  await checkHighlight('measure-angle');
  await evaluate(`document.querySelector('[data-tool-guide="measure-point"]').style.display = 'none'`);
  await click('Tiếp');
  await checkHighlight('measure-distance');
  await click('Trước');
  await checkHighlight('measure-angle');
  await evaluate(`document.querySelector('[data-tool-guide="measure-angle"]').style.display = 'none'`);
  await wait(`!document.querySelector('[data-guide]')`);
  await evaluate(`document.querySelectorAll('[data-tool-guide^="measure-"]').forEach(t => t.style.removeProperty('display'))`);
  await openGroup('measurement');
  assert.ok(await evaluate(`(() => { const r=document.querySelector('[role="dialog"]').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight; })()`));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(`!document.querySelector('[data-guide]')`);
  assert.equal(await evaluate(`localStorage.getItem('${storageKey}')`), null, 'ESC must not complete the overview');
  await openGroup('measurement');
  await wait(`document.querySelector('.viewer-tool-guide__step')?.textContent.startsWith('Bước 1')`);
  await click('Đóng');
  await evaluate(`window.keysAfterClose=0;window.addEventListener('keydown',()=>window.keysAfterClose++);`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'x', code: 'KeyX' });
  assert.equal(await evaluate('window.keysAfterClose'), 1, 'keyboard listener cleaned up');
  assert.equal(await evaluate('window.toolCalls'), 0, 'guides never invoke tools/layers');
  await evaluate(`
    const toolbar = document.createElement('div');
    toolbar.setAttribute('data-tour', 'display-toolbar');
    toolbar.textContent = 'Toolbar';
    document.body.appendChild(toolbar);
    document.querySelector('[title="Hướng dẫn sử dụng"]').click();
  `);
  await wait(`!!document.querySelector('[data-tour-overview="open"]')`);
  await evaluate(`Array.from(document.querySelectorAll('[data-tour-overview] button')).find(b => b.textContent === 'Bắt đầu hướng dẫn').click()`);
  for (let step = 1; step <= 6; step++) {
    await wait(`document.querySelector('[data-tour-overview] .demo-tour__counter')?.textContent === 'Bước ${step} / 6'`);
    await evaluate(`document.querySelectorAll('[data-guide-open]').forEach(button => button.click())`);
    assert.equal(await evaluate(`!!document.querySelector('[data-guide]')`), false, `overview step ${step} blocks mini-guides`);
    if (step < 6) await evaluate(`Array.from(document.querySelectorAll('[data-tour-overview] button')).find(b => b.textContent === 'Tiếp').click()`);
  }
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('[data-tour-overview] button')).map(b => b.textContent)`), ['Trước', 'Hoàn tất']);
  await evaluate(`Array.from(document.querySelectorAll('[data-tour-overview] button')).find(b => b.textContent === 'Hoàn tất').click()`);
  await wait(`!document.querySelector('[data-tour-overview]')`);
  assert.equal(await evaluate(`localStorage.getItem('${storageKey}')`), '1');
  await openGroup('measurement');
  await click('Đóng');
  await wait(`!document.querySelector('[data-guide]')`);
  await evaluate(`window.mount(false)`);
  await wait(`!document.querySelector('[data-guide-open]')`);
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions));
  console.log('PASS: one exact tool spotlight per step; Next/Previous; missing/removed target; viewport/card placement; real clicks blocked; highlight cleanup; overview/localStorage unchanged.');
} finally {
  await send('Browser.close', {}, null).catch(() => {});
  chrome.kill();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  // Only remove the isolated profile created by this test, after verifying its parent/prefix.
  if (path.dirname(path.resolve(profile)) === path.resolve(tmpdir()) && path.basename(profile).startsWith('viewer-tool-guides-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {});
  }
}
