import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Info,
  Phone,
  LogOut,
  Heart,
  Building2,
  ChevronRight,
  Calculator,
  Newspaper,
  Search as SearchIcon,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react-native";
import Screen from "../../components/Screen";
import SignInPrompt from "../../components/SignInPrompt";
import { TAB_BAR_CLEARANCE } from "../../components/TabBar";
import PropertyCard from "../../components/PropertyCard";
import { useAuthStore } from "../../lib/auth-store";
import { useWishlistStore } from "../../lib/wishlist-store";
import { propertiesApi } from "../../lib/api";

const STATUS_TONE = {
  approved: { bg: "bg-primary-soft", text: "text-primary", label: "Live" },
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending review" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const savedCount = useWishlistStore((s) => s.properties.length);
  const isBroker = user?.role === "builder";

  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(isBroker);

  useFocusEffect(
    useCallback(() => {
      if (!isBroker || !token) return;
      propertiesApi
        .list({ mine: "true" }, token)
        .then(({ data }) => setMyProperties(data))
        .catch(() => setMyProperties([]))
        .finally(() => setLoading(false));
    }, [isBroker, token])
  );

  const onLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  if (!token) {
    return (
      <Screen>
        <SignInPrompt
          icon={User}
          title="Sign in to your account"
          message="Track saved properties, manage your listings and reach our team faster."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View className="mx-4 mt-2 rounded-3xl bg-secondary px-5 py-6">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-2xl font-bold">{user?.name?.[0]?.toUpperCase() || "U"}</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white text-xl font-bold" numberOfLines={1}>
                {user?.name}
              </Text>
              <Text className="text-white/60 text-sm mt-0.5" numberOfLines={1}>
                {user?.email}
              </Text>
              <View className="bg-white/15 self-start px-2.5 py-1 rounded-full mt-2">
                <Text className="text-accent text-[10px] font-bold uppercase">
                  {isBroker ? "Broker Account" : "Customer Account"}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3 mt-5">
            <Stat icon={Heart} label="Saved" value={savedCount} onPress={() => router.push("/wishlist")} />
            {isBroker ? (
              <Stat icon={Building2} label="Listings" value={myProperties.length} />
            ) : (
              <Stat icon={ShieldCheck} label="Verified only" value="100%" />
            )}
          </View>
        </View>

        {/* Broker listings */}
        {isBroker && (
          <View className="px-4 mt-7">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-secondary">My Listings</Text>
              <Pressable onPress={() => router.push("/list-property")}>
                <Text className="text-primary font-semibold text-sm">+ Add new</Text>
              </Pressable>
            </View>

            {loading ? (
              <Text className="text-muted text-sm">Loading…</Text>
            ) : myProperties.length === 0 ? (
              <View className="bg-surface border border-border rounded-2xl p-6 items-center">
                <Building2 size={24} color="#9ca8a2" />
                <Text className="text-muted text-sm text-center mt-2.5 mb-4">
                  You haven&apos;t listed any properties yet.
                </Text>
                <Pressable onPress={() => router.push("/list-property")} className="bg-primary px-5 py-2.5 rounded-xl">
                  <Text className="text-white font-semibold text-sm">List a property</Text>
                </Pressable>
              </View>
            ) : (
              myProperties.map((p) => {
                const tone = STATUS_TONE[p.status] || STATUS_TONE.approved;
                return (
                  <View key={p._id}>
                    <PropertyCard property={p} />
                    <View className={`${tone.bg} self-start px-2.5 py-1 rounded-full -mt-1 mb-4 ml-1`}>
                      <Text className={`text-[10px] font-bold ${tone.text}`}>{tone.label}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Menu */}
        <Section title="Explore">
          <Row icon={SearchIcon} label="Browse properties" onPress={() => router.push("/search")} />
          <Row icon={Heart} label="My wishlist" onPress={() => router.push("/wishlist")} />
          <Row icon={Calculator} label="Property calculators" onPress={() => router.push("/calculators")} />
          <Row icon={Newspaper} label="Blog & insights" onPress={() => router.push("/blog")} last />
        </Section>

        <Section title="Support">
          <Row icon={Phone} label="Contact us" onPress={() => router.push("/contact")} />
          <Row icon={Info} label="About PropFinova" onPress={() => router.push("/about")} />
          <Row icon={FileText} label="Privacy & terms" onPress={() => router.push("/legal")} last />
        </Section>

        <View className="px-4 mt-6">
          <Pressable
            onPress={onLogout}
            className="flex-row items-center justify-center gap-2 bg-surface border border-red-200 rounded-2xl py-4"
          >
            <LogOut size={17} color="#dc2626" />
            <Text className="text-red-600 font-semibold">Log out</Text>
          </Pressable>
          <Text className="text-center text-muted text-xs mt-5">PropFinova · v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ icon: Icon, label, value, onPress }) {
  return (
    <Pressable onPress={onPress} className="flex-1 bg-white/10 rounded-2xl px-4 py-3">
      <Icon size={15} color="#6fcf9a" />
      <Text className="text-white text-xl font-bold mt-1.5">{value}</Text>
      <Text className="text-white/55 text-[11px]">{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }) {
  return (
    <View className="px-4 mt-7">
      <Text className="text-xs font-bold text-muted uppercase mb-2.5 ml-1">{title}</Text>
      <View className="bg-surface border border-border rounded-2xl overflow-hidden">{children}</View>
    </View>
  );
}

function Row({ icon: Icon, label, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 ${last ? "" : "border-b border-border"}`}
    >
      <View className="w-9 h-9 rounded-xl bg-primary-soft items-center justify-center">
        <Icon size={16} color="#17855a" />
      </View>
      <Text className="ml-3 flex-1 font-medium text-foreground">{label}</Text>
      <ChevronRight size={17} color="#9ca8a2" />
    </Pressable>
  );
}
