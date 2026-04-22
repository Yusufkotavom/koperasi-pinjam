import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const baseUrl = 'https://koperasi-one.vercel.app';
  
  // Ensure screenshot directory exists
  const screenshotDir = path.join(process.cwd(), 'public/docs/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('Logging in...');
  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotDir, 'debug-login-page.png') });
    
    // Check if #email exists
    const emailExists = await page.$('#email');
    if (!emailExists) {
      console.log('Selector #email not found. Current URL:', page.url());
      const content = await page.content();
      console.log('Page content length:', content.length);
    }

    await page.fill('#email', 'admin@koperasi.id');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
  } catch (err) {
    console.error('Error during login:', err.message);
    await page.screenshot({ path: path.join(screenshotDir, 'error-login.png') });
    throw err;
  }

  // Wait for navigation after login
  await page.waitForURL(`${baseUrl}/`, { timeout: 10000 });
  console.log('Logged in successfully');

  const pagesToScreenshot = [
    { name: 'dashboard', url: '/' },
    { name: 'nasabah', url: '/nasabah' },
    { name: 'pengajuan', url: '/pengajuan' },
    { name: 'kas', url: '/kas' },
    { name: 'pembayaran', url: '/pembayaran' },
    { name: 'laporan', url: '/laporan' },
    { name: 'settings', url: '/settings' },
  ];

  for (const p of pagesToScreenshot) {
    console.log(`Capturing ${p.name}...`);
    await page.goto(`${baseUrl}${p.url}`);
    // Wait for content to load
    await page.waitForTimeout(2000); 
    await page.screenshot({ path: path.join(screenshotDir, `${p.name}.png`), fullPage: false });
  }

  await browser.close();
  console.log('Screenshots captured successfully!');
}

run().catch(console.error);
