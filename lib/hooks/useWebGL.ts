"use client";

import { useEffect, useState } from "react";

export type WebGLState = "checking" | "ok" | "unsupported";

/**
 * Feature-detects WebGL2/WebGL once on mount. Also treats "save-data" and
 * very low device memory as unsupported so we never ship a heavy canvas to a
 * phone that will choke on it — the 2D fallback hero is shown instead.
 */
export function useWebGL(): WebGLState {
  const [state, setState] = useState<WebGLState>("checking");

  useEffect(() => {
    try {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean };
        deviceMemory?: number;
      };
      if (nav.connection?.saveData) {
        setState("unsupported");
        return;
      }
      if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory < 1) {
        setState("unsupported");
        return;
      }

      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

      if (!gl) {
        setState("unsupported");
        return;
      }
      // Release the probe context immediately.
      const lose = (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context");
      lose?.loseContext();
      setState("ok");
    } catch {
      setState("unsupported");
    }
  }, []);

  return state;
}
