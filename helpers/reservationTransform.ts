// lib/reservationTransform.ts

// ============================================
// NETPARKS API TYPES
// ============================================

interface CustomRateCharge {
  unit: "day" | "hour" | "week" | "month";
  duration: number;
  fee?: number;
  fpp?: number;
}

interface Service {
  service?: number;
  description?: string;
  ws_description?: string;
  ws_notes?: string;
  ws_order?: string;
  price?: number;
}

interface OptionInventory {
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
}

interface Option {
  id?: number;
  option?: number;
  description?: string;
  gratuity?: "none" | "parking" | "service";
  price?: number;
  inventory_obj?: OptionInventory[];
}

interface Coupon {
  id?: number;
  coupon?: number;
  description?: string;
  notes?: string;
  code?: string;
  amount?: number;
  free_days?: number;
  min_days?: number;
  tax_on_gross?: boolean;
  type?: "inventory" | "ticket";
}

interface Payment {
  amount: number;
  type: "AX" | "MC" | "VI" | "DI" | "DC" | "JC" | "CA" | "AR" | "GC" | "PC";
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

interface Coupon {
  id?: number;
  coupon?: number;
  description?: string;
  notes?: string;
  code?: string;
  amount?: number;
  free_days?: number;
  min_days?: number;
  tax_on_gross?: boolean;
  type?: "inventory" | "ticket";
}

interface CustomRateCalendar {
  date: string;
  daily_rate: number;
  hourly_rate?: number;
  blackout?: boolean;
  day_based?: boolean;
}

interface CreateReservationParams {
  sourceId: number;
  startDate: string;
  endDate: string;
  lastName: string;
  email: string;
  reservationId: string;
  customRateCharges: CustomRateCharge[];

  // Optional customer info
  firstName?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;

  // Optional reservation details
  customerId?: number | null;
  location?: number;
  notes?: string;
  rate?: number;
  rateHistoryId?: number;
  discount?: number | null;
  promoCode?: string | null;
  parkingZone?: number | null;
  quoteName?: string;
  allowDup?: boolean;
  otherId?: string;

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
    source_id: number;
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
  };
}

// ============================================
// SHOPIFY ORDER TYPES
// ============================================

export interface ShopifyOrder {
  id: number;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip?: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
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
  closed_at: string | null;
  confirmation_number?: string;
  confirmed: boolean;
  contact_email?: string;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_subtotal_price_set: PriceSet;
  current_total_additional_fees_set: any | null;
  current_total_discounts: string;
  current_total_discounts_set: PriceSet;
  current_total_duties_set: any | null;
  current_total_price: string;
  current_total_price_set: PriceSet;
  current_total_tax: string;
  current_total_tax_set: PriceSet;
  customer_locale?: string | null;
  device_id: string | null;
  discount_codes?: DiscountCode[];
  email: string;
  estimated_taxes: boolean;
  financial_status: string;
  fulfillment_status: string | null;
  landing_site?: string | null;
  landing_site_ref: string | null;
  location_id: number | null;
  merchant_of_record_app_id: number | null;
  name: string;
  note: string | null;
  note_attributes?: NoteAttribute[];
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_additional_fees_set: any | null;
  original_total_duties_set: any | null;
  payment_gateway_names: string[];
  phone?: string | null;
  po_number?: string | null;
  presentment_currency: string;
  processed_at: string;
  reference?: string | null;
  referring_site: string | null;
  source_identifier?: string | null;
  source_name: string;
  source_url: string | null;
  subtotal_price: string;
  subtotal_price_set: PriceSet;
  tags: string;
  tax_exempt?: boolean;
  tax_lines?: TaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_discounts_set: PriceSet;
  total_line_items_price: string;
  total_line_items_price_set: PriceSet;
  total_outstanding: string;
  total_price: string;
  total_price_set: PriceSet;
  total_shipping_price_set: PriceSet;
  total_tax: string;
  total_tax_set: PriceSet;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number | null;
  billing_address?: BillingAddress | null;
  customer?: Customer;
  discount_applications?: DiscountApplication[];
  fulfillments: any[];
  line_items: LineItem[];
  payment_terms: any | null;
  refunds: any[];
  shipping_address: any | null;
  shipping_lines: any[];
}

