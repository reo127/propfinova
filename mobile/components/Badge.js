import { View, Text } from "react-native";

export default function Badge({ label, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    dark: "bg-secondary text-white",
    accent: "bg-accent-soft text-secondary",
  };
  const [bg, text] = tones[tone].split(" ");
  return (
    <View className={`${bg} px-2.5 py-1 rounded-full self-start`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
