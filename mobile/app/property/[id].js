import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, Linking, FlatList, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  Phone,
  MessageCircle,
  Layers,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Download,
  Tag,
  ArrowRight,
} from "lucide-react-native";
import Screen from "../../components/Screen";
import Badge from "../../components/Badge";
import Gallery from "../../components/Gallery";
import WishlistHeart from "../../components/WishlistHeart";
import EMICalculator from "../../components/EMICalculator";
import PropertyMap from "../../components/PropertyMap";
import EnquiryForm from "../../components/EnquiryForm";
import PropertyCard from "../../components/PropertyCard";
import LeadModal, { LEAD_PRESETS } from "../../components/LeadModal";
import { propertiesApi, resolveImageUrl } from "../../lib/api";
import { typeLabel, modeLabel, formatPrice } from "../../lib/format";
import { parsePriceToNumber } from "../../lib/emi";
import { getAmenityIcon } from "../../lib/amenityIcon";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "amenities", label: "Amenities" },
  { id: "about", label: "About Project" },
  { id: "emi", label: "EMI" },
  { id: "location", label: "Location" },
];

export default function PropertyDetail() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [visibleAmenities, setVisibleAmenities] = useState(12);
  const [lead, setLead] = useState(null); // 'visit' | 'brochure' | 'price'
  const [activeSection, setActiveSection] = useState("overview");

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const offsets = useRef({});

  useEffect(() => {
    propertiesApi
      .get(id)
      .then(({ data }) => setProperty(data))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));

    propertiesApi
      .similar(id)
      .then(({ data }) => setSimilar(data || []))
      .catch(() => setSimilar([]));
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#17855a" />
          <Text className="text-muted mt-3">Loading property…</Text>
        </View>
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <Text className="text-muted text-center mt-10">Property not found.</Text>
      </Screen>
    );
  }

  const images = (property.gallery || []).map(resolveImageUrl);
  const videos = property.videos || [];

  const call = () => property.contactNumber && Linking.openURL(`tel:${property.contactNumber}`);
  const whatsapp = () =>
    property.contactNumber &&
    Linking.openURL(
      `https://wa.me/91${property.contactNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${property.title}`)}`
    );

  const scrollTo = (sectionId) => {
    const y = offsets.current[sectionId];
    if (y != null) scrollRef.current?.scrollTo({ y: y - 8, animated: true });
    setActiveSection(sectionId);
  };

  const trackSection = (sectionId) => (e) => {
    offsets.current[sectionId] = e.nativeEvent.layout.y;
  };

  const keyFacts = [
    { label: "Starting Price", value: formatPrice(property.price), icon: CircleDollarSign },
    {
      label: "Configuration",
      value: `${property.bhk ? property.bhk.toUpperCase() + " " : ""}${typeLabel(property.type)}`,
      icon: Layers,
    },
    { label: "Possession", value: property.possessionDate || "Request details", icon: CalendarDays },
    {
      label: "Project Area",
      value: property.projectArea || (property.squareFootage ? `${property.squareFootage} sq.ft.` : "On request"),
      icon: Sparkles,
    },
  ];

  const heroHighlights = [
    property.developer ? `Developed by ${property.developer}` : null,
    property.totalUnits ? `${property.totalUnits}+ residences` : null,
    property.totalTowers ? `${property.totalTowers} tower${property.totalTowers > 1 ? "s" : ""}` : null,
    property.locationAdvantages?.[0] || property.highlights?.[0] || null,
  ].filter(Boolean);

  const quickFacts = [
    property.squareFootage ? `${property.squareFootage} sq.ft.` : null,
    property.parkingSpaces ? `${property.parkingSpaces} parking` : null,
    property.furnishingStatus ? typeLabel(property.furnishingStatus) : null,
    property.floorNumber
      ? `Floor ${property.floorNumber}${property.totalFloors ? ` of ${property.totalFloors}` : ""}`
      : null,
  ].filter(Boolean);

  const aboutStats = [
    { label: "Project Area", value: property.projectArea },
    { label: "Launch Date", value: property.launchDate },
    { label: "Total Units", value: property.totalUnits },
    { label: "Total Towers", value: property.totalTowers },
    { label: "BHK", value: property.bhk?.toUpperCase() },
    { label: "Carpet Area", value: property.carpetArea },
  ].filter((s) => s.value);

  return (
    // Not wrapped in <Screen>: the gallery is full-bleed under a transparent
    // header, so this screen must not inherit a top safe-area inset.
    <View className="flex-1 bg-background">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 110 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        <Gallery images={images} videos={videos} title={property.title} location={property.location} />

        <View className="px-5 pt-4">
          {/* Trust badges */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="flex-row items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5">
              <BadgeCheck size={13} color="#17855a" />
              <Text className="text-[11px] font-semibold text-secondary">Verified Project</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5">
              <ShieldCheck size={13} color="#17855a" />
              <Text className="text-[11px] font-semibold text-secondary">Zero Brokerage</Text>
            </View>
            <Badge label={modeLabel(property.mode)} tone="dark" />
          </View>

          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-[26px] leading-8 font-bold text-secondary flex-1">{property.title}</Text>
            <WishlistHeart propertyId={property._id} />
          </View>

          <View className="flex-row items-center flex-wrap gap-x-4 gap-y-1 mt-2">
            <View className="flex-row items-center">
              <MapPin size={14} color="#17855a" />
              <Text className="text-muted ml-1">{property.location}</Text>
            </View>
            {property.developer ? (
              <View className="flex-row items-center">
                <Building2 size={14} color="#17855a" />
                <Text className="text-muted ml-1">By {property.developer}</Text>
              </View>
            ) : null}
          </View>

          <Text className="text-primary text-2xl font-bold mt-3">{formatPrice(property.price)}</Text>

          {/* Key metrics */}
          <View className="flex-row flex-wrap gap-3 mt-5">
            {keyFacts.map(({ label, value, icon: Icon }) => (
              <View key={label} className="w-[47%] bg-surface border border-border rounded-2xl p-3.5">
                <View className="w-8 h-8 rounded-full bg-primary-soft items-center justify-center mb-2">
                  <Icon size={15} color="#17855a" />
                </View>
                <Text className="text-[10px] uppercase text-muted">{label}</Text>
                <Text className="text-sm font-semibold text-secondary mt-0.5" numberOfLines={2}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          {/* Primary CTAs — mirrors the web hero's three actions */}
          <View className="gap-2.5 mt-5">
            <Pressable
              onPress={() => setLead("visit")}
              className="flex-row items-center justify-center gap-2 bg-primary rounded-2xl py-4"
            >
              <Text className="text-white font-bold text-base">Book Free Site Visit</Text>
              <ArrowRight size={17} color="#fff" />
            </Pressable>

            <View className="flex-row gap-2.5">
              <Pressable
                onPress={() => setLead("brochure")}
                className="flex-1 flex-row items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3.5"
              >
                <Download size={16} color="#10251b" />
                <Text className="text-secondary font-semibold text-sm">Brochure</Text>
              </Pressable>
              <Pressable
                onPress={() => setLead("price")}
                className="flex-1 flex-row items-center justify-center gap-2 bg-primary-soft border border-primary/20 rounded-2xl py-3.5"
              >
                <Tag size={16} color="#17855a" />
                <Text className="text-primary font-semibold text-sm">Get Price</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-2.5">
              <Pressable onPress={call} className="flex-1 flex-row items-center justify-center gap-2 bg-secondary rounded-2xl py-3.5">
                <Phone size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm">Call Expert</Text>
              </Pressable>
              <Pressable onPress={whatsapp} className="flex-1 flex-row items-center justify-center gap-2 bg-[#25D366] rounded-2xl py-3.5">
                <MessageCircle size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm">WhatsApp</Text>
              </Pressable>
            </View>
          </View>

          {/* Hero highlights */}
          {heroHighlights.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-5">
              {heroHighlights.map((item) => (
                <View key={item} className="bg-background border border-border rounded-full px-3 py-1.5">
                  <Text className="text-xs text-muted">{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section nav */}
        <View className="mt-6 border-y border-border bg-surface">
          <FlatList
            data={SECTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(s) => s.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => scrollTo(item.id)}
                className={`px-3.5 py-2 rounded-full ${activeSection === item.id ? "bg-primary" : "bg-background"}`}
              >
                <Text className={`text-xs font-semibold ${activeSection === item.id ? "text-white" : "text-muted"}`}>
                  {item.label}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* Overview */}
        <View onLayout={trackSection("overview")} className="px-5 pt-7">
          <Text className="text-xl font-bold text-secondary mb-2">Overview</Text>
          <Text className="text-foreground leading-6">
            {property.description || `${property.title} in ${property.location}.`}
          </Text>

          {quickFacts.length > 0 && (
            <View className="bg-surface border border-border rounded-2xl p-4 mt-4">
              <Text className="text-[11px] uppercase font-semibold text-muted mb-3">At a glance</Text>
              {quickFacts.map((fact) => (
                <View key={fact} className="flex-row items-center gap-2.5 mb-2.5">
                  <View className="w-7 h-7 rounded-full bg-primary-soft items-center justify-center">
                    <BadgeCheck size={13} color="#17855a" />
                  </View>
                  <Text className="text-sm text-secondary">{fact}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Amenities */}
        {property.amenities?.length > 0 && (
          <View onLayout={trackSection("amenities")} className="px-5 pt-8">
            <Text className="text-xl font-bold text-secondary mb-3">Amenities</Text>
            <View className="flex-row flex-wrap gap-3">
              {property.amenities.slice(0, visibleAmenities).map((amenity, i) => {
                const Icon = getAmenityIcon(amenity);
                return (
                  <View
                    key={i}
                    className="w-[30%] items-center justify-center bg-surface border border-border rounded-2xl py-3.5 px-1"
                  >
                    <Icon size={20} color="#17855a" />
                    <Text className="text-[11px] text-secondary text-center mt-1.5" numberOfLines={2}>
                      {amenity}
                    </Text>
                  </View>
                );
              })}
            </View>
            {property.amenities.length > visibleAmenities && (
              <Pressable
                onPress={() => setVisibleAmenities((v) => v + 12)}
                className="flex-row items-center justify-center gap-1 mt-4 py-2"
              >
                <Text className="text-primary font-semibold text-sm">
                  Show {property.amenities.length - visibleAmenities} more
                </Text>
                <ChevronDown size={15} color="#17855a" />
              </Pressable>
            )}
          </View>
        )}

        {/* Mid-content conversion banner */}
        <View className="mx-5 mt-8 rounded-2xl bg-primary p-5">
          <Text className="text-white font-bold text-lg">Interested? Visit & get the best deal</Text>
          <Text className="text-white/80 text-sm mt-1">
            On-site visits get exclusive discounts. Limited slots available.
          </Text>
          <Pressable onPress={() => setLead("visit")} className="bg-white rounded-xl py-3 items-center mt-4">
            <Text className="text-primary font-bold">Book Free Site Visit</Text>
          </Pressable>
        </View>

        {/* About project */}
        {(aboutStats.length > 0 || property.highlights?.length || property.locationAdvantages?.length) && (
          <View onLayout={trackSection("about")} className="px-5 pt-8">
            <Text className="text-xl font-bold text-secondary mb-3">About {property.title}</Text>

            {aboutStats.length > 0 && (
              <View className="flex-row flex-wrap gap-3 mb-5">
                {aboutStats.map((stat) => (
                  <View key={stat.label} className="w-[47%] bg-surface border border-border rounded-2xl p-3.5">
                    <Text className="text-[10px] uppercase text-muted">{stat.label}</Text>
                    <Text className="text-base font-bold text-secondary mt-1">{stat.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {property.highlights?.length > 0 && (
              <View className="mb-5">
                <Text className="font-bold text-secondary mb-2">Highlights</Text>
                {property.highlights.map((h, i) => (
                  <View key={i} className="flex-row items-start gap-2 mb-1.5">
                    <CheckCircle2 size={15} color="#17855a" style={{ marginTop: 2 }} />
                    <Text className="text-foreground flex-1">{h}</Text>
                  </View>
                ))}
              </View>
            )}

            {property.locationAdvantages?.length > 0 && (
              <View>
                <Text className="font-bold text-secondary mb-2">Location Advantages</Text>
                {property.locationAdvantages.map((a, i) => (
                  <View key={i} className="flex-row items-start gap-2 mb-1.5">
                    <CheckCircle2 size={15} color="#17855a" style={{ marginTop: 2 }} />
                    <Text className="text-foreground flex-1">{a}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* EMI */}
        <View onLayout={trackSection("emi")} className="px-5 pt-8">
          <Text className="text-xl font-bold text-secondary mb-3">EMI Calculator</Text>
          <EMICalculator defaultPrice={parsePriceToNumber(property.price)} />
        </View>

        {/* Location */}
        <View onLayout={trackSection("location")} className="px-5 pt-8">
          <Text className="text-xl font-bold text-secondary mb-3">Location</Text>
          <PropertyMap
            location={property.location}
            propertyTitle={property.title}
            mapLocationLink={property.mapLocationLink}
          />
        </View>

        {/* Enquiry */}
        <View className="px-5 pt-8">
          <EnquiryForm property={property} />
        </View>

        {/* Similar */}
        {similar.length > 0 && (
          <View className="pt-8">
            <Text className="text-xl font-bold text-secondary mb-3 px-5">
              {property.mode === "buy" ? "More Properties" : "Similar Properties"}
            </Text>
            <FlatList
              data={similar}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              renderItem={({ item }) => (
                <View style={{ width: 240 }}>
                  <PropertyCard property={item} />
                </View>
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* Sticky conversion bar — the web pins this on mobile viewports too */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 px-5 pt-3 bg-surface border-t border-border"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="flex-1">
          <Text className="text-xs font-bold text-secondary" numberOfLines={1}>
            {property.title}
          </Text>
          <Text className="text-[10px] text-muted">Guided visit · pricing help</Text>
        </View>
        <Pressable onPress={() => setLead("visit")} className="bg-primary rounded-xl px-5 py-3">
          <Text className="text-white font-bold text-sm">Book Visit</Text>
        </Pressable>
      </View>

      <LeadModal
        visible={!!lead}
        onClose={() => setLead(null)}
        property={property}
        {...(lead ? LEAD_PRESETS[lead] : LEAD_PRESETS.visit)}
      />
    </View>
  );
}
