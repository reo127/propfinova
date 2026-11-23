import { View, Text, Pressable } from "react-native";
import Field from "./Field";

const GENDER_OPTIONS = [["male", "Male"], ["female", "Female"], ["other", "Other"]];
const MARITAL_OPTIONS = [["single", "Single"], ["married", "Married"], ["other", "Other"]];

function ChipRow({ value, options, onChange }) {
  return (
    <View className="flex-row gap-2 mb-3.5">
      {options.map(([v, l]) => (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-xl border items-center ${value === v ? "bg-primary-soft border-primary" : "bg-background border-border"}`}
        >
          <Text className={`text-xs font-semibold ${value === v ? "text-primary" : "text-muted"}`}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Personal / KYC fields — step 1 of the loan apply flow, and also the first
 * section of the standalone "My Loan Profile" screen. Mirrors the web
 * PersonalStep (src/app/components/loan-form/PersonalStep.jsx) field-for-field.
 *
 * Phone/email aren't part of the reusable LoanProfile (they live on User and
 * are captured per-application instead), so `showContact` is false in the
 * standalone screen — showing them there would let someone "edit" a value
 * that's silently discarded on save.
 */
export default function PersonalStep({ form, set, showContact = true }) {
  return (
    <>
      <Field label="Full name" value={form.applicantName} onChangeText={set("applicantName")} placeholder="As on your PAN card" />
      {showContact && (
        <>
          <Field
            label="Phone number"
            value={form.phone}
            onChangeText={(v) => set("phone")(v.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            keyboardType="number-pad"
            maxLength={10}
          />
          <Field label="Email (optional)" value={form.email} onChangeText={set("email")} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
        </>
      )}
      <Field label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={set("dateOfBirth")} placeholder="1990-01-01" keyboardType="numeric" />

      <Text className="text-[11px] font-bold text-muted uppercase mb-2">Gender</Text>
      <ChipRow value={form.gender} options={GENDER_OPTIONS} onChange={set("gender")} />

      <Text className="text-[11px] font-bold text-muted uppercase mb-2">Marital status</Text>
      <ChipRow value={form.maritalStatus} options={MARITAL_OPTIONS} onChange={set("maritalStatus")} />

      <Field
        label="PAN"
        value={form.panNumber}
        onChangeText={(v) => set("panNumber")(v.toUpperCase())}
        placeholder="ABCDE1234F"
        autoCapitalize="characters"
        maxLength={10}
      />
      <Field
        label="Aadhaar number"
        value={form.aadhaarNumber}
        onChangeText={(v) => set("aadhaarNumber")(v.replace(/\D/g, "").slice(0, 12))}
        placeholder="XXXX XXXX XXXX"
        keyboardType="number-pad"
      />
      <Field
        label="Address"
        value={form.address}
        onChangeText={set("address")}
        placeholder="House no, street, city, state, pincode"
        multiline
        numberOfLines={2}
      />
    </>
  );
}
