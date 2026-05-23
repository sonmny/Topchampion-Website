// Curated list of major industrial countries / regions, bilingual.
// Code is ISO 3166-1 alpha-2 where possible; "OTHER" for fallback.
// Priority codes (always pinned to the top of the dropdown, in this order):
export const PRIORITY_CODES = ["CN", "US", "HK", "TW"];

/**
 * Returns the country list sorted by priority first, then alphabetically
 * by the active language. Chinese sort uses localeCompare("zh-Hans-CN")
 * which orders by Pinyin then stroke; English uses default sort.
 */
export function sortedCountries(lang = "en") {
  const priority = PRIORITY_CODES
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);
  const rest = COUNTRIES
    .filter((c) => !PRIORITY_CODES.includes(c.code) && c.code !== "OTHER")
    .sort((a, b) => {
      const key = lang === "cn" ? "cn" : "en";
      return a[key].localeCompare(b[key], lang === "cn" ? "zh-Hans-CN" : "en", { sensitivity: "base" });
    });
  const other = COUNTRIES.find((c) => c.code === "OTHER");
  return [...priority, ...rest, ...(other ? [other] : [])];
}

export const COUNTRIES = [
  { code: "CN", en: "China", cn: "中国" },
  { code: "HK", en: "Hong Kong SAR", cn: "中国香港" },
  { code: "TW", en: "Taiwan", cn: "中国台湾" },
  { code: "MO", en: "Macao SAR", cn: "中国澳门" },
  { code: "JP", en: "Japan", cn: "日本" },
  { code: "KR", en: "South Korea", cn: "韩国" },
  { code: "SG", en: "Singapore", cn: "新加坡" },
  { code: "MY", en: "Malaysia", cn: "马来西亚" },
  { code: "TH", en: "Thailand", cn: "泰国" },
  { code: "ID", en: "Indonesia", cn: "印度尼西亚" },
  { code: "VN", en: "Vietnam", cn: "越南" },
  { code: "PH", en: "Philippines", cn: "菲律宾" },
  { code: "IN", en: "India", cn: "印度" },
  { code: "PK", en: "Pakistan", cn: "巴基斯坦" },
  { code: "BD", en: "Bangladesh", cn: "孟加拉国" },
  { code: "LK", en: "Sri Lanka", cn: "斯里兰卡" },
  { code: "MM", en: "Myanmar", cn: "缅甸" },
  { code: "KH", en: "Cambodia", cn: "柬埔寨" },
  { code: "MN", en: "Mongolia", cn: "蒙古" },
  { code: "AU", en: "Australia", cn: "澳大利亚" },
  { code: "NZ", en: "New Zealand", cn: "新西兰" },
  // Europe
  { code: "DE", en: "Germany", cn: "德国" },
  { code: "FR", en: "France", cn: "法国" },
  { code: "UK", en: "United Kingdom", cn: "英国" },
  { code: "IT", en: "Italy", cn: "意大利" },
  { code: "ES", en: "Spain", cn: "西班牙" },
  { code: "NL", en: "Netherlands", cn: "荷兰" },
  { code: "BE", en: "Belgium", cn: "比利时" },
  { code: "CH", en: "Switzerland", cn: "瑞士" },
  { code: "AT", en: "Austria", cn: "奥地利" },
  { code: "SE", en: "Sweden", cn: "瑞典" },
  { code: "NO", en: "Norway", cn: "挪威" },
  { code: "DK", en: "Denmark", cn: "丹麦" },
  { code: "FI", en: "Finland", cn: "芬兰" },
  { code: "IE", en: "Ireland", cn: "爱尔兰" },
  { code: "PT", en: "Portugal", cn: "葡萄牙" },
  { code: "PL", en: "Poland", cn: "波兰" },
  { code: "CZ", en: "Czech Republic", cn: "捷克" },
  { code: "SK", en: "Slovakia", cn: "斯洛伐克" },
  { code: "HU", en: "Hungary", cn: "匈牙利" },
  { code: "RO", en: "Romania", cn: "罗马尼亚" },
  { code: "BG", en: "Bulgaria", cn: "保加利亚" },
  { code: "GR", en: "Greece", cn: "希腊" },
  { code: "RS", en: "Serbia", cn: "塞尔维亚" },
  { code: "HR", en: "Croatia", cn: "克罗地亚" },
  { code: "SI", en: "Slovenia", cn: "斯洛文尼亚" },
  { code: "LT", en: "Lithuania", cn: "立陶宛" },
  { code: "LV", en: "Latvia", cn: "拉脱维亚" },
  { code: "EE", en: "Estonia", cn: "爱沙尼亚" },
  { code: "IS", en: "Iceland", cn: "冰岛" },
  { code: "LU", en: "Luxembourg", cn: "卢森堡" },
  { code: "RU", en: "Russia", cn: "俄罗斯" },
  { code: "UA", en: "Ukraine", cn: "乌克兰" },
  { code: "BY", en: "Belarus", cn: "白俄罗斯" },
  { code: "KZ", en: "Kazakhstan", cn: "哈萨克斯坦" },
  { code: "TR", en: "Turkey", cn: "土耳其" },
  // North America
  { code: "US", en: "United States", cn: "美国" },
  { code: "CA", en: "Canada", cn: "加拿大" },
  { code: "MX", en: "Mexico", cn: "墨西哥" },
  // Latin America
  { code: "BR", en: "Brazil", cn: "巴西" },
  { code: "AR", en: "Argentina", cn: "阿根廷" },
  { code: "CL", en: "Chile", cn: "智利" },
  { code: "CO", en: "Colombia", cn: "哥伦比亚" },
  { code: "PE", en: "Peru", cn: "秘鲁" },
  { code: "EC", en: "Ecuador", cn: "厄瓜多尔" },
  { code: "VE", en: "Venezuela", cn: "委内瑞拉" },
  { code: "UY", en: "Uruguay", cn: "乌拉圭" },
  { code: "PA", en: "Panama", cn: "巴拿马" },
  { code: "CR", en: "Costa Rica", cn: "哥斯达黎加" },
  // Middle East / Africa
  { code: "SA", en: "Saudi Arabia", cn: "沙特阿拉伯" },
  { code: "AE", en: "United Arab Emirates", cn: "阿联酋" },
  { code: "QA", en: "Qatar", cn: "卡塔尔" },
  { code: "KW", en: "Kuwait", cn: "科威特" },
  { code: "BH", en: "Bahrain", cn: "巴林" },
  { code: "OM", en: "Oman", cn: "阿曼" },
  { code: "JO", en: "Jordan", cn: "约旦" },
  { code: "LB", en: "Lebanon", cn: "黎巴嫩" },
  { code: "IL", en: "Israel", cn: "以色列" },
  { code: "IR", en: "Iran", cn: "伊朗" },
  { code: "IQ", en: "Iraq", cn: "伊拉克" },
  { code: "EG", en: "Egypt", cn: "埃及" },
  { code: "MA", en: "Morocco", cn: "摩洛哥" },
  { code: "DZ", en: "Algeria", cn: "阿尔及利亚" },
  { code: "TN", en: "Tunisia", cn: "突尼斯" },
  { code: "ZA", en: "South Africa", cn: "南非" },
  { code: "NG", en: "Nigeria", cn: "尼日利亚" },
  { code: "KE", en: "Kenya", cn: "肯尼亚" },
  { code: "GH", en: "Ghana", cn: "加纳" },
  { code: "ET", en: "Ethiopia", cn: "埃塞俄比亚" },
  { code: "OTHER", en: "Other", cn: "其他" },
];

export const labelOf = (code, lang) => {
  const c = COUNTRIES.find((x) => x.code === code);
  return c ? c[lang] || c.en : code;
};
