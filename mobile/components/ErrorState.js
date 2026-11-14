import { View, Text, Pressable } from "react-native";
import { WifiOff, RotateCw } from "lucide-react-native";
import { API_URL } from "../lib/api";

/**
 * Shown when a request fails, instead of rendering an empty list.
 *
 * Previously a failed fetch was caught and turned into `[]`, so a network
 * problem looked exactly like "there are no properties" — which made a
 * blocked connection impossible to tell apart from empty data.
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <View className="items-center px-8 py-12">
      <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
        <WifiOff size={24} color="#9ca8a2" />
      </View>

      <Text className="text-secondary font-bold text-base text-center">Couldn&apos;t load properties</Text>
      <Text className="text-muted text-sm text-center mt-1.5 leading-5">
        {message || "We couldn't reach the server. Check your connection and try again."}
      </Text>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl mt-5"
        >
          <RotateCw size={15} color="#fff" />
          <Text className="text-white font-semibold text-sm">Try again</Text>
        </Pressable>
      )}

      <Text className="text-[10px] text-muted/70 mt-5 text-center">{API_URL}</Text>
    </View>
  );
}
