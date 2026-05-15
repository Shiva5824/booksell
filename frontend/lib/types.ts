export type ProductCategory = "ipe" | "eapcet" | "jee" | "neet";
export type ProductCondition = "new" | "good" | "used";
export type ProductStatus = "active" | "sold";

export interface User {
  _id: string;
  name: string;
  email: string;
  college: string;
  firebaseUid?: string;
  avatar?: string;
  phone?: string;
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
