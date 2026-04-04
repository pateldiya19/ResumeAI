'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollStackItemProps {
  children: ReactNode;
  className?: string;
}

export function ScrollStackItem({ children, className = '' }: ScrollStackItemProps) {
  return (
    <div className={`scroll-stack-card transform-gpu origin-top will-change-transform shadow-[0_0_30px_rgba(0,0,0,0.06)] w-full p-8 rounded-2xl box-border ${className}`}>
      {children}
    </div>
  );
}

interface ScrollStackProps {
  children: ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
}

export default function ScrollStack({
  children,
  className = '',
  itemDistance = 80,
  itemScale = 0.02,
  itemStackDistance = 25,
}: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll('.scroll-stack-card')) as HTMLElement[];
    cardsRef.current = cards;

    cards.forEach((card, i) => {
      if (i < cards.length - 1) card.style.marginBottom = `${itemDistance}px`;
      card.style.willChange = 'transform';
      card.style.transformOrigin = 'top center';
    });

    const update = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const stickyTop = vh * 0.2; // 20% from top

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const cardTopAbsolute = rect.top + scrollY;
        const triggerPoint = cardTopAbsolute - stickyTop - itemStackDistance * i;

        // Scale: shrink as card gets pinned deeper in stack
        const scaleStart = cardTopAbsolute - vh;
        const scaleEnd = cardTopAbsolute - vh * 0.1;
        let scaleProgress = 0;
        if (scrollY > scaleStart && scrollY < scaleEnd) {
          scaleProgress = (scrollY - scaleStart) / (scaleEnd - scaleStart);
        } else if (scrollY >= scaleEnd) {
          scaleProgress = 1;
        }
        const targetScale = 0.88 + i * itemScale;
        const scale = 1 - scaleProgress * (1 - targetScale);

        // Pin: stick to top
        let translateY = 0;
        if (scrollY >= triggerPoint) {
          translateY = scrollY - cardTopAbsolute + stickyTop + itemStackDistance * i;
          // Cap translateY so cards don't go past the container
          const containerBottom = container.getBoundingClientRect().bottom + scrollY;
          const maxTranslate = containerBottom - cardTopAbsolute - vh * 0.5;
          if (translateY > maxTranslate) translateY = maxTranslate;
        }

        card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [itemDistance, itemScale, itemStackDistance]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {children}
    </div>
  );
}
