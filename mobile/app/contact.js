import { View, Text, Pressable, Linking } from "react-native";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react-native";
import Screen from "../components/Screen";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_TEL_HREF, whatsappHref } from "../lib/contact";

export default function Contact() {
  return (
    <Screen>
      <View className="p-5">
        <Text className="text-2xl font-bold text-secondary mb-1">Get in Touch</Text>
        <Text className="text-muted mb-6">We usually reply within a few minutes.</Text>

        <ContactRow
          icon={Phone}
          label="Call Us"
          value={SUPPORT_PHONE_DISPLAY}
          onPress={() => Linking.openURL(SUPPORT_TEL_HREF)}
        />
        <ContactRow
          icon={MessageCircle}
          label="WhatsApp"
          value="Chat with our team"
          onPress={() => Linking.openURL(whatsappHref())}
        />
        <ContactRow
          icon={Mail}
          label="Email"
          value="support@propfinova.com"
          onPress={() => Linking.openURL("mailto:support@propfinova.com")}
        />
        <ContactRow icon={MapPin} label="Office" value="Bangalore, Karnataka" />
      </View>
    </Screen>
  );
}

function ContactRow({ icon: Icon, label, value, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3.5 mb-3">
      <View className="w-10 h-10 rounded-lg bg-primary-soft items-center justify-center mr-3">
        <Icon size={18} color="#17855a" />
      </View>
      <View>
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="font-semibold text-foreground">{value}</Text>
      </View>
    </Wrapper>
  );
}
