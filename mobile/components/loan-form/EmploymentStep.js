import { View, Text, Pressable } from "react-native";
import Field from "./Field";

/**
 * Employment & income fields — step 2 of the loan apply flow, and the
 * second section of the standalone "My Loan Profile" screen. Mirrors the
 * web EmploymentStep (src/app/components/loan-form/EmploymentStep.jsx).
 */
export default function EmploymentStep({ form, set }) {
  const selfEmployed = form.employmentType === "self-employed";
  const num = (key) => (v) => set(key)(v.replace(/[^\d]/g, ""));

  return (
    <>
      <Text className="text-[11px] font-bold text-muted uppercase mb-2">I am</Text>
      <View className="flex-row gap-2.5 mb-4">
        {[
          { v: "salaried", l: "Salaried" },
          { v: "self-employed", l: "Self-employed" },
        ].map(({ v, l }) => (
          <Pressable
            key={v}
            onPress={() => set("employmentType")(v)}
            className={`flex-1 py-3 rounded-xl border items-center ${
              form.employmentType === v ? "bg-primary-soft border-primary" : "bg-background border-border"
            }`}
          >
            <Text className={`font-semibold text-sm ${form.employmentType === v ? "text-primary" : "text-muted"}`}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <Field
        label={`${selfEmployed ? "Business name" : "Employer"} (optional)`}
        value={form.employerName}
        onChangeText={set("employerName")}
        placeholder={selfEmployed ? "Business name" : "Company name"}
      />
      <Field
        label={`${selfEmployed ? "Nature of business" : "Designation"} (optional)`}
        value={form.designation}
        onChangeText={set("designation")}
        placeholder={selfEmployed ? "e.g. Retail, Manufacturing" : "e.g. Manager"}
      />
      <Field label="Monthly income (₹)" value={String(form.monthlyIncome)} onChangeText={num("monthlyIncome")} keyboardType="number-pad" placeholder="80000" />
      <Field label="Existing EMIs (₹)" value={String(form.existingEmi)} onChangeText={num("existingEmi")} keyboardType="number-pad" placeholder="0" />
      <Field
        label={selfEmployed ? "Years in business" : "Work experience (years)"}
        value={String(form.workExperienceYears)}
        onChangeText={num("workExperienceYears")}
        keyboardType="number-pad"
        placeholder="3"
      />
      <Field label="Credit score (if known)" value={String(form.creditScore)} onChangeText={num("creditScore")} keyboardType="number-pad" placeholder="750" />
    </>
  );
}
