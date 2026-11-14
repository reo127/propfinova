import nextConfig from "eslint-config-next";

export default [
  // mobile/ is a separate Expo/React Native app with its own dependencies
  // and conventions — not part of this Next.js project's lint scope.
  { ignores: ["mobile/**"] },
  ...nextConfig,
];

