import fs from "fs-extra";
import path from "path";
import axios from "axios";

/**
 * Lưu ảnh và video của sản phẩm vào thư mục tương ứng
 * @param {Object} product
 */
export async function saveProductAssets(product) {
  const { code, optimaPrice, sizes, images, videoUrl, id } = product;

  if (!Array.isArray(images) || images.length === 0) {
    console.warn(`⚠️ Không có ảnh trong sản phẩm ${code || id}`);
    return;
  }

  const uniqueSizes = Array.from(
    new Set(
      (sizes || [])
        .map((s) => {
          const match = s.match(/(S|M|L|XL|XXL|3XL|4XL)/i);
          return match ? match[1].toUpperCase() : null;
        })
        .filter(Boolean)
    )
  );

  const sizeStr = uniqueSizes.join(" ") || "NoSize";
  const realPrice = optimaPrice
    ? Number(optimaPrice) >= 50
      ? Number(optimaPrice) + 20
      : Number(optimaPrice) + 10
    : 20;
  const priceStr = `${realPrice} Tệ`;

  const shortId = id ? id.slice(-6) : "NoCode";
  const now = new Date();
  const timeSuffix = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  const codeStr = code || `ID${shortId}_${timeSuffix}`;

  const baseName = sanitize(`Mã ${codeStr} - ${priceStr} - ${sizeStr}`);
  let dirName = baseName;
  let saveDir = path.join(process.cwd(), "output", dirName);
  let index = 1;

  while (await fs.pathExists(saveDir)) {
    dirName = `${baseName} (${index})`;
    saveDir = path.join(process.cwd(), "output", dirName);
    index++;
  }

  console.log("📁 Đường dẫn thư mục:", saveDir);
  await fs.ensureDir(saveDir);

  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const ext = path.extname(new URL(url).pathname).split("?")[0] || ".jpg";
    const filePath = path.join(saveDir, `img_${i + 1}${ext}`);
    console.log(`⬇️ Tải ảnh ${i + 1}: ${url}`);
    await downloadWithRetry(url, filePath);
  }

  if (videoUrl) {
    const ext =
      path.extname(new URL(videoUrl).pathname).split("?")[0] || ".mp4";
    const videoPath = path.join(saveDir, `video${ext}`);
    console.log(`🎬 Tải video: ${videoUrl}`);
    await downloadWithRetry(videoUrl, videoPath);
  }
}

function sanitize(str) {
  return str
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function downloadWithRetry(url, outputPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await downloadFile(url, outputPath);
      return;
    } catch (e) {
      console.error(`❌ Lỗi tải file lần ${attempt}: ${url}`);
      if (attempt === retries) {
        console.error(`⛔ Bỏ qua file sau ${retries} lần thất bại.`);
      } else {
        console.log("🔁 Thử lại...");
        await wait(1000);
      }
    }
  }
}

async function downloadFile(url, outputPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const res = await axios.get(url, {
    responseType: "stream",
    signal: controller.signal,
  });

  clearTimeout(timeout);
  const writer = fs.createWriteStream(outputPath);
  res.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