interface PriceSet {
  shop_money: {
    amount: string;
    currency_code: string;
  };
  presentment_money: {
    amount: string;
    currency_code: string;
  };
}

interface DiscountCode {
  code: string;
  amount: string;
  type: string;
}

interface NoteAttribute {
  name: string;
  value: string;
}

interface TaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: PriceSet;
  channel_liable: boolean;
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

interface BillingAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string | null;
  city: string;
  province: string;
  zip: string;
  phone?: string;
}

interface Customer {
  id: number;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  state: string;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  phone: string | null;
  email_marketing_consent?: {
    state: string;
    opt_in_level: string;
    consent_updated_at: string | null;
  };
  sms_marketing_consent: any | null;
  tags: string;
  currency: string;
  accepts_marketing_updated_at?: string;
  marketing_opt_in_level?: string;
  tax_exemptions: any[];
  admin_graphql_api_id: string;
  default_address?: {
    id: number;
    customer_id: number;
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
    name: string;
    province_code: string;
    country_code: string;
    country_name: string;
    default: boolean;
  };
}

interface DiscountApplication {
  target_type: string;
  type: string;
  value: string;
  value_type: string;
  allocation_method: string;
  target_selection: string;
  title: string;
  description: string;
}

// interface LineItem {
//   id: number;
//   admin_graphql_api_id: string;
//   current_quantity?: number;
//   fulfillable_quantity: number;
//   fulfillment_service: string;
//   fulfillment_status: string | null;
//   gift_card: boolean;
//   grams: number;
//   name: string;
//   price: string;
//   price_set: PriceSet;
//   product_exists: boolean;
//   product_id: number | null;
//   properties?: LineItemProperty[];
//   quantity: number;
//   requires_shipping: boolean;
//   sku: string | null;
//   taxable: boolean;
//   title: string;
//   total_discount: string;
//   total_discount_set: PriceSet;
//   variant_id: number | null;
//   variant_inventory_management: string | null;
//   variant_title: string | null;
//   vendor: string | null;
//   tax_lines?: TaxLine[];
//   duties: any[];
//   discount_allocations?: DiscountAllocation[];
// }

interface LineItem {
  id: number;
  name: string;
  title: string;
  price: string;
  quantity: number;
  sku: string | null;
  taxable: boolean;
  properties?: LineItemProperty[];
  tax_lines?: TaxLine[];
}

interface LineItemProperty {
  name: string;
  value: string | any;
}

interface DiscountAllocation {
  amount: string;
  amount_set: PriceSet;
  discount_application_index: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if order is from Mercedes partner
 */
export function isMercedesOrder(order: ShopifyOrder): boolean {
  return (
    order.note_attributes?.some(
      (attr) => attr.name === "vendor" && attr.value === "mercedes"
    ) ?? false
  );
}

/**
 * Extract booking start and end dates from line items
 */
function extractBookingDates(lineItems: LineItem[]): {
  startDate: string | null;
  endDate: string | null;
} {
  // Find the parking line item (not facility charge or other fees)
  const parkingItem = lineItems.find(
    (item) =>
      item.name.toUpperCase().includes("PARKING") ||
      item.title.toUpperCase().includes("PARKING")
  );

  if (!parkingItem || !parkingItem.properties) {
    return { startDate: null, endDate: null };
  }

  const startDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-start"
  );
  const endDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-finish"
  );

  return {
    startDate: startDateProp?.value || null,
    endDate: endDateProp?.value || null,
  };
}

/**
 * Calculate the number of days between two dates
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1; // Return at least 1 day
}

/**
 * Get customer information with fallbacks
 */
function getCustomerInfo(order: ShopifyOrder) {
  const billingAddress = order.billing_address;
  const customer = order.customer;
  const defaultAddress = customer?.default_address;

  return {
    firstName: billingAddress?.first_name || customer?.first_name || "",
    lastName: billingAddress?.last_name || customer?.last_name || "",
    email: order.email || order.contact_email || customer?.email || "",
    phone:
      order.phone ||
      billingAddress?.phone ||
      defaultAddress?.phone ||
      customer?.phone ||
      null,
    address: billingAddress?.address1 || defaultAddress?.address1 || null,
    address2: billingAddress?.address2 || defaultAddress?.address2 || null,
    city: billingAddress?.city || defaultAddress?.city || null,
    state: billingAddress?.province || defaultAddress?.province || null,
    zip: billingAddress?.zip || defaultAddress?.zip || null,
  };
}

