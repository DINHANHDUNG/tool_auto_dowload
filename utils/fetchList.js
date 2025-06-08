// utils/fetchList.js
import axios from "axios";

const headers = {
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Referer: "https://www.wsxcme.com/weshop/store/A202410282001227512002187",
  Origin: "https://www.wsxcme.com",
  Cookie:
    "googtrans=/zh-CN/en; googtrans=/zh-CN/en; client_type=net; token=NEI4Mjk3ODgyNDYwQ0Y3NDI0NDc2RDYzNUNBODc1MDJEM0Q1NEY2QzMzNjI2NjUyNTUyOEJFMDk4N0REOTgwRkI0MkNEMDlFMzBERUFDMzNGQzg4MjdFMTA0MkEyMkM2MDA1RjEyM0ZGQzM1REQ2MjkwQjNBNjkxRERDQjkzODc=; producte_run_to_dev_tomcat=; JSESSIONID=6C4CEFB6749BFD049BEE24E4B68BB5F9", // Bạn dán đúng token và cookie bạn đang dùng
};

const BASE_URL = "https://www.wsxcme.com/album/personal/all";

/**
 * Lấy danh sách sản phẩm từ 1 album
 * @param {string} albumId
 * @param {number} maxTries - số lần thử giới hạn (để tránh lặp vô tận nếu server chơi kỳ)
 */
export async function getAllProductItems(albumId) {
  const allItemsMap = new Map();
  let pageTimestamp = "";
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    // const url = `${BASE_URL}?albumId=${albumId}&slipType=1&requestDataType=`;
    const url = `${BASE_URL}?isFilter=true&albumId=${albumId}&slipType=1&requestDataType=`;

    const params = {};
    if (page > 1 && pageTimestamp) {
      params.timestamp = pageTimestamp;
    }

    try {
      const res = await axios.post(
        url,
        {},
        {
          headers: headers,
          params,
        }
      );

      const result = res?.data?.result;
      const items = result?.items || [];
      const pagination = result?.pagination;

      console.log(
        `📥 Offset trang ${page++} ➝ có ${
          items.length
        } sản phẩm, ${pageTimestamp}`
      );

      if (items.length === 0) {
        console.log("⛔ Không còn sản phẩm, kết thúc.");
        break;
      }

      for (const item of items) {
        const id =
          item.goods_id ||
          item.selfGoodsId ||
          item.id ||
          item.code ||
          item.goodsNum;
        if (!allItemsMap.has(id)) {
          allItemsMap.set(id, item);
        }
      }

      hasMore = pagination?.isLoadMore;
      pageTimestamp = pagination?.pageTimestamp;
    } catch (error) {
      console.error(`❌ Lỗi trang ${page}:`, error.message);
      hasMore = false;
    }
  }

  return Array.from(allItemsMap.values());
}
