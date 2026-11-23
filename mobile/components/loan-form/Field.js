import { View, Text, TextInput } from "react-native";

// Shared text-input wrapper, lifted from the original LoanApplySheet so every
// loan-form step component looks the same.
export default function Field({ label, ...props }) {
  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">{label}</Text>
      <TextInput
        placeholderTextColor="#9ca8a2"
        className="border border-border rounded-xl px-4 py-3 text-foreground bg-background"
        {...props}
      />
    </View>
  );
}
