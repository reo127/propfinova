import { useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart, Search as SearchIcon } from "lucide-react-native";
import SignInPrompt from "../../components/SignInPrompt";
import Screen from "../../components/Screen";
import { TAB_BAR_CLEARANCE } from "../../components/TabBar";
import PropertyCard from "../../components/PropertyCard";
import { useAuthStore } from "../../lib/auth-store";
import { useWishlistStore } from "../../lib/wishlist-store";

export default function WishlistScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { properties, load } = useWishlistStore();

  useFocusEffect(
    useCallback(() => {
      load(token);
    }, [token])
  );

  if (!token) {
    return (
      <Screen>
        <SignInPrompt
          icon={Heart}
          title="Sign in to save properties"
          message="Keep a shortlist of the homes you like and come back to them any time."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold text-secondary">Saved properties</Text>
        <Text className="text-muted text-sm mt-0.5">
          {properties.length === 0
            ? "Nothing saved yet"
            : `${properties.length} ${properties.length === 1 ? "property" : "properties"} saved`}
        </Text>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PropertyCard property={item} />}
        ListEmptyComponent={
          <View className="items-center mt-16 px-8">
            <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
              <Heart size={26} color="#9ca8a2" />
            </View>
            <Text className="text-secondary font-bold text-base mb-1">No saved properties</Text>
            <Text className="text-muted text-sm text-center mb-6">
              Tap the heart on any listing and it will show up here for easy comparison later.
            </Text>
            <Pressable
              onPress={() => router.push("/search")}
              className="flex-row items-center gap-2 bg-primary px-6 py-3.5 rounded-xl"
            >
              <SearchIcon size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm">Browse properties</Text>
            </Pressable>
          </View>
        }
      />
    </Screen>
  );
}
