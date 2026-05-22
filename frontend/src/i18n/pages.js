// Detail content for sub-pages — bilingual
export const pages = {
  en: {
    solutionsHub: {
      breadcrumb: ["Home", "Solutions"],
      title: "Our Solutions",
      subtitle: "Three product pillars built on one integrated engineering organization — from MES-orchestrated robotics to MWh-scale BESS distribution.",
    },
    solutions: {
      "tire-production": {
        breadcrumb: ["Home", "Solutions", "Tire Production"],
        title: "Automated Tire Production Lines",
        subtitle: "MES-integrated robotic cells, vision QC, and SCADA orchestration for high-mix, high-volume tire manufacturing.",
        sections: [
          { h: "What we deliver", p: "Turnkey green-tire-to-curing automation. Robotic loading & extraction, hot-rebuild conveyors, weigh & label stations, and full MES/SCADA orchestration calibrated to your existing line topology." },
          { h: "Why operators choose us", p: "We have commissioned 24-cell curing presses in Southeast Asia two weeks ahead of plan, with MES integration flawless from day one. OEE gains of 12–18% are typical within the first quarter." },
          { h: "Standards & integration", p: "Rockwell ControlLogix / Siemens TIA / Schneider EcoStruxure PLCs. OPC-UA northbound to Ignition, AVEVA PI, or SAP MES. ISA-95 aligned." },
        ],
        bullets: ["MES & SCADA integration", "Robotic green-tire handling", "Inline vision QA/QC", "Predictive curing-press maintenance", "ISA-95 / OPC-UA northbound"],
      },
      "control-cabinets": {
        breadcrumb: ["Home", "Solutions", "Control Cabinets"],
        title: "High / Low-Voltage Control Cabinets",
        subtitle: "ABB MNS-E and Rittal Ri4Power assemblies — type-tested, IEC / UL compliant, engineered for mission-critical reliability.",
        sections: [
          { h: "Assemblies & switchgear", p: "Authorized ABB MNS-E LV switchgear and Rittal Ri4Power assemblies, with arc-fault containment to IEC 61641 / 7.1. Compartment forms 2b → 4b, withdrawable modules, full type-test certification." },
          { h: "Engineering rigour", p: "EPLAN P8 schematics, thermal CFD verification, full short-circuit study (per IEC 60909 / IEEE 551). Every cabinet ships with FAT-witnessed traceability — component serial → drawing → operator." },
          { h: "Compliance", p: "Type-tested to IEC 61439-1/2, UL 891, UL 508A. CE marked, CCC where applicable. SCCR-rated assemblies for North American projects." },
        ],
        bullets: ["ABB MNS-E LV switchgear", "Rittal Ri4Power assemblies", "IEC 61439-1/2 type-tested", "UL 891 / UL 508A", "Arc-fault containment IEC 61641"],
      },
      "bess": {
        breadcrumb: ["Home", "Solutions", "BESS Integration"],
        title: "Battery Energy Storage Integration",
        subtitle: "Utility-scale BESS distribution, PCS coordination, and EMS — from 80 MWh pilots to 220 MWh deployments without re-engineering.",
        sections: [
          { h: "Scope of supply", p: "AC-block LV distribution, transformer interface, PCS integration (Sungrow, SMA, ABB), and SCADA-grade Energy Management Systems. We deliver the electrical brain that turns a battery container farm into a dispatchable asset." },
          { h: "Scalability", p: "Our Ri4Power LV distribution scales linearly from 80 MWh to 220+ MWh without re-engineering. Modular bus systems, hot-swap PCS modules, and topology agnostic to LFP / NMC chemistry." },
          { h: "Grid services", p: "Frequency response (FFR / FCR), peak shaving, arbitrage, black-start, and grid-forming control. Compliant with IEEE 1547, UL 9540 / 9540A, and regional grid codes." },
        ],
        bullets: ["MWh-scale LV distribution", "PCS-agnostic integration", "EMS & SCADA delivery", "IEEE 1547 / UL 9540A", "Grid-forming control"],
      },
      "data-center": {
        breadcrumb: ["Home", "Solutions", "Data Center Distribution"],
        title: "Green Data Center Distribution",
        subtitle: "Tier-rated LV distribution, PDUs, and isolated-parallel busways for hyperscale, colocation, and AI-cluster facilities.",
        sections: [
          { h: "Critical power chain", p: "Mains → UPS interface → IP-rated switchgear → busway → rack PDU. Every link engineered for concurrent maintainability (Tier III) or fault tolerance (Tier IV) with documented selectivity studies." },
          { h: "Sustainability", p: "Low-loss transformers, dynamic load-bank coordination, and harmonic-mitigation packages let operators hit PUE targets without sacrificing reliability." },
          { h: "Documentation", p: "Type-tested MNS-E lineups delivered to UL standards, fully documented — Tier audits passed in a single session by our MENA hyperscale client." },
        ],
        bullets: ["Tier III / Tier IV ready", "Isolated-parallel busway", "Smart PDUs with API telemetry", "Harmonic mitigation", "Concurrent maintainability"],
      },
    },
    engineering: {
      breadcrumb: ["Home", "Engineering"],
      title: "Engineering Excellence",
      subtitle: "One accountable team from white-board to plant-floor. No handoffs lost. No specifications drifted.",
    },
    cases: {
      breadcrumb: ["Home", "Case Studies"],
      title: "Case Studies",
      subtitle: "Mission-critical floors trust us in tire manufacturing, BESS, and hyperscale data centers — across Asia, Europe, and MENA.",
    },
    contact: {
      breadcrumb: ["Home", "Contact"],
      title: "Get in Touch",
      subtitle: "A senior engineer will respond within one business day with a scoped technical proposal — not a sales pitch.",
    },
    about: {
      breadcrumb: ["Home", "About"],
      title: "About Topchampion",
      subtitle: "Founded in Suzhou Industrial Park, China. Engineering precision automation and green-energy systems for global industry since the day we opened the doors.",
      sections: [
        { h: "Who we are", p: "Suzhou Topchampion Electric & Automation Co., Ltd. is an authorized ABB manufacturer, a Rittal Ri4Power partner, and a Rockwell Automation system integrator. We design, build, and commission control & power systems for tire production lines, BESS sites, and green data centers." },
        { h: "What we believe", p: "A control cabinet should outlive the project that ordered it. A line should commission on time. Documentation should pass an audit on the first attempt. We engineer to these standards, every project." },
        { h: "Where we work", p: "Headquartered in Suzhou with active deployments in 27 countries across Asia, Europe, MENA, and the Americas." },
      ],
    },
    careers: {
      breadcrumb: ["Home", "Careers"],
      title: "Careers at Topchampion",
      subtitle: "We hire engineers who care about the documentation, the FAT report, and the operator picking up the phone at 03:00.",
      sections: [
        { h: "Open positions", p: "Electrical Engineer (Switchgear) · Controls Engineer (PLC/SCADA) · BESS Systems Engineer · Commissioning Engineer (field) · Project Manager (EPC). Locations: Suzhou HQ + on-site rotations globally." },
        { h: "What you'll work on", p: "Real MWh-scale BESS projects. Real 24-cell tire lines. Real Tier-IV data centers. No theatre, no demos — production systems that customers depend on." },
        { h: "How to apply", p: "Send CV and a one-paragraph note on the most interesting commissioning problem you have solved to careers@topchampion.cn. We reply to every qualified application." },
      ],
    },
    certifications: {
      breadcrumb: ["Home", "Certifications"],
      title: "Certifications & Compliance",
      subtitle: "Type-tested, audited, and documented — to the standards that procurement, insurers, and regulators actually accept.",
      items: [
        { k: "ISO 9001:2015", t: "Quality Management System", d: "Full ISO 9001:2015 certification covering design, manufacturing, FAT, and on-site commissioning workflows. Audited annually." },
        { k: "IEC 61439-1/2", t: "Type-tested LV Switchgear", d: "Assemblies type-tested to IEC 61439-1 and -2 for power switchgear and controlgear. Compartment forms 2b, 3b, 4a, 4b available." },
        { k: "UL 891 / UL 508A", t: "North American Compliance", d: "UL 891 dead-front switchboards and UL 508A industrial control panels. SCCR-rated for project-specific fault currents." },
        { k: "CE Marking", t: "European Conformity", d: "All cabinets shipped to EU markets carry CE marking under LVD 2014/35/EU and EMC 2014/30/EU directives." },
        { k: "IEC 61641", t: "Arc-fault Containment", d: "Internal arc-fault testing to IEC 61641 / TR 7.1 — assemblies graded A / B / C / D classifications as required." },
      ],
    },
    privacy: {
      breadcrumb: ["Home", "Privacy Policy"],
      title: "Privacy Policy",
      subtitle: "How we handle inquiry data submitted through this website.",
      sections: [
        { h: "What we collect", p: "When you submit a Smart Quote, we record your name, company, email, phone (optional), industry, preferred PLC brand, and project description. That is the entirety of the data we hold from this website." },
        { h: "How we use it", p: "Your inquiry is routed to the senior engineering team that handles your industry. We respond within one business day. We do not sell, lease, or share your contact data with any third party." },
        { h: "Retention", p: "Inquiry records are retained for 24 months for follow-up and reference, after which they are anonymized or deleted on request." },
        { h: "Your rights", p: "You may request access, correction, or deletion of your data at any time by emailing privacy@topchampion.cn — we respond within five business days." },
      ],
    },
  },
  cn: {
    solutionsHub: {
      breadcrumb: ["首页", "解决方案"],
      title: "解决方案",
      subtitle: "三大产品支柱,一支集成工程团队 —— 从 MES 调度的机器人到 MWh 级 BESS 配电。",
    },
    solutions: {
      "tire-production": {
        breadcrumb: ["首页", "解决方案", "轮胎生产线"],
        title: "轮胎自动化生产线",
        subtitle: "MES 集成的机器人单元、视觉质检与 SCADA 调度,专为高混合、高产量轮胎制造而生。",
        sections: [
          { h: "交付内容", p: "从生胎到硫化的交钥匙自动化。机器人上下料、热重建输送、称重贴标、以及与现有产线拓扑校准的全套 MES / SCADA 调度。" },
          { h: "客户为何选择我们", p: "我们在东南亚提前两周完成 24 单元硫化压机调试,第一天 MES 即完美运行。首个季度 OEE 提升 12–18% 是常态。" },
          { h: "标准与集成", p: "Rockwell ControlLogix / Siemens TIA / Schneider EcoStruxure PLC。OPC-UA 北向接入 Ignition / AVEVA PI / SAP MES。遵循 ISA-95 架构。" },
        ],
        bullets: ["MES 与 SCADA 集成", "机器人生胎搬运", "在线视觉 QA/QC", "硫化压机预测性维护", "ISA-95 / OPC-UA 北向"],
      },
      "control-cabinets": {
        breadcrumb: ["首页", "解决方案", "控制柜"],
        title: "高/低压控制柜",
        subtitle: "ABB MNS-E 与 Rittal Ri4Power 总装方案 —— 型式试验、符合 IEC / UL,面向关键任务可靠性。",
        sections: [
          { h: "成套与开关设备", p: "ABB MNS-E 授权低压开关柜与 Rittal Ri4Power 总装,IEC 61641 / 7.1 弧故障防护。隔室形式 2b → 4b,抽出式模块,完整型式试验认证。" },
          { h: "工程严谨", p: "EPLAN P8 图纸、热 CFD 验证、按 IEC 60909 / IEEE 551 的短路研究。每台柜体出厂均带 FAT 见证可追溯性 —— 组件序号 → 图纸 → 操作员。" },
          { h: "合规", p: "型式试验符合 IEC 61439-1/2、UL 891、UL 508A。CE 标识、适用项目附 CCC。北美项目带 SCCR 评级。" },
        ],
        bullets: ["ABB MNS-E 低压开关柜", "Rittal Ri4Power 总装", "IEC 61439-1/2 型式试验", "UL 891 / UL 508A", "IEC 61641 弧故障防护"],
      },
      "bess": {
        breadcrumb: ["首页", "解决方案", "BESS 集成"],
        title: "电池储能集成",
        subtitle: "公用事业级 BESS 配电、PCS 协同与 EMS —— 从 80 MWh 试点到 220 MWh 部署,无需重新设计。",
        sections: [
          { h: "供货范围", p: "AC 块低压配电、变压器接口、PCS 集成(Sungrow / SMA / ABB)、以及 SCADA 级能量管理系统。我们交付的是把电池集装箱阵列变为可调度资产的电气大脑。" },
          { h: "可扩展性", p: "Ri4Power 低压配电从 80 MWh 线性扩展至 220+ MWh,无需重新设计。模块化母线,PCS 热插拔模块,与 LFP / NMC 化学体系拓扑无关。" },
          { h: "电网服务", p: "频率响应(FFR / FCR)、削峰填谷、套利、黑启动、并网构网控制。符合 IEEE 1547、UL 9540 / 9540A 与区域电网规范。" },
        ],
        bullets: ["MWh 级低压配电", "PCS 无关集成", "EMS 与 SCADA 交付", "IEEE 1547 / UL 9540A", "构网控制"],
      },
      "data-center": {
        breadcrumb: ["首页", "解决方案", "数据中心配电"],
        title: "绿色数据中心配电",
        subtitle: "面向超大规模、托管与 AI 集群数据中心的 Tier 级低压配电、PDU 与隔离并联母线。",
        sections: [
          { h: "关键电力链路", p: "进线 → UPS 接口 → IP 等级开关柜 → 母线 → 机架 PDU。每一环节均按并行可维护性(Tier III)或容错(Tier IV)设计,附完整选择性研究。" },
          { h: "可持续性", p: "低损耗变压器、动态负载柜协同、谐波抑制方案,让运营商在不牺牲可靠性的前提下达成 PUE 指标。" },
          { h: "文档", p: "符合 UL 标准的型式试验 MNS-E 配电柜、文档完备 —— 我们中东超大规模客户的 Tier 审核一次通过。" },
        ],
        bullets: ["Tier III / Tier IV 就绪", "隔离并联母线", "带 API 遥测的智能 PDU", "谐波抑制", "并行可维护性"],
      },
    },
    engineering: {
      breadcrumb: ["首页", "工程能力"],
      title: "工程卓越",
      subtitle: "一支专属团队,从白板到现场。无遗失交接,无规格漂移。",
    },
    cases: {
      breadcrumb: ["首页", "案例研究"],
      title: "案例研究",
      subtitle: "我们的关键任务现场遍及亚洲、欧洲与中东 —— 涵盖轮胎制造、BESS 与超大规模数据中心。",
    },
    contact: {
      breadcrumb: ["首页", "联系我们"],
      title: "联系我们",
      subtitle: "资深工程师将在一个工作日内回复,提供有范围的技术建议书 —— 而非销售推销。",
    },
    about: {
      breadcrumb: ["首页", "关于我们"],
      title: "关于赛冠",
      subtitle: "成立于中国苏州工业园区。自开业以来,我们为全球工业提供精密自动化与绿色能源系统工程。",
      sections: [
        { h: "我们是谁", p: "苏州赛冠电气自动化有限公司 —— ABB 授权制造商、Rittal Ri4Power 合作伙伴、Rockwell Automation 系统集成商。我们为轮胎生产线、BESS 站点与绿色数据中心提供控制与电力系统的设计、制造与调试。" },
          { h: "我们相信什么", p: "控制柜的寿命应超过它所服务的项目。生产线应按时投运。文档应一次通过审核。每一个项目,我们都按此标准工程。" },
          { h: "我们在哪里工作", p: "总部位于苏州,业务遍及亚洲、欧洲、中东与美洲共 27 个国家。" },
      ],
    },
    careers: {
      breadcrumb: ["首页", "招贤纳士"],
      title: "加入赛冠",
      subtitle: "我们雇佣那些关心文档、关心 FAT 报告、关心凌晨三点接听操作员电话的工程师。",
      sections: [
        { h: "在招岗位", p: "电气工程师(开关柜)· 控制工程师(PLC/SCADA)· BESS 系统工程师 · 调试工程师(现场)· 项目经理(EPC)。工作地点:苏州总部 + 全球现场轮岗。" },
        { h: "你将从事什么", p: "真实的 MWh 级 BESS 项目。真实的 24 单元轮胎生产线。真实的 Tier-IV 数据中心。没有表演、没有演示 —— 是客户真正依赖的生产系统。" },
        { h: "如何申请", p: "将简历及一段关于你解决过的最有趣调试问题的描述发送至 careers@topchampion.cn。我们对每一份合格的申请都会回复。" },
      ],
    },
    certifications: {
      breadcrumb: ["首页", "认证"],
      title: "认证与合规",
      subtitle: "型式试验、审计与文档 —— 符合采购、保险与监管机构真正认可的标准。",
      items: [
        { k: "ISO 9001:2015", t: "质量管理体系", d: "覆盖设计、制造、FAT 与现场调试流程的完整 ISO 9001:2015 认证。每年审核。" },
        { k: "IEC 61439-1/2", t: "型式试验低压开关柜", d: "成套设备按 IEC 61439-1 与 -2 进行型式试验,适用于电力开关柜与控制柜。提供 2b、3b、4a、4b 隔室形式。" },
        { k: "UL 891 / UL 508A", t: "北美合规", d: "UL 891 死前面板开关柜与 UL 508A 工业控制面板。按项目特定故障电流提供 SCCR 评级。" },
        { k: "CE 标识", t: "欧洲合规", d: "出口至欧盟市场的所有柜体均带 CE 标识,符合 LVD 2014/35/EU 与 EMC 2014/30/EU 指令。" },
        { k: "IEC 61641", t: "弧故障防护", d: "按 IEC 61641 / TR 7.1 进行内部弧故障测试 —— 总装按需评级 A / B / C / D 等级。" },
      ],
    },
    privacy: {
      breadcrumb: ["首页", "隐私政策"],
      title: "隐私政策",
      subtitle: "我们如何处理通过本网站提交的咨询数据。",
      sections: [
        { h: "我们收集什么", p: "提交智能报价时,我们记录您的姓名、公司、邮箱、电话(可选)、行业、首选 PLC 品牌及项目描述。这就是我们从本网站持有的全部数据。" },
        { h: "我们如何使用", p: "您的咨询将转交给负责您行业的资深工程团队。我们在一个工作日内回复。我们不会出售、出租或与任何第三方共享您的联系方式。" },
        { h: "保留期", p: "咨询记录保留 24 个月用于跟进与参考,之后将匿名化处理或按要求删除。" },
        { h: "您的权利", p: "您可随时通过 privacy@topchampion.cn 邮件请求访问、更正或删除您的数据 —— 我们在五个工作日内回复。" },
      ],
    },
  },
};