// ============================================
// PAYLOAD CREATION FUNCTIONS
// ============================================

/**
 * Creates a reservation payload for the NetParks API
 */
function createReservationPayload(
  params: CreateReservationParams
): ReservationPayload {
  const payload: ReservationPayload = {
    data: {
      // Required fields
      source_id: params.sourceId,
      start_date: params.startDate,
      end_date: params.endDate,
      last_name: params.lastName,
      email: params.email,
      reservation: params.reservationId,
      custom_rate_charges: params.customRateCharges,
    },
  };

  // Add optional customer information
  if (params.firstName) payload.data.first_name = params.firstName;
  if (params.address) payload.data.address = params.address;
  if (params.address2) payload.data.address2 = params.address2;
  if (params.city) payload.data.city = params.city;
  if (params.state) payload.data.state = params.state;
  if (params.zip) payload.data.zip = params.zip;
  if (params.phone) payload.data.phone = params.phone;
  if (params.phone2) payload.data.phone2 = params.phone2;
  if (params.phone3) payload.data.phone3 = params.phone3;

  // Add optional reservation details
  if (params.customerId !== undefined)
    payload.data.customer_id = params.customerId;
  if (params.location) payload.data.location = params.location;
  if (params.notes) {
    payload.data.notes = params.notes;
  }
  if (params.rate) payload.data.rate = params.rate;
  if (params.rateHistoryId) payload.data.rate_history_id = params.rateHistoryId;
  if (params.discount !== undefined) payload.data.discount = params.discount;
  if (params.promoCode !== undefined)
    payload.data.promo_code = params.promoCode;
  if (params.parkingZone !== undefined)
    payload.data.parking_zone = params.parkingZone;
  if (params.allowDup !== undefined) payload.data.allow_dup = params.allowDup;
  if (params.otherId) payload.data.other_id = params.otherId;
  if (params.quoteName) payload.data.quote_name = params.quoteName;

  // Add optional arrays
  if (params.services && params.services.length > 0) {
    payload.data.services = params.services;
  }
  if (params.options && params.options.length > 0) {
    payload.data.options = params.options;
  }
  if (params.payments && params.payments.length > 0) {
    payload.data.payments = params.payments;
  }
  if (params.coupons && params.coupons.length > 0) {
    payload.data.coupons = params.coupons;
  }
  if (params.customRateCalendar && params.customRateCalendar.length > 0) {
    payload.data.custom_rate_calendar = params.customRateCalendar;
  }

  return payload;
}

// ============================================
// FACILITY CHARGE HANDLING
// ============================================

/**
 * Extract facility charge from line items
 * Looks for line items with "Facility Charge" in the name
 */
function extractFacilityCharge(lineItems: LineItem[]): {
  hasFacilityCharge: boolean;
  facilityChargeAmount: number;
  facilityChargeItem: LineItem | null;
} {
  const facilityChargeItem = lineItems.find(
    (item) =>
      item.name.toLowerCase().includes("facility charge") ||
      item.title.toLowerCase().includes("facility charge")
  );

  if (!facilityChargeItem) {
    return {
      hasFacilityCharge: false,
      facilityChargeAmount: 0,
      facilityChargeItem: null,
    };
  }

  const amount =
    parseFloat(facilityChargeItem.price) * facilityChargeItem.quantity;

  return {
    hasFacilityCharge: true,
    facilityChargeAmount: amount,
    facilityChargeItem: facilityChargeItem,
  };
}

/**
 * Extract discount/coupon information
 */
function extractCoupons(order: ShopifyOrder): Coupon[] {
  if (!order.discount_codes || order.discount_codes.length === 0) {
    return [];
  }

  return order.discount_codes.map((discount) => ({
    code: discount.code,
    description: discount.code,
    amount: parseFloat(discount.amount),
    type: "inventory" as const,
  }));
}

