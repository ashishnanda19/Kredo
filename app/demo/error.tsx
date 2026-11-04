"use client";

import { WorldError } from "@/components/demo/world-error";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <WorldError error={error} retry={retry} />;
}
