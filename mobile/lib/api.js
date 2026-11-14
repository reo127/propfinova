// Talks to the existing PropFinova Next.js backend (src/app/api/**) — no new
// backend was written for the app, it reuses the same JWT auth + Mongo models.
//
// "localhost" on a phone/emulator means the device itself, not your laptop,
// so in dev we derive the dev machine's address from Expo's own packager
// host (Constants.expoConfig.hostUri is already the LAN IP your phone used
// to load this bundle in Expo Go). Set EXPO_PUBLIC_API_URL to override
// (needed for a deployed backend, or if hostUri detection ever misfires).
import Constants from "expo-constants";

function getDevApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  return `http://${host || "localhost"}:3000`;
}

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || getDevApiUrl();

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token, isForm } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const authApi = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
  register: (name, email, password, role) =>
    request("/api/auth/register", { method: "POST", body: { name, email, password, role } }),
};

export const propertiesApi = {
  list: (params = {}, token) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return request(`/api/properties${qs ? `?${qs}` : ""}`, { token });
  },
  get: (id) => request(`/api/properties/${id}`),
  create: (payload, token) => request("/api/properties", { method: "POST", body: payload, token }),
  similar: (id) => request(`/api/properties/similar/${id}`),
};

export const wishlistApi = {
  list: (token) => request("/api/wishlist", { token }),
  add: (propertyId, token) => request("/api/wishlist", { method: "POST", body: { propertyId }, token }),
  remove: (propertyId, token) => request(`/api/wishlist/${propertyId}`, { method: "DELETE", token }),
};

export const leadsApi = {
  create: (payload) => request("/api/leads", { method: "POST", body: payload }),
};

export const contentApi = {
  banners: () => request("/api/banners"),
  heroImage: () => request("/api/hero-image"),
  blogs: (page = 1, limit = 10) => request(`/api/blogs?page=${page}&limit=${limit}`),
  blog: (slug) => request(`/api/blogs/${slug}`),
};

/**
 * Resolves a property to { lat, lng } using the same backend route the
 * website uses: coordinates are pulled out of the admin's Google Maps link
 * when there is one, otherwise the location text is geocoded server-side.
 * Keeping it on the server means OpenStreetMap sees one identified caller
 * rather than every phone hitting Nominatim directly.
 */
export async function resolveCoordinates({ mapLocationLink, location }) {
  if (!mapLocationLink && !location) return null;
  try {
    const res = await fetch(`${API_URL}/api/maps/extract-coordinates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: mapLocationLink || undefined, location: location || undefined }),
    });
    const data = await res.json();
    return data?.success ? data.coordinates : null;
  } catch {
    return null;
  }
}

export async function uploadImage(uri, token) {
  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === "jpg" ? "jpeg" : match[1]}` : "image/jpeg";

  const form = new FormData();
  form.append("file", { uri, name: filename, type });

  const data = await request("/api/upload", { method: "POST", body: form, token, isForm: true });
  return data.url;
}

export function resolveImageUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

export { ApiError };
