import React from "react";
import { motion } from "framer-motion";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";

// Real customer roster sourced from Topchampion 2025 catalog.
// Displayed as text-only badges (no third-party logos shown).
const FALLBACK_ROSTER = {
  cn: {
    overline: "服务客户",
    title: "20 年,服务全球工业头部客户。",
    sub: "以下为部分公开可披露的客户名单(按行业分组)。完整参考请咨询销售团队。",
    groups: [
      {
        label: "轮胎与橡胶",
        items: ["固铂 / Goodyear(美国)", "倍耐力 Pirelli", "住友橡胶", "库珀成山", "正新轮胎 CST", "华丰橡胶"],
      },
      {
        label: "汽车与新能源",
        items: ["宝马沈阳(出口德国)", "广州恒大汽车", "福特 Ford(越南)", "VinFast(越南)"],
      },
      {
        label: "半导体 / 显示面板",
        items: ["台积电 TSMC(上海)", "中芯 SMIC(北京/上海/天津)", "武汉弘芯", "天马 Tianma(厦门/武汉)", "华星光电 CSOT(深圳)", "联芯 UMC(厦门)", "惠科 HKC(四川/安徽)", "南亚电子", "柔宇科技"],
      },
      {
        label: "数据中心 / 互联网",
        items: ["华为", "阿里巴巴", "富士康", "台达"],
      },
      {
        label: "电力生产 / 发电机组",
        items: ["V-POWER(新加坡)", "V-POWER(缅甸)", "ComAp(东南亚)", "Trilogy Power Solutions(美→加)"],
      },
      {
        label: "轨道交通 / 医疗 / 基础设施",
        items: ["成都地铁 4 号线二期", "郑州城郊线", "长海医院", "北京清华医院", "北京长庚医院", "吉首大学", "莆田 / 抚州交警"],
      },
    ],
  },
  en: {
    overline: "Selected customers",
    title: "20 years serving global industrial leaders.",
    sub: "Public-disclosable customers grouped by industry below. Full reference list available on request.",
    groups: [
      {
        label: "Tire & Rubber",
        items: ["Goodyear (USA)", "Pirelli", "Sumitomo Rubber", "Cooper Chengshan", "CST Tire", "Huafeng Rubber"],
      },
      {
        label: "Automotive & New Energy",
        items: ["BMW Shenyang (→ Germany)", "Evergrande Auto", "Ford (Vietnam)", "VinFast (Vietnam)"],
      },
      {
        label: "Semiconductor / FPD",
        items: ["TSMC (Shanghai)", "SMIC (Beijing/Shanghai/Tianjin)", "Wuhan Hongxin", "Tianma (Xiamen/Wuhan)", "CSOT (Shenzhen)", "UMC (Xiamen)", "HKC (Sichuan/Anhui)", "Nanya", "Royole"],
      },
      {
        label: "Data Center / Internet",
        items: ["Huawei", "Alibaba", "Foxconn", "Delta"],
      },
      {
        label: "Power Generation",
        items: ["V-POWER (Singapore)", "V-POWER (Myanmar)", "ComAp (SE Asia)", "Trilogy Power Solutions (US→CA)"],
      },
      {
        label: "Rail / Healthcare / Infrastructure",
        items: ["Chengdu Metro Line 4 P2", "Zhengzhou Urban Rail", "Changhai Hospital", "Tsinghua Hospital Beijing", "Chang Gung Hospital Beijing", "Jishou University", "Putian / Fuzhou Traffic Police"],
      },
    ],
  },
};

export const Clients = () => {
  const { lang } = useLang();
  const c = FALLBACK_ROSTER[lang];
  const { data: serverGroups } = useSiteContent("client-groups");

  // Build groups array: prefer server data when present, otherwise fallback.
  const groups = (Array.isArray(serverGroups) && serverGroups.length > 0)
    ? serverGroups.map((g) => ({ label: lang === "cn" ? g.label_cn : g.label_en, items: g.items || [] }))
    : c.groups;

  return (
    <section
      id="clients"
      data-testid="clients-section"
      className="relative bg-[#070707] py-24 lg:py-32 border-t border-white/10"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="mb-14 max-w-3xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-[#C9A063]" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
              {c.overline}
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-white uppercase leading-[1.05] mb-5">
            {c.title}
          </h2>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">{c.sub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {groups.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="bg-[#0A0A0A] p-7 lg:p-8 flex flex-col gap-4 hover:bg-[#101010] transition-colors"
              data-testid={`clients-group-${i}`}
            >
              <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#C9A063]">
                {String(i + 1).padStart(2, "0")} / {g.label}
              </div>
              <ul className="flex flex-col gap-2">
                {g.items.map((it, j) => (
                  <li
                    key={j}
                    className="text-sm text-zinc-300 flex items-center gap-2.5 leading-snug"
                  >
                    <span className="w-1 h-1 bg-[#1A8A52] shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 font-mono text-[10px] tracking-[0.25em] uppercase text-zinc-600 max-w-2xl leading-relaxed">
          {lang === "cn"
            ? "* 上述客户名单仅用于工程参考。客户名为各自商标持有人所有。完整签约范围请联系销售。"
            : "* Customer references shown for engineering context only. All trademarks belong to their respective owners. Full contracted scope on request."}
        </p>
      </div>
    </section>
  );
};
