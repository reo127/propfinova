import { Pressable, View, Text, Image } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, BedDouble, ImageIcon, ChevronRight } from "lucide-react-native";
import { resolveImageUrl } from "../lib/api";
import { typeLabel, modeLabel, firstImage, formatPrice } from "../lib/format";
import Badge from "./Badge";
import WishlistHeart from "./WishlistHeart";

export default function PropertyCard({ property }) {
  const router = useRouter();
  const image = resolveImageUrl(firstImage(property.gallery));
  const photoCount = property.gallery?.length || 0;
  const videoCount = property.videos?.length || 0;

  return (
    <Pressable
      onPress={() => router.push(`/property/${property._id}`)}
      className="bg-surface rounded-2xl overflow-hidden mb-4 border border-border"
      style={{ shadowColor: "#10251b", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
    >
      <View className="w-full h-44 bg-primary-soft">
        {image ? (
          <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ImageIcon size={22} color="#5c7268" />
            <Text className="text-muted text-xs mt-1.5">No image</Text>
          </View>
        )}

        <View className="absolute top-3 left-3">
          <Badge label={modeLabel(property.mode)} tone="dark" />
        </View>

        <WishlistHeart propertyId={property._id} className="absolute top-3 right-3" />

        {photoCount > 1 && (
          <View className="absolute bottom-3 left-3 flex-row items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
            <ImageIcon size={11} color="#fff" />
            <Text className="text-white text-[10px] font-semibold">
              {photoCount}
              {videoCount > 0 ? ` · ${videoCount} video${videoCount > 1 ? "s" : ""}` : ""}
            </Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-base font-bold text-secondary" numberOfLines={1}>
          {property.title}
        </Text>

        <View className="flex-row items-center mt-1">
          <MapPin size={13} color="#5c7268" />
          <Text className="text-sm text-muted ml-1 flex-1" numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5 mt-2.5">
          <View className="bg-primary-soft px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-semibold text-primary">Verified</Text>
          </View>
          {property.bhk && property.bhk !== "na" ? (
            <View className="flex-row items-center gap-1 bg-background border border-border px-2 py-0.5 rounded-md">
              <BedDouble size={10} color="#5c7268" />
              <Text className="text-[10px] font-semibold text-muted">{property.bhk.toUpperCase()}</Text>
            </View>
          ) : (
            <View className="bg-background border border-border px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-semibold text-muted">{typeLabel(property.type)}</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-primary font-bold text-lg">{formatPrice(property.price)}</Text>
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-primary">Details</Text>
            <ChevronRight size={13} color="#17855a" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
