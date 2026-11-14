import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { leadsApi } from "../lib/api";

export default function EnquiryForm({ property }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (!name || phone.length !== 10) {
      setError("Enter your name and a 10-digit phone number.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await leadsApi.create({
        name,
        phone,
        inquiryType: "general_inquiry",
        propertyId: property._id,
        propertyTitle: property.title,
        interestedLocation: property.location,
      });
      setDone(true);
    } catch (e) {
      setError(e.message || "Failed to submit, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View className="bg-primary-soft rounded-2xl p-5 items-center border border-primary/15">
        <CheckCircle2 size={28} color="#17855a" />
        <Text className="text-primary font-semibold mt-2">Request sent!</Text>
        <Text className="text-muted text-sm text-center mt-1">
          Our team will call you back within 2 hours.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl border border-border p-5">
      <Text className="text-lg font-bold text-secondary">Request a Callback</Text>
      <Text className="text-muted text-sm mt-1 mb-4">
        Get pricing, brochure and a guided visit for this property.
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#9ca8a2"
        className="border border-border rounded-xl px-4 py-3 text-foreground bg-background mb-3"
      />
      <View className="flex-row items-center border border-border rounded-xl bg-background px-4 mb-3">
        <Text className="text-muted font-medium">+91</Text>
        <TextInput
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          placeholderTextColor="#9ca8a2"
          keyboardType="number-pad"
          maxLength={10}
          className="flex-1 py-3 px-2 text-foreground"
        />
      </View>

      {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

      <Pressable onPress={onSubmit} disabled={submitting} className="bg-primary rounded-xl py-3.5 items-center">
        {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Request Callback</Text>}
      </Pressable>
    </View>
  );
}
