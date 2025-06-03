// autoPostGroup.js

import puppeteer from "puppeteer";
import fs from "fs-extra";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COOKIE_PATH = "./facebook-cookie.json";
const GROUP_URL =
  "https://www.facebook.com/groups/httpswww.facebook.comtuyetbequangchau";
const ROOT_FOLDER = path.join(__dirname, "output");
const LOG_FILE = "./post-log.txt";

function randomDelay(min = 5000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function loadCookies(page) {
  const cookies = await fs.readJSON(COOKIE_PATH);
  await page.setCookie(...cookies);
}

async function postToGroup(page, folderPath, caption) {
  const files = await fs.readdir(folderPath);
  const mediaPaths = files
    .filter((f) => /\.(jpg|jpeg|png|gif|mp4|mov)$/i.test(f))
    .map((f) => path.join(folderPath, f));

  if (mediaPaths.length === 0) {
    const msg = `⚠️ Không tìm thấy ảnh/video trong thư mục: ${caption}`;
    console.log(msg);
    await fs.appendFile(LOG_FILE, msg + "\n");
    return;
  }

  await page.goto(GROUP_URL, { waitUntil: "networkidle2" });

  const clicked = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    const target = spans.find(
      (el) =>
        el.textContent?.includes("Bạn viết gì đi") ||
        el.textContent?.includes("Viết gì đó")
    );
    if (target) {
      target.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    const msg = `❌ Không tìm thấy nút tạo bài viết: ${caption}`;
    console.log(msg);
    await fs.appendFile(LOG_FILE, msg + "\n");
    return;
  }

  try {
    await page.waitForSelector('div[aria-label="Tạo bài viết"]', {
      timeout: 15000,
    });
    const textbox = await page.waitForSelector(
      'div[role="dialog"] div[contenteditable="true"]',
      { timeout: 15000 }
    );
    await textbox.focus();
    await page.keyboard.type(caption);
    await new Promise((r) => setTimeout(r, 1000));

    // Click nút thêm ảnh/video
    await page.evaluate(() => {
      const icons = Array.from(
        document.querySelectorAll(
          'div[aria-label="Ảnh/video"], div[aria-label="Photo/video"]'
        )
      );
      if (icons.length > 0) icons[0].click();
    });

    // Đợi input file xuất hiện và upload ảnh
    for (const file of mediaPaths) {
      const input = await page.waitForSelector(
        'div[role="dialog"] input[type="file"][accept*="image"]',
        { timeout: 15000 }
      );
      await input.uploadFile(file);
      await new Promise((r) => setTimeout(r, 1000)); // Delay để ảnh load xong
    }

    // Đợi nút đăng bật lên
    await page.waitForFunction(
      () => {
        const btn = document.querySelector(
          '[aria-label="Đăng"], [aria-label="Post"]'
        );
        return btn && !btn.disabled;
      },
      { timeout: 10000 }
    );

    await new Promise((r) => setTimeout(r, 4000)); // Delay thêm chút để ảnh load xong

    const postButton = await page.$('[aria-label="Đăng"], [aria-label="Post"]');
    const isDisabled = await page.evaluate(
      (button) => button?.hasAttribute("disabled"),
      postButton
    );

    if (postButton && !isDisabled) {
      await postButton.click();
      const successMsg = `✅ Đã đăng bài: ${caption}`;
      console.log(successMsg);
      await fs.appendFile(LOG_FILE, successMsg + "\n");
      await new Promise((r) => setTimeout(r, 5000));
      await fs.remove(folderPath); // Xóa thư mục sau khi post thành công
    } else {
      const failMsg = `❌ Không thể đăng bài hoặc nút Đăng bị vô hiệu: ${caption}`;
      console.log(failMsg);
      await fs.appendFile(LOG_FILE, failMsg + "\n");
    }
  } catch (err) {
    const msg = `❌ Lỗi khi đăng bài "${caption}": ${err.message}`;
    console.log(msg);
    await fs.appendFile(LOG_FILE, msg + "\n");
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await loadCookies(page);

  const folders = await fs.readdir(ROOT_FOLDER);
  for (const folder of folders) {
    const fullPath = path.join(ROOT_FOLDER, folder);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await postToGroup(page, fullPath, folder);
      const delay = randomDelay();
      console.log(`⏱️ Đợi ${delay / 1000}s trước bài tiếp theo...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.log("🎉 Đã hoàn tất việc đăng toàn bộ bài.");
})();
