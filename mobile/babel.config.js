module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // expo-router's native-stack transitions require this even though we
    // don't call reanimated APIs directly in our own screens.
    plugins: ["react-native-worklets/plugin"],
  };
};
