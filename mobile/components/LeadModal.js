import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { X, Check, CheckCircle2, ShieldCheck } from "lucide-react-native";
import { leadsApi } from "../lib/api";

const BENEFITS = [
  "Zero brokerage on new projects",
  "Verified direct builder floor plans",
  "Priority site visit scheduling",
  "Exclusive launch discounts",
];

/**
 * The app's equivalent of the web LeadCaptureModal. Same three entry points
 * (site visit / brochure / price), same `inquiryType` values on the payload,
 * so leads land in the CRM already categorised the way the site categorises them.
 */
export default function LeadModal({
  visible,
  onClose,
  property,
  title,
  description,
  inquiryType,
  successTitle,
  successMessage,
  submitLabel = "Get Free Consultation",
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // On a property page the location is already known, exactly like the web
  // modal; off a property page the API still requires one, so we ask.
  const needsLocation = !property?.location;

  const close = () => {
    onClose();
    // Reset after the dismiss animation so the form doesn't flicker on the way out.
    setTimeout(() => {
      setDone(false);
      setError("");
      setName("");
      setPhone("");
      setLocation("");
    }, 250);
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (needsLocation && !location.trim()) {
      setError("Please tell us which area you're looking in.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await leadsApi.create({
        name: name.trim(),
        phone,
        inquiryType,
        propertyId: property?._id,
        propertyTitle: property?.title,
        interestedLocation: property?.location || location.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-surface rounded-t-3xl max-h-[90%]">
            {done ? (
              <View className="p-8 items-center">
                <View className="w-16 h-16 rounded-full bg-primary-soft items-center justify-center mb-4">
                  <CheckCircle2 size={32} color="#17855a" />
                </View>
                <Text className="text-xl font-bold text-secondary text-center">{successTitle}</Text>
                <Text className="text-muted text-center mt-2 leading-5">{successMessage}</Text>
                <Pressable onPress={close} className="bg-primary rounded-xl py-3.5 items-center w-full mt-6">
                  <Text className="text-white font-semibold">Close</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
                <View className="flex-row items-start justify-between gap-3 mb-1">
                  <Text className="text-xl font-bold text-secondary flex-1">{title}</Text>
                  <Pressable onPress={close} hitSlop={10} className="w-8 h-8 rounded-full bg-background items-center justify-center">
                    <X size={17} color="#5c7268" />
                  </Pressable>
                </View>
                <Text className="text-muted text-sm mb-5">{description}</Text>

                <View className="bg-primary-soft rounded-2xl p-4 mb-5">
                  {BENEFITS.map((b) => (
                    <View key={b} className="flex-row items-center gap-2.5 mb-2 last:mb-0">
                      <View className="w-4 h-4 rounded-full bg-primary items-center justify-center">
                        <Check size={10} color="#fff" />
                      </View>
                      <Text className="text-sm text-secondary flex-1">{b}</Text>
                    </View>
                  ))}
                </View>

                <Text className="text-xs font-bold text-muted uppercase mb-1.5">Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#9ca8a2"
                  className="border border-border rounded-xl px-4 py-3.5 text-foreground bg-background mb-4"
                />

                <Text className="text-xs font-bold text-muted uppercase mb-1.5">Phone Number</Text>
                <View className="flex-row items-center border border-border rounded-xl bg-background px-4 mb-4">
                  <Text className="text-muted font-medium">+91</Text>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98765 43210"
                    placeholderTextColor="#9ca8a2"
                    keyboardType="number-pad"
                    maxLength={10}
                    className="flex-1 py-3.5 px-2 text-foreground"
                  />
                </View>

                {needsLocation && (
                  <>
                    <Text className="text-xs font-bold text-muted uppercase mb-1.5">Preferred Location</Text>
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder="e.g. Whitefield, Bangalore"
                      placeholderTextColor="#9ca8a2"
                      className="border border-border rounded-xl px-4 py-3.5 text-foreground bg-background mb-4"
                    />
                  </>
                )}

                {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

                <Pressable
                  onPress={onSubmit}
                  disabled={submitting}
                  className={`bg-primary rounded-xl py-4 items-center ${submitting ? "opacity-60" : ""}`}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">{submitLabel}</Text>
                  )}
                </Pressable>

                <View className="flex-row items-center justify-center gap-1.5 mt-4">
                  <ShieldCheck size={13} color="#17855a" />
                  <Text className="text-xs text-muted">100% privacy guaranteed · No spam</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// The three web variants, kept here so every caller opens an identically
// worded modal and tags the lead the same way.
export const LEAD_PRESETS = {
  visit: {
    title: "Book Free Site Visit",
    description: "Visit the property & negotiate the best deal directly with the builder.",
    inquiryType: "general_inquiry",
    submitLabel: "Book Free Site Visit",
    successTitle: "Site Visit Booked!",
    successMessage: "Our team will call you within 2 hours to schedule your free site visit.",
  },
  brochure: {
    title: "Download Brochure",
    description: "Get floor plans, pricing & brochure sent to your phone instantly.",
    inquiryType: "brochure_request",
    submitLabel: "Send Me The Brochure",
    successTitle: "Request Received!",
    successMessage: "Our team will contact you shortly with the property brochure and full details.",
  },
  price: {
    title: "Get Property Price",
    description: "We'll call you within 2 hours with exclusive pricing & offers.",
    inquiryType: "price_request",
    submitLabel: "Unlock Price",
    successTitle: "Thank You!",
    successMessage: "We've received your price enquiry. Our team will share detailed pricing soon.",
  },
};
