import { AuraHome } from "@/components/aura/aura-home";
import { AuraWorld } from "@/components/student/aura-world";
import { WorldOr } from "@/components/student/world-or";

export default function Page() {
  return (
    <WorldOr world={<AuraWorld />}>
      <AuraHome />
    </WorldOr>
  );
}
