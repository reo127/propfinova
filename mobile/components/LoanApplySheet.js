import { useEffect, useState } from "react";
import {
  View, Text, Pressable, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { X, CheckCircle2, ShieldCheck, AlertCircle, Pencil } from "lucide-react-native";
import { loansApi, loanProfileApi } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { checkEligibilityGates, formatMoney } from "../lib/loanMath";
import { groupForLoanType, EXTRA_FIELDS_BY_GROUP, PURPOSE_OPTIONS_BY_GROUP } from "../lib/loanCategories";
import PersonalStep from "./loan-form/PersonalStep";
import EmploymentStep from "./loan-form/EmploymentStep";
import DocumentsStep from "./loan-form/DocumentsStep";
import Field from "./loan-form/Field";

const STEP_TITLES = ["Personal details", "Employment & income", "Loan details", "Documents", "Review & submit"];

/**
 * Loan application sheet — the app counterpart of the web LoanApplyModal.
 * 5 steps (personal/KYC, employment & income, loan details, documents,
 * review). Requires login: once applied, the KYC/employment/document data
 * is saved to the account (src/models/LoanProfile) and prefilled here next
 * time, landing straight on Review.
 */
export default function LoanApplySheet({ product, prefill = {}, onClose }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const group = groupForLoanType(product.loanType);
  const extraFields = EXTRA_FIELDS_BY_GROUP[group] || [];
  const purposeOptions = PURPOSE_OPTIONS_BY_GROUP[group];

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    applicantName: "", phone: "", email: "",
    dateOfBirth: "", gender: "", maritalStatus: "", address: "",
    panNumber: "", aadhaarNumber: "",
    employmentType: "salaried", employerName: "", designation: "",
    monthlyIncome: String(prefill.monthlyIncome || ""), existingEmi: String(prefill.existingEmi || "0"),
    workExperienceYears: "", creditScore: "",
    loanAmount: String(prefill.loanAmount || ""), tenureYears: String(prefill.tenureYears || 20), purpose: "",
    propertyValue: String(prefill.propertyValue || ""), propertyLocation: "",
    loanDetails: {},
    documents: [],
  });

  // Seed from the account, then layer the saved loan profile on top if one
  // exists — and if it does, skip straight to Review.
  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        applicantName: user.name || p.applicantName,
        phone: user.phone || p.phone,
        email: user.email || p.email,
      }));
    }
    if (!token) return;
    let active = true;
    loanProfileApi
      .get(token)
      .then((d) => {
        if (!active || !d?.success) return;
        const p = d.data;
        const hasProfile = Boolean(p?.fullName || p?.panNumber || p?.monthlyIncome || p?.documents?.length);
        if (!hasProfile) return;
        setForm((prev) => ({
          ...prev,
          applicantName: p.fullName || prev.applicantName,
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : "",
          gender: p.gender || "",
          maritalStatus: p.maritalStatus || "",
          address: p.address || "",
          panNumber: p.panNumber || "",
          aadhaarNumber: p.aadhaarNumber || "",
          employmentType: p.employmentType || "salaried",
          employerName: p.employerName || "",
          designation: p.designation || "",
          monthlyIncome: String(p.monthlyIncome || prev.monthlyIncome),
          existingEmi: String(p.existingEmi || prev.existingEmi),
          workExperienceYears: String(p.workExperienceYears || ""),
          creditScore: p.creditScore != null ? String(p.creditScore) : "",
          documents: p.documents || [],
        }));
        setStep(5);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));
  const num = (k) => (v) => setForm((p) => ({ ...p, [k]: v.replace(/[^\d]/g, "") }));
  const setDetail = (k) => (v) => setForm((p) => ({ ...p, loanDetails: { ...p.loanDetails, [k]: v } }));
  const setDocuments = (updater) =>
    setForm((p) => ({ ...p, documents: typeof updater === "function" ? updater(p.documents) : updater }));

  const gates = checkEligibilityGates(product, {
    monthlyIncome: Number(form.monthlyIncome) || 0,
    creditScore: Number(form.creditScore) || null,
    employmentType: form.employmentType,
    loanAmount: Number(form.loanAmount) || 0,
  });

  const validateStep = (n) => {
    if (n === 1) {
      if (!form.applicantName.trim()) return "Please enter your full name.";
      if (!/^\d{10}$/.test(form.phone)) return "Please enter a valid 10-digit phone number.";
    }
    if (n === 2) {
      if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) return "Please enter your monthly income.";
    }
    if (n === 3) {
      if (!form.loanAmount || Number(form.loanAmount) <= 0) return "Please enter the loan amount you need.";
    }
    return "";
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    setStep((s) => Math.min(s + 1, 5));
  };

  const submit = async () => {
    for (const n of [1, 2, 3]) {
      const err = validateStep(n);
      if (err) { setError(err); setStep(n); return; }
    }

    setError("");
    setSubmitting(true);
    try {
      await loansApi.apply(
        {
          loanProduct: product._id,
          applicantName: form.applicantName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          address: form.address.trim(),
          panNumber: form.panNumber.trim(),
          aadhaarNumber: form.aadhaarNumber.trim(),
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          designation: form.designation.trim(),
          monthlyIncome: Number(form.monthlyIncome),
          existingEmi: Number(form.existingEmi) || 0,
          workExperienceYears: Number(form.workExperienceYears) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          loanAmount: Number(form.loanAmount),
          tenureYears: Number(form.tenureYears) || 20,
          purpose: form.purpose,
          propertyValue: Number(form.propertyValue) || 0,
          propertyLocation: form.propertyLocation.trim(),
          loanDetails: form.loanDetails,
          documents: form.documents,
        },
        token
      );
      setDone(true);
    } catch (e) {
      setError(e.message || "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="bg-surface rounded-t-3xl max-h-[92%]">
            {done ? (
              <View className="p-8 items-center">
                <View className="w-16 h-16 rounded-full bg-primary-soft items-center justify-center mb-4">
                  <CheckCircle2 size={32} color="#17855a" />
                </View>
                <Text className="text-xl font-bold text-secondary text-center">
                  Application submitted
                </Text>
                <Text className="text-muted text-center mt-2 leading-5">
                  Our loan team will call you within one working day to collect documents and take
                  this forward with {product.lenderName}.
                </Text>
                <Pressable onPress={onClose} className="bg-primary rounded-xl py-3.5 items-center w-full mt-6">
                  <Text className="text-white font-bold">Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View className="flex-row items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-secondary" numberOfLines={1}>
                      Apply · {product.lenderName}
                    </Text>
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {product.productName} · from {product.interestRateMin}% p.a.
                    </Text>
                  </View>
                  <Pressable onPress={onClose} hitSlop={10} className="w-8 h-8 rounded-full bg-background items-center justify-center">
                    <X size={17} color="#5c7268" />
                  </Pressable>
                </View>

                <View className="flex-row gap-1.5 px-5 pt-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <View key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`} />
                  ))}
                </View>
                <Text className="px-5 pt-1.5 text-[11px] font-bold text-muted uppercase">
                  Step {step} of 5 · {STEP_TITLES[step - 1]}
                </Text>

                <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
                  {step === 1 && <PersonalStep form={form} set={set} />}
                  {step === 2 && <EmploymentStep form={form} set={set} />}

                  {step === 3 && (
                    <>
                      <Field label="Loan needed (₹)" value={form.loanAmount} onChangeText={num("loanAmount")} keyboardType="number-pad" placeholder="4000000" />
                      <Field label="Tenure (years)" value={form.tenureYears} onChangeText={num("tenureYears")} keyboardType="number-pad" placeholder="20" />
                      <Field
                        label={`Purpose${purposeOptions ? ` (${purposeOptions.join(" / ")})` : ""}`}
                        value={form.purpose}
                        onChangeText={set("purpose")}
                        placeholder="What is this loan for?"
                      />

                      {group === "home" && (
                        <>
                          <Field label="Property value (₹)" value={form.propertyValue} onChangeText={num("propertyValue")} keyboardType="number-pad" placeholder="5000000" />
                          <Field label="Property location" value={form.propertyLocation} onChangeText={set("propertyLocation")} placeholder="Whitefield, Bangalore" />
                        </>
                      )}

                      {extraFields.map((f) => (
                        <Field
                          key={f.key}
                          label={`${f.label}${f.options ? ` (${f.options.join(" / ")})` : ""}`}
                          value={form.loanDetails[f.key] || ""}
                          onChangeText={setDetail(f.key)}
                          keyboardType={f.type === "number" ? "number-pad" : "default"}
                          placeholder={f.placeholder}
                        />
                      ))}

                      {!gates.eligible && gates.reasons.length > 0 && (
                        <View className="flex-row items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                          <AlertCircle size={15} color="#d97706" style={{ marginTop: 1 }} />
                          <View className="flex-1">
                            <Text className="text-xs font-bold text-amber-800">This offer may not fit</Text>
                            {gates.reasons.map((r) => (
                              <Text key={r} className="text-xs text-amber-800 mt-0.5">• {r}</Text>
                            ))}
                            <Text className="text-xs text-amber-800 mt-1">
                              You can still apply — we will suggest alternatives.
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {step === 4 && <DocumentsStep group={group} documents={form.documents} setDocuments={setDocuments} token={token} />}

                  {step === 5 && (
                    <ReviewStep form={form} group={group} extraFields={extraFields} product={product} onEdit={setStep} />
                  )}

                  {error ? <Text className="text-red-500 text-sm mb-2">{error}</Text> : null}
                </ScrollView>

                <View className="px-5 py-4 pb-8 border-t border-border">
                  <View className="flex-row gap-2.5">
                    {step > 1 && (
                      <Pressable
                        onPress={() => { setStep((s) => s - 1); setError(""); }}
                        className="border border-border rounded-xl px-6 py-3.5 items-center"
                      >
                        <Text className="text-secondary font-bold">Back</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={step === 5 ? submit : goNext}
                      disabled={submitting}
                      className={`flex-1 bg-primary rounded-xl py-3.5 items-center ${submitting ? "opacity-60" : ""}`}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-bold">
                          {step === 5 ? "Confirm & submit" : "Continue"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                  <View className="flex-row items-center justify-center gap-1.5 mt-3">
                    <ShieldCheck size={13} color="#17855a" />
                    <Text className="text-[11px] text-muted">No fee to apply · Your details stay private</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ReviewStep({ form, group, extraFields, product, onEdit }) {
  const row = (l, v) => (v ? (
    <Text className="text-sm text-secondary mb-0.5"><Text className="text-muted">{l}: </Text>{v}</Text>
  ) : null);

  return (
    <View className="gap-3">
      <Section title="Personal details" onEdit={() => onEdit(1)}>
        {row("Name", form.applicantName)}
        {row("Phone", form.phone)}
        {row("Email", form.email)}
        {row("Date of birth", form.dateOfBirth)}
        {row("PAN", form.panNumber)}
        {row("Aadhaar", form.aadhaarNumber)}
        {row("Address", form.address)}
      </Section>

      <Section title="Employment & income" onEdit={() => onEdit(2)}>
        {row("Employment type", form.employmentType === "self-employed" ? "Self-employed" : "Salaried")}
        {row(form.employmentType === "self-employed" ? "Business" : "Employer", form.employerName)}
        {row("Monthly income", form.monthlyIncome ? formatMoney(Number(form.monthlyIncome)) : "")}
        {row("Existing EMIs", form.existingEmi ? formatMoney(Number(form.existingEmi)) : "")}
      </Section>

      <Section title="Loan details" onEdit={() => onEdit(3)}>
        {row("Lender", `${product.lenderName} · ${product.productName}`)}
        {row("Loan amount", form.loanAmount ? formatMoney(Number(form.loanAmount)) : "")}
        {row("Tenure", form.tenureYears ? `${form.tenureYears} years` : "")}
        {row("Purpose", form.purpose)}
        {group === "home" && row("Property value", form.propertyValue ? formatMoney(Number(form.propertyValue)) : "")}
        {group === "home" && row("Property location", form.propertyLocation)}
        {extraFields.map((f) => row(f.label, form.loanDetails[f.key]))}
      </Section>

      <Section title="Documents" onEdit={() => onEdit(4)}>
        {form.documents.length ? (
          <Text className="text-sm text-secondary">{form.documents.length} document{form.documents.length > 1 ? "s" : ""} attached</Text>
        ) : (
          <Text className="text-sm text-amber-700">No documents uploaded yet</Text>
        )}
      </Section>
    </View>
  );
}

function Section({ title, onEdit, children }) {
  return (
    <View className="border border-border rounded-xl p-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-secondary">{title}</Text>
        <Pressable onPress={onEdit} className="flex-row items-center gap-1">
          <Pencil size={12} color="#17855a" />
          <Text className="text-xs font-bold text-primary">Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}
