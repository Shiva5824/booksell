import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type CarouselSection = "hero" | "cta";

export async function getSiteContact() {
  try {
    const response = await axios.get(`${API_BASE_URL}/site/contact`);
    return response.data.data || { supportEmail: "", whatsappNumber: "" };
  } catch (error) {
    console.error("Error fetching site contact:", error);
    return { supportEmail: "", whatsappNumber: "" };
  }
}

export async function updateSiteContact(data: any) {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin/site/contact`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating site contact:", error);
    throw error;
  }
}

// ===== Carousel Media =====
//
// Carousels are namespaced by `section`:
//   - "hero" → top-of-homepage hero carousel (default for back-compat)
//   - "cta"  → "Save More on College Essentials" CTA banner
//
// All endpoints accept `section`. If omitted, the backend treats it as "hero"
// so existing callers continue to work unchanged.

export async function getCarouselMedia(section: CarouselSection = "hero") {
  try {
    const response = await axios.get(`${API_BASE_URL}/site/media`, {
      params: { section },
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching carousel media:", error);
    return [];
  }
}

export async function createCarouselMedia(data: {
  imageUrl: string;
  title?: string;
  description?: string;
  order?: number;
  section?: CarouselSection;
}) {
  try {
    const response = await axios.post(`${API_BASE_URL}/site/media`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error creating carousel media:", error);
    throw error;
  }
}

export async function updateCarouselMedia(id: string, data: any) {
  try {
    const response = await axios.put(`${API_BASE_URL}/site/media/${id}`, data, {
      headers: getAuthHeader(),
    });
    return response.data.data;
  } catch (error) {
    console.error("Error updating carousel media:", error);
    throw error;
  }
}

export async function deleteCarouselMedia(id: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/site/media/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting carousel media:", error);
    throw error;
  }
}

export async function reorderCarouselMedia(
  items: Array<{ id: string; order: number }>,
  section: CarouselSection = "hero",
) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/site/media/reorder`,
      { items, section },
      { headers: getAuthHeader() },
    );
    return response.data.data;
  } catch (error) {
    console.error("Error reordering carousel media:", error);
    throw error;
  }
}
