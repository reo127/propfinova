import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { CheckCircle2, User } from "lucide-react-native";
import Screen from "../../components/Screen";
import SignInPrompt from "../../components/SignInPrompt";
import PersonalStep from "../../components/loan-form/PersonalStep";
import EmploymentStep from "../../components/loan-form/EmploymentStep";
import DocumentsStep from "../../components/loan-form/DocumentsStep";
import { loanProfileApi } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";

const EMPTY = {
  applicantName: "",
  dateOfBirth: "", gender: "", maritalStatus: "", address: "",
  panNumber: "", aadhaarNumber: "",
  employmentType: "salaried", employerName: "", designation: "",
  monthlyIncome: "", existingEmi: "0", workExperienceYears: "", creditScore: "",
  documents: [],
};

/**
 * Standalone editor for the reusable loan KYC/employment/document profile —
 * the mobile counterpart of src/app/user/loan-profile/page.jsx. Reuses the
 * same step components as LoanApplySheet so the two never drift.
 */
export default function LoanProfileScreen() {
  const { token, user } = useAuthStore();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    loanProfileApi
      .get(token)
      .then((d) => {
        if (!d?.success) return;
        const p = d.data;
        setForm((prev) => ({
          ...prev,
          applicantName: p.fullName || user?.name || "",
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
          gender: p.gender || "",
          maritalStatus: p.maritalStatus || "",
          address: p.address || "",
          panNumber: p.panNumber || "",
          aadhaarNumber: p.aadhaarNumber || "",
          employmentType: p.employmentType || "salaried",
          employerName: p.employerName || "",
          designation: p.designation || "",
          monthlyIncome: String(p.monthlyIncome || ""),
          existingEmi: String(p.existingEmi || "0"),
          workExperienceYears: String(p.workExperienceYears || ""),
          creditScore: p.creditScore != null ? String(p.creditScore) : "",
          documents: p.documents || [],
        }));
      })
      .finally(() => setLoading(false));
  }, [token]);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));
  const setDocuments = (updater) =>
    setForm((p) => ({ ...p, documents: typeof updater === "function" ? updater(p.documents) : updater }));

  const save = async () => {
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await loanProfileApi.save(
        {
          fullName: form.applicantName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          address: form.address.trim(),
          panNumber: form.panNumber.trim(),
          aadhaarNumber: form.aadhaarNumber.trim(),
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          designation: form.designation.trim(),
          monthlyIncome: Number(form.monthlyIncome) || 0,
          existingEmi: Number(form.existingEmi) || 0,
          workExperienceYears: Number(form.workExperienceYears) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          documents: form.documents,
        },
        token
      );
      setSaved(true);
    } catch (e) {
      setError(e.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <Screen>
        <SignInPrompt icon={User} title="Sign in to your account" message="Save your KYC and employment details once, reuse them on every loan application." />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#17855a" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Text className="text-muted text-sm mb-4">
          Saved once, reused on every loan application so you don&apos;t have to retype it.
        </Text>

        <SectionCard title="Personal details">
          <PersonalStep form={form} set={set} showContact={false} />
        </SectionCard>

        <SectionCard title="Employment & income">
          <EmploymentStep form={form} set={set} />
        </SectionCard>

        <SectionCard title="Documents">
          <DocumentsStep group="other" documents={form.documents} setDocuments={setDocuments} token={token} />
        </SectionCard>

        {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

        <Pressable
          onPress={save}
          disabled={saving}
          className={`flex-row items-center justify-center gap-2 bg-primary rounded-xl py-3.5 ${saving ? "opacity-60" : ""}`}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {saved ? <CheckCircle2 size={16} color="#fff" /> : null}
              <Text className="text-white font-bold">{saved ? "Saved" : "Save profile"}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function SectionCard({ title, children }) {
  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
      <Text className="text-sm font-bold text-secondary mb-3">{title}</Text>
      {children}
    </View>
  );
}
