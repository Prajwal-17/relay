import { ShoppingBasket } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="bg-canvas flex-1">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <ShoppingBasket color="#283129" size={28} strokeWidth={1.8} />
        <Text className="text-ink text-xl font-semibold">QuickCart</Text>
        <Text className="text-muted text-center text-sm">Mobile setup is ready.</Text>
      </View>
    </SafeAreaView>
  );
}
