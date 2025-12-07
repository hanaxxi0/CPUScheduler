
// ينسخ dist/index.html إلى dist/404.html ليدعم GitHub Pages مع SPA
import { copyFile } from 'fs/promises';
try {
  await copyFile('dist/index.html', 'dist/404.html');
  console.log('✅ 404.html created from index.html');
} catch (e) {
  console.error('⚠️ Could not create 404.html:', e.message);
}
