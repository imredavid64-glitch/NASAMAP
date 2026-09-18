/**
 * prefers-reduced-motion helper for the 3D canvases.
 *
 * The canvas components are client-only (dynamic ssr:false), so this hook can
 * read matchMedia on the browsering thread and switch on change. When reduced
 * motion is requested, animations do not autoplay — the scene stays on a static
 * frame and the user drives playback explicitly.
 */

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    if (media.addEventListener) media.addEventListener("change", update);
    else if (media.addListener) media.addListener(update);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update);
      else if (media.removeListener) media.removeListener(update);
    };
  }, []);

  return reduced ?? false;
}