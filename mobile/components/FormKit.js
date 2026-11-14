import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, FlatList } from "react-native";
import { ChevronDown, X, Plus, MapPin, Search } from "lucide-react-native";
import { API_URL } from "../lib/api";

/** Collapsible section, mirroring the web form's accordion sections. */
export function FormSection({ title, icon: Icon, expanded, onToggle, children }) {
  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-3">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center gap-2.5">
          {Icon ? <Icon size={16} color="#17855a" /> : null}
          <Text className="font-bold text-secondary">{title}</Text>
        </View>
        <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
          <ChevronDown size={17} color="#9ca8a2" />
        </View>
      </Pressable>
      {expanded && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}

export function Field({ label, hint, required, ...props }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor="#9ca8a2"
        className="border border-border rounded-xl px-4 py-3 text-foreground bg-background"
        {...props}
      />
      {hint ? <Text className="text-[11px] text-muted mt-1">{hint}</Text> : null}
    </View>
  );
}

/** Two inputs side by side (price range, carpet/superbuilt area). */
export function FieldPair({ label, required, left, right }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <View className="flex-row gap-2.5">
        <TextInput
          placeholderTextColor="#9ca8a2"
          className="flex-1 border border-border rounded-xl px-4 py-3 text-foreground bg-background"
          {...left}
        />
        <TextInput
          placeholderTextColor="#9ca8a2"
          className="flex-1 border border-border rounded-xl px-4 py-3 text-foreground bg-background"
          {...right}
        />
      </View>
    </View>
  );
}

/** Chip-based replacement for the web's <select> — avoids a modal per field. */
export function SelectChips({ label, required, options, value, onChange, dark }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-muted uppercase mb-2">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(active ? "" : opt.value)}
              className={`px-3 py-2 rounded-full border ${
                active
                  ? dark
                    ? "bg-secondary border-secondary"
                    : "bg-primary border-primary"
                  : "bg-background border-border"
              }`}
            >
              <Text className={active ? "text-white text-sm font-semibold" : "text-muted text-sm"}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Location field: free text plus a dropdown of known localities, fetched from
 * /api/locations so the list matches the website's (src/utils/locations.js)
 * rather than being duplicated here.
 */
export function LocationField({ label = "Location", required, value, onChange, placeholder, hint }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/locations`)
      .then((r) => r.json())
      .then((d) => active && d?.success && setOptions(d.data || []))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>

      <View className="flex-row gap-2.5">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca8a2"
          className="flex-1 border border-border rounded-xl px-4 py-3 text-foreground bg-background"
        />
        <Pressable
          onPress={() => setOpen(true)}
          disabled={options.length === 0}
          className={`px-3.5 items-center justify-center rounded-xl ${
            options.length === 0 ? "bg-border" : "bg-primary-soft border border-primary/20"
          }`}
        >
          <ChevronDown size={17} color="#17855a" />
        </Pressable>
      </View>
      {hint ? <Text className="text-[11px] text-muted mt-1">{hint}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl max-h-[75%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
              <Text className="text-lg font-bold text-secondary">Choose a locality</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <X size={19} color="#5c7268" />
              </Pressable>
            </View>

            <View className="px-5 pt-3">
              <View className="flex-row items-center bg-background border border-border rounded-xl px-3.5">
                <Search size={15} color="#5c7268" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search localities"
                  placeholderTextColor="#9ca8a2"
                  className="flex-1 py-2.5 px-2 text-foreground"
                />
              </View>
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(l) => l}
              contentContainerStyle={{ padding: 20, paddingTop: 12 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(`${item}, Bangalore`);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex-row items-center gap-2.5 py-3.5 border-b border-border"
                >
                  <MapPin size={15} color="#17855a" />
                  <Text className="text-foreground">{item}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="text-muted text-sm text-center mt-6">
                  No match — close this and type the area manually.
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** Free-text list builder: amenities, highlights, nearby places, videos. */
export function TagInput({ label, hint, placeholder, items, onAdd, onRemove, draft, setDraft, keyboardType }) {
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">{label}</Text>
      <View className="flex-row gap-2.5">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder={placeholder}
          placeholderTextColor="#9ca8a2"
          keyboardType={keyboardType}
          returnKeyType="done"
          className="flex-1 border border-border rounded-xl px-4 py-3 text-foreground bg-background"
        />
        <Pressable onPress={add} className="w-12 items-center justify-center bg-primary rounded-xl">
          <Plus size={18} color="#fff" />
        </Pressable>
      </View>
      {hint ? <Text className="text-[11px] text-muted mt-1">{hint}</Text> : null}

      {items.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2.5">
          {items.map((item, i) => (
            <Pressable
              key={`${item}-${i}`}
              onPress={() => onRemove(i)}
              className="flex-row items-center gap-1.5 bg-primary-soft border border-primary/20 rounded-full px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-primary max-w-56" numberOfLines={1}>
                {item}
              </Text>
              <X size={11} color="#17855a" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
