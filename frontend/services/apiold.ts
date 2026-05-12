import axios from "axios";
import type { Product, ProductFilters, User } from "@/lib/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 12000
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    // Try to get Firebase token dynamically
    const { auth } = await import("@/lib/firebase");
    const token = await auth.currentUser?.getIdToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Auth header set from Firebase token for:", config.url);
    } else {
      // Fallback to localStorage for compatibility
      const localToken = window.localStorage.getItem("sellchey-token");
      if (localToken) {
        config.headers.Authorization = `Bearer ${localToken}`;
        console.log("Auth header set from localStorage for:", config.url);
      } else {
        console.warn("No auth token found for request:", config.url);
      }
    }
  }
  return config;
});

export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  try {
    const { data } = await api.post<{ data: string[] }>("/uploads/images", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data.data;
  } catch (error) {
    console.error("Failed to upload images:", error);
    throw error;
  }
}

export async function createProduct(productData: any): Promise<Product | null> {
  try {
    const { data } = await api.post<{ data: Product }>("/products", productData);
    return data.data;
  } catch (error: any) {
    console.error("Failed to create product:", error);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Full error:", error);
    throw error;
  }
}

export async function syncAuth(payload: { name?: string; college?: string; avatar?: string } = {}): Promise<User | null> {
  try {
    console.log("Syncing auth with backend...", payload);
    const { data } = await api.post<{ data: User }>("/auth/login", payload);
    console.log("Auth sync successful:", data.data);
    return data.data;
  } catch (error: any) {
    console.error("Failed to sync auth with backend:", error);
    console.error("Response status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    return null;
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  try {
    const { data } = await api.get<{ data: Product[] }>("/products", { params: filters });
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<{ data: User }>("/auth/me");
    return data.data;
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return null;
  }
}
