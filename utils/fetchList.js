// utils/fetchList.js
import axios from "axios";

const headers = {
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Referer: "https://www.wsxcme.com/weshop/store/A202410282001227512002187",
  Origin: "https://www.wsxcme.com",
  Cookie:
    "googtrans=/zh-CN/en; googtrans=/zh-CN/en; client_type=net; token=Mzk4MDk3Q0E5RTZCN0I1MkYwMTYwNDlCQUNFNkQ5QzVFOEZCOTI1OEEwOTA2MDc0QzUzRTVCNDVDMTg1RTgzRTZBNTY1MTZDQTNFNDFCRkI2ODZGRTgxRjQxRDU3MEZD; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22A202505281059203152002637%22%2C%22first_id%22%3A%2219714c8975e12fa-04166786133e7-19525636-2073600-19714c8975f25ad%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E5%BC%95%E8%8D%90%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC%22%2C%22%24latest_referrer%22%3A%22https%3A%2F%2Fchat.zalo.me%2F%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfbG9naW5faWQiOiJBMjAyNTA1MjgxMDU5MjAzMTUyMDAyNjM3IiwiJGlkZW50aXR5X2Nvb2tpZV9pZCI6IjE5NzE0Yzg5NzVlMTJmYS0wNDE2Njc4NjEzM2U3LTE5NTI1NjM2LTIwNzM2MDAtMTk3MTRjODk3NWYyNWFkIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%22A202505281059203152002637%22%7D%2C%22%24device_id%22%3A%2219714c8975e12fa-04166786133e7-19525636-2073600-19714c8975f25ad%22%7D; producte_run_to_dev_tomcat=; JSESSIONID=6C4CEFB6749BFD049BEE24E4B68BB5F9", // Bạn dán đúng token và cookie bạn đang dùng
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
    const url = `https://www.wsxcme.com/album/personal/all?albumId=${albumId}&slipType=1&requestDataType=`;

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
