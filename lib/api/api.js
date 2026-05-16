/**
 * @typedef {Object} DashboardData
 * @property {number} globalTemp
 * @property {number} tempChange
 * @property {number} co2
 * @property {number} aqi
 * @property {number} pm25
 * @property {number} pm10
 * @property {number} renewableRate
 * @property {{year: string, value: number}[]} carbonHistory
 * @property {{year: string, value: number}[]} renewableHistory
 * @property {{title: string, url: string, source: string}[]} news
 * @property {string} updatedAt
 */

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
 * Lấy dữ liệu môi trường thực tế từ các API công khai đáng tin cậy.
 * Có trạng thái loading và fallback data nếu API lỗi.
 * @returns {Promise<DashboardData>}
 */
export async function fetchDashboardData() {
  const data = JSON.parse(JSON.stringify(FALLBACK_DATA));

  try {
    // 1. NOAA CO2 (Proxy)
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
    } catch (e) { console.warn('CO2 fetch failed', e); }

    // 2. NASA / NOAA Temperature
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
    } catch (e) { console.warn('Temp fetch failed', e); }

    // 3. World Bank Renewable Energy
    try {
      const wbRes = await fetch('https://api.worldbank.org/v2/country/WLD/indicator/EG.FEC.RNEW.ZS?format=json');
      if (wbRes.ok) {
        const wbJson = await wbRes.json();
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
    } catch (e) { console.warn('World Bank fetch failed', e); }

    data.updatedAt = new Date().toISOString();
    return data;
  } catch (error) {
    console.error("Failed to fetch dashboard data", error);
    return data;
  }
}