/**
 * Create an Option object for the facility charge
 */
function createFacilityChargeOption(facilityChargeItem: LineItem): Option {
  const price =
    parseFloat(facilityChargeItem.price) * facilityChargeItem.quantity;

  return {
    description: facilityChargeItem.title || facilityChargeItem.name,
    price: price,
    gratuity: "none",
    // Optional: Add inventory_obj for more detailed information
    inventory_obj: [
      {
        description: facilityChargeItem.title || facilityChargeItem.name,
        price: price,
        gratuity: "none",
        adjustable: false,
        airport_taxable: facilityChargeItem.taxable,
        sales_taxable: facilityChargeItem.taxable,
        overridable: false,
        coupon_override: false,
        mandatory: true,
        active: true,
      },
    ],
  };
}

/**
 * Calculate parking subtotal (excluding facility charges and other fees)
 */
function calculateParkingSubtotal(lineItems: LineItem[]): number {
  const parkingItems = lineItems.filter(
    (item) =>
      (item.name.includes("PARKING") || item.title.includes("PARKING")) &&
      !item.name.toLowerCase().includes("facility") &&
      !item.name.toLowerCase().includes("fee")
  );

  const total = parkingItems.reduce((sum, item) => {
    const itemTotal = parseFloat(item.price) * item.quantity;
    return sum + itemTotal;
  }, 0);

  return total;
}

/**
 * Extract all additional services from line items
 * This includes facility charges and any other service-type items
 */
function extractServices(lineItems: LineItem[]): Service[] {
  const services: Service[] = [];

  // Look for service items (non-parking items)
  const serviceItems = lineItems.filter(
    (item) =>
      !item.name.includes("PARKING") &&
      !item.title.includes("PARKING") &&
      !item.name.toLowerCase().includes("facility charge") // We'll handle this as an option
  );

  serviceItems.forEach((item) => {
    services.push({
      description: item.title || item.name,
      price: parseFloat(item.price) * item.quantity,
      ws_description: item.sku || undefined,
    });
  });

  return services;
}

/**
 * Extract all options from line items
 * This includes facility charges and any other option-type items
 */
function extractOptions(lineItems: LineItem[]): Option[] {
  const options: Option[] = [];

  // Extract facility charge as an option
  const { hasFacilityCharge, facilityChargeItem } =
    extractFacilityCharge(lineItems);

  if (hasFacilityCharge && facilityChargeItem) {
    options.push(createFacilityChargeOption(facilityChargeItem));
  }

  // You can add logic here to extract other options if needed
  // For example, if you have "Oversized Vehicle" or other add-ons

  return options;
}

/**
 * Order total breakdown
 */
export interface OrderTotals {
  // Subtotals
  parkingSubtotal: number;
  facilityChargeSubtotal: number;
  otherFeesSubtotal: number;
  subtotalBeforeDiscounts: number;

  // Discounts
  discountAmount: number;
  discountPercentage: number;

  // After discounts
  subtotalAfterDiscounts: number;

  // Taxes
  federalTax: number;
  privilegeFee: number;
  otherTaxes: number;
  totalTax: number;

  // Final totals
  grandTotal: number;

  // Additional info
  isFreeOrder: boolean;
  vendorType: "general" | "mercedes";
  numberOfDays: number;
  dailyRate: number;
}

/**
 * Extract line item breakdown
 */
