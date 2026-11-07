/**
 * Whether the demo tools (Demo Controls, the Stage, persona jump-in) are available.
 * NEXT_PUBLIC_DEMO_CONTROLS=true turns them on and =false turns them off. When it is not set they are on in
 * development and off in a production build, so a deployed site has no demo tools unless it opts in.
 * NEXT_PUBLIC_* values are inlined at build time.
 */
export const DEMO_ENABLED =
  process.env.NEXT_PUBLIC_DEMO_CONTROLS === "true" ||
  (process.env.NEXT_PUBLIC_DEMO_CONTROLS !== "false" && process.env.NODE_ENV !== "production");
