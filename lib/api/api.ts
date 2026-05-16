export interface DashboardData {
  globalTemp: number;
  tempChange: number;
  co2: number;
  aqi: number;
  pm25: number;
  pm10: number;
  renewableRate: number;
  carbonHistory: { year: string; value: number }[];
  renewableHistory: { year: string; value: number }[];
  news: { title: string; url: string; source: string; }[];
  updatedAt: string;
}

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
 * Fetches real-time environmental data from reliable public APIs.
 * Includes loading states and fallback data if an API fails or key is missing.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const data = { ...FALLBACK_DATA };

  try {
    // API Keys from environment
    const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY || '';
    const NEWS_KEY = process.env.NEWS_API_KEY || '';
    
    // 1. NOAA CO2 (Using global-warming.org as proxy for NOAA data for easier CORS)
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
    } catch (e) { console.warn('World Bank fetch failed', e); }

    // 4. OpenWeather Air Quality
    try {
      if (OPENWEATHER_KEY) {
        const aqiRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=21.0285&lon=105.8542&appid=${OPENWEATHER_KEY}`);
        if (aqiRes.ok) {
          const aqiJson = await aqiRes.json();
          const item = aqiJson.list[0];
          data.aqi = item.main.aqi; 
          data.pm25 = item.components.pm2_5;
          data.pm10 = item.components.pm10;
        }
      }
    } catch (e) { console.warn('AQI fetch failed', e); }

    // 5. NewsAPI
    try {
      if (NEWS_KEY) {
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
    } catch (e) { console.warn('News fetch failed', e); }

    data.updatedAt = new Date().toISOString();
    return data;
  } catch (error) {
    console.error("Failed to fetch dashboard data", error);
    return data;
  }
}
