// Per-route SEO copy (EN + CN).
// SITE.url uses REACT_APP_SITE_URL at build time when set, otherwise falls back to
// the current preview domain. To switch to production, set REACT_APP_SITE_URL in
// frontend/.env to your real domain (e.g. https://www.topchampion.cn) and rebuild.

const PROD_URL = process.env.REACT_APP_SITE_URL || "https://green-automation-pro.preview.emergentagent.com";

export const SITE = {
  url: PROD_URL,
  ogImage: "/logo.png",
  name: {
    en: "Topchampion Electric & Automation",
    cn: "苏州赛冠电气与自动化",
  },
  defaultKeywords: {
    en: "industrial automation, PLC integration, gen-set control, switchgear, control cabinets, MES, SCADA, ABB MNS-E, Rittal Ri4Power, Rockwell, ComAp, semiconductor cleanroom, data center distribution, Kunshan, Suzhou, V-POWER, Goodyear, TSMC",
    cn: "工业自动化, PLC 集成, 发电机组控制, 开关柜, 控制柜, MES, SCADA, ABB MNS-E, Rittal Ri4Power, Rockwell, ComAp, 半导体洁净厂房, 数据中心配电, 昆山, 苏州赛冠, V-POWER, 固铂, 台积电",
  },
};

export const seoConfig = {
  home: {
    en: {
      title: "Suzhou Topchampion Automation — Since 2005 · PLC, Switchgear & Gen-Set Control Integrator",
      description: "20 years of PLC, MCC, ABB MNS-E switchgear and gen-set control systems for tire production (Goodyear, Pirelli), semiconductor (TSMC, SMIC), gas power stations (V-POWER), automotive (BMW, Ford, VinFast) and data centers (Huawei, Alibaba). ISO 9001 · National High-Tech Enterprise.",
    },
    cn: {
      title: "苏州赛冠工业自动化 — 2005 年成立 · PLC、开关柜与发电机组控制集成商",
      description: "20 年 PLC、MCC、ABB MNS-E 开关柜与发电机组控制系统经验,服务固铂、倍耐力、台积电、中芯、V-POWER、宝马、福特、VinFast、华为、阿里巴巴等客户。ISO 9001、国家高新技术企业。",
    },
  },
  solutionsHub: {
    en: {
      title: "Solutions — Tire · Switchgear · Gen-Set · Cleanroom | Topchampion",
      description: "Four core solution lines from Suzhou Topchampion: MES-integrated tire production, ABB MNS-E + Rittal Ri4Power cabinets, gas/diesel gen-set control (V-POWER, ComAp), and semiconductor cleanroom + data center distribution.",
    },
    cn: {
      title: "解决方案 — 轮胎·控制柜·发电机组·洁净厂房 | 苏州赛冠",
      description: "苏州赛冠四大核心解决方案:MES 集成轮胎生产线、ABB MNS-E 与 Rittal Ri4Power 控制柜、燃气/柴油机组控制(V-POWER、ComAp)、半导体洁净厂房与数据中心配电。",
    },
  },
  "solution.tire-production": {
    en: {
      title: "Automated Tire Production Lines — MES + Robotics + SCADA | Topchampion",
      description: "Robotic assembly cells, vision QC, and SCADA-orchestrated MES integration for high-mix, high-volume tire manufacturing. Predictive maintenance and full traceability.",
    },
    cn: {
      title: "轮胎自动化生产线 — MES + 机器人 + SCADA | 苏州赛冠",
      description: "面向高混合、高产量轮胎制造的机器人装配单元、视觉 QC 与 SCADA 调度 MES 集成。预测性维护与全流程可追溯。",
    },
  },
  "solution.control-cabinets": {
    en: {
      title: "High / Low-Voltage Control Cabinets — ABB MNS-E & Rittal Ri4Power | Topchampion",
      description: "Type-tested LV/HV control cabinets engineered with ABB MNS-E and Rittal Ri4Power. IEC 61439 / UL 891 compliant, arc-fault protected, mission-critical reliability.",
    },
    cn: {
      title: "高/低压控制柜 — ABB MNS-E 与 Rittal Ri4Power | 苏州赛冠",
      description: "采用 ABB MNS-E 与 Rittal Ri4Power 的型式试验低压/高压控制柜。符合 IEC 61439 / UL 891，弧故障防护，面向关键任务可靠性。",
    },
  },
  "solution.power-generation": {
    en: {
      title: "Gas / Diesel Gen-Set Control — V-POWER, ComAp, Trilogy Power | Topchampion",
      description: "Generator station control cabinets for gas and diesel power plants. References: V-POWER Singapore & Myanmar, ComAp SE Asia, Trilogy Power (US → Canada). 1 MW to 50 MW stations, ComAp InteliGen / InteliSys.",
    },
    cn: {
      title: "燃气/柴油机组控制 — V-POWER · ComAp · Trilogy Power | 苏州赛冠",
      description: "燃气与柴油发电站机组控制柜。参考项目：V-POWER 新加坡与缅甸、ComAp 东南亚、Trilogy Power（美→加）。1 MW 至 50 MW 电站，ComAp InteliGen / InteliSys 平台。",
    },
  },
  "solution.data-center": {
    en: {
      title: "Green Data Center Distribution — Tier IV LV / PDU / Busway | Topchampion",
      description: "Tier-rated low-voltage distribution, PDUs, and isolated-parallel busways for hyperscale, colocation, and AI-cluster facilities. IEEE 1547 / UL 9540 compliant.",
    },
    cn: {
      title: "绿色数据中心配电 — Tier IV 低压 / PDU / 母线 | 苏州赛冠",
      description: "面向超大规模、托管与 AI 集群数据中心的 Tier 级低压配电、PDU 与隔离并联母线。符合 IEEE 1547 / UL 9540。",
    },
  },
  engineering: {
    en: {
      title: "Engineering Excellence — Consultation to Commissioning | Topchampion",
      description: "One accountable engineering team from white-board consultation through site commissioning. No handoffs lost, no specifications drifted — documented end-to-end.",
    },
    cn: {
      title: "工程卓越 — 从咨询到调试 | 苏州赛冠",
      description: "一支专属工程团队，从白板咨询到现场调试全程负责。无遗失交接，无规格漂移 —— 端到端文档化。",
    },
  },
  cases: {
    en: {
      title: "Case Studies — V-POWER, Goodyear, TSMC, BMW, Ford | Topchampion",
      description: "Real projects delivered by Suzhou Topchampion: V-POWER gas power stations (Singapore + Myanmar), Goodyear USA tire lines, TSMC Shanghai cleanroom, BMW Shenyang R4 panels exported to Germany, Ford & VinFast Vietnam paint shops.",
    },
    cn: {
      title: "案例研究 — V-POWER · 固铂 · 台积电 · 宝马 · 福特 | 苏州赛冠",
      description: "苏州赛冠真实交付项目:V-POWER 燃气电站(新加坡+缅甸)、固铂美国轮胎产线、台积电上海洁净厂房、宝马沈阳 R4 Panel 出口德国、福特与 VinFast 越南涂装线。",
    },
  },
  contact: {
    en: {
      title: "Contact / Smart Quote — Senior Engineer Reply Within 1 Day | Topchampion",
      description: "Submit a Smart Quote and a senior engineer will respond within one business day with a scoped technical proposal — not a sales pitch. NDA-ready.",
    },
    cn: {
      title: "联系我们 / 智能报价 — 1 个工作日内资深工程师回复 | 苏州赛冠",
      description: "提交智能报价，资深工程师将在一个工作日内回复有范围的技术建议书 —— 而非销售推销。可签 NDA。",
    },
  },
  about: {
    en: {
      title: "About Topchampion — Suzhou Industrial Park Automation Engineer",
      description: "Founded in Suzhou Industrial Park, China. Engineering precision automation and green-energy systems for global industry since the day we opened the doors.",
    },
    cn: {
      title: "关于赛冠 — 苏州工业园区自动化工程师",
      description: "成立于中国苏州工业园区。自开业以来，我们为全球工业提供精密自动化与绿色能源系统工程。",
    },
  },
  careers: {
    en: {
      title: "Careers — Join Topchampion's Engineering Team | Suzhou",
      description: "We hire engineers who care about documentation, FAT reports, and the operator on the phone at 03:00. Open roles in Suzhou and on-site abroad.",
    },
    cn: {
      title: "招聘 — 加入苏州赛冠工程团队",
      description: "我们雇佣那些关心文档、关心 FAT 报告、关心凌晨三点接听操作员电话的工程师。苏州及海外现场职位长期开放。",
    },
  },
  certifications: {
    en: {
      title: "Certifications & Compliance — ISO 9001 · IEC 61439 · UL 891 | Topchampion",
      description: "Type-tested, audited, and documented to the standards procurement, insurers, and regulators actually accept: ISO 9001:2015, IEC 61439, UL 891, IEEE 1547, UL 9540.",
    },
    cn: {
      title: "认证与合规 — ISO 9001 · IEC 61439 · UL 891 | 苏州赛冠",
      description: "型式试验、审计与文档 —— 符合采购、保险与监管机构真正认可的标准：ISO 9001:2015、IEC 61439、UL 891、IEEE 1547、UL 9540。",
    },
  },
  privacy: {
    en: {
      title: "Privacy Policy | Topchampion",
      description: "How Suzhou Topchampion handles inquiry data submitted through this website. Plain-language, no dark patterns.",
    },
    cn: {
      title: "隐私政策 | 苏州赛冠",
      description: "苏州赛冠如何处理通过本网站提交的咨询数据。明确表述，无暗模式。",
    },
  },
  notFound: {
    en: {
      title: "Page Not Found | Topchampion",
      description: "The page you requested does not exist. Return to the Topchampion homepage.",
    },
    cn: {
      title: "页面未找到 | 苏州赛冠",
      description: "您请求的页面不存在。请返回赛冠首页。",
    },
  },
};

