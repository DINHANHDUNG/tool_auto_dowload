import { getAllProductItems } from "./utils/fetchList.js";
import { fetchProductDetail } from "./utils/fetchDetail.js";
import { saveProductAssets } from "./utils/save.js";

const albumId = "A202410282001227512002187";
const targetAlbumId = "_dlFqf6WDaj_CCoLc_x-6L8vYUYuws-URg4edCYw";

async function main() {
  const start = Date.now();
  console.log(`🚀 Bắt đầu thu thập sản phẩm từ album: ${albumId}`);

  const productList = await getAllProductItems(albumId);
  console.log(`📦 Tổng cộng ${productList.length} sản phẩm.`);

  for (const [index, product] of productList.entries()) {
    console.log(
      `🔍 [${index + 1}/${productList.length}] Lấy chi tiết sản phẩm: ${
        product.goods_id
      }`
    );
    try {
      const detail = await fetchProductDetail(
        product.goods_id,
        product.shop_id,
        targetAlbumId
      );
      if (!detail) {
        console.warn(`⚠️ Không có chi tiết sản phẩm: ${product.goods_id}`);
        continue;
      }

      await saveProductAssets(detail);
    } catch (error) {
      console.error(`❌ Lỗi sản phẩm ${product.goods_id}:`, error.message);
      logErrorToFile(`Sản phẩm ${product.goods_id} - ${error.message}`);
    }
  }

  const end = Date.now();
  console.log(
    `✅ Hoàn tất! ⏱️ Tổng thời gian: ${Math.round((end - start) / 1000)}s`
  );
}

main().catch((err) => {
  console.error("💥 Lỗi toàn cục:", err.message);
});

function logErrorToFile(msg) {
  fs.appendFileSync("errors.log", `${new Date().toISOString()} - ${msg}\n`);
}
