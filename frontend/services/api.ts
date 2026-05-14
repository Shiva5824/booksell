import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===== PRODUCT ENDPOINTS =====

export async function getProducts(filters: any = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`, {
      params: filters,
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function createProduct(data: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}/products`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function markProductAsSold(id: string) {
  return updateProduct(id, { status: "sold" });
}

// ===== USER ENDPOINTS =====

export async function getUserProfile(userId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(data: { name?: string; avatar?: string; phone?: string }) {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function getUserProducts(userId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/products`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching user products:", error);
    return [];
  }
}

// ===== UPLOAD ENDPOINTS =====

export async function uploadImages(files: File[]) {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await axios.post(`${API_BASE_URL}/uploads/images`, formData, {
      headers: getAuthHeader(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

// ===== AUTH ENDPOINTS =====

export async function syncAuth(data: any = {}) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error syncing auth:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
