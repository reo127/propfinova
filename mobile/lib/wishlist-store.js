import { create } from "zustand";
import { wishlistApi } from "./api";

export const useWishlistStore = create((set, get) => ({
  ids: new Set(),
  properties: [],
  loaded: false,

  load: async (token) => {
    if (!token) return;
    try {
      const { data } = await wishlistApi.list(token);
      set({ properties: data, ids: new Set(data.map((p) => p._id)), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  isSaved: (propertyId) => get().ids.has(propertyId),

  toggle: async (propertyId, token) => {
    if (!token) return;
    const saved = get().ids.has(propertyId);
    const nextIds = new Set(get().ids);
    saved ? nextIds.delete(propertyId) : nextIds.add(propertyId);
    set({ ids: nextIds });

    try {
      if (saved) {
        await wishlistApi.remove(propertyId, token);
        set({ properties: get().properties.filter((p) => p._id !== propertyId) });
      } else {
        await wishlistApi.add(propertyId, token);
      }
    } catch {
      // revert optimistic update on failure
      const revertIds = new Set(get().ids);
      saved ? revertIds.add(propertyId) : revertIds.delete(propertyId);
      set({ ids: revertIds });
    }
  },
}));
