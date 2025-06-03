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

async function cleanMediaPreview(page) {
  let retry = 0;
  while (retry < 5) {
    const found = await page.evaluate(() => {
      const removeButtons = Array.from(
        document.querySelectorAll('[aria-label*="Gỡ"], [aria-label*="Remove"]')
      );
      removeButtons.forEach((btn) => {
        if (btn.offsetParent !== null) btn.click();
      });
      return removeButtons.length;
    });

    if (found === 0) break;
    await new Promise((r) => setTimeout(r, 1500));
    retry++;
  }
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

  // Click mở hộp soạn bài
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("div[role='button']"));
    const target = buttons.find(
      (el) =>
        el.textContent?.includes("Bạn viết gì đi") ||
        el.textContent?.includes("Viết gì đó")
    );
    if (target) target.click();
    return !!target;
  });

  if (!clicked) {
    const msg = `❌ Không tìm thấy nút tạo bài viết: ${caption}`;
    console.log(msg);
    await fs.appendFile(LOG_FILE, msg + "\n");
    return;
  }

  try {
    // Chờ modal tạo bài viết
    await page.waitForSelector('div[aria-label="Tạo bài viết"]', { timeout: 10000 });

    // Xoá media preview nếu có
    await cleanMediaPreview(page);

    // Gõ caption
    const textbox = await page.waitForSelector(
      'div[role="dialog"] div[contenteditable="true"]',
      { timeout: 15000 }
    );
    await textbox.focus();
    await page.keyboard.type(caption);
    await new Promise((r) => setTimeout(r, 1000));

    // Click nút Thêm ảnh/video
    await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll(
          'div[aria-label="Ảnh/video"], div[aria-label="Photo/video"]'
        )
      );
      if (buttons.length > 0) buttons[0].click();
    });

    await new Promise((r) => setTimeout(r, 1500)); // chờ vùng input hiện

    // Chỉ lấy input trong modal (tránh dính ảnh bìa)
    const fileInput = await page.$('div[role="dialog"] input[type="file"][accept*="image"]');
    if (!fileInput) {
      throw new Error("❌ Không tìm thấy input file trong modal tạo bài viết!");
    }

    console.log("🖼️ Uploading files:", mediaPaths);
    await fileInput.uploadFile(...mediaPaths); // ✅ upload tất cả cùng lúc
    await new Promise((r) => setTimeout(r, 4000)); // chờ ảnh render

    // Kiểm tra xem có ảnh hiện ra không
    const previewCount = await page.evaluate(() => {
      return document.querySelectorAll('div[role="dialog"] img').length;
    });

    if (previewCount === 0) {
      const msg = `❌ Không thấy ảnh nào sau upload: ${caption}`;
      console.log(msg);
      await fs.appendFile(LOG_FILE, msg + "\n");
      return;
    }

    // Đợi nút Đăng
    await page.waitForFunction(() => {
      const btn = document.querySelector('[aria-label="Đăng"], [aria-label="Post"]');
      return btn && !btn.disabled;
    }, { timeout: 10000 });

    const postButton = await page.$('[aria-label="Đăng"], [aria-label="Post"]');
    const isDisabled = await page.evaluate(
      (btn) => btn?.hasAttribute("disabled"),
      postButton
    );

    if (postButton && !isDisabled) {
      await postButton.click();
      const successMsg = `✅ Đã đăng bài: ${caption}`;
      console.log(successMsg);
      await fs.appendFile(LOG_FILE, successMsg + "\n");
      await new Promise((r) => setTimeout(r, 5000));
      await fs.remove(folderPath);
    } else {
      const failMsg = `❌ Nút Đăng không khả dụng: ${caption}`;
      console.log(failMsg);
      await fs.appendFile(LOG_FILE, failMsg + "\n");
    }
  } catch (err) {
    const msg = `❌ Lỗi khi đăng bài "${caption}": ${err.message}`;
    console.log(msg);
    await fs.appendFile(LOG_FILE, msg + "\n");
  }
}

// === CHẠY ===
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
