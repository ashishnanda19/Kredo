"use client";

import { useSyncExternalStore } from "react";

/** True when this page is shown inside another page (a phone frame on the Demo Stage). False on the server. */
export function useEmbedded(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => window.self !== window.top,
    () => false,
  );
}
