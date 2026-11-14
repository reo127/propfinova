import { SafeAreaView } from "react-native-safe-area-context";

export default function Screen({ children, className = "" }) {
  return (
    <SafeAreaView className={`flex-1 bg-background ${className}`} edges={["top", "left", "right"]}>
      {children}
    </SafeAreaView>
  );
}
