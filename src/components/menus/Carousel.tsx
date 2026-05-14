import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string | number;
  ariaLabel: string;
  className?: string;
  /** Min-width of each slide, applied as a Tailwind value (default = '85%'). */
  itemMinWidth?: string;
  /** When true, prev/next arrows are rendered (hidden on coarse pointer via CSS). */
  showArrows?: boolean;
}

export function Carousel<T>({
  items,
  renderItem,
  getKey,
  ariaLabel,
  className = '',
  itemMinWidth = '88%',
  showArrows = true,
}: CarouselProps<T>) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Detect which slide is most centered after a scroll settles.
  const updateActive = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    Array.from(scroller.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(center - childCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    setActiveIndex(bestIndex);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateActive);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    updateActive();
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [updateActive, items.length]);

  const scrollToIndex = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[index] as HTMLElement | undefined;
    if (!child) return;
    scroller.scrollTo({ left: child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2, behavior: 'smooth' });
  }, []);

  const goPrev = () => scrollToIndex(Math.max(0, activeIndex - 1));
  const goNext = () => scrollToIndex(Math.min(items.length - 1, activeIndex + 1));

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      className={`relative ${className}`}
    >
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') { event.preventDefault(); goNext(); }
          else if (event.key === 'ArrowLeft') { event.preventDefault(); goPrev(); }
        }}
      >
        {items.map((item, index) => (
          <div
            key={getKey(item, index)}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}`}
            tabIndex={0}
            className="shrink-0 snap-center focus:outline-none focus:ring-1 focus:ring-orange-500/60"
            style={{ minWidth: itemMinWidth }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {showArrows && items.length > 1 && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between [@media(pointer:fine)]:flex">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="Previous slide"
            className="pointer-events-auto -ml-2 grid h-9 w-9 place-items-center border border-white/15 bg-black/60 text-white/80 transition-colors hover:border-orange-500 hover:text-orange-400 disabled:opacity-30 disabled:hover:border-white/15"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={activeIndex === items.length - 1}
            aria-label="Next slide"
            className="pointer-events-auto -mr-2 grid h-9 w-9 place-items-center border border-white/15 bg-black/60 text-white/80 transition-colors hover:border-orange-500 hover:text-orange-400 disabled:opacity-30 disabled:hover:border-white/15"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {items.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden>
          {items.map((item, index) => (
            <button
              key={getKey(item, index)}
              type="button"
              tabIndex={-1}
              onClick={() => scrollToIndex(index)}
              className={`h-1.5 transition-all ${index === activeIndex ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/25 hover:bg-white/40'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
