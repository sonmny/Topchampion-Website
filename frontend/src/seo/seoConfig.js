// Per-route SEO copy (EN + CN).
// Update SITE.url to match the production domain when deploying.

export const SITE = {
  url: "https://green-automation-pro.preview.emergentagent.com",
  ogImage: "/logo.png",
  name: {
    en: "Topchampion Electric & Automation",
    cn: "苏州赛冠电气与自动化",
  },
  defaultKeywords: {
    en: "industrial automation, PLC integration, BESS, control cabinets, MES, SCADA, ABB MNS-E, Rittal Ri4Power, data center distribution, Suzhou",
    cn: "工业自动化, PLC 集成, BESS 储能, 控制柜, MES, SCADA, ABB MNS-E, Rittal Ri4Power, 数据中心配电, 苏州赛冠",
  },
};

export const seoConfig = {
  home: {
    en: {
      title: "Suzhou Topchampion Automation — Industrial PLC, BESS & Green Power Integrator",
      description: "Suzhou Topchampion Automation engineers turnkey industrial automation: tire production lines, ABB/Rittal control cabinets, BESS integration, and green data center distribution. ISO 9001 · IEC 61439 · UL 891.",
    },
    cn: {
      title: "苏州赛冠自动化 — 工业 PLC、BESS 储能与绿色电力系统集成商",
      description: "苏州赛冠提供交钥匙工业自动化方案：轮胎生产线、ABB/Rittal 控制柜、BESS 储能集成与绿色数据中心配电。ISO 9001 · IEC 61439 · UL 891。",
    },
  },
  solutionsHub: {
    en: {
      title: "Solutions — Tire Lines · Control Cabinets · BESS · Data Centers | Topchampion",
      description: "Four flagship solution lines from Suzhou Topchampion: MES-orchestrated tire production, ABB MNS-E and Rittal Ri4Power cabinets, MWh-scale BESS, and Tier-rated data center distribution.",
    },
    cn: {
      title: "解决方案 — 轮胎产线·控制柜·BESS·数据中心 | 苏州赛冠",
      description: "苏州赛冠四大核心解决方案：MES 调度的轮胎生产线、ABB MNS-E 与 Rittal Ri4Power 控制柜、MWh 级 BESS 储能集成、Tier 级数据中心配电。",
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
  "solution.bess": {
    en: {
      title: "Battery Energy Storage Integration — Utility-Scale BESS / PCS / EMS | Topchampion",
      description: "MWh-class BESS distribution, on-grid / off-grid PCS coordination, and EMS — from 80 MWh pilots to 220 MWh deployments without re-engineering.",
    },
    cn: {
      title: "电池储能集成 — 公用事业级 BESS / PCS / EMS | 苏州赛冠",
      description: "MWh 级 BESS 配电、并网/离网 PCS 协同与 EMS —— 从 80 MWh 试点到 220 MWh 部署，无需重新设计。",
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
      title: "Case Studies — Tire, BESS & Data Center Deployments | Topchampion",
      description: "Mission-critical floors trust Topchampion across Asia, Europe, and MENA — tire manufacturing, MWh-scale BESS, and hyperscale data centers.",
    },
    cn: {
      title: "案例研究 — 轮胎、BESS 与数据中心部署 | 苏州赛冠",
      description: "我们的关键任务现场遍及亚洲、欧洲与中东 —— 涵盖轮胎制造、MWh 级 BESS 储能与超大规模数据中心。",
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
  name: "Suzhou Topchampion Automation Co., Ltd.",
  alternateName: ["苏州赛冠电气与自动化", "Topchampion Electric & Automation"],
  url: SITE.url,
  logo: `${SITE.url}${SITE.ogImage}`,
  description: "Industrial automation, BESS integration, and control cabinet engineering company headquartered in Suzhou Industrial Park, China.",
  foundingLocation: { "@type": "Place", name: "Suzhou Industrial Park, China" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Suzhou",
    addressRegion: "Jiangsu",
    addressCountry: "CN",
  },
  sameAs: [],
  knowsAbout: [
    "Industrial Automation",
    "PLC Integration",
    "Battery Energy Storage Systems (BESS)",
    "Low-Voltage Switchgear",
    "ABB MNS-E",
    "Rittal Ri4Power",
    "Data Center Power Distribution",
    "MES",
    "SCADA",
  ],
  hasCredential: [
    "ISO 9001:2015",
    "IEC 61439",
    "UL 891",
    "IEEE 1547",
    "UL 9540",
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
