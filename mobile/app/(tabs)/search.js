import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, FlatList, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Search as SearchIcon, SlidersHorizontal, X, ArrowUpDown, Building2 } from "lucide-react-native";
import Screen from "../../components/Screen";
import { TAB_BAR_CLEARANCE } from "../../components/TabBar";
import PropertyCard from "../../components/PropertyCard";
import { propertiesApi } from "../../lib/api";
import { parsePriceToNumber } from "../../lib/emi";

const TYPES = [
  { value: "apartments", label: "Apartment" },
  { value: "independent-house", label: "Independent House" },
  { value: "villas", label: "Villa" },
  { value: "plots", label: "Plot" },
  { value: "commercial-space", label: "Commercial" },
];
const MODES = [
  { value: "", label: "Any" },
  { value: "buy", label: "Buy" },
  { value: "rent", label: "Rent" },
];
const BHKS = ["1bhk", "2bhk", "3bhk", "4bhk", "5bhk"];
const BUDGETS = [
  { value: "", label: "No limit" },
  { value: "5000000", label: "₹50 Lacs" },
  { value: "10000000", label: "₹1 Cr" },
  { value: "20000000", label: "₹2 Cr" },
  { value: "50000000", label: "₹5 Cr+" },
];
const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];
const SUGGESTED = ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi", "Thane", "Navi Mumbai"];

const EMPTY = { location: "", mode: "", price: "", type: "", bhk: "" };

const LABELS = {
  mode: (v) => MODES.find((m) => m.value === v)?.label,
  price: (v) => `Under ${BUDGETS.find((b) => b.value === v)?.label}`,
  type: (v) => TYPES.find((t) => t.value === v)?.label,
  bhk: (v) => v.toUpperCase(),
  location: (v) => v,
};

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const [filters, setFilters] = useState({ ...EMPTY, mode: params.mode || "" });
  const [draft, setDraft] = useState({ ...EMPTY, mode: params.mode || "" });
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const runSearch = useCallback(async (f) => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.list(f);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(filters);
  }, []);

  const sorted = useMemo(() => {
    const list = [...results];
    if (sort === "price-low") list.sort((a, b) => parsePriceToNumber(a.price) - parsePriceToNumber(b.price));
    if (sort === "price-high") list.sort((a, b) => parsePriceToNumber(b.price) - parsePriceToNumber(a.price));
    return list;
  }, [results, sort]);

  const apply = (next) => {
    setFilters(next);
    setDraft(next);
    runSearch(next);
  };

  const removeFilter = (key) => apply({ ...filters, [key]: "" });

  const activeChips = Object.entries(filters).filter(([, v]) => v);

  return (
    <Screen>
      {/* Header */}
      <View className="px-5 pt-2 pb-3">
        <Text className="text-2xl font-bold text-secondary mb-3">Find a property</Text>

        <View className="flex-row gap-2.5">
          <View className="flex-1 flex-row items-center bg-surface border border-border rounded-2xl px-4">
            <SearchIcon size={17} color="#5c7268" />
            <TextInput
              value={draft.location}
              onChangeText={(v) => setDraft((p) => ({ ...p, location: v }))}
              onSubmitEditing={() => apply(draft)}
              placeholder="City, locality or project"
              placeholderTextColor="#9ca8a2"
              returnKeyType="search"
              className="flex-1 py-3.5 px-2.5 text-foreground"
            />
            {draft.location ? (
              <Pressable onPress={() => apply({ ...filters, location: "" })} hitSlop={8}>
                <X size={16} color="#5c7268" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => setShowFilters(true)}
            className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
          >
            <SlidersHorizontal size={18} color="#fff" />
            {activeChips.filter(([k]) => k !== "location").length > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary items-center justify-center border-2 border-background">
                <Text className="text-white text-[9px] font-bold">
                  {activeChips.filter(([k]) => k !== "location").length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8 }}>
            {activeChips.map(([key, value]) => (
              <Pressable
                key={key}
                onPress={() => removeFilter(key)}
                className="flex-row items-center gap-1.5 bg-primary-soft border border-primary/20 rounded-full px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-primary">{LABELS[key]?.(value) ?? value}</Text>
                <X size={12} color="#17855a" />
              </Pressable>
            ))}
            <Pressable onPress={() => apply({ ...EMPTY })} className="px-3 py-1.5">
              <Text className="text-xs font-semibold text-muted underline">Clear all</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Result bar */}
        <View className="flex-row items-center justify-between mt-3.5">
          <View className="flex-row items-center gap-2">
            <View className="w-1.5 h-1.5 rounded-full bg-primary" />
            <Text className="text-sm text-secondary font-semibold">
              {loading ? "Searching…" : `${results.length} ${results.length === 1 ? "property" : "properties"}`}
            </Text>
          </View>
          <Pressable onPress={() => setShowSort(true)} className="flex-row items-center gap-1.5">
            <ArrowUpDown size={13} color="#17855a" />
            <Text className="text-sm font-medium text-primary">{SORTS.find((s) => s.value === sort)?.label}</Text>
          </Pressable>
        </View>
      </View>

      {loading && results.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-20">
          <ActivityIndicator color="#17855a" />
          <Text className="text-muted text-sm mt-3">Finding properties that match…</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: TAB_BAR_CLEARANCE }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PropertyCard property={item} />}
          ListEmptyComponent={
            <View className="items-center mt-12 px-6">
              <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
                <Building2 size={26} color="#9ca8a2" />
              </View>
              <Text className="text-secondary font-bold text-base mb-1">No properties found</Text>
              <Text className="text-muted text-sm text-center mb-5">
                We couldn&apos;t find anything matching your criteria. Try a different area or loosen the filters.
              </Text>
              <Text className="text-xs text-muted mb-2.5">Try searching in</Text>
              <View className="flex-row flex-wrap justify-center gap-2 mb-6">
                {SUGGESTED.map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => apply({ ...EMPTY, location: loc })}
                    className="px-3.5 py-2 rounded-full border border-border bg-surface"
                  >
                    <Text className="text-sm text-secondary">{loc}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={() => apply({ ...EMPTY })} className="bg-primary px-6 py-3.5 rounded-xl">
                <Text className="text-white font-semibold text-sm">Clear filters & see all</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={showFilters}
        draft={draft}
        setDraft={setDraft}
        onClose={() => {
          setDraft(filters);
          setShowFilters(false);
        }}
        onApply={() => {
          setShowFilters(false);
          apply(draft);
        }}
        onClear={() => {
          setShowFilters(false);
          apply({ ...EMPTY });
        }}
      />

      <SortSheet visible={showSort} value={sort} onSelect={setSort} onClose={() => setShowSort(false)} />
    </Screen>
  );
}

