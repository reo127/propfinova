import { Pressable, Text, ActivityIndicator } from "react-native";

const VARIANTS = {
  primary: "bg-primary active:bg-primary-dark",
  outline: "bg-transparent border border-primary active:bg-primary-soft",
  ghost: "bg-transparent active:bg-primary-soft",
};

const TEXT_VARIANTS = {
  primary: "text-white",
  outline: "text-primary",
  ghost: "text-primary",
};

export default function Button({ title, onPress, variant = "primary", loading, disabled, className = "" }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-xl py-3.5 items-center justify-center ${VARIANTS[variant]} ${
        disabled || loading ? "opacity-60" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#17855a"} />
      ) : (
        <Text className={`font-semibold text-base ${TEXT_VARIANTS[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