interface LineItemBreakdown {
  parkingItems: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  facilityCharges: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  otherFees: Array<{
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
}

/**
 * Get detailed breakdown of line items
 */
function getLineItemBreakdown(order: ShopifyOrder): LineItemBreakdown {
  const breakdown: LineItemBreakdown = {
    parkingItems: [],
    facilityCharges: [],
    otherFees: [],
  };

  order.line_items.forEach((item) => {
    const itemData = {
      name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity,
      total: parseFloat(item.price) * item.quantity,
    };

    // Categorize the line item
    const nameUpper = item.name.toUpperCase();
    const nameLower = item.name.toLowerCase();

    if (nameUpper.includes("PARKING")) {
      breakdown.parkingItems.push(itemData);
    } else if (
      nameLower.includes("facility charge") ||
      nameLower.includes("facility fee")
    ) {
      breakdown.facilityCharges.push(itemData);
    } else {
      breakdown.otherFees.push(itemData);
    }
  });

  return breakdown;
}

/**
 * Calculate tax breakdown from order
 */
function calculateTaxBreakdown(order: ShopifyOrder): {
  federalTax: number;
  privilegeFee: number;
  otherTaxes: number;
  totalTax: number;
} {
  let federalTax = 0;
  let privilegeFee = 0;
  let otherTaxes = 0;

  // Check order-level tax lines first
  if (order.tax_lines && order.tax_lines.length > 0) {
    order.tax_lines.forEach((tax) => {
      const amount = parseFloat(tax.price);
      const titleLower = tax.title.toLowerCase();

      if (titleLower.includes("federal")) {
        federalTax += amount;
      } else if (titleLower.includes("privilege")) {
        privilegeFee += amount;
      } else {
        otherTaxes += amount;
      }
    });
  } else {
    // If no order-level taxes, sum from line items
    order.line_items.forEach((item) => {
      if (item.tax_lines) {
        item.tax_lines.forEach((tax) => {
          const amount = parseFloat(tax.price);
          const titleLower = tax.title.toLowerCase();

          if (titleLower.includes("federal")) {
            federalTax += amount;
          } else if (titleLower.includes("privilege")) {
            privilegeFee += amount;
          } else {
            otherTaxes += amount;
          }
        });
      }
    });
  }

  const totalTax = federalTax + privilegeFee + otherTaxes;

  return { federalTax, privilegeFee, otherTaxes, totalTax };
}

/**
 * Extract booking dates and calculate number of days
 */
function extractDaysFromOrder(order: ShopifyOrder): number {
  const parkingItem = order.line_items.find(
    (item) =>
      item.name.toUpperCase().includes("PARKING") ||
      item.title.toUpperCase().includes("PARKING")
  );

  if (!parkingItem || !parkingItem.properties) {
    return 1; // Default to 1 day if can't calculate
  }

  const startDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-start"
  );
  const endDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-finish"
  );

  if (!startDateProp?.value || !endDateProp?.value) {
    return 1;
  }

  const start = new Date(startDateProp.value);
  const end = new Date(endDateProp.value);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays || 1;
}

/**
 * Calculate comprehensive order totals for both Mercedes and general orders
 * @param order - Shopify order object
 * @returns Detailed breakdown of all order amounts
 */
export function calculateOrderTotals(order: ShopifyOrder): OrderTotals {
  // Determine vendor type
  const vendorType = isMercedesOrder(order) ? "mercedes" : "general";

  // Get line item breakdown
  const breakdown = getLineItemBreakdown(order);

  // Calculate subtotals
  const parkingSubtotal = breakdown.parkingItems.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const facilityChargeSubtotal = breakdown.facilityCharges.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const otherFeesSubtotal = breakdown.otherFees.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const subtotalBeforeDiscounts =
    parkingSubtotal + facilityChargeSubtotal + otherFeesSubtotal;

  // Calculate discount amount
  let discountAmount = 0;
  let discountPercentage = 0;

  if (order.discount_codes && order.discount_codes.length > 0) {
    // Get discount from discount_codes
    discountAmount = order.discount_codes.reduce((sum, discount) => {
      return sum + parseFloat(discount.amount);
    }, 0);

    // Calculate percentage if possible
    if (subtotalBeforeDiscounts > 0) {
      discountPercentage = (discountAmount / subtotalBeforeDiscounts) * 100;
    }
  } else {
    // Fallback: calculate from total_discounts field
    discountAmount = parseFloat(order.total_discounts || "0");
    if (subtotalBeforeDiscounts > 0) {
      discountPercentage = (discountAmount / subtotalBeforeDiscounts) * 100;
    }
  }

  // Calculate subtotal after discounts
  const subtotalAfterDiscounts = subtotalBeforeDiscounts - discountAmount;

  // Calculate tax breakdown
  const taxes = calculateTaxBreakdown(order);

  // Calculate grand total
  const grandTotal = subtotalAfterDiscounts + taxes.totalTax;

  // Check if it's a free order
  const isFreeOrder = grandTotal === 0 || vendorType === "mercedes";

  // Calculate number of days and daily rate
  const numberOfDays = extractDaysFromOrder(order);
  const dailyRate = numberOfDays > 0 ? parkingSubtotal / numberOfDays : 0;

  return {
    // Subtotals
    parkingSubtotal: parseFloat(parkingSubtotal.toFixed(2)),
    facilityChargeSubtotal: parseFloat(facilityChargeSubtotal.toFixed(2)),
    otherFeesSubtotal: parseFloat(otherFeesSubtotal.toFixed(2)),
    subtotalBeforeDiscounts: parseFloat(subtotalBeforeDiscounts.toFixed(2)),

    // Discounts
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    discountPercentage: parseFloat(discountPercentage.toFixed(2)),

    // After discounts
    subtotalAfterDiscounts: parseFloat(subtotalAfterDiscounts.toFixed(2)),

    // Taxes
    federalTax: parseFloat(taxes.federalTax.toFixed(2)),
    privilegeFee: parseFloat(taxes.privilegeFee.toFixed(2)),
    otherTaxes: parseFloat(taxes.otherTaxes.toFixed(2)),
    totalTax: parseFloat(taxes.totalTax.toFixed(2)),

    // Final totals
    grandTotal: parseFloat(grandTotal.toFixed(2)),

    // Additional info
    isFreeOrder,
    vendorType,
    numberOfDays,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
  };
}

