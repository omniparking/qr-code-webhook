/*jshint esversion: 8 */
/* eslint-disable prefer-destructuring */

import { Redis } from "@upstash/redis";

// Assign environment variables
const HOOKDECK_SOURCE = process.env.HOOKDECK_SOURCE;
const HOOKDECK_SOURCE_ALT = process.env.HOOKDECK_SOURCE_ALT;
const SHOPIFY_TOPIC = process.env.SHOPIFY_TOPIC;
const SHOPIFY_TOPIC_ALT = process.env.SHOPIFY_TOPIC_ALT;

/**
 *
 * @param {Redis} redis redis instance
 * @param newWebhookId webhook id being stored in redis db
 * @returns {Promise<boolean>} represents whether webhook id was stored in redis db
 */
export async function sendWebhookIdToRedis(
  redis: Redis,
  newWebhookId: string,
): Promise<boolean> {
  try {
    await redis.set(newWebhookId, newWebhookId);
    return true;
  } catch (error) {
    console.error("Error redis webhook =>", error);
    return false;
  }
}

/**
 * Calculates the total parking fee based on reservation dates and daily rate.
 *
 * The calculation includes:
 * - Base rate (rounded up to nearest full day)
 * - Florida Sales Tax (6.5%)
 * - Privilege Fee Recovery Charge (10%)
 *
 * @param startDate - Reservation start date/time (ISO string or Date object)
 * @param endDate - Reservation end date/time (ISO string or Date object)
 * @param dailyRate - Base daily parking rate in dollars
 * @returns Total parking fee rounded to 2 decimal places
 *
 * @example
 * ```typescript
 * const total = calculateParkingFee(
 *   '2025-11-23T15:00:00',
 *   '2025-11-25T08:00:00',
 *   6.99
 * );
 * // Returns: 16.29
 * // Breakdown: 2 days × $6.99 = $13.98
 * //            + 6.5% tax ($0.91)
 * //            + 10% privilege fee ($1.40)
 * ```
 */
export function calculateParkingFee(
  startDate: string | Date,
  endDate: string | Date,
  dailyRate: number,
): number {
  const SALES_TAX_RATE = 0.065; // 6.5% Florida Sales Tax
  const PRIVILEGE_FEE_RATE = 0.1; // 10% Privilege Fee Recovery Charge

  // Convert to Date objects if needed
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate duration in milliseconds
  const durationMs = end.getTime() - start.getTime();

  // Convert to hours
  const hours = durationMs / (1000 * 60 * 60);

  // Round up to nearest full day (any partial day counts as full day)
  const days = Math.ceil(hours / 24);

  // Calculate base price
  const basePrice = days * dailyRate;

  // Calculate taxes and fees
  const salesTax = basePrice * SALES_TAX_RATE;
  const privilegeFee = basePrice * PRIVILEGE_FEE_RATE;

  // Calculate total
  const total = basePrice + salesTax + privilegeFee;

  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * @param {string} startTime start time of booking
 * @param {string} endTime end time of booking
 * @returns {PriceInfoForMercedes} price info for mercedes order
 */
export function generatePricesForMercedes(startTime: string, endTime: string) {
  const quantity = calculateDaysBetweenWithTime(startTime, endTime);
  const subtotal = +(12.99 * quantity + 4.99).toFixed(2);
  const tax = +(subtotal * 0.165).toFixed(2);
  const total = parseFloat((subtotal + tax).toFixed(2));
  return {
    quantity: `${quantity}`,
    subtotal: `${subtotal}`,
    tax: `${tax}`,
    total: `${total}`,
  };
}

/**
 *
 * @param {string | undefined} method http method
 * @param {string} shopifyTopic shopify topic
 * @param {string} sourceName http source name
 * @returns {boolean} whether or not the http request comes from a trusted source
 */
export function isTrustedSource(
  method: string | undefined,
  shopifyTopic: string,
  sourceName: string,
): boolean {
  return (
    method === "POST" &&
    (shopifyTopic === SHOPIFY_TOPIC || shopifyTopic === SHOPIFY_TOPIC_ALT) &&
    (sourceName === HOOKDECK_SOURCE || sourceName === HOOKDECK_SOURCE_ALT)
  );
}

/**
 * Determines quantity of days user parking in lot for mercedes VIP users
 * @param {string} startDateStr start date of reservation as string in format 2024-02-01T18:00:00
 * @param {string} endDateStr end date of reservation as string in format 2024-02-01T18:00:00
 * @returns {number} the quantity of days between start and end time as number
 */
export function calculateDaysBetweenWithTime(
  startDateStr: string,
  endDateStr: string,
): number {
  // Convert date strings to Date objects
  const startDate: Date = new Date(startDateStr);
  const endDate: Date = new Date(endDateStr);

  // Calculate the time difference in milliseconds
  const timeDifference: number = endDate.getTime() - startDate.getTime();

  // Convert the time difference to days, including partial days
  const daysDifference: number = timeDifference / (1000 * 60 * 60 * 24);

  return Math.ceil(daysDifference);
}

/**
 * Format date to include timezone offset in the format required by NetParks API
 * Format: YYYY-MM-DDTHH:mm:ss-05:00
 *
 * @param dateString - ISO date string (e.g., "2024-01-22T08:00:00")
 * @param timezoneOffset - Timezone offset in hours (e.g., -5 for EST, -4 for EDT)
 * @returns Formatted date string with timezone
 */
export function formatDateWithTimezone(
  dateString: string,
  timezoneOffset: number = -5,
): string {
  // Parse the date string
  const date = new Date(dateString);

  // Get date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Format timezone offset
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";
  const offsetHours = String(Math.abs(Math.floor(timezoneOffset))).padStart(
    2,
    "0",
  );
  const offsetMinutes = String(Math.abs((timezoneOffset % 1) * 60)).padStart(
    2,
    "0",
  );
  const timezoneString = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  // Combine into final format
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneString}`;
}
