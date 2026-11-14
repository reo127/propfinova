import {
  Waves,
  Dumbbell,
  Car,
  Trees,
  ShieldCheck,
  Users,
  ArrowUpDown,
  Baby,
  Zap,
  Droplet,
  Wifi,
  Snowflake,
  Gamepad2,
  Home,
} from "lucide-react-native";

// Same keyword matching as the web app's getAmenityIcon (PropertyDetails.jsx),
// trimmed to the icon set that already ships with lucide-react-native.
const RULES = [
  [/swim|pool/, Waves],
  [/gym|fitness|exercise|workout/, Dumbbell],
  [/park|car/, Car],
  [/garden|landscape|green/, Trees],
  [/security|cctv|guard/, ShieldCheck],
  [/club|community|hall/, Users],
  [/elevator|lift/, ArrowUpDown],
  [/playground|kids|children/, Baby],
  [/power|backup|generator|electricity/, Zap],
  [/water|supply/, Droplet],
  [/internet|wifi|broadband/, Wifi],
  [/\bac\b|air|conditioning/, Snowflake],
  [/game|gaming/, Gamepad2],
];

export function getAmenityIcon(label) {
  const lower = (label || "").toLowerCase();
  const match = RULES.find(([re]) => re.test(lower));
  return match ? match[1] : Home;
}
