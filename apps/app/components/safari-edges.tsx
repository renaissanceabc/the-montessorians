"use client";

import { useLayoutEffect } from "react";

import { edgeColorFromStack, edgeSamplePoint, PAGE_EDGE_COLOR } from "@/lib/safari-edges";

const sampleEdge = (edge: "top" | "bottom") => {
  const viewport = window.visualViewport;
  const point = edgeSamplePoint(edge, {
    height: viewport?.height ?? window.innerHeight,
    width: viewport?.width ?? window.innerWidth,
  });
  if (!point) {
    return PAGE_EDGE_COLOR;
  }

  const layers = document.elementsFromPoint(point.x, point.y).map((element) => ({
    backgroundColor: getComputedStyle(element).backgroundColor,
    ignore:
      element === document.body ||
      element === document.documentElement ||
      element.classList.contains("edge-top") ||
      element.classList.contains("edge-bottom"),
  }));

  // One value for the strip, the document background, and `theme-color`.
  return edgeColorFromStack(layers) ?? PAGE_EDGE_COLOR;
};

/**
 * Fixed strips whose backgrounds Safari extends behind the status bar and the
 * bottom toolbar. They stay outside any transformed ancestor so `position: fixed`
 * is relative to the viewport, and they track scroll, restored scroll, resizes,
 * and the toolbar expanding or collapsing.
 */
export const SafariEdges = () => {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const initialThemeColor = themeColor?.getAttribute("content") ?? null;
    let frame = 0;
    let topColor = "";
    let bottomColor = "";

    const apply = () => {
      frame = 0;
      const nextTop = sampleEdge("top");
      const nextBottom = sampleEdge("bottom");
      if (nextTop === topColor && nextBottom === bottomColor) {
        return;
      }
      topColor = nextTop;
      bottomColor = nextBottom;
      root.style.setProperty("--edge-top-background", nextTop);
      root.style.setProperty("--edge-bottom-background", nextBottom);
      themeColor?.setAttribute("content", nextTop);
    };

    const schedule = () => {
      if (frame !== 0) {
        return;
      }
      frame = window.requestAnimationFrame(apply);
    };

    apply();

    const viewport = window.visualViewport;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);

    // Sheets and menus change the edge without scrolling.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      attributeFilter: ["class", "hidden", "open"],
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      observer.disconnect();
      root.style.removeProperty("--edge-top-background");
      root.style.removeProperty("--edge-bottom-background");
      if (themeColor && initialThemeColor !== null) {
        themeColor.setAttribute("content", initialThemeColor);
      }
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="edge-top" data-print-hidden />
      <div aria-hidden="true" className="edge-bottom" data-print-hidden />
    </>
  );
};
