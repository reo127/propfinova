import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CheckCircle2, UploadCloud } from "lucide-react-native";
import { uploadImage } from "../../lib/api";
import { DOCUMENT_SLOTS_BY_GROUP } from "../../lib/loanCategories";

/**
 * Document upload slots — step 4 of the apply flow, and the documents
 * section of the standalone "My Loan Profile" screen. Reuses the same
 * image-picker + uploadImage pattern already used for property photos in
 * app/(tabs)/list-property.js, one slot at a time.
 */
export default function DocumentsStep({ group, documents, setDocuments, token }) {
  const slots = DOCUMENT_SLOTS_BY_GROUP[group] || DOCUMENT_SLOTS_BY_GROUP.other;
  const [uploadingType, setUploadingType] = useState("");

  const docFor = (type) => documents.find((d) => d.type === type);

  const pick = async (type, slotLabel) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload documents.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploadingType(type);
    try {
      const url = await uploadImage(result.assets[0].uri, token);
      setDocuments((prev) => [
        ...prev.filter((d) => d.type !== type),
        { type, label: slotLabel, url, uploadedAt: new Date().toISOString() },
      ]);
    } catch {
      Alert.alert("Upload failed", "Could not upload this document.");
    } finally {
      setUploadingType("");
    }
  };

  return (
    <View>
      {slots.map(({ type, label: slotLabel }) => {
        const doc = docFor(type);
        const uploading = uploadingType === type;
        return (
          <View key={type} className="flex-row items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 mb-2.5">
            <View className="flex-row items-center gap-2.5 flex-1">
              {doc ? <CheckCircle2 size={18} color="#17855a" /> : <UploadCloud size={18} color="#9ca8a2" />}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-secondary" numberOfLines={1}>{slotLabel}</Text>
                {doc ? <Text className="text-xs text-muted">Uploaded</Text> : null}
              </View>
            </View>
            <Pressable onPress={() => pick(type, slotLabel)} disabled={uploading} className="border border-border rounded-lg px-3 py-1.5">
              {uploading ? <ActivityIndicator size="small" /> : <Text className="text-xs font-bold text-secondary">{doc ? "Replace" : "Upload"}</Text>}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
