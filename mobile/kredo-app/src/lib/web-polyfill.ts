if (typeof window !== "undefined") {
  const win = window as any;
  win.process = win.process || {};
  win.process.env = win.process.env || {};
  if (!win.process.env.EXPO_OS) {
    win.process.env.EXPO_OS = "web";
  }
}
