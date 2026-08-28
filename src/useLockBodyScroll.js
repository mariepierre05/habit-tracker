import { useEffect } from "react";

// While a bottom sheet is open the page behind it must stop scrolling.
// On iOS, leaving it scrollable is a known cause of taps inside a fixed
// overlay failing to focus an input — the tap scrolls the page underneath
// instead of reaching the field, so the keyboard never appears.
//
// `overflow: hidden` alone doesn't hold on iOS; the body has to be pinned with
// `position: fixed`, which loses the scroll position, so it is restored on the
// way out.
export function useLockBodyScroll() {
  useEffect(() => {
    const { overflow, position, top, width } = document.body.style;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, []);
}
