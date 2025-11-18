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
