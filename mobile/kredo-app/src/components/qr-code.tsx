import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Text } from "./ui/text";

interface QrProps {
  value: string;
  size?: number;
  logo?: string;
}

export function VendorQr({ value, size = 260, logo }: QrProps) {
  return (
    <View className="items-center">
      <QRCode
        value={value}
        size={size}
        color="#0B0B0C"
        logo={logo ? { uri: logo } : undefined}
        logoSize={48}
        logoBackgroundColor="#FFFFFF"
        logoBorderRadius={12}
      />
      <Text style={{ marginTop: 12, fontSize: 12, fontWeight: "700", color: "#6B6B70" }}>Tap the code to see a payment arrive</Text>
    </View>
  );
}

interface ScannerViewProps {
  onScanned: (data: string) => void;
}

export function QrScannerPlaceholder({}: ScannerViewProps) {
  return (
    <View className="w-full h-[256px] rounded-[36px] border border-borderSoft bg-[#F4F2EB] items-center justify-center">
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B6B70" }}>Camera access coming in next build — tap a vendor below to pay instead.</Text>
    </View>
  );
}
