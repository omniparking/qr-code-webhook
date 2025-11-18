export interface MailAttachment {
  cid: string;
  filename: string;
  path: string;
}

export interface BillingAddress {
  address1: string;
  address2: string;
  city: string;
  country: string;
  name: string;
  province: string;
  zip: string;
}

export interface BookingTime {
  name: string;
  value: string;
}

export interface DataForServer {
  end_time: string;
  first: string;
  last: string;
  order_num: string;
  start_time: string;
}

export interface EmailData {
  attachments: any;
  from: string;
  html: string;
  orderNum: string;
  to: string;
  cc?: string[];
}

export interface FTPServer {
  host: string;
  password: string;
  port: number;
  secure: boolean;
  user: string;
}

export interface StartAndEndTime {
  start_time: string;
  end_time: string;
}

export interface PriceInfoForMercedes {
  quantity: string;
  subtotal: string;
  tax: string;
  total: string;
}

export interface SMSPayload {
  api_key: string;
  message: string;
  recipient: string;
  sender: string;
  service_type: "sms";
}

export interface SendSMSProps {
  phoneNumber: string;
  orderNum: string;
  startTime: string;
  endTime: string;
  qrCodeData: string;
}

export interface CustomRateCharge {
  unit: "day" | "hour" | "week" | "month";
  duration: number;
  fee?: number;
  fpp?: number;
}

export interface Service {
  description?: string;
  price?: number;
  service?: number;
  ws_description?: string;
  ws_notes?: string;
  ws_order?: string;
}

export interface OptionInventory {
  active?: boolean;
  adjustable?: boolean;
  airport_taxable?: boolean;
  coupon_override?: boolean;
  description?: string;
  gratuity?: "none" | "parking" | "service";
  mandatory?: boolean;
  option?: number;
  overridable?: boolean;
  price?: number;
  sales_taxable?: boolean;
}

export interface Option {
  id?: number;
  option?: number;
  description?: string;
  gratuity?: "none" | "parking" | "service";
  price?: number;
  inventory_obj?: OptionInventory[];
}

export interface Coupon {
  amount?: number;
  code?: string;
  coupon?: number;
  description?: string;
  free_days?: number;
  id?: number;
  min_days?: number;
  notes?: string;
  tax_on_gross?: boolean;
  type?: "inventory" | "ticket";
}

export interface Payment {
  amount: number;
  type: "AR" | "AX" | "CA" | "DC" | "DI" | "GC" | "JC" | "MC" | "PC" | "VI";
  notes: string;
  id?: number;
  dbr_date?: string;
  onfile?:
    | "customer-primary"
    | "customer-secondary"
    | "ticket-primary"
    | "ticket-secondary"
    | "reservation";
  customer?: number | null;
  company?: number | null;
  ar_code?: number | null;
  card?: number | null;
  ticket?: number | null;
  tt_id?: number;
  user?: number;
  status?: "active" | "voided";
  credited?: boolean;
  captcha_token?: string;
  cc_address?: string;
  cc_auth?: string;
  cc_batch?: number;
  cc_expiration?: string;
  cc_name?: string;
  cc_number?: string;
  cc_processor?: number;
  cc_source?: number;
  cc_swipe?: string;
  cc_token?: string;
  cc_ttid?: string;
  cc_zip?: string;
  terminal_id?: string;
  location?: number;
}

export interface Coupon {
  amount?: number;
  code?: string;
  coupon?: number;
  description?: string;
  free_days?: number;
  id?: number;
  min_days?: number;
  notes?: string;
  tax_on_gross?: boolean;
  type?: "inventory" | "ticket";
}

export interface CustomRateCalendar {
  date: string;
  daily_rate: number;
  blackout?: boolean;
  day_based?: boolean;
  hourly_rate?: number;
}

export interface CreateReservationParams {
  customRateCharges: CustomRateCharge[];
  email: string;
  endDate: string;
  lastName: string;
  reservationId: string;
  sourceId: number;
  startDate: string;

  // Optional customer info
  address?: string;
  address2?: string;
  city?: string;
  firstName?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  state?: string;
  zip?: string;

  // Optional reservation details
  allowDup?: boolean;
  customerId?: number | null;
  discount?: number | null;
  location?: number;
  notes?: string;
  otherId?: string;
  parkingZone?: number | null;
  promoCode?: string | null;
  quoteName?: string;
  rate?: number;
  rateHistoryId?: number;

  // Optional arrays
  services?: Service[];
  options?: Option[];
  payments?: Payment[];
  coupons?: Coupon[];
  customRateCalendar?: CustomRateCalendar[];
}

