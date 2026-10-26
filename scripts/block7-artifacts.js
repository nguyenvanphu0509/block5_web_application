import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const folder = resolve('artifacts/block7');
const receipt = JSON.parse(await readFile(`${folder}/supabase-verification.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  // Report visibly identifies its origin; it does not imitate the Supabase dashboard.
  await page.setContent(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Block 7 · Supabase SQL evidence</title><style>body{font:20px system-ui;background:#f2f5f1;color:#18392e;padding:50px}article{background:white;padding:40px;border-radius:22px}h1{font-size:36px}pre{background:#ecf2ed;padding:22px;font:19px monospace;white-space:pre-wrap}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:16px;border-bottom:1px solid #ccd8cd}small{color:#52695f}strong{font-size:44px}</style><article><small>BLOCK 7 · KẾT QUẢ TRUY VẤN SQL TRỰC TIẾP SUPABASE</small><h1>1.089 món ăn · 1.000 món demo</h1><p>Đây là báo cáo từ kết quả PostgreSQL; không phải ảnh dashboard Supabase.</p><pre>SELECT count(*) AS total,
 count(*) FILTER (WHERE "importKey" LIKE 'block7:demo:%') AS demo
FROM public.dishes;</pre><table><tr><th>total</th><th>demo</th></tr><tr><td><strong>${receipt.counts[0].total}</strong></td><td><strong>${receipt.counts[0].demo}</strong></td></tr></table><p>Seed lần 1: ${receipt.seed.before} → ${receipt.seed.after} món · Thêm ${receipt.seed.inserted} món</p><p>Seed lần 2: ${receipt.repeatSeed.before} → ${receipt.repeatSeed.after} món · Thêm ${receipt.repeatSeed.inserted} món</p><small>Nguồn: supabase-verification.json · ${receipt.at}</small></article></html>`);
  await page.screenshot({ path: `${folder}/supabase-count.png`, fullPage: true });
  const clips = ['01-pages', '02-more', '03-infinite'];
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#18392e;color:white;font:20px system-ui}h1{font-size:22px;margin:0;padding:12px;height:28px}video{width:1280px;height:800px;display:block}</style><h1></h1><video muted playsinline></video><script>
  const clips = ${JSON.stringify(clips)}, labels = ['Số trang · Advanced + sort + Reload', 'Tải thêm · Không lặp món, bỏ response cũ', 'Cuộn vô hạn · Dừng khi hết, xóa điều kiện'];
  let i = 0; const v = document.querySelector('video');
  function play() { if(i === clips.length) { document.body.dataset.done = 'true'; return; } document.querySelector('h1').textContent = 'Block 7 · ' + labels[i]; v.src = clips[i] + '.webm'; v.playbackRate = 1.25; v.play(); }
  v.onended = () => { i++; play(); }; play();
  </script>`;
  await writeFile(`${folder}/demo-playlist.html`, html);
  const context = await browser.newContext({ viewport: { width: 1280, height: 852 }, recordVideo: { dir: `${folder}/combined-recording`, size: { width: 1280, height: 852 } } });
  const demo = await context.newPage();
  await demo.goto(pathToFileURL(`${folder}/demo-playlist.html`).href);
  await demo.waitForFunction(() => document.body.dataset.done === 'true', { timeout: 60000 });
  const video = demo.video(); await context.close();
  await copyFile(await video.path(), `${folder}/demo-pagination.webm`);
} finally { await browser.close(); }
console.log('Created supabase-count.png and demo-pagination.webm');
