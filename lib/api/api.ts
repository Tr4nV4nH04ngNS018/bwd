/**
 * ═══════════════════════════════════════════════════════════════════════
 *  FILE: lib/api/api.ts
 *  MÔ TẢ: File định nghĩa TypeScript và hàm gọi các API môi trường toàn cầu
 *  
 *  CÁC CHỨC NĂNG CHÍNH:
 *  1. Định nghĩa interface DashboardData cho TypeScript kiểm soát kiểu chặt chẽ.
 *  2. Khởi tạo dữ liệu dự phòng FALLBACK_DATA.
 *  3. Hàm fetchDashboardData() gọi các API sau:
 *     - global-warming.org/api/co2-api (CO2)
 *     - global-warming.org/api/temperature-api (Nhiệt độ)
 *     - api.worldbank.org (Năng lượng tái tạo)
 *     - api.openweathermap.org (Chất lượng không khí - AQI, PM2.5, PM10)
 *     - newsapi.org (Tin tức môi trường)
 * ═══════════════════════════════════════════════════════════════════════
 */

export interface DashboardData {
  globalTemp: number;                            // Nhiệt độ trung bình toàn cầu thực tế (°C)
  tempChange: number;                            // Mức độ chênh lệch nhiệt độ so với mốc cơ sở (°C)
  co2: number;                                   // Nồng độ CO2 hiện tại (ppm)
  aqi: number;                                   // Chỉ số chất lượng không khí tổng quát
  pm25: number;                                  // Nồng độ bụi mịn PM2.5 (µg/m³)
  pm10: number;                                  // Nồng độ bụi thô PM10 (µg/m³)
  renewableRate: number;                         // Tỷ lệ năng lượng tái tạo (%)
  carbonHistory: { year: string; value: number }[]; // Lịch sử CO2 qua các năm/tháng
  renewableHistory: { year: string; value: number }[]; // Lịch sử tỷ lệ năng lượng tái tạo qua các năm
  news: { title: string; url: string; source: string; }[]; // Danh sách bài báo tin tức môi trường
  updatedAt: string;                             // Thời gian cập nhật dữ liệu (ISO String)
}

// Dữ liệu dự phòng (Fallback Data) tuân thủ interface DashboardData
const FALLBACK_DATA: DashboardData = {
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
 * fetchDashboardData(): Hàm bất đồng bộ gọi API thực tế và trả về Promise<DashboardData>.
 * - Đọc API key từ biến môi trường (process.env).
 * - Sử dụng try-catch riêng biệt cho từng khối gọi API để đảm bảo tính sẵn sàng cao.
 * 
 * @returns {Promise<DashboardData>}
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  // Bản sao dữ liệu fallback làm nền tảng
  const data = { ...FALLBACK_DATA };

  try {
    // Đọc API Keys từ môi trường hệ thống
    const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || '';
    const NEWS_KEY = process.env.NEWS_API_KEY || '';
    
    // ════ 1. API NỒNG ĐỘ CO2 (global-warming.org làm Proxy) ════
    try {
      const co2Res = await fetch('https://global-warming.org/api/co2-api');
      if (co2Res.ok) {
        const co2Json = await co2Res.json();
        if (co2Json.co2 && co2Json.co2.length > 0) {
          data.co2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);
          
          const history = [];
          for (let i = 1; i <= 6; i++) {
            const yearData = co2Json.co2[co2Json.co2.length - 1 - (i * 12)];
            if (yearData) history.unshift({ year: yearData.year, value: parseFloat(yearData.trend) });
          }
          if (history.length > 0) data.carbonHistory = history;
        }
      }
    } catch (e) { console.warn('Lỗi fetch CO2:', e); }

    // ════ 2. API NHIỆT ĐỘ TOÀN CẦU (global-warming.org / NASA) ════
    try {
      const tempRes = await fetch('https://global-warming.org/api/temperature-api');
      if (tempRes.ok) {
        const tempJson = await tempRes.json();
        if (tempJson.result && tempJson.result.length > 0) {
          const latest = tempJson.result[tempJson.result.length - 1];
          data.tempChange = parseFloat(latest.land); 
          data.globalTemp = parseFloat((14.0 + data.tempChange).toFixed(1)); 
        }
      }
    } catch (e) { console.warn('Lỗi fetch Nhiệt độ:', e); }

    // ════ 3. API NĂNG LƯỢNG TÁI TẠO (World Bank) ════
    try {
      const wbRes = await fetch('https://api.worldbank.org/v2/country/WLD/indicator/EG.FEC.RNEW.ZS?format=json');
      if (wbRes.ok) {
        const wbJson = await wbRes.json();
        if (wbJson[1] && wbJson[1].length > 0) {
          const validData = wbJson[1].filter((d: any) => d.value !== null);
          if (validData.length > 0) {
            data.renewableRate = parseFloat(validData[0].value.toFixed(1));
            data.renewableHistory = validData.slice(0, 4).reverse().map((d: any) => ({
              year: d.date,
              value: parseFloat(d.value.toFixed(1))
            }));
          }
        }
      }
    } catch (e) { console.warn('Lỗi fetch World Bank:', e); }

    // ════ 4. API CHẤT LƯỢNG KHÔNG KHÍ (OpenWeather - AQI, PM2.5, PM10) ════
    try {
      if (OPENWEATHER_KEY) {
        // Gọi API chất lượng không khí tại Hà Nội (vĩ độ: 21.0285, kinh độ: 105.8542)
        const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=21.0285&lon=105.8542&appid=${OPENWEATHER_KEY}`);
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          const item = aqiJson.list[0];
          data.aqi = item.main.aqi; 
          data.pm25 = item.components.pm2_5;
          data.pm10 = item.components.pm10;
        }
      }
    } catch (e) { console.warn('Lỗi fetch AQI OpenWeather:', e); }

    // ════ 5. API TIN TỨC MÔI TRƯỜNG (NewsAPI) ════
    try {
      if (NEWS_KEY) {
        // Lấy 5 tin tức tiếng Việt hoặc liên quan đến biến đổi khí hậu/năng lượng tái tạo
        const newsRes = await fetch(`https://newsapi.org/v2/everything?q=climate+change+OR+renewable+energy&language=vi&sortBy=publishedAt&apiKey=${NEWS_KEY}`);
        if (newsRes.ok) {
          const newsJson = await newsRes.json();
          if (newsJson.articles && newsJson.articles.length > 0) {
            data.news = newsJson.articles.slice(0, 5).map((a: any) => ({
              title: a.title,
              url: a.url,
              source: a.source.name
            }));
          }
        }
      }
    } catch (e) { console.warn('Lỗi fetch NewsAPI:', e); }

    // Cập nhật mốc thời gian ISO cập nhật thành công cuối cùng
    data.updatedAt = new Date().toISOString();
    return data;
  } catch (error) {
    console.error("Lỗi tổng quát khi tải dữ liệu Dashboard (TS):", error);
    return data;
  }
}
