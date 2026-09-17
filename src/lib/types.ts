export type ProductOption = { name: string; values: string[] };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
  product_count?: number;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  price_paise: number;
  compare_at_paise: number | null;
  stock: number;
  is_made_to_order: boolean;
  category_name: string | null;
  category_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
};

export type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type Product = ProductCard & {
  description: string | null;
  materials: string | null;
  dimensions: string | null;
  care: string | null;
  lead_time_days: number | null;
  options: ProductOption[];
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  sku: string | null;
  images: ProductImage[];
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  pricePaise: number;
  quantity: number;
  options: Record<string, string>;
};

export type OrderStatus =
  | "pending" | "confirmed" | "making" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  id: string;
  name_snapshot: string;
  image_snapshot: string | null;
  unit_price_paise: number;
  quantity: number;
  options: Record<string, string>;
  line_total_paise: number;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  subtotal_paise: number;
  shipping_paise: number;
  total_paise: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  customer_note: string | null;
  internal_note: string | null;
  created_at: string;
  items?: OrderItem[];
};
