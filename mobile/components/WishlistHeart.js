import { Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Heart } from "lucide-react-native";
import { useAuthStore } from "../lib/auth-store";
import { useWishlistStore } from "../lib/wishlist-store";

export default function WishlistHeart({ propertyId, size = 18, className = "" }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const saved = useWishlistStore((s) => s.ids.has(propertyId));
  const toggle = useWishlistStore((s) => s.toggle);

  const onPress = (e) => {
    e.stopPropagation?.();

    // Browsing needs no account, but saving does — say so instead of failing
    // silently, and offer the way forward.
    if (!token) {
      Alert.alert("Sign in to save", "Create a free account to keep a shortlist of properties.", [
        { text: "Not now", style: "cancel" },
        { text: "Sign in", onPress: () => router.push("/login") },
      ]);
      return;
    }

    toggle(propertyId, token);
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      className={`w-9 h-9 rounded-full bg-surface items-center justify-center ${className}`}
      style={{
        shadowColor: "#10251b",
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Heart size={size} color={saved ? "#17855a" : "#5c7268"} fill={saved ? "#17855a" : "transparent"} />
    </Pressable>
  );
}
