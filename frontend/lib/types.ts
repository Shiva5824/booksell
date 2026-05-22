export type ProductCategory = "ipe" | "eapcet" | "jee" | "neet";
export type ProductCondition = "new" | "good" | "used";
export type ProductStatus = "active" | "sold";

export interface Location {
  _id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  college: string;
  firebaseUid?: string;
  avatar?: string;
  phone?: string;
  locations?: Location[];
  favorites?: string[];
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  condition: ProductCondition;
  category: ProductCategory;
  images: string[];
  description: string;
  college: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  sellerId: User | string;
  status: ProductStatus;
  createdAt: string;
}

export interface ProductFilters {
  q?: string;
  college?: string;
  category?: ProductCategory | "";
  min?: string;
  max?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}