/**
 * Get a simple total amount (for quick access)
 * @param order - Shopify order object
 * @returns The grand total amount
 */
export function getOrderTotal(order: ShopifyOrder): number {
  const totals = calculateOrderTotals(order);
  return totals.grandTotal;
}

/**
 * Transform Shopify order webhook data into NetParks reservation payload
 * Updated to handle facility charges as separate options
 */
export function transformShopifyOrderToReservation(
  order: ShopifyOrder,
  sourceId: number
): ReservationPayload | null {
  // Extract booking dates
  const { startDate, endDate } = extractBookingDates(order.line_items);

  if (!startDate || !endDate) {
    console.error("Missing booking dates in order:", order.id);
    return null;
  }

  // Get customer information
  const customerInfo = getCustomerInfo(order);

  if (!customerInfo.lastName || !customerInfo.email) {
    console.error("Missing required customer information in order:", order.id);
    return null;
  }

  // Check if this is a Mercedes order
  const isMercedes = isMercedesOrder(order);

  // Calculate days for the reservation
  const days = calculateDays(startDate, endDate);

  // Calculate the parking rate per day (excluding facility charges and fees)
  const parkingSubtotal = calculateParkingSubtotal(order.line_items);

  // For Mercedes orders, the rate is 0 (100% discount applied)
  // For general orders, divide the parking subtotal by number of days
  const ratePerDay = isMercedes ? 0 : parkingSubtotal / days;

  // Build custom rate charges
  const customRateCharges: CustomRateCharge[] = [
    {
      unit: "day",
      duration: days,
      fee: ratePerDay,
    },
  ];

  // Extract facility charges and other options
  const options = extractOptions(order.line_items);
  const coupons = extractCoupons(order);

  // Extract additional services (if any)
  const services = extractServices(order.line_items);

  // Log extracted information for debugging
  console.log("Order transformation details:", {
    orderId: order.id,
    orderName: order.name,
    isMercedes,
    days,
    parkingSubtotal,
    ratePerDay,
    optionsCount: options.length,
    // servicesCount: services.length,
  });

  // Build the payload using the createReservationPayload function
  const payload = createReservationPayload({
    sourceId,
    startDate,
    endDate,
    lastName: customerInfo.lastName,
    email: customerInfo.email,
    reservationId:
      order.name &&
      order.name.substring(1) &&
      !isNaN(parseInt(order.name.substring(1)))
        ? order.name.substring(1)
        : order.name, // Using Shopify order name (e.g., "#61437")
    customRateCharges: customRateCharges,
    firstName: customerInfo.firstName || undefined,
    phone: customerInfo.phone || undefined,
    address: customerInfo.address || undefined,
    address2: customerInfo.address2 || undefined,
    city: customerInfo.city || undefined,
    state: customerInfo.state || undefined,
    zip: customerInfo.zip || undefined,
    notes: isMercedes
      ? "Mercedes partner reservation - 100% discount applied"
      : undefined,
    payments: [
      {
        type: "AR",
        amount: getOrderTotal(order),
        notes: "Prepaid payment",
      },
    ],
    promoCode: order.discount_codes?.[0]?.code || undefined,
    // Add options (facility charges, etc.)
    options: options.length > 0 ? options : undefined,
    // Add services (if any)
    services: services.length > 0 ? services : undefined,
    // Add coupons (if any)
    coupons: coupons.length > 0 ? coupons : undefined,
    quoteName: "Self Park",
  });

  return payload;
}

