/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: lib/api/api.js
 *  MÔ TẢ: Module gọi các API môi trường toàn cầu (CO2, Nhiệt độ, Năng lượng tái tạo)
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. Định nghĩa kiểu dữ liệu DashboardData bằng JSDoc.
 *  2. Khởi tạo dữ liệu dự phòng FALLBACK_DATA phòng khi các API gặp sự cố.
 *  3. Hàm fetchDashboardData() gọi song song/lần lượt các API công khai:
 *     - global-warming.org/api/co2-api (Nồng độ CO2 khí quyển)
 *     - global-warming.org/api/temperature-api (Chỉ số nhiệt độ toàn cầu của NASA)
 *     - api.worldbank.org (Tỷ lệ năng lượng tái tạo từ Ngân hàng Thế giới)
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * @typedef {Object} DashboardData
 * @property {number} globalTemp - Nhiệt độ trung bình toàn cầu thực tế (°C)
 * @property {number} tempChange - Mức độ chênh lệch nhiệt độ so với mốc cơ sở (°C)
 * @property {number} co2 - Nồng độ CO2 hiện tại (ppm)
 * @property {number} aqi - Chỉ số chất lượng không khí tổng quát
 * @property {number} pm25 - Nồng độ bụi mịn PM2.5 (µg/m³)
 * @property {number} pm10 - Nồng độ bụi thô PM10 (µg/m³)
 * @property {number} renewableRate - Tỷ lệ năng lượng tái tạo (%)
 * @property {{year: string, value: number}[]} carbonHistory - Mảng lịch sử nồng độ CO2 qua các năm/tháng
 * @property {{year: string, value: number}[]} renewableHistory - Mảng lịch sử tỷ lệ năng lượng tái tạo qua các năm
 * @property {{title: string, url: string, source: string}[]} news - Danh sách bài báo tin tức môi trường
 * @property {string} updatedAt - Thời gian cập nhật dữ liệu (ISO String)
 */

// Dữ liệu dự phòng chất lượng cao (Fallback Data)
const FALLBACK_DATA = {
  globalTemp: 14.5,
  tempChange: 0.9,
  co2: 421.7,
  aqi: 33,
  pm25: 12.5,
  pm10: 25.0,
  renewableRate: 15,
  carbonHistory: [
    { year: '2018', value: 11800 },
    { year: '2019', value: 10200 },
    { year: '2020', value: 9000 },
    { year: '2021', value: 7500 },
    { year: '2022', value: 6200 },
    { year: '2023', value: 5000 },
  ],
  renewableHistory: [
    { year: '2018', value: 2 },
    { year: '2020', value: 5 },
    { year: '2022', value: 10 },
    { year: '2023', value: 15 },
  ],
  news: [
    { title: "Năng lượng tái tạo đang trở thành xu hướng chính toàn cầu", url: "#", source: "EcoNews" },
    { title: "Lượng phát thải CO2 đạt mức thấp kỷ lục tại châu Âu", url: "#", source: "Green Daily" },
    { title: "Hội nghị chống biến đổi khí hậu công bố mục tiêu mới", url: "#", source: "World Update" },
    { title: "Phát triển bền vững: Ưu tiên hàng đầu của doanh nghiệp", url: "#", source: "BizEco" }
  ],
  updatedAt: new Date().toISOString()
};

/**
 * fetchDashboardData(): Gọi các API bất đồng bộ để lấy dữ liệu thực tế.
 * - Sử dụng try-catch cho từng API để tránh lỗi dây chuyền (nếu 1 API sập, các API khác vẫn chạy).
 * - Sử dụng bản sao dữ liệu FALLBACK_DATA làm gốc để ghi đè dần khi fetch thành công.
 * 
 * @returns {Promise<DashboardData>}
 */
export async function fetchDashboardData() {
  // Deep clone dữ liệu dự phòng để đảm bảo tính an toàn dữ liệu
  const data = JSON.parse(JSON.stringify(FALLBACK_DATA));

  try {
    // ════ 1. API NỒNG ĐỘ CO2 (global-warming.org) ════
    try {
      const co2Res = await fetch('https://global-warming.org/api/co2-api');
      if (co2Res.ok) {
        const co2Json = await co2Res.json();
        if (co2Json.co2 && co2Json.co2.length > 0) {
          // Lấy giá trị xu hướng mới nhất ở cuối mảng
          data.co2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);
          
          // Lọc dữ liệu lịch sử CO2 qua các năm (khoảng cách 12 tháng/năm)
          const history = [];
          for (let i = 1; i <= 6; i++) {
            const yearData = co2Json.co2[co2Json.co2.length - 1 - (i * 12)];
            if (yearData) history.unshift({ year: yearData.year, value: parseFloat(yearData.trend) });
          }
          if (history.length > 0) data.carbonHistory = history;
        }
      }
    } catch (e) { console.warn('Lỗi gọi API CO2:', e); }

    // ════ 2. API NHIỆT ĐỘ TOÀN CẦU (global-warming.org / NASA) ════
    try {
      const tempRes = await fetch('https://global-warming.org/api/temperature-api');
      if (tempRes.ok) {
        const tempJson = await tempRes.json();
        if (tempJson.result && tempJson.result.length > 0) {
          const latest = tempJson.result[tempJson.result.length - 1];
          data.tempChange = parseFloat(latest.land); 
          // Quy đổi mức chênh lệch ra nhiệt độ tuyệt đối toàn cầu (mốc cơ sở 14.0°C)
          data.globalTemp = parseFloat((14.0 + data.tempChange).toFixed(1)); 
        }
      }
    } catch (e) { console.warn('Lỗi gọi API Nhiệt độ:', e); }

    // ════ 3. API NĂNG LƯỢNG TÁI TẠO (Ngân hàng Thế giới - World Bank) ════
    try {
      const wbRes = await fetch('https://api.worldbank.org/v2/country/WLD/indicator/EG.FEC.RNEW.ZS?format=json');
      if (wbRes.ok) {
        const wbJson = await wbRes.json();
        // Cấu trúc World Bank trả về mảng 2 phần tử: [metadata, data_array]
        if (wbJson[1] && wbJson[1].length > 0) {
          const validData = wbJson[1].filter((d) => d.value !== null);
          if (validData.length > 0) {
            data.renewableRate = parseFloat(validData[0].value.toFixed(1));
            data.renewableHistory = validData.slice(0, 4).reverse().map((d) => ({
              year: d.date,
              value: parseFloat(d.value.toFixed(1))
            }));
          }
        }
      }
    } catch (e) { console.warn('Lỗi gọi API World Bank:', e); }

    // Gán nhãn thời điểm cập nhật thành công cuối cùng
    data.updatedAt = new Date().toISOString();
    return data;
  } catch (error) {
    console.error("Lỗi tổng quát khi tải dữ liệu Dashboard:", error);
    return data;
  }
}
