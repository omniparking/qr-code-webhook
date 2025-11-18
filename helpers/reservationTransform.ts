import { formatDateWithTimezone, generatePricesForMercedes } from ".";
import {
  Coupon,
  CreateReservationParams,
  CustomRateCharge,
  LineItem,
  NetparksQuote,
  NetparksQuoteResponse,
  Option,
  QuotePayload,
  ReservationPayload,
  Service,
  ShopifyOrder,
} from "./interfaces";

/**
 * Check if order is from Mercedes partner
 */
export function isMercedesOrder(order: ShopifyOrder): boolean {
  return (
    order.note_attributes?.some(
      (attr) => attr.name === "vendor" && attr.value === "mercedes",
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
      item.title.toUpperCase().includes("PARKING"),
  );

  if (!parkingItem || !parkingItem.properties) {
    return { startDate: null, endDate: null };
  }

  const startDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-start",
  );
  const endDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-finish",
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
  const phoneNumberRaw =
    order.phone ||
    billingAddress?.phone ||
    defaultAddress?.phone ||
    customer?.phone ||
    null;
  const phone = phoneNumberRaw ? normalizePhoneNumber(phoneNumberRaw) : null;

  return {
    phone,
    firstName: billingAddress?.first_name || customer?.first_name || "",
    lastName: billingAddress?.last_name || customer?.last_name || "",
    email: order.email || order.contact_email || customer?.email || "",
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
  params: CreateReservationParams,
): ReservationPayload {
  const payload: ReservationPayload = {
    data: {
      // Required fields
      // source_id: params.sourceId, // LEAVE OUT FOR API CALL
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

  payload.data.text_opt_in = "true";

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
      item.title.toLowerCase().includes("facility charge"),
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
      !item.name.toLowerCase().includes("fee"),
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
      !item.name.toLowerCase().includes("facility charge"), // We'll handle this as an option
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
      item.title.toUpperCase().includes("PARKING"),
  );

  if (!parkingItem || !parkingItem.properties) {
    return 1; // Default to 1 day if can't calculate
  }

  const startDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-start",
  );
  const endDateProp = parkingItem.properties.find(
    (prop) => prop.name === "booking-finish",
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
    0,
  );
  const facilityChargeSubtotal = breakdown.facilityCharges.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const otherFeesSubtotal = breakdown.otherFees.reduce(
    (sum, item) => sum + item.total,
    0,
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
  console.log("\n\n\n TOTAL PRICES:", totals, "\n\n");
  return totals.grandTotal;
}

/**
 * Normalizes a phone number to a 10-digit format (area code + local number)
 * Removes country code, spaces, parentheses, and dashes
 *
 * @param phoneNumber - Phone number in any common format
 * @returns 10-digit phone number string, or null if invalid
 *
 * @example
 * normalizePhoneNumber("+1 (201) 519-8855") // "2015198855"
 * normalizePhoneNumber("201-519-8855") // "2015198855"
 */
export function normalizePhoneNumber(
  phoneNumber: string | null | undefined,
): string | null {
  // Handle null/undefined/empty
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return null;
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  // Handle empty result after cleaning
  if (digitsOnly.length === 0) {
    return null;
  }

  // Handle different digit lengths
  if (digitsOnly.length === 10) {
    // Already 10 digits (area code + number)
    return digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    // 11 digits starting with country code '1'
    return digitsOnly.slice(1);
  } else if (digitsOnly.length === 11 && !digitsOnly.startsWith("1")) {
    // 11 digits but doesn't start with 1 - likely invalid
    return null;
  } else {
    // Too few or too many digits
    return null;
  }
}
/**
 * Transform Shopify order webhook data into NetParks reservation payload
 * Updated to handle facility charges as separate options
 */
export function transformShopifyOrderToReservation(
  order: ShopifyOrder,
  sourceId: number,
): ReservationPayload | null {
  console.log(
    "\n\n transformShopifyOrderToReservation => order:",
    order,
    "\n\n",
  );
  // Extract booking dates
  const { startDate, endDate } = extractBookingDates(order.line_items);

  if (!startDate || !endDate) {
    console.error("Missing booking dates in order:", order.id);
    return null;
  }

  const formattedStartDate = formatDateWithTimezone(startDate, -5);
  const formattedEndDate = formatDateWithTimezone(endDate, -5);

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

  // For Mercedes orders, the rate is 0 (100% discount applied), else $6.99
  const ratePerDay = isMercedes ? 0 : 6.99;

  // Build custom rate charges
  // Netpark will determine price based on start/end dates
  const customRateCharges: CustomRateCharge[] = [
    {
      unit: "day",
      duration: 1,
      fee: ratePerDay,
    },
  ];

  // Extract facility charges and other options
  // const options = extractOptions(order.line_items);

  // Extract coupons
  // const coupons = extractCoupons(order);

  // Extract additional services (if any)
  const services = extractServices(order.line_items);

  const amount = isMercedes
    ? +generatePricesForMercedes(startDate, endDate)
    : getOrderTotal(order);

  const reservationId = `${order.number}`;
  const notes = isMercedes
    ? "Mercedes partner reservation (through Shopify) - 100% discount applied"
    : "General reservation (through Shopify)";

  // Log extracted information for debugging
  console.log("Order transformation details:", {
    orderId: order.id,
    orderName: order.name,
    endDate: formattedEndDate,
    startDate: formattedStartDate,
    amount,
    days,
    isMercedes,
    notes,
    parkingSubtotal,
    ratePerDay,
    reservationId,
    servicesCount: services.length,
    // optionsCount: options.length,
  });

  // Build the payload using the createReservationPayload function
  const payload = createReservationPayload({
    reservationId,
    sourceId,
    address: customerInfo.address || null,
    address2: customerInfo.address2 || null,
    city: customerInfo.city || null,
    customRateCharges: customRateCharges,
    email: customerInfo.email,
    endDate: formattedEndDate,
    firstName: customerInfo.firstName || undefined,
    lastName: customerInfo.lastName,
    phone: customerInfo.phone || undefined,
    phone3: customerInfo.phone || undefined,
    startDate: formattedStartDate,
    state: customerInfo.state || null,
    zip: customerInfo.zip || null,
    notes,
    payments: [
      {
        type: "AR",
        amount: amount || 0,
        notes: "Prepaid payment",
      },
    ],
    services: services.length > 0 ? services : null,
    // quoteName: "Uncovered",
    // promoCode: order.discount_codes?.[0]?.code || undefined, // need to determine what this should be
    // coupons: coupons.length > 0 ? coupons : undefined,
    // quoteName: "Self Park",
    quoteName: "Daily Rate",
  });

  return payload;
}

/**
 * NOTE BEING USED
 * Generate a quote from NetParks API
 * @param reservationPayload - Full reservation payload (will be converted to quote payload)
 * @param apiUrl - NetParks API URL
 * @param apiKey - NetParks API Key
 * @returns Quote response with pricing breakdown
 */
export async function generateNetparksQuote(
  reservationPayload: ReservationPayload,
): Promise<NetparksQuoteResponse> {
  const apiUrl = process.env.NETPARK_API_URL;
  const apiKey = process.env.NETPARK_API_KEY;

  if (!apiUrl) {
    throw new Error("NetParks API URL not configured in environment variables");
  }

  if (!apiKey) {
    throw new Error("NetParks API Key not configured in environment variables");
  }

  const formattedStartDate = formatDateWithTimezone(
    reservationPayload.data.start_date,
    -5,
  );
  const formattedEndDate = formatDateWithTimezone(
    reservationPayload.data.end_date,
    -5,
  );

  const endpoint = `${apiUrl}/reservations/quotes`;
  const body = JSON.stringify({
    data: {
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    },
  });

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("X-Api-Key", apiKey);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: myHeaders,
    body,
    redirect: "follow",
  });

  const responseText = await response.text();
  console.log("\n\n\n QUOTE QUOTE responseText:", responseText);
  if (!response.ok) {
    console.error(
      `NetParks Quote API error (${response.status}):`,
      responseText,
    );
    throw new Error(
      `NetParks Quote API request failed with status ${response.status}: ${responseText}`,
    );
  }

  // Parse JSON response
  let data: NetparksQuoteResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse quote response:", responseText);
    throw new Error("NetParks Quote API returned invalid JSON");
  }

  // Check for errors in response
  if (data.errors && data.errors.length > 0) {
    const errorMessages = data.errors.map((err) => err.message).join(", ");
    throw new Error(`NetParks Quote API returned errors: ${errorMessages}`);
  }

  return data;
}

/**
 * Get the first (primary) quote from the response
 * @param quoteResponse - Quote response from NetParks
 * @returns First quote or null if no quotes returned
 */
export function getPrimaryQuote(
  quoteResponse: NetparksQuoteResponse,
): NetparksQuote | null {
  return !quoteResponse.data || quoteResponse.data.length === 0
    ? null
    : quoteResponse.data[0];
}
