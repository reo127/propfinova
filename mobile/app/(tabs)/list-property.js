import { useState } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert, TextInput } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ImagePlus,
  X,
  Home,
  Ruler,
  Sparkles,
  Wallet,
  Film,
  Building2,
  ListChecks,
  Plus,
} from "lucide-react-native";
import Screen from "../../components/Screen";
import { TAB_BAR_CLEARANCE } from "../../components/TabBar";
import Button from "../../components/Button";
import { FormSection, Field, FieldPair, SelectChips, TagInput, LocationField } from "../../components/FormKit";
import { propertiesApi, uploadImage } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";
import { isValidVideoUrl, getThumbnailUrl } from "../../lib/videoUtils";

// Option lists copied from the web form so both surfaces submit identical
// enum values (src/app/list-property/page.jsx).
const TYPES = [
  { value: "apartments", label: "Apartments" },
  { value: "independent-house", label: "Independent House" },
  { value: "villas", label: "Villas" },
  { value: "gated-communities", label: "Gated Communities" },
  { value: "plots", label: "Plots" },
  { value: "villa-plot", label: "Villa Plot" },
  { value: "farm-house", label: "Farm House" },
  { value: "farm-land", label: "Farm Land" },
  { value: "builders-floors", label: "Builders Floors" },
  { value: "penthouse", label: "Penthouse" },
  { value: "cottage", label: "Cottage" },
  { value: "duplex-house", label: "Duplex House" },
  { value: "commercial-space", label: "Commercial Space" },
  { value: "industrial-land", label: "Industrial Land" },
];
const MODES = [
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "sell", label: "Sell" },
];
const BHK_OPTIONS = [
  { value: "1bhk", label: "1 BHK" },
  { value: "2bhk", label: "2 BHK" },
  { value: "2.5bhk", label: "2.5 BHK" },
  { value: "3bhk", label: "3 BHK" },
  { value: "3.5bhk", label: "3.5 BHK" },
  { value: "4bhk", label: "4 BHK" },
  { value: "4.5bhk", label: "4.5 BHK" },
  { value: "5bhk", label: "5 BHK" },
];
const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs-renovation", label: "Needs Renovation" },
];
const FURNISHING = [
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

// Mirrors the Property model's conditional `bhk` requirement.
const BHK_REQUIRED_TYPES = new Set([
  "apartments",
  "independent-house",
  "villas",
  "gated-communities",
  "builders-floors",
  "penthouse",
  "cottage",
  "duplex-house",
]);

const EMPTY = {
  title: "",
  location: "",
  mapLocationLink: "",
  priceFrom: "",
  priceTo: "",
  type: "",
  mode: "",
  carpetArea: "",
  superbuiltArea: "",
  description: "",
  contactNumber: "",
  yearBuilt: "",
  squareFootage: "",
  lotSize: "",
  propertyCondition: "",
  parkingSpaces: "",
  furnishingStatus: "",
  floorNumber: "",
  totalFloors: "",
  availabilityDate: "",
  schoolDistrict: "",
  hoa: "",
  propertyTax: "",
  developer: "",
  possessionDate: "",
  projectArea: "",
  launchDate: "",
  totalUnits: "",
  totalTowers: "",
  projectSize: "",
  bank: "",
  possession: "",
  dimension: "",
};

export default function ListPropertyScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]); // { uri, uploading, url }
  const [videos, setVideos] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [nearbyAmenities, setNearbyAmenities] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [locationAdvantages, setLocationAdvantages] = useState([]);
  const [bhkConfigs, setBhkConfigs] = useState([]); // { bhk, price }

  const [drafts, setDrafts] = useState({
    amenity: "",
    nearby: "",
    highlight: "",
    advantage: "",
    video: "",
  });
  const [currentBhk, setCurrentBhk] = useState("");
  const [currentBhkPrice, setCurrentBhkPrice] = useState("");

  const [open, setOpen] = useState({
    basics: true,
    specs: false,
    amenities: false,
    financial: false,
    media: false,
    project: false,
    highlights: false,
  });
  const toggle = (k) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));
  const setDraft = (key) => (value) => setDrafts((p) => ({ ...p, [key]: value }));

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add property images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled) return;

    const entries = result.assets.map((a) => ({ uri: a.uri, uploading: true, url: null }));
    setImages((prev) => [...prev, ...entries]);

    entries.forEach(async (entry) => {
      try {
        const url = await uploadImage(entry.uri, token);
        setImages((prev) => prev.map((i) => (i.uri === entry.uri ? { ...i, uploading: false, url } : i)));
      } catch {
        setImages((prev) => prev.filter((i) => i.uri !== entry.uri));
        Alert.alert("Upload failed", "Could not upload one of the images.");
      }
    });
  };

  const addVideo = (url) => {
    if (!isValidVideoUrl(url)) {
      setError("Enter a valid YouTube, Vimeo, Dailymotion or direct video URL.");
      return;
    }
    setError("");
    setVideos((prev) => [...prev, url]);
  };

  const addBhkConfig = () => {
    if (!currentBhk) return;
    setBhkConfigs((prev) => [
      ...prev.filter((c) => c.bhk !== currentBhk),
      { bhk: currentBhk, price: currentBhkPrice.trim() },
    ]);
    setCurrentBhk("");
    setCurrentBhkPrice("");
  };

  const onSubmit = async () => {
    const gallery = images.filter((i) => i.url).map((i) => i.url);

    if (!form.title || !form.location || !form.type || !form.mode || !form.description || !form.contactNumber) {
      setError("Please fill in all required fields in Basics.");
      setOpen((p) => ({ ...p, basics: true }));
      return;
    }
    if (!/^\d{10}$/.test(form.contactNumber)) {
      setError("Contact number must be exactly 10 digits.");
      return;
    }
    if (!form.priceFrom && !form.priceTo) {
      setError("Please enter at least one end of the price range.");
      return;
    }
    if (gallery.length === 0) {
      setError("Please add at least one photo.");
      setOpen((p) => ({ ...p, media: true }));
      return;
    }
    if (BHK_REQUIRED_TYPES.has(form.type) && bhkConfigs.length === 0) {
      setError("Add at least one BHK configuration for this property type.");
      setOpen((p) => ({ ...p, basics: true }));
      return;
    }

    // Same price/BHK transform the web form applies before POSTing.
    let price;
    if (form.priceFrom && form.priceTo) price = `${form.priceFrom} - ${form.priceTo}`;
    else if (form.priceFrom) price = `Start from ${form.priceFrom}`;
    else price = `Up to ${form.priceTo}`;

    const payload = {
      ...Object.fromEntries(Object.entries(form).filter(([, v]) => v !== "")),
      price,
      gallery,
      videos,
      amenities,
      nearbyAmenities,
      highlights,
      locationAdvantages,
    };
    delete payload.priceFrom;
    delete payload.priceTo;

    if (bhkConfigs.length > 0) {
      payload.bhkConfigurations = bhkConfigs;
      payload.bhk = bhkConfigs.map((c) => c.bhk).join(", ");
    }

    setError("");
    setSubmitting(true);
    try {
      await propertiesApi.create(payload, token);
      Alert.alert("Submitted", "Your property was submitted and is pending admin approval.");
      setForm(EMPTY);
      setImages([]);
      setVideos([]);
      setAmenities([]);
      setNearbyAmenities([]);
      setHighlights([]);
      setLocationAdvantages([]);
      setBhkConfigs([]);
      router.push("/profile");
    } catch (e) {
      setError(e.message || "Failed to submit property");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_CLEARANCE }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-secondary mb-1 px-1">List Your Property</Text>
        <Text className="text-muted mb-5 px-1">Submissions are reviewed by our team before going live.</Text>

        {/* ---------------------------------------------------- Basics */}
        <FormSection title="Basics" icon={Home} expanded={open.basics} onToggle={() => toggle("basics")}>
          <Field
            label="Property Title"
            required
            value={form.title}
            onChangeText={set("title")}
            placeholder="e.g. 3BHK in Whitefield"
          />
          <LocationField
            required
            value={form.location}
            onChange={set("location")}
            placeholder="Pick a locality or type your own"
            hint="Choose from the list or enter any other area."
          />
          <Field
            label="Map Location Link"
            value={form.mapLocationLink}
            onChangeText={set("mapLocationLink")}
            placeholder="Paste a Google Maps share link"
            autoCapitalize="none"
            hint="Optional — pins the map exactly. Otherwise the location text is geocoded."
          />
          <FieldPair
            label="Price Range"
            required
            left={{
              value: form.priceFrom,
              onChangeText: set("priceFrom"),
              placeholder: "From (50 lakhs)",
            }}
            right={{ value: form.priceTo, onChangeText: set("priceTo"), placeholder: "To (1.2 Cr)" }}
          />
          <SelectChips label="Property Type" required options={TYPES} value={form.type} onChange={set("type")} dark />
          <FieldPair
            label="Dimensions"
            left={{
              value: form.carpetArea,
              onChangeText: set("carpetArea"),
              placeholder: "Carpet (sq ft)",
            }}
            right={{
              value: form.superbuiltArea,
              onChangeText: set("superbuiltArea"),
              placeholder: "Superbuilt (sq ft)",
            }}
          />
          <SelectChips label="Mode" required options={MODES} value={form.mode} onChange={set("mode")} />

          {/* BHK configurations — bhk + price pairs, as on web */}
          <View className="mb-4">
            <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">BHK Configurations</Text>
            <Text className="text-[11px] text-muted mb-2">Add multiple BHK types with their prices.</Text>
            <View className="flex-row flex-wrap gap-2 mb-2.5">
              {BHK_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setCurrentBhk(currentBhk === o.value ? "" : o.value)}
                  className={`px-3 py-2 rounded-full border ${
                    currentBhk === o.value ? "bg-secondary border-secondary" : "bg-background border-border"
                  }`}
                >
                  <Text
                    className={currentBhk === o.value ? "text-white text-sm font-semibold" : "text-muted text-sm"}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2.5">
              <TextInput
                value={currentBhkPrice}
                onChangeText={setCurrentBhkPrice}
                placeholder="Price for this BHK (e.g. 85 lakhs)"
                placeholderTextColor="#9ca8a2"
                className="flex-1 border border-border rounded-xl px-4 py-3 text-foreground bg-background"
              />
              <Pressable
                onPress={addBhkConfig}
                disabled={!currentBhk}
                className={`w-12 items-center justify-center rounded-xl ${currentBhk ? "bg-primary" : "bg-border"}`}
              >
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>

            {bhkConfigs.length > 0 && (
              <View className="mt-2.5 gap-2">
                {bhkConfigs.map((c, i) => (
                  <View
                    key={c.bhk}
                    className="flex-row items-center justify-between bg-background border border-border rounded-xl px-3.5 py-2.5"
                  >
                    <Text className="font-semibold text-secondary text-sm">{c.bhk.toUpperCase()}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-muted text-sm">{c.price || "Price on request"}</Text>
                      <Pressable
                        onPress={() => setBhkConfigs((prev) => prev.filter((_, idx) => idx !== i))}
                        hitSlop={8}
                      >
                        <X size={14} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Field
            label="Description"
            required
            value={form.description}
            onChangeText={set("description")}
            placeholder="Describe the property..."
            multiline
            numberOfLines={4}
            style={{ height: 110, textAlignVertical: "top" }}
          />
          <Field
            label="Contact Number"
            required
            value={form.contactNumber}
            onChangeText={(v) => set("contactNumber")(v.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
          />
        </FormSection>

        {/* --------------------------------------------- Specifications */}
        <FormSection title="Specifications" icon={Ruler} expanded={open.specs} onToggle={() => toggle("specs")}>
          <FieldPair
            label="Year Built / Square Footage"
            left={{
              value: form.yearBuilt,
              onChangeText: set("yearBuilt"),
              placeholder: "Year built",
              keyboardType: "number-pad",
            }}
            right={{
              value: form.squareFootage,
              onChangeText: set("squareFootage"),
              placeholder: "Sq ft",
              keyboardType: "number-pad",
            }}
          />
          <Field label="Lot Size" value={form.lotSize} onChangeText={set("lotSize")} placeholder="e.g. 2400 sq ft" />
          <SelectChips
            label="Property Condition"
            options={CONDITIONS}
            value={form.propertyCondition}
            onChange={set("propertyCondition")}
          />
          <SelectChips
            label="Furnishing Status"
            options={FURNISHING}
            value={form.furnishingStatus}
            onChange={set("furnishingStatus")}
          />
          <FieldPair
            label="Floor Number / Total Floors"
            left={{
              value: form.floorNumber,
              onChangeText: set("floorNumber"),
              placeholder: "Floor no.",
              keyboardType: "number-pad",
            }}
            right={{
              value: form.totalFloors,
              onChangeText: set("totalFloors"),
              placeholder: "Total floors",
              keyboardType: "number-pad",
            }}
          />
          <Field
            label="Parking Spaces"
            value={form.parkingSpaces}
            onChangeText={set("parkingSpaces")}
            placeholder="e.g. 2"
            keyboardType="number-pad"
          />
          <Field
            label="Available From"
            value={form.availabilityDate}
            onChangeText={set("availabilityDate")}
            placeholder="YYYY-MM-DD"
          />
        </FormSection>

        {/* ------------------------------------------------- Amenities */}
        <FormSection title="Amenities" icon={Sparkles} expanded={open.amenities} onToggle={() => toggle("amenities")}>
          <TagInput
            label="Property Amenities"
            placeholder="e.g. Swimming Pool"
            items={amenities}
            draft={drafts.amenity}
            setDraft={setDraft("amenity")}
            onAdd={(v) => setAmenities((p) => [...p, v])}
            onRemove={(i) => setAmenities((p) => p.filter((_, idx) => idx !== i))}
          />
          <TagInput
            label="Nearby Amenities"
            placeholder="e.g. Metro Station — 500m"
            items={nearbyAmenities}
            draft={drafts.nearby}
            setDraft={setDraft("nearby")}
            onAdd={(v) => setNearbyAmenities((p) => [...p, v])}
            onRemove={(i) => setNearbyAmenities((p) => p.filter((_, idx) => idx !== i))}
          />
        </FormSection>

        {/* -------------------------------- Financial & Location info */}
        <FormSection
          title="Financial & Location Info"
          icon={Wallet}
          expanded={open.financial}
          onToggle={() => toggle("financial")}
        >
          <Field
            label="School District"
            value={form.schoolDistrict}
            onChangeText={set("schoolDistrict")}
            placeholder="e.g. Whitefield zone"
          />
          <Field
            label="HOA / Maintenance Fee"
            value={form.hoa}
            onChangeText={set("hoa")}
            placeholder="e.g. ₹3,500 / month"
          />
          <Field
            label="Property Tax (Annual)"
            value={form.propertyTax}
            onChangeText={set("propertyTax")}
            placeholder="e.g. ₹18,000"
          />
        </FormSection>

        {/* ----------------------------------------------------- Media */}
        <FormSection title="Media" icon={Film} expanded={open.media} onToggle={() => toggle("media")}>
          <Text className="text-[11px] font-bold text-muted uppercase mb-2">
            Property Images <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            {images.map((img) => (
              <View key={img.uri} className="w-20 h-20 rounded-xl overflow-hidden">
                <Image source={{ uri: img.uri }} className="w-full h-full" />
                {img.uploading && (
                  <View className="absolute inset-0 bg-black/45 items-center justify-center">
                    <Text className="text-white text-[10px] font-semibold">Uploading</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => setImages((p) => p.filter((i) => i.uri !== img.uri))}
                  className="absolute top-1 right-1 bg-black/65 rounded-full p-1"
                >
                  <X size={10} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={pickImages}
              className="w-20 h-20 rounded-xl border border-dashed border-primary items-center justify-center bg-primary-soft"
            >
              <ImagePlus size={20} color="#17855a" />
            </Pressable>
          </View>

          <TagInput
            label="Property Videos"
            placeholder="YouTube / Vimeo / .mp4 URL"
            hint="Paste a video link and tap +"
            items={videos}
            draft={drafts.video}
            setDraft={setDraft("video")}
            onAdd={addVideo}
            onRemove={(i) => setVideos((p) => p.filter((_, idx) => idx !== i))}
          />

          {videos.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {videos.map((v, i) => {
                const thumb = getThumbnailUrl(v);
                return thumb ? (
                  <Image key={i} source={{ uri: thumb }} className="w-24 h-16 rounded-lg" resizeMode="cover" />
                ) : null;
              })}
            </View>
          )}
        </FormSection>

        {/* --------------------------------------- Project information */}
        <FormSection
          title="Project Information"
          icon={Building2}
          expanded={open.project}
          onToggle={() => toggle("project")}
        >
          <Field
            label="Developer / Builder"
            value={form.developer}
            onChangeText={set("developer")}
            placeholder="e.g. Prestige Group"
          />
          <FieldPair
            label="Possession / Launch Date"
            left={{
              value: form.possessionDate,
              onChangeText: set("possessionDate"),
              placeholder: "Possession",
            }}
            right={{ value: form.launchDate, onChangeText: set("launchDate"), placeholder: "Launch" }}
          />
          <FieldPair
            label="Project Area / Project Size"
            left={{ value: form.projectArea, onChangeText: set("projectArea"), placeholder: "e.g. 5 acres" }}
            right={{ value: form.projectSize, onChangeText: set("projectSize"), placeholder: "e.g. 2 phases" }}
          />
          <FieldPair
            label="Total Units / Total Towers"
            left={{
              value: form.totalUnits,
              onChangeText: set("totalUnits"),
              placeholder: "Units",
              keyboardType: "number-pad",
            }}
            right={{
              value: form.totalTowers,
              onChangeText: set("totalTowers"),
              placeholder: "Towers",
              keyboardType: "number-pad",
            }}
          />
          <Field
            label="Bank Approved"
            value={form.bank}
            onChangeText={set("bank")}
            placeholder="e.g. SBI, HDFC approved"
          />
          <Field
            label="Possession Status"
            value={form.possession}
            onChangeText={set("possession")}
            placeholder="e.g. Ready to move"
          />
          <Field label="Dimension" value={form.dimension} onChangeText={set("dimension")} placeholder="e.g. 30x40" />
        </FormSection>

        {/* ------------------------------------------------ Highlights */}
        <FormSection
          title="Highlights & Location Advantages"
          icon={ListChecks}
          expanded={open.highlights}
          onToggle={() => toggle("highlights")}
        >
          <TagInput
            label="Key Features & Highlights"
            placeholder="e.g. Corner unit with park view"
            items={highlights}
            draft={drafts.highlight}
            setDraft={setDraft("highlight")}
            onAdd={(v) => setHighlights((p) => [...p, v])}
            onRemove={(i) => setHighlights((p) => p.filter((_, idx) => idx !== i))}
          />
          <TagInput
            label="Location Benefits & Connectivity"
            placeholder="e.g. 10 min to ORR"
            items={locationAdvantages}
            draft={drafts.advantage}
            setDraft={setDraft("advantage")}
            onAdd={(v) => setLocationAdvantages((p) => [...p, v])}
            onRemove={(i) => setLocationAdvantages((p) => p.filter((_, idx) => idx !== i))}
          />
        </FormSection>

        {error ? <Text className="text-red-500 text-sm mb-3 px-1">{error}</Text> : null}

        <Button title="Submit for Review" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </Screen>
  );
}
