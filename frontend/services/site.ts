import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getAuthHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