// JSON-LD Organization schema for the homepage.
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Suzhou Topchampion Industrial Automation Technology Co., Ltd.",
  alternateName: ["苏州赛冠工业自动化技术有限公司", "Topchampion Electric & Automation", "赛冠工业自动化"],
  url: SITE.url,
  logo: `${SITE.url}${SITE.ogImage}`,
  description: "Industrial automation, power distribution, gen-set control and switchgear manufacturer founded May 2005 in Kunshan, Jiangsu, China. National High-Tech Enterprise (2024). Authorized ABB manufacturer, Rockwell system integrator, Rittal Ri4Power partner.",
  foundingDate: "2005-05",
  foundingLocation: { "@type": "Place", name: "Kunshan, Jiangsu, China" },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Building 009, No.19 Taihong Road, Yushan Town",
    addressLocality: "Kunshan",
    addressRegion: "Jiangsu",
    addressCountry: "CN",
  },
  sameAs: [],
  knowsAbout: [
    "Industrial Automation",
    "PLC Integration",
    "Gas & Diesel Generator Set Control",
    "Low-Voltage Switchgear",
    "ABB MNS-E",
    "Rittal Ri4Power",
    "Rockwell Automation",
    "ComAp Gen-Set Controllers",
    "Tire Production Line Automation",
    "Semiconductor Cleanroom PLC",
    "Data Center Power Distribution",
    "MES",
    "SCADA",
  ],
  hasCredential: [
    "ISO 9001:2015 (since 2006)",
    "CCC Product Certification (since 2007)",
    "CE Marking (since 2020)",
    "National High-Tech Enterprise (2024, GR202432006352)",
    "IEC 61439",
    "UL 891",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Suzhou Topchampion Automation",
  url: SITE.url,
  inLanguage: ["zh-CN", "en"],
};

// Helper: build a Service schema for any solution detail page.
export const serviceSchema = (slug, lang) => {
  const cfg = seoConfig[`solution.${slug}`]?.[lang];
  if (!cfg) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: cfg.title.split(" — ")[0],
    description: cfg.description,
    provider: { "@type": "Organization", name: "Suzhou Topchampion Automation" },
    areaServed: ["China", "Asia", "Europe", "MENA"],
    url: `${SITE.url}/solutions/${slug}`,
  };
};
