import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, Linking } from "react-native";
import { useRouter } from "expo-router";
import {
  Search as SearchIcon,
  ShieldCheck,
  Building2,
  Users,
  ChevronRight,
  Phone,
  MessageCircle,
} from "lucide-react-native";
import Screen from "../../components/Screen";
import { TAB_BAR_CLEARANCE } from "../../components/TabBar";
import PropertyCard from "../../components/PropertyCard";
import BannerSlider from "../../components/BannerSlider";
import ErrorState from "../../components/ErrorState";
import LeadModal, { LEAD_PRESETS } from "../../components/LeadModal";
import { propertiesApi, contentApi } from "../../lib/api";
import { SUPPORT_TEL_HREF, whatsappHref } from "../../lib/contact";
import { useAuthStore } from "../../lib/auth-store";

const TABS = [
  { key: "buy", label: "Buy" },
  { key: "rent", label: "Rent" },
  { key: "new", label: "New" },
];
const QUICK_FILTERS = ["3 BHK", "Ready to move", "Under ₹1 Cr", "New launch"];
const PAGE = 6;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [properties, setProperties] = useState([]);
  const [banners, setBanners] = useState([]);
  const [hero, setHero] = useState(null);
  const [visible, setVisible] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("buy");
  const [query, setQuery] = useState("");
  const [showLead, setShowLead] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    const [props, bans, heroData] = await Promise.allSettled([
      propertiesApi.list(),
      contentApi.banners(),
      contentApi.heroImage(),
    ]);

    // Only the listings failing is worth surfacing — banners and the hero are
    // decorative, so losing them should not block the feed.
    if (props.status === "fulfilled") {
      setProperties(props.value.data || []);
      setLoadError(null);
    } else {
      setLoadError(props.reason?.message || "Request failed");
    }

    if (bans.status === "fulfilled") setBanners(bans.value.data || []);
    if (heroData.status === "fulfilled") setHero(heroData.value.data || null);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const search = () => router.push({ pathname: "/search", params: { mode: tab === "new" ? "buy" : tab } });

  const topCities = hero?.topCities || [];
  const localities = hero?.popularLocalities || [];

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#17855a" />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View>
            <Text className="text-muted text-sm">Welcome back</Text>
            <Text className="text-xl font-bold text-secondary">{user?.name?.split(" ")[0] || "there"} 👋</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-primary-soft px-3 py-1.5 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-primary" />
            <Text className="text-[11px] font-semibold text-primary">Site-verified</Text>
          </View>
        </View>

        {/* Hero */}
        <View className="mx-4 rounded-3xl bg-secondary overflow-hidden">
          <View className="px-5 pt-6 pb-5">
            <Text className="text-white text-[22px] leading-7 font-bold">
              A home search built on what&apos;s actually true.
            </Text>
            <Text className="text-white/65 text-sm mt-2 leading-5">
              Every listing site-verified before it goes live. Builder deals direct — no brokerage on top.
            </Text>
          </View>

          {/* Search card */}
          <View className="bg-surface mx-3 mb-3 rounded-2xl overflow-hidden">
            <View className="flex-row border-b border-border">
              {TABS.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  className={`flex-1 py-3 items-center ${tab === t.key ? "border-b-2 border-primary bg-primary-soft" : ""}`}
                >
                  <Text className={`text-sm font-semibold ${tab === t.key ? "text-primary" : "text-muted"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="p-3.5">
              <View className="flex-row items-center bg-background rounded-xl px-3.5 mb-3">
                <SearchIcon size={16} color="#5c7268" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={search}
                  placeholder="City, locality or project name"
                  placeholderTextColor="#9ca8a2"
                  returnKeyType="search"
                  className="flex-1 py-3 px-2 text-foreground"
                />
              </View>
              <Pressable onPress={search} className="bg-primary rounded-xl py-3.5 items-center">
                <Text className="text-white font-bold">Search properties</Text>
              </Pressable>

              <View className="flex-row flex-wrap items-center gap-2 mt-3">
                <Text className="text-xs text-muted">Try:</Text>
                {QUICK_FILTERS.map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => router.push({ pathname: "/search", params: { mode: tab === "new" ? "buy" : tab } })}
                    className="px-2.5 py-1.5 rounded-lg border border-border"
                  >
                    <Text className="text-xs text-muted">{chip}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Banners — same auto-advancing slider as the web home page */}
        <View className="mt-6">
          <BannerSlider banners={banners} />
        </View>

        {/* Trust strip */}
        <View className="flex-row gap-2.5 px-4 mt-6">
          {[
            { icon: ShieldCheck, label: "RERA\nRegistered" },
            { icon: Building2, label: "Verified\nListings" },
            { icon: Users, label: "5,000+\nClients" },
          ].map(({ icon: Icon, label }) => (
            <View key={label} className="flex-1 bg-surface rounded-2xl px-3 py-3.5 items-center border border-border">
              <Icon size={19} color="#17855a" />
              <Text className="text-[11px] text-muted text-center mt-1.5 leading-4">{label}</Text>
            </View>
          ))}
        </View>

        {/* Top cities */}
        {topCities.length > 0 && (
          <View className="mt-7">
            <Text className="text-sm font-bold text-secondary px-5 mb-2.5">Top cities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {topCities.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => router.push({ pathname: "/search", params: { mode: "buy" } })}
                  className="px-4 py-2.5 rounded-full border border-border bg-surface"
                >
                  <Text className="text-sm font-medium text-secondary">{city}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular localities */}
        {localities.length > 0 && (
          <View className="mt-4">
            <Text className="text-sm font-bold text-secondary px-5 mb-2.5">Popular localities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {localities.map((loc) => (
                <Pressable
                  key={loc}
                  onPress={() => router.push({ pathname: "/search", params: { mode: "buy" } })}
                  className="px-4 py-2.5 rounded-full border border-border bg-surface"
                >
                  <Text className="text-sm font-medium text-secondary">{loc}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Listings */}
        <View className="px-4 mt-8">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xl font-bold text-secondary">Handpicked for you</Text>
            <Pressable onPress={() => router.push("/search")} className="flex-row items-center">
              <Text className="text-primary font-semibold text-sm">View all</Text>
              <ChevronRight size={15} color="#17855a" />
            </Pressable>
          </View>

          {loading ? (
            [1, 2].map((i) => (
              <View key={i} className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
                <View className="h-44 bg-border" />
                <View className="p-4 gap-2.5">
                  <View className="h-4 bg-border rounded w-2/3" />
                  <View className="h-3 bg-border rounded w-1/3" />
                  <View className="h-4 bg-border rounded w-1/4" />
                </View>
              </View>
            ))
          ) : loadError ? (
            <ErrorState
              message={loadError}
              onRetry={() => {
                setLoading(true);
                load().finally(() => setLoading(false));
              }}
            />
          ) : properties.length === 0 ? (
            <View className="border border-dashed border-border rounded-2xl py-12 items-center">
              <Text className="text-muted text-center px-6">
                No properties yet. New listings will appear here as soon as they&apos;re added.
              </Text>
            </View>
          ) : (
            <>
              {properties.slice(0, visible).map((p) => (
                <PropertyCard key={p._id} property={p} />
              ))}
              {properties.length > visible && (
                <Pressable
                  onPress={() => setVisible((v) => v + PAGE)}
                  className="border border-primary rounded-xl py-3.5 items-center mt-1"
                >
                  <Text className="text-primary font-semibold">
                    Show {Math.min(PAGE, properties.length - visible)} more
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Lead-gen band */}
        <View className="mx-4 mt-8 rounded-3xl bg-secondary px-5 py-7">
          <Text className="text-white text-xl font-bold leading-7">
            Talk to someone who knows the street, not just the listing.
          </Text>
          <Text className="text-white/65 text-sm mt-2.5 leading-5">
            Leave your number and an advisor will call back with options that fit your budget and timeline.
          </Text>
          <Pressable onPress={() => setShowLead(true)} className="bg-background rounded-xl py-3.5 items-center mt-5">
            <Text className="text-secondary font-bold">Get a call back</Text>
          </Pressable>
          <Text className="text-white/40 text-[11px] text-center mt-3">
            We&apos;ll only call about properties — no spam.
          </Text>
        </View>

        {/* Quick contact — dials/opens directly now that a real number is
            configured, instead of bouncing through the Contact screen. */}
        <View className="flex-row gap-3 px-4 mt-5">
          <Pressable
            onPress={() => Linking.openURL(SUPPORT_TEL_HREF)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3.5"
          >
            <Phone size={16} color="#17855a" />
            <Text className="text-secondary font-semibold text-sm">Call us</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Linking.openURL(whatsappHref("Hi, I am interested in properties on PropFinova."))
            }
            className="flex-1 flex-row items-center justify-center gap-2 bg-[#25D366] rounded-2xl py-3.5"
          >
            <MessageCircle size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">WhatsApp</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LeadModal
        visible={showLead}
        onClose={() => setShowLead(false)}
        property={null}
        {...LEAD_PRESETS.visit}
        title="Get a call back"
        description="Leave your number and an advisor will call you with matching options."
        submitLabel="Request call back"
      />
    </Screen>
  );
}
