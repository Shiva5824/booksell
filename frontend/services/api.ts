import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ===== PRODUCT ENDPOINTS =====

export async function getProducts(filters: any = {}) {
  // Map frontend filter keys to backend expected keys
  const params: any = { ...filters };

  if (params.q) {
    params.search = params.q;
    delete params.q;
  }
  if (params.min) {
    params.minPrice = params.min;
    delete params.min;
  }
  if (params.max) {
    params.maxPrice = params.max;
    delete params.max;
  }

  // Clean up empty strings, null or undefined values to ensure backend ignores them
  Object.keys(params).forEach((key) => {
    if (params[key] === "" || params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });

  try {
    const response = await axios.get(`${API_BASE_URL}/products`, {
      params,
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
  if (!userId || userId === "undefined" || userId === "null") {
    return null;
  }
  console.log("[getUserProfile] Fetching profile for userId:", userId);
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
    return response.data.data;
  } catch (error: any) {
    console.error(
      `[getUserProfile] Failed fetching profile for userId: ${userId}. Response:`,
      error.response?.data || error.message
    );
    return null;
  }
}

export async function updateUserProfile(data: { name?: string; avatar?: string; phone?: string; college?: string }) {
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

export async function checkPhoneExists(phone: string): Promise<boolean> {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/check/phone`, {
      params: { phone },
      headers: getAuthHeader(),
    });
    return response.data.exists;
  } catch (error) {
    console.error("Error checking phone existence:", error);
    return false;
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
// ===== ADMIN ENDPOINTS =====

export async function getAdminStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw error;
  }
}

export async function resetAdminTraffic() {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/traffic/reset`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting admin traffic:", error);
    throw error;
  }
}

export async function getAdminUsers() {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeader(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

export async function toggleUserActive(id: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/users/${id}/toggle`, {}, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
}

export async function getAdminProducts() {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/products`, {
      headers: getAuthHeader(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return [];
  }
}

export async function toggleProductDisabled(id: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/products/${id}/toggle`, {}, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error toggling product status:", error);
    throw error;
  }
}

export async function toggleUserRole(id: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/users/${id}/role`, {}, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error toggling user role:", error);
    throw error;
  }
}

export async function deleteUserAccountAdmin(id: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/admin/users/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user account:", error);
    throw error;
  }
}
