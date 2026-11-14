import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

const SPRING = { damping: 18, stiffness: 190, mass: 0.6 };
const SIDE_MARGIN = 20;
const PAD = 7;

// Solid ink pill on the light page canvas — deliberately opaque rather than
// translucent: frosted glass over a near-white background just reads as a
// washed-out grey, while solid ink reads as a physical, premium object.
const INK = "#10251b";
const ACTIVE = "#17855a";
const INACTIVE_ICON = "rgba(255,255,255,0.55)";

/**
 * Bottom padding every tab screen's scroll container must reserve. The bar
 * floats over content, so without this the last row sits behind it.
 */
export const TAB_BAR_CLEARANCE = 112;

/**
 * Floating tab bar: a detached solid-ink pill with a spring-driven green
 * indicator that slides between tabs, scaling icons and fading labels.
 *
 * NOTE: expo-router 58's bottom-tabs passes `{ state, descriptors, emitter,
 * navigateToTab, insets }` — there is no `navigation` prop, and navigation is
 * driven by route.key (not route.name). See
 * expo-router/build/react-navigation/bottom-tabs/views/BottomTabBar.js.
 */
export default function TabBar({ state, descriptors, emitter, navigateToTab, insets }) {
  const [barWidth, setBarWidth] = useState(0);

  // `href: null` is normalised to `hidden` by expo-router and those routes are
  // filtered upstream; this keeps the broker-only tab out either way.
  const visible = state.routes.filter((r) => descriptors[r.key].options.hidden !== true);
  const focusedKey = state.routes[state.index]?.key;
  const activeIndex = Math.max(0, visible.findIndex((r) => r.key === focusedKey));

  const innerWidth = Math.max(0, barWidth - PAD * 2);
  const tabWidth = visible.length > 0 ? innerWidth / visible.length : 0;

  const indicatorStyle = useAnimatedStyle(
    () => ({
      width: tabWidth,
      transform: [{ translateX: withSpring(tabWidth * activeIndex, SPRING) }],
    }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        bottom: Math.max(insets?.bottom ?? 0, 14),
        zIndex: 10,
      }}
    >
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={{
          backgroundColor: INK,
          borderRadius: 30,
          padding: PAD,
          flexDirection: "row",
          // A deep, wide shadow is what sells "floating" — keep it soft so it
          // reads as elevation rather than a hard outline.
          shadowColor: INK,
          shadowOpacity: 0.34,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 18,
        }}
      >
        {/* Sliding indicator sits behind the items */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: PAD,
                bottom: PAD,
                left: PAD,
                backgroundColor: ACTIVE,
                borderRadius: 24,
              },
              indicatorStyle,
            ]}
          />
        )}

        {visible.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === focusedKey;

          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              if (Platform.OS !== "web") {
                Haptics.selectionAsync().catch(() => {});
              }
              navigateToTab(route.key);
            }
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={options.title ?? route.name}
              icon={options.tabBarIcon}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({ focused, label, icon, accessibilityLabel, onPress, onLongPress }) {
  // Animation modifiers must be produced inside the worklet, so each style
  // returns `withSpring`/`withTiming` directly rather than reading a value
  // computed during render. No dependency array: Reanimated ignores it on
  // native and warns, and the worklet captures `focused` from the closure.
  const iconStyle = useAnimatedStyle(
    () => ({
      transform: [
        { scale: withSpring(focused ? 1.1 : 1, SPRING) },
        { translateY: withSpring(focused ? -1 : 0, SPRING) },
      ],
    }));

  const labelStyle = useAnimatedStyle(
    () => ({ opacity: withTiming(focused ? 1 : 0.55, { duration: 220 }) }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 9 }}
    >
      <Animated.View style={iconStyle}>
        {icon?.({ color: focused ? "#ffffff" : INACTIVE_ICON, size: 21, focused })}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[
          labelStyle,
          {
            fontSize: 10,
            marginTop: 3,
            color: "#ffffff",
            fontWeight: focused ? "700" : "500",
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}
