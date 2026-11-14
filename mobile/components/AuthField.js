import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";

export default function AuthField({ label, icon: Icon, isPassword, error, ...props }) {
  const [reveal, setReveal] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-foreground mb-1.5">{label}</Text>
      <View
        className={`flex-row items-center border rounded-xl bg-surface px-4 ${
          error ? "border-red-400" : "border-border"
        }`}
      >
        {Icon ? <Icon size={18} color="#5c7268" /> : null}
        <TextInput
          placeholderTextColor="#9ca8a2"
          secureTextEntry={isPassword && !reveal}
          className={`flex-1 py-3.5 text-[15px] text-foreground ${Icon ? "ml-2.5" : ""}`}
          {...props}
        />
        {isPassword ? (
          <Pressable onPress={() => setReveal((v) => !v)} hitSlop={8}>
            {reveal ? <EyeOff size={18} color="#5c7268" /> : <Eye size={18} color="#5c7268" />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-xs text-red-500 mt-1">{error}</Text> : null}
    </View>
  );
}
