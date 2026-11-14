import { useEffect, useState } from "react";
import { View, Text, Pressable, Linking, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { ExternalLink, MapPin } from "lucide-react-native";
import { resolveCoordinates } from "../lib/api";
import { MAP_PROVIDER, googleEmbedUrl, externalMapUrl, leafletHtml } from "../lib/mapConfig";

/**
 * Shows where a property is. The admin/broker pastes a Google Maps share link
 * on the listing form; this resolves it to coordinates via the backend and
 * drops a pin on whichever provider is configured (OpenStreetMap today,
 * Google Maps by setting EXPO_PUBLIC_MAP_PROVIDER=google).
 */
export default function PropertyMap({ location, propertyTitle, mapLocationLink }) {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    resolveCoordinates({ mapLocationLink, location }).then((c) => {
      if (!active) return;
      setCoords(c);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [location, mapLocationLink]);

  const googleUrl = coords && MAP_PROVIDER === "google" ? googleEmbedUrl(coords) : null;
  const source = coords
    ? googleUrl
      ? { uri: googleUrl }
      : { html: leafletHtml({ lat: coords.lat, lng: coords.lng, title: propertyTitle, location }) }
    : null;

  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden">
      {loading ? (
        <View className="h-52 items-center justify-center bg-background">
          <ActivityIndicator color="#17855a" />
          <Text className="text-muted text-sm mt-2">Loading map…</Text>
        </View>
      ) : source ? (
        <WebView
          originWhitelist={["*"]}
          source={source}
          style={{ height: 240, backgroundColor: "#f3faf6" }}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
        />
      ) : (
        <View className="h-28 flex-row items-center justify-center gap-2 bg-background">
          <MapPin size={17} color="#5c7268" />
          <Text className="text-muted text-sm">{location || "Location unavailable"}</Text>
        </View>
      )}

      <Pressable
        onPress={() =>
          Linking.openURL(
            externalMapUrl({ lat: coords?.lat, lng: coords?.lng, location, mapLocationLink })
          )
        }
        className="flex-row items-center justify-center gap-2 py-3.5 border-t border-border"
      >
        <Text className="text-primary font-semibold text-sm">
          Open in {MAP_PROVIDER === "google" ? "Google Maps" : "OpenStreetMap"}
        </Text>
        <ExternalLink size={15} color="#17855a" />
      </Pressable>
    </View>
  );
}
