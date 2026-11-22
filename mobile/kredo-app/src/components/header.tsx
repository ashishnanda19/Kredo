import { View, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Text } from "./ui/text";

interface HeaderProps {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  backLabel?: string;
  onBack?: () => void;
  className?: string;
}

export function Header({ title, left, right, onBack, className }: HeaderProps) {
  return (
    <View className={cn("flex-row items-center justify-between px-4 py-3", className)}>
      {onBack ? (
        <Pressable className="p-1.5" onPress={onBack}>
          <ArrowLeft size={20} strokeWidth={2} color="#0B0B0C" />
        </Pressable>
      ) : left}
      <Text className="text-[17px] font-[800] tracking-[-0.02em] flex-1 text-center">{title}</Text>
      <View className="flex-row items-center gap-2">{right ?? <></>}</View>
    </View>
  );
}

export function HeaderActions({ icons }: { icons: React.ReactNode[] }) {
  return (
    <View className="flex-row items-center gap-2">
      {icons.map((icon, i) => (
        <Pressable key={i} className="p-1.5">
          {icon}
        </Pressable>
      ))}
    </View>
  );
}
