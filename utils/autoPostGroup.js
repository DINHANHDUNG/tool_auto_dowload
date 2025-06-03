import puppeteer from 'puppeteer';
import fs from 'fs-extra';

const COOKIE_PATH = './facebook-cookie.json';
const GROUP_URL = 'https://www.facebook.com/groups/httpswww.facebook.comtuyetbequangchau'; // group của bạn
const IMAGE_PATHS = ['./to_post/demo/1.jpg', './to_post/demo/2.jpg'];
const MESSAGE = '🔥 Auto post từ script Dũng Cháy 🔥';

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load cookie
  const cookies = await fs.readJSON(COOKIE_PATH);
  await page.setCookie(...cookies);

  // Truy cập group
  await page.goto(GROUP_URL, { waitUntil: 'networkidle2' });

  // Chờ hộp post hiện
  await page.waitForSelector('[role="textbox"]', { timeout: 10000 });

  // Click vào textbox và nhập caption
  await page.click('[role="textbox"]');
  await page.keyboard.type(MESSAGE);

  // Upload ảnh
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    page.click('input[type="file"]'), // Có thể cần selector khác tùy cấu trúc group
  ]);
  await fileChooser.accept(IMAGE_PATHS);

  // Chờ nút Đăng xuất hiện
  await page.waitForSelector('[aria-label="Đăng"], [aria-label="Post"]', { timeout: 10000 });

  // Nhấn nút Đăng
  await page.click('[aria-label="Đăng"], [aria-label="Post"]');

  console.log('✅ Đã đăng bài lên group!');
  // await browser.close(); // giữ mở để kiểm tra
}

run();
