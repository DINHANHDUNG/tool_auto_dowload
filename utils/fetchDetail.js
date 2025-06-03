// fetchDetail.js
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

/**
 * Lấy thông tin chi tiết 1 sản phẩm
 * @param {string} goods_id
 * @param {string} shop_id
 * @param {string} albumId
 * @returns {Promise<Object|null>}
 */
export async function fetchProductDetail(goods_id, shop_id, albumId) {
  try {
    const res = await axios.get("https://www.wsxcme.com/commodity/view", {
      params: {
        itemId: goods_id,
        targetAlbumId: albumId,
        t: Date.now(),
      },
      headers: headers,
      timeout: 10000 // ⏱ Timeout sau 10 giây
    });

    const data = res.data?.result?.commodity;
    if (!data) return null;

    return {
      id: data.goods_id || data.goods_id_decode,
      goods_id,
      title: data.title || "",
      code: data.goodsNum || "",
      optimaPrice: data.optimaPrice || "",
      sizes: data.skus?.map((s) => s.name) || [],
      images: data.imgsSrc || data.imgs || [],
      videoUrl: data.videoUrl || "",
      shop_id,
    };
  } catch (err) {
    console.error(`❌ Lỗi lấy chi tiết sản phẩm ${goods_id}:`, err.message);
    return null;
  }
}