// ============================================
// CONFIGURABLE TRANSFORMATION FUNCTION
// ============================================

interface TransformationOptions {
  includeFacilityChargeAsOption?: boolean; // Default: true
  includeFacilityChargeInPrice?: boolean; // Default: true
}

/**
 * Transform Shopify order with configurable options
 */
export function transformShopifyOrderToReservationWithOptions(
  order: ShopifyOrder,
  sourceId: number,
  options: TransformationOptions = {}
): ReservationPayload | null {
  const {
    includeFacilityChargeAsOption = true,
    includeFacilityChargeInPrice = true,
  } = options;

  // Extract booking dates
  const { startDate, endDate } = extractBookingDates(order.line_items);

  if (!startDate || !endDate) {
    console.error("Missing booking dates in order:", order.id);
    return null;
  }

  // Get customer information
  const customerInfo = getCustomerInfo(order);

  if (!customerInfo.lastName || !customerInfo.email) {
    console.error("Missing required customer information in order:", order.id);
    return null;
  }

  // Check if this is a Mercedes order
  const isMercedes = isMercedesOrder(order);

  // Calculate days for the reservation
  const days = calculateDays(startDate, endDate);

  // Get facility charge info
  const { hasFacilityCharge, facilityChargeAmount, facilityChargeItem } =
    extractFacilityCharge(order.line_items);

  // Calculate parking subtotal
  let parkingSubtotal = calculateParkingSubtotal(order.line_items);

  // If we want to include facility charge in the price, add it to the subtotal
  if (includeFacilityChargeInPrice && hasFacilityCharge) {
    parkingSubtotal += facilityChargeAmount;
  }

  // For Mercedes orders, the rate is 0 (100% discount applied)
  // For general orders, divide the parking subtotal by number of days
  const ratePerDay = isMercedes ? 0 : parkingSubtotal / days;

  // Build custom rate charges
  const customRateCharges: CustomRateCharge[] = [
    {
      unit: "day",
      duration: days,
      fee: ratePerDay,
    },
  ];

  // Extract options (facility charges, etc.)
  let optionsArray: Option[] = [];

  if (includeFacilityChargeAsOption) {
    optionsArray = extractOptions(order.line_items);
  }

  // Extract services
  const services = extractServices(order.line_items);

  // Log extracted information for debugging
  console.log("Order transformation details:", {
    orderId: order.id,
    orderName: order.name,
    isMercedes,
    days,
    parkingSubtotal,
    facilityChargeAmount,
    includeFacilityChargeInPrice,
    includeFacilityChargeAsOption,
    ratePerDay,
    optionsCount: optionsArray.length,
    servicesCount: services.length,
  });

  // Build the payload
  const payload = createReservationPayload({
    sourceId: sourceId,
    startDate: startDate,
    endDate: endDate,
    lastName: customerInfo.lastName,
    email: customerInfo.email,
    reservationId: order.name,
    customRateCharges: customRateCharges,
    firstName: customerInfo.firstName || undefined,
    phone: customerInfo.phone || undefined,
    address: customerInfo.address || undefined,
    address2: customerInfo.address2 || undefined,
    city: customerInfo.city || undefined,
    state: customerInfo.state || undefined,
    zip: customerInfo.zip || undefined,
    notes: isMercedes
      ? "Mercedes partner reservation - 100% discount applied"
      : undefined,
    promoCode: order.discount_codes?.[0]?.code || undefined,
    options: optionsArray.length > 0 ? optionsArray : undefined,
    services: services.length > 0 ? services : undefined,
  });

  return payload;
}
