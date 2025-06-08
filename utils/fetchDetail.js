// fetchDetail.js
import axios from "axios";

const headers = {
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Referer: "https://www.wsxcme.com/weshop/store/A202410282001227512002187",
  Origin: "https://www.wsxcme.com",
  // 'wego-albumid': '_dqHqHJE_1t1Hu7o3UpwfxiYbA80Wyx_pbHLA2Qg',
  Cookie:
    "googtrans=/zh-CN/en; googtrans=/zh-CN/en; client_type=net; token=NEI4Mjk3ODgyNDYwQ0Y3NDI0NDc2RDYzNUNBODc1MDJEM0Q1NEY2QzMzNjI2NjUyNTUyOEJFMDk4N0REOTgwRkI0MkNEMDlFMzBERUFDMzNGQzg4MjdFMTA0MkEyMkM2MDA1RjEyM0ZGQzM1REQ2MjkwQjNBNjkxRERDQjkzODc=; producte_run_to_dev_tomcat=; JSESSIONID=6C4CEFB6749BFD049BEE24E4B68BB5F9", // Bạn dán đúng token và cookie bạn đang dùng
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
