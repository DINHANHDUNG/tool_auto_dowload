// save.js
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

const usedDirs = new Map();
const savedHashes = new Set();

/**
 * Lưu ảnh và video của sản phẩm vào thư mục tương ứng
 * @param {Object} product
 */
export async function saveProductAssets(product) {
  const { code, optimaPrice, sizes, images, videoUrl, id } = product;

  // Lấy size duy nhất, chỉ giữ S M L XL XXL...
  const uniqueSizes = Array.from(new Set((sizes || []).map(s => {
    const match = s.match(/(S|M|L|XL|XXL|3XL|4XL)/i);
    return match ? match[1].toUpperCase() : null;
  }).filter(Boolean)));

  const sizeStr = uniqueSizes.join(' ') || 'NoSize';
  const realPrice = optimaPrice
    ? Number(optimaPrice) >= 50
      ? Number(optimaPrice) + 20
      : Number(optimaPrice) + 10
    : 20;
  const priceStr = `${realPrice} Tệ`;

  // Rút gọn id nếu không có code và thêm thời gian tránh trùng tên thư mục
  const shortId = id ? id.slice(-6) : 'NoCode';
  const now = new Date();
  const timeSuffix = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  const codeStr = code || `ID${shortId}_${timeSuffix}`;

  // Tạo tên thư mục cơ bản
  const baseName = sanitize(`Mã ${codeStr} - ${priceStr} - ${sizeStr}`);
  let dirName = baseName;
  let saveDir = path.join(process.cwd(), 'output', dirName);
  let index = 1;

  // Nếu thư mục đã tồn tại thì thêm hậu tố (1), (2), ...
  while (await fs.pathExists(saveDir)) {
    dirName = `${baseName} (${index})`;
    saveDir = path.join(process.cwd(), 'output', dirName);
    index++;
  }

  console.log('📁 Đường dẫn thư mục:', saveDir);
  await fs.ensureDir(saveDir);

  // Tải ảnh
  for (let i = 0; i < images.length; i++) {
    const url = images[i];
    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
    const filePath = path.join(saveDir, `img_${i + 1}${ext}`);
    console.log('🖼 Tải ảnh:', filePath);
    await downloadFile(url, filePath);
  }

  // Tải video nếu có
  if (videoUrl) {
    const ext = path.extname(new URL(videoUrl).pathname).split('?')[0] || '.mp4';
    const videoPath = path.join(saveDir, `video${ext}`);
    console.log('📹 Tải video:', videoPath);
    await downloadFile(videoUrl, videoPath);
  }
}

// Xóa ký tự không hợp lệ khỏi tên file/thư mục
function sanitize(str) {
  return str.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
}

// Tải file từ URL
async function downloadFile(url, outputPath) {
  try {
    const res = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    res.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Lỗi tải file: ${url}`, error.message);
  }
}