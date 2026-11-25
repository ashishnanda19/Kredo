const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Polyfills for browser environment (injected before any module executes)
const originalGetPolyfills = config.serializer?.getPolyfills;
config.serializer = config.serializer || {};
config.serializer.getPolyfills = (options) => {
  const polyfills = originalGetPolyfills ? originalGetPolyfills(options) : [];
  // Web only: on iOS and Android this would tell libraries they run in a browser.
  if (options?.platform !== "web") return polyfills;
  return [path.resolve(__dirname, "src/lib/web-polyfill.js"), ...polyfills];
};

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "zustand/middleware") {
    return {
      filePath: path.resolve(__dirname, "node_modules/zustand/middleware.js"),
      type: "sourceFile",
    };
  }
  if (moduleName === "zustand") {
    return {
      filePath: path.resolve(__dirname, "node_modules/zustand/index.js"),
      type: "sourceFile",
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