function SortSheet({ visible, value, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <View className="bg-surface rounded-t-3xl p-5 pb-9">
          <Text className="text-lg font-bold text-secondary mb-3">Sort by</Text>
          {SORTS.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => {
                onSelect(s.value);
                onClose();
              }}
              className={`flex-row items-center justify-between py-3.5 px-4 rounded-xl mb-1.5 ${
                value === s.value ? "bg-primary-soft" : "bg-background"
              }`}
            >
              <Text className={value === s.value ? "text-primary font-bold" : "text-foreground"}>{s.label}</Text>
              {value === s.value && <View className="w-2 h-2 rounded-full bg-primary" />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function FilterSheet({ visible, draft, setDraft, onClose, onApply, onClear }) {
  const set = (key, value) => setDraft((p) => ({ ...p, [key]: p[key] === value ? "" : value }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-surface rounded-t-3xl max-h-[88%]">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-border">
            <Text className="text-lg font-bold text-secondary">Filters</Text>
            <Pressable onPress={onClose} hitSlop={10} className="w-8 h-8 rounded-full bg-background items-center justify-center">
              <X size={17} color="#5c7268" />
            </Pressable>
          </View>

          <ScrollView className="px-5 py-4" contentContainerStyle={{ paddingBottom: 16 }}>
            <Group title="Transaction type">
              {MODES.map((m) => (
                <Chip key={m.value} label={m.label} active={draft.mode === m.value} onPress={() => set("mode", m.value)} />
              ))}
            </Group>

            <Group title="Max budget">
              {BUDGETS.map((b) => (
                <Chip key={b.value} label={b.label} active={draft.price === b.value} onPress={() => set("price", b.value)} />
              ))}
            </Group>

            <Group title="Property type">
              {TYPES.map((t) => (
                <Chip key={t.value} label={t.label} active={draft.type === t.value} onPress={() => set("type", t.value)} dark />
              ))}
            </Group>

            <Group title="Configuration">
              {BHKS.map((b) => (
                <Chip key={b} label={b.toUpperCase()} active={draft.bhk === b} onPress={() => set("bhk", b)} dark />
              ))}
            </Group>
          </ScrollView>

          <View className="flex-row gap-3 px-5 py-4 pb-8 border-t border-border">
            <Pressable onPress={onClear} className="flex-1 border border-border rounded-xl py-3.5 items-center">
              <Text className="text-secondary font-semibold">Clear all</Text>
            </Pressable>
            <Pressable onPress={onApply} className="flex-[1.6] bg-primary rounded-xl py-3.5 items-center">
              <Text className="text-white font-bold">Show results</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Group({ title, children }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-bold text-muted uppercase mb-2.5">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress, dark }) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3.5 py-2 rounded-full border ${
        active ? (dark ? "bg-secondary border-secondary" : "bg-primary border-primary") : "bg-background border-border"
      }`}
    >
      <Text className={active ? "text-white text-sm font-semibold" : "text-muted text-sm"}>{label}</Text>
    </Pressable>
  );
}
