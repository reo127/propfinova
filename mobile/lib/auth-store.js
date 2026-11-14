import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authApi } from "./api";

const TOKEN_KEY = "propfinova_token";
const USER_KEY = "propfinova_user";

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    const [token, userRaw] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    set({ token, user: userRaw ? JSON.parse(userRaw) : null, isHydrated: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authApi.login(email, password);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
      set({ token, user, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authApi.register(name, email, password, role);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
      set({ token, user, isLoading: false });
      return user;
    } catch (e) {
      set({ isLoading: false, error: e.message });
      throw e;
    }
  },

  logout: async () => {
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    set({ token: null, user: null });
  },

  isBroker: () => get().user?.role === "builder",
}));