export interface ReservationPayload {
  data: {
    custom_rate_charges: CustomRateCharge[];
    email: string;
    end_date: string;
    last_name: string;
    reservation: string;
    source_id?: number;
    start_date: string;
    address?: string;
    address2?: string;
    allow_dup?: boolean;
    auto_key?: number | null;
    city?: string;
    coupons?: Coupon[];
    custom_rate_calendar?: CustomRateCalendar[];
    customer_id?: number | null;
    discount?: number | null;
    first_name?: string;
    location?: number;
    notes?: string;
    options?: Option[];
    other_id?: string;
    parking_zone?: number | null;
    payments?: Payment[];
    phone?: string;
    phone2?: string;
    phone3?: string;
    points?: number | null;
    promo_code?: string | null;
    quote_name?: string;
    rate_history_id?: number;
    rate?: number;
    services?: Service[];
    state?: string;
    zip?: string;
    quote?: NetparksQuote;
    text_opt_in?: string;
  };
}

// ============================================
// SHOPIFY ORDER TYPES
// ============================================

export interface ShopifyOrder {
  admin_graphql_api_id: string;
  app_id: number;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  closed_at: string | null;
  confirmed: boolean;
  created_at: string;
  currency: string;
  current_subtotal_price_set: PriceSet;
  current_subtotal_price: string;
  current_total_additional_fees_set: any | null;
  current_total_discounts_set: PriceSet;
  current_total_discounts: string;
  current_total_duties_set: any | null;
  current_total_price_set: PriceSet;
  current_total_price: string;
  current_total_tax_set: PriceSet;
  current_total_tax: string;
  device_id: string | null;
  email: string;
  estimated_taxes: boolean;
  financial_status: string;
  fulfillment_status: string | null;
  fulfillments: any[];
  id: number;
  landing_site_ref: string | null;
  line_items: LineItem[];
  location_id: number | null;
  merchant_of_record_app_id: number | null;
  name: string;
  note: string | null;
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_additional_fees_set: any | null;
  original_total_duties_set: any | null;
  payment_gateway_names: string[];
  payment_terms: any | null;
  presentment_currency: string;
  processed_at: string;
  referring_site: string | null;
  refunds: any[];
  shipping_address: any | null;
  shipping_lines: any[];
  source_name: string;
  source_url: string | null;
  subtotal_price_set: PriceSet;
  subtotal_price: string;
  tags: string;
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts_set: PriceSet;
  total_discounts: string;
  total_line_items_price_set: PriceSet;
  total_line_items_price: string;
  total_outstanding: string;
  total_price_set: PriceSet;
  total_price: string;
  total_shipping_price_set: PriceSet;
  total_tax_set: PriceSet;
  total_tax: string;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number | null;
  billing_address?: BillingAddress | null;
  browser_ip?: string | null;
  cart_token?: string | null;
  checkout_id?: number | null;
  checkout_token?: string | null;
  client_details?: {
    accept_language?: string;
    browser_height?: number | null;
    browser_ip?: string;
    browser_width?: number | null;
    session_hash?: string | null;
    user_agent?: string;
  } | null;
  confirmation_number?: string;
  contact_email?: string;
  customer_locale?: string | null;
  customer?: Customer;
  discount_applications?: DiscountApplication[];
  discount_codes?: DiscountCode[];
  landing_site?: string | null;
  note_attributes?: NoteAttribute[];
  phone?: string | null;
  po_number?: string | null;
  reference?: string | null;
  source_identifier?: string | null;
  tax_exempt?: boolean;
  tax_lines?: TaxLine[];
}

export interface PriceSet {
  shop_money: {
    amount: string;
    currency_code: string;
  };
  presentment_money: {
    amount: string;
    currency_code: string;
  };
}

export interface DiscountCode {
  code: string;
  amount: string;
  type: string;
}

export interface BillingAddress {
  address1: string;
  city: string;
  first_name: string;
  last_name: string;
  province: string;
  zip: string;
  address2?: string | null;
  phone?: string;
}

export interface Customer {
  accepts_marketing: boolean;
  admin_graphql_api_id: string;
  created_at: string;
  currency: string;
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  multipass_identifier: string | null;
  note: string | null;
  phone: string | null;
  sms_marketing_consent: any | null;
  state: string;
  tags: string;
  tax_exempt: boolean;
  tax_exemptions: any[];
  updated_at: string;
  verified_email: boolean;
  accepts_marketing_updated_at?: string;
  default_address?: {
    address1: string;
    address2: string | null;
    city: string;
    company: string | null;
    country_code: string;
    country_name: string;
    country: string;
    customer_id: number;
    default: boolean;
    first_name: string;
    id: number;
    last_name: string;
    name: string;
    phone: string;
    province_code: string;
    province: string;
    zip: string;
  };
  email_marketing_consent?: {
    consent_updated_at: string | null;
    opt_in_level: string;
    state: string;
  };
  marketing_opt_in_level?: string;
}

