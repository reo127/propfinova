import { View, Text, TextInput } from "react-native";

export default function Input({ label, error, className = "", ...props }) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#5c7268"
        className={`border rounded-xl px-4 py-3 text-base text-foreground bg-surface ${
          error ? "border-red-400" : "border-border"
        }`}
        {...props}
      />
      {error ? <Text className="text-xs text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
