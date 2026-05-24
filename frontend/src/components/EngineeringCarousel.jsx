import React from "react";
import { useLang } from "../i18n/LangContext";
import { useSiteContent } from "../hooks/useSiteContent";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Continuously scrolling marquee of engineering capability images (CMS-managed).
 * Doubles the items inline so the CSS keyframe loop is seamless. Pauses on hover.
 * Hidden entirely when the CMS has zero engineering-images.
 */
export const EngineeringCarousel = () => {
  const { lang } = useLang();
  const { data: images } = useSiteContent("engineering-images");

  const items = Array.isArray(images) ? images : [];
  if (items.length === 0) return null;

  // Duplicate the array so the marquee can loop without a visible jump
  const loop = [...items, ...items];

  return (
    <section
      data-testid="engineering-carousel"
      className="relative bg-[#070707] border-t border-white/10 py-16 lg:py-20 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-8 h-px bg-[#C9A063]" />
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C9A063]">
            {lang === "cn" ? "工程能力剪影" : "Engineering Capabilities · Gallery"}
          </span>
        </div>
      </div>

      {/* Marquee viewport */}
      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-r from-[#070707] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 lg:w-48 bg-gradient-to-l from-[#070707] to-transparent z-10" />

        <div
          className="flex gap-6 px-6 md:px-12 marquee-track"
          style={{
            animation: `marquee-scroll ${Math.max(20, items.length * 7)}s linear infinite`,
            width: "fit-content",
          }}
        >
          {loop.map((img, i) => (
            <figure
              key={`${img.id}-${i}`}
              data-testid={`eng-img-${i}`}
              className="relative shrink-0 w-[380px] lg:w-[460px] bg-[#0A0A0A] border border-white/10 overflow-hidden group"
            >
              <div className="aspect-[16/10] bg-white/[0.02] overflow-hidden">
                <img
                  src={`${BACKEND_URL}${img.image_url}`}
                  alt={(lang === "cn" ? img.caption_cn : img.caption_en) || "Engineering capability"}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-[1.03]"
                />
              </div>
              {(img.caption_en || img.caption_cn) && (
                <figcaption className="px-5 py-3.5 border-t border-white/10">
                  <p className="text-sm text-white leading-snug line-clamp-2">
                    {(lang === "cn" ? img.caption_cn : img.caption_en) || (lang === "cn" ? img.caption_en : img.caption_cn)}
                  </p>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      {/* Animation keyframes (scoped via global style — Tailwind keyframes config-free) */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track:hover { animation-play-state: paused !important; }
      `}</style>
    </section>
  );
};