export interface DiscountApplication {
  allocation_method: string;
  description: string;
  target_selection: string;
  target_type: string;
  title: string;
  type: string;
  value_type: string;
  value: string;
}

export interface LineItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  sku: string | null;
  taxable: boolean;
  title: string;
  properties?: LineItemProperty[];
  tax_lines?: TaxLine[];
}

export interface LineItemProperty {
  name: string;
  value: string | any;
}

export interface NoteAttribute {
  name: string;
  value: string;
}

export interface TaxLine {
  channel_liable: boolean;
  price_set: PriceSet;
  price: string;
  rate: number;
  title: string;
}

export interface NetparksQuote {
  name: string;
  index: number;
  fpp: number;
  days_redeemed: number;
  parking_rate_subtotal: number;
  options_subtotal: number;
  savings: number;
  parking_net: number;
  parking_taxes_subtotal: number;
  parking_subtotal: number;
  services_net: number;
  services_taxes_subtotal: number;
  services_subtotal: number;
  taxes_subtotal: number;
  sales_taxes_subtotal: number;
  airport_taxes_subtotal: number;
  parking_sales_tax: number;
  parking_airport_tax: number;
  services_sales_tax: number;
  services_airport_tax: number;
  grand_total: number;
  prepaid: number;
  balance_due: number;
  parking_zone?: any;
  details?: any;
  costs?: {
    minutes: number;
    hours: number;
    days: number;
    weeks: number;
    months: number;
  };
}

export interface NetparksQuoteResponse {
  errors?: Array<{
    code: number;
    message: string;
    type: string;
    notes?: string;
    field?: string;
  }>;
  data?: NetparksQuote[];
}

export interface QuotePayload {
  data: {
    source_id: number;
    start_date: string;
    end_date: string;
    custom_rate_charges?: Array<{
      unit: "day" | "hour" | "week" | "month";
      duration: number;
      fee?: number;
      fpp?: number;
    }>;
    options?: Array<{
      id?: number;
      option?: number;
      description?: string;
      gratuity?: "none" | "parking" | "service";
      price?: number;
      inventory_obj?: Array<{
        option?: number;
        description?: string;
        gratuity?: "none" | "parking" | "service";
        price?: number;
        adjustable?: boolean;
        airport_taxable?: boolean;
        sales_taxable?: boolean;
        overridable?: boolean;
        coupon_override?: boolean;
        mandatory?: boolean;
        active?: boolean;
      }>;
    }>;
    services?: Array<{
      description?: string;
      ws_description?: string;
      ws_notes?: string;
      ws_order?: string;
      price?: number;
    }>;
    coupons?: Array<{
      coupon?: number;
      description?: string;
      notes?: string;
      code?: string;
      amount?: number;
      free_days?: number;
      min_days?: number;
      tax_on_gross?: boolean;
      type?: string;
    }>;
    promo_code?: string | null;
    customer_id?: number | null;
    points?: number | null;
  };
}

// interface BillingAddress {
//   first_name: string;
//   address1: string;
//   phone?: string;
//   city: string;
//   zip: string;
//   province: string;
//   country: string;
//   last_name: string;
//   address2?: string | null;
//   company?: string | null;
//   latitude?: number;
//   longitude?: number;
//   name: string;
//   country_code: string;
//   province_code: string;
// }

// interface LineItem {
//   admin_graphql_api_id: string;
//   duties: any[];
//   fulfillable_quantity: number;
//   fulfillment_service: string;
//   fulfillment_status: string | null;
//   gift_card: boolean;
//   grams: number;
//   id: number;
//   name: string;
//   price_set: PriceSet;
//   price: string;
//   product_exists: boolean;
//   product_id: number | null;
//   quantity: number;
//   requires_shipping: boolean;
//   sku: string | null;
//   taxable: boolean;
//   title: string;
//   total_discount_set: PriceSet;
//   total_discount: string;
//   variant_id: number | null;
//   variant_inventory_management: string | null;
//   variant_title: string | null;
//   vendor: string | null;
//   current_quantity?: number;
//   discount_allocations?: DiscountAllocation[];
//   properties?: LineItemProperty[];
//   tax_lines?: TaxLine[];
// }
