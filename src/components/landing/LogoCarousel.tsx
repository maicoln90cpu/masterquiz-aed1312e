import { useEffect, useRef } from "react";

const LOGOS = [
  { src: "https://content.inlead.cloud/2025/12/braip.png", alt: "Braip" },
  { src: "https://content.inlead.cloud/2025/12/perfectpay.png", alt: "PerfectPay" },
  { src: "https://content.inlead.cloud/2025/12/ticto.png", alt: "Ticto" },
  { src: "https://content.inlead.cloud/2025/12/monetizze.png", alt: "Monetizze" },
  { src: "https://content.inlead.cloud/2025/12/lastlink.png", alt: "Lastlink" },
  { src: "https://content.inlead.cloud/2025/12/eduzz.png", alt: "Eduzz" },
  { src: "https://content.inlead.cloud/2025/12/kirvano.png", alt: "Kirvano" },
  { src: "https://content.inlead.cloud/2025/12/kiwify.png", alt: "Kiwify" },
  { src: "https://content.inlead.cloud/2025/12/hotmart.png", alt: "Hotmart" },
];

export const LogoCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    let pos = 0;
    const speed = 0.5; // px per frame

    const step = () => {
      pos += speed;
      // Each list is identical; reset when we've scrolled past the first copy
      const firstList = el.querySelector("ul");
      if (firstList) {
        const gap = window.innerWidth >= 768 ? 100 : window.innerWidth >= 640 ? 64 : 48;
        const listWidth = firstList.scrollWidth + gap;
        if (pos >= listWidth) pos -= listWidth;
      }
      el.style.transform = `translate3d(-${pos}px, 0, 0)`;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const LogoList = ({ ariaHidden }: { ariaHidden: boolean }) => (
    <ul className="flex items-center" role="list" aria-hidden={ariaHidden}>
      {LOGOS.map((logo) => (
        <li key={logo.alt} className="flex-none mr-12 sm:mr-16 md:mr-[100px]" role="listitem">
          <img
            className="max-h-8 sm:max-h-10 md:max-h-14 h-auto w-auto block pointer-events-none"
            src={logo.src}
            alt={logo.alt}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="relative overflow-x-hidden py-8 bg-muted/30" role="region" aria-label="Parceiros">
      {/* Fade edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[clamp(24px,8%,120px)] bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-[clamp(24px,8%,120px)] bg-gradient-to-l from-background to-transparent"
      />

      <div
        ref={scrollRef}
        className="flex w-max will-change-transform select-none motion-reduce:transform-none"
      >
        <LogoList ariaHidden={false} />
        <LogoList ariaHidden={true} />
        <LogoList ariaHidden={true} />
      </div>
    </section>
  );
};
