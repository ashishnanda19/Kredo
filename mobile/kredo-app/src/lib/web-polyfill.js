// @ts-nocheck
// Web polyfills — injected via metro.config.js getPolyfills before any module
if (typeof window !== "undefined") {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.EXPO_OS = "web";

  // Provide a fallback "platform" so Metro's HMR client doesn't throw
  // "Missing required parameter `platform`". The HMR client reads
  // location.search when deciding which platform it bundles for.
  try {
    var url = new URL(window.location.href);
    if (!url.searchParams.has("platform")) {
      url.searchParams.set("platform", "web");
      window.history.replaceState(null, "", url.toString());
    }
  } catch (_) {
    // ignore — SSR or non-browser environment
  }
}
if (typeof globalThis !== "undefined") {
  globalThis.process = globalThis.process || {};
  globalThis.process.env = globalThis.process.env || {};
  globalThis.process.env.EXPO_OS = "web";
}
