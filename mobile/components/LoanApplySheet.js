import { useState } from "react";
import {
  View, Text, TextInput, Pressable, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { X, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react-native";
import { loansApi } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";
import { checkEligibilityGates, formatMoney } from "../lib/loanMath";

/**
 * Loan application sheet — the app counterpart of the web LoanApplyModal.
 *
 * Open to guests, like property enquiries: requiring an account first would
 * only lose applications. A signed-in user's token is sent so the application
 * links to their account.
 */
export default function LoanApplySheet({ product, prefill = {}, onClose }) {
  const token = useAuthStore((s) => s.token);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    applicantName: "",
    phone: "",
    email: "",
    employmentType: "salaried",
    employerName: "",
    monthlyIncome: String(prefill.monthlyIncome || ""),
    existingEmi: String(prefill.existingEmi || "0"),
    creditScore: "",
    loanAmount: String(prefill.loanAmount || ""),
    tenureYears: String(prefill.tenureYears || 20),
    propertyValue: String(prefill.propertyValue || ""),
    propertyLocation: "",
  });

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));
  const num = (k) => (v) => setForm((p) => ({ ...p, [k]: v.replace(/[^\d]/g, "") }));

  const gates = checkEligibilityGates(product, {
    monthlyIncome: Number(form.monthlyIncome) || 0,
    creditScore: Number(form.creditScore) || null,
    employmentType: form.employmentType,
    loanAmount: Number(form.loanAmount) || 0,
  });

  const next = () => {
    if (!form.applicantName.trim()) return setError("Please enter your full name.");
    if (!/^\d{10}$/.test(form.phone)) return setError("Please enter a valid 10-digit phone number.");
    setError("");
    setStep(2);
  };

  const submit = async () => {
    if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) {
      return setError("Please enter your monthly income.");
    }
    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
      return setError("Please enter the loan amount you need.");
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
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          monthlyIncome: Number(form.monthlyIncome),
          existingEmi: Number(form.existingEmi) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          loanAmount: Number(form.loanAmount),
          tenureYears: Number(form.tenureYears) || 20,
          propertyValue: Number(form.propertyValue) || 0,
          propertyLocation: form.propertyLocation.trim(),
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
                  {[1, 2].map((n) => (
                    <View key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`} />
                  ))}
                </View>

                <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
                  {step === 1 ? (
                    <>
                      <Field label="Full name" value={form.applicantName} onChangeText={set("applicantName")} placeholder="As on your PAN card" />
                      <Field
                        label="Phone number"
                        value={form.phone}
                        onChangeText={(v) => set("phone")(v.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                      <Field label="Email (optional)" value={form.email} onChangeText={set("email")} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />

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
                              form.employmentType === v
                                ? "bg-primary-soft border-primary"
                                : "bg-background border-border"
                            }`}
                          >
                            <Text className={`font-semibold text-sm ${form.employmentType === v ? "text-primary" : "text-muted"}`}>
                              {l}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  ) : (
                    <>
                      <Field label="Monthly income (₹)" value={form.monthlyIncome} onChangeText={num("monthlyIncome")} keyboardType="number-pad" placeholder="80000" />
                      <Field label="Existing EMIs (₹)" value={form.existingEmi} onChangeText={num("existingEmi")} keyboardType="number-pad" placeholder="0" />
                      <Field label="Loan needed (₹)" value={form.loanAmount} onChangeText={num("loanAmount")} keyboardType="number-pad" placeholder="4000000" />
                      <Field label="Tenure (years)" value={form.tenureYears} onChangeText={num("tenureYears")} keyboardType="number-pad" placeholder="20" />
                      <Field label="Property value (₹)" value={form.propertyValue} onChangeText={num("propertyValue")} keyboardType="number-pad" placeholder="5000000" />
                      <Field label="Credit score (if known)" value={form.creditScore} onChangeText={num("creditScore")} keyboardType="number-pad" placeholder="750" />
                      <Field label="Property location" value={form.propertyLocation} onChangeText={set("propertyLocation")} placeholder="Whitefield, Bangalore" />
                      {form.employmentType === "salaried" && (
                        <Field label="Employer (optional)" value={form.employerName} onChangeText={set("employerName")} placeholder="Company name" />
                      )}

                      {/* Flagged before submission so nobody waits on a call to
                          learn they never met a published cut-off. */}
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

                  {error ? <Text className="text-red-500 text-sm mb-2">{error}</Text> : null}
                </ScrollView>

                <View className="px-5 py-4 pb-8 border-t border-border">
                  <View className="flex-row gap-2.5">
                    {step === 2 && (
                      <Pressable
                        onPress={() => { setStep(1); setError(""); }}
                        className="border border-border rounded-xl px-6 py-3.5 items-center"
                      >
                        <Text className="text-secondary font-bold">Back</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={step === 1 ? next : submit}
                      disabled={submitting}
                      className={`flex-1 bg-primary rounded-xl py-3.5 items-center ${submitting ? "opacity-60" : ""}`}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white font-bold">
                          {step === 1 ? "Continue" : "Submit application"}
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

function Field({ label, ...props }) {
  return (
    <View className="mb-3.5">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1.5">{label}</Text>
      <TextInput
        placeholderTextColor="#9ca8a2"
        className="border border-border rounded-xl px-4 py-3 text-foreground bg-background"
        {...props}
      />
    </View>
  );
}
