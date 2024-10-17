/*jshint esversion: 8 */
/* eslint-disable prefer-destructuring */

import { Redis } from "@upstash/redis";
import { sendSMSViaSineris } from "./sms";
import { Vendor } from "../pages/api";

/* eslint max-len: ["error", { "code": 120 }] */

// Get environment variables from process.env
const HOOKDECK_SOURCE = process.env.HOOKDECK_SOURCE;
const HOOKDECK_SOURCE_ALT = process.env.HOOKDECK_SOURCE_ALT;
const M_NAME = process.env.M_NAME;
const M_VENDOR = process.env.M_VENDOR;
const SHOPIFY_TOPIC = process.env.SHOPIFY_TOPIC;
const SHOPIFY_TOPIC_ALT = process.env.SHOPIFY_TOPIC_ALT;

// declaring variables for styling HTML markup
const qrCodeStyles: string =
  "display: block; object=fit: contain; margin-left: 0; margin-right: 0;";
const inline: string = "display: inline-block;";
const padding0: string = "padding: 0px;";
const margin0: string = "margin: 0px;";
const bold: string = "font-weight: bold;";
const marginV = (px: string): string => `margin: ${px}px 0;`;
const marginT = (px: string): string => `margin: ${px}px 0 0 0;`;
const marginB = (px: string): string => `margin: 0 0 ${px}px 0;`;
const paddingT = (px: string): string => `padding: ${px}px 0 0 0;`;
const fontSize = (size: string, type = "rem"): string =>
  `font-size: ${size}${type};`;

export const hrefBase = "https://qr-code-webhook.vercel.app/";

const shuttlePickupLabel = "SHUTTLE PICKUP INSTRUCTIONS:\n";
const shuttlePickupInfo = `When you have arrived at Orlando International Airport, please make your way to level one, ground transportation. Level one is located one level below baggage claim. 
If you're at Terminal A, our shuttle stops are at A12 or A13. If you're at Terminal B, our shuttle stops are at B12 or B13. 
If you're at Terminal C, out shuttle stop are C277,C278 and or C279. 
Please make sure that you hop on the shuttle that says Green Motion & Omni Airport Parking. 
Our shuttles are every 15-25 minutes, however please be advised that shuttles may take a little longer due to traffic conditions at certain hours of the day.
Please be advised that our live call center service hours are now Monday-Friday, 6AM-6PM.`;

const shuttleDispatchLabel = "SHUTTLE DISPATCH TEXT MESSAGE:\n";
const shuttleDispatchInfo = `If you are at the airport now and need a shuttle, please text 689-267-2990 and indicate if you are at A12/A13, B12/B13 or C277/C278 and the number of people in your party to expedite and re-route the nearest shuttle to you. `;

const cancellationRefundLabel = "Cancellation/Refund Policy:\n";
const cancellationRefundInfo = `Sales orders will be refunded in full if cancelled 7 days or more in advance via email to info@OmniAirportParking.com Any reservation made within less than 7 days from arrival date, will not qualify to be refunded regardless of circumstance. 
Please note there is no refund or credit for early termination of the services.`;
/**
 *
 */
export async function sendSMSToUser(userData) {
  let smsResponse = false;
  const { phoneNumber, orderNum, startTime, endTime, qrCodeData } = userData;

  try {
    // send SMS to user
    smsResponse = await sendSMS({
      phoneNumber,
      orderNum,
      startTime,
      endTime,
      qrCodeData,
    });
    return smsResponse;
  } catch (error) {
    console.error("sendSMSToUser Error =>", error);
    return smsResponse;
  }
}

/**
 *
 * @param {Redis} redis redis instance
 * @param newWebhookId webhook id being stored in redis db
 * @returns {Promise<boolean>} represents whether webhook id was stored in redis db
 */
export async function sendWebhookIdToRedis(
  redis: Redis,
  newWebhookId: string
): Promise<boolean> {
  let webhookLogged = false;
  try {
    await redis.set(newWebhookId, newWebhookId);
    webhookLogged = true;
  } catch (error) {
    console.error("Error redis webhook =>", error);
  }
  return webhookLogged;
} // END sendWebhookIdToRedis

/**
 *
 * @param {string} qrcodeUrl url to view qr code in browser
 * @param {string} logoImg base64 string of omni parking logo
 * @returns {MailAttachment[]} an array of objects that are the attachments for email (omni logo and qrcode image)
 */
export function generateAttachments(
  qrcodeUrl: string,
  logoImg: string
): MailAttachment[] {
  return [
    {
      cid: "unique-qrcode",
      filename: "qrcode.png",
      path: qrcodeUrl,
    },
    {
      cid: "unique-omnilogo",
      filename: "logo.png",
      path: `data:text/plain;base64, ${logoImg}`,
    },
  ];
} // END generateAttachments

/**
 *
 * @param {Vendor} vendorName 'general' or 'mercedes'
 * @returns {string[]} an array of emails to CC email
 */
export function generateCC(vendorName: Vendor): string[] {
  return vendorName === Vendor.mercedes
    ? ["info@omniairportparking.com", "Bdc_service@mbso.com"]
    : ["info@omniairportparking.com"];
} // END generateCC

/**
 * @param {string} startTime start time of booking
 * @param {string} endTime end time of booking
 * @returns {PriceInfoForMercedes} price info for mercedes order
 */
export function generatePricesForMercedes(
  startTime: string,
  endTime: string
): PriceInfoForMercedes {
  const qty = calculateDaysBetweenWithTime(startTime, endTime);
  const sub = +(12.99 * qty + 4.99).toFixed(2);
  const tax = +(sub * 0.165).toFixed(2);
  const total = parseFloat((sub + tax).toFixed(2));
  return {
    quantity: `${qty}`,
    subtotal: `${sub}`,
    tax: `${tax}`,
    total: `${total}`,
  };
} // END generatePricesForMercedes

/**
 *
 * @param {string} order_number the order number of the booking
 * @returns {string} data for qr code
 */
export function generateqrCodeData(order_number): string {
  const qrcodeLength: number = `1755164${order_number}`.length;
  const zeros: string = new Array(16 - qrcodeLength).join("0");
  const qrCodeData: string = `1755164${zeros}${order_number}`; // add zero placeholders to qrcode data
  return qrCodeData;
} // END generateqrCodeData

/**
 *
 * @param {Vendor} vendor vendor name either 'general' or 'mercedes'
 * @param {BookingTime[]} bookingTimes Booking Time info
 * @param {string} price order price
 * @param {string} name name of product
 * @param {any} customer object containing customer info
 * @param {string} start_time start of booking datetime as string
 * @param {string} end_time end of booking datetime as string
 * @returns {boolean} denotes whether or not data is missing from request body
 */
export function missingData(
  vendor: Vendor,
  bookingTimes: BookingTime[],
  price: string,
  name: string,
  customer: any,
  start_time: string,
  end_time: string
): boolean {
  if (vendor === Vendor.general) {
    return !bookingTimes?.length || !price || !name || !customer;
  }
  return !bookingTimes || !start_time || !end_time;
} // END missingData

/**
 *  @param {BookingTime[]} bookingTimes an array of objects containing booking time info
 *  @returns {StartAndEndTime} start and end times as string
 */
export function getStartAndEndBookingTimes(
  bookingTimes: BookingTime[]
): StartAndEndTime {
  const result: StartAndEndTime = {
    start_time: "",
    end_time: "",
  };

  bookingTimes?.forEach(({ name, value }: BookingTime) => {
    if (name === "booking-start") {
      result.start_time = value;
    } else if (name === "booking-finish") {
      result.end_time = value;
    }
  });

  return result;
}

/**
 * @param {any} lineItems array of objects containing booking data
 * @param {any} customer an object containing user data
 * @returns {{ quantity: string, price: string, name: string, bookingTimes: BookingTime[], first: string, last: string }}
 */
export function getInfoFromRequest(
  lineItems: any,
  customer: any
): {
  quantity: string;
  price: string;
  name: string;
  bookingTimes: BookingTime[];
  first: string;
  last: string;
} {
  const { quantity, price, name } = lineItems;
  const bookingTimes: BookingTime[] = lineItems?.properties || [];
  const { first_name: first, last_name: last } = customer;

  return { quantity, price, name, bookingTimes, first, last };
} // END getInfoFromRequest

/**
 *
 * @param {any} body the request body
 * @returns {boolean} whether or not request is from mercedes vendor
 */
export function isMercedesIntegration(body: any): boolean {
  return (
    body?.note_attributes?.[0]?.name === M_VENDOR &&
    body?.note_attributes?.[0]?.value === M_NAME
  );
} // END isMercedesIntegration

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
  sourceName: string
): boolean {
  return (
    method === "POST" &&
    (shopifyTopic === SHOPIFY_TOPIC || shopifyTopic === SHOPIFY_TOPIC_ALT) &&
    (sourceName === HOOKDECK_SOURCE || sourceName === HOOKDECK_SOURCE_ALT)
  );
} // END isTrustedSource

/**
 * @param {string} dateString date in string format
 * @param {boolean} shouldExcludeTime determines whether or not time should be added to date string
 * @returns {string} in the format MM/DD/YYYY or MM/DD/YYYY hh:mm:ss a
 */
export function formatDateWithTime(
  dateString: string,
  shouldExcludeTime: boolean
): string {
  const date = new Date(dateString);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  let formattedDate = `${month}/${day}/${year}`;

  if (shouldExcludeTime) {
    return formattedDate;
  }

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedTime = `${hours}:${minutes}:${seconds} ${meridiem}`;
  formattedDate += ` ${formattedTime}`;

  return formattedDate;
}

/**
 * @param {string} inputDate date in string format
 * @param {boolean} shouldAddGracePeriod whether or not to set time to beginning of the day
 * @returns {string} date in the format MM.DD.YYYYhh:mm:ss
 */
export function formatDate(inputDate: string, shouldAddGracePeriod): string {
  if (!inputDate) return "";

  const date = new Date(inputDate);

  if (shouldAddGracePeriod) {
    date.setHours(0, 1, 0, 0);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDate = `${day}.${month}.${year}${hours}:${minutes}:${seconds}`;

  return formattedDate;
} // END formatDate

/**
 *
 * @param {string} inputDate
 * @returns {string} date in the format 'MM/DD/YY 12:20 PM'
 */
export function convertDateFormat(inputDate: string): string {
  const date = new Date(inputDate);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const formattedDate = `${month}/${day}/${year} ${hours}:${minutes} ${meridiem}`;

  return formattedDate;
} // END convertDateFormat

/**
 * Determines which line_items array should be used
 * @param {any} lineItems line items off body
 * @returns {any} line item properties for booking
 */
export function checkProperties(lineItems: any): any {
  return lineItems?.[0]?.name === "(MCO) SUPER SAVER 30 DAY PASS"
    ? lineItems[0]
    : lineItems?.[1]?.name === "(MCO) SUPER SAVER 30 DAY PASS"
    ? lineItems[1]
    : lineItems?.[1]?.properties?.length === 3
    ? lineItems[1]
    : lineItems[0];
} // END checkProperties

/**
 * Generates Omni Airport Logo as Image Tag
 * @returns {string} HTML Image Tag of Omni logo
 */
function generateIconImageForEmailTemplate(): string {
  const style: string = `style="display: block; ${marginB("12")};"`;
  const desc: string = "Omni Airport Parking logo";
  const alt: string = `alt="${desc}"`;
  const title: string = `title="${desc}"`;
  const src: string = `src="cid:unique-omnilogo"`;
  return `<img width="100" height="50" ${style} ${src} ${alt} ${title} />`;
} // END generateIconImageForEmailTemplate

const generateNameHTML = (userName: string): string => {
  return `
    <p style="${padding0} ${marginT("16")}">
      <b>Name:</b> ${userName}
    </p>
  `;
}; // END generateNameHTML

/**
 *
 * @param {string} billingAddressMarkup HTML markup for billing address
 * @returns Billing Address HTML Markup
 */
const generateBillingHTMLMarkup = (billingAddressMarkup: string): string => {
  return `
    <p style="${bold} ${marginB("1")} ${padding0}">
      Billing Address:
    </p>
    <p style="${padding0} ${marginV("4")};">${billingAddressMarkup}</p>
  `;
};

/**
 *
 * @param {string} total the total price of the booking
 * @param {boolean} [includeDiscount] the total price of the booking
 * @returns HTML markup for price before discount and after
 */
const getPriceHTML = (total: string, includeDiscount = true): string => {
  return includeDiscount
    ? `<p style="${padding0} ${margin0}">Total Before Discount: $${total}</p>
    <p style="${padding0} ${marginB("20")}">Total After Discount: $0.00</p>`
    : `<p style="${padding0} ${marginB("20")}">Total: $${total}</p>`;
}; // END getPriceHTML

export const getShuttlePickupMsg = (): string => {
  return `
    <p style="${padding0} ${paddingT("32")}">SHUTTLE PICKUP INSTRUCTIONS:\n</p>
    <p style="${padding0} ${paddingT("4")}">
      If you have arrived at Orlando International Airport, please make your way to level one, ground transportation. 
      Level one is located one level below baggage claim. If you're at Terminal A, our shuttle stops are at A12 or A13. 
      If you're at Terminal B, our shuttle stops are at B12 or B13. If you're at Terminal C, out shuttle stop are C277, C278 and or C279. 
      You are more than welcome to call us to verify ETA.\n
    </p>
    <p style="${padding0} ${paddingT("2")}">
      Please make sure that you hop on a shuttle that says Green Motion & Omni Airport Parking. Our shuttles are every 20-25 minutes, 
      however please be advised that shuttles may take a little longer due to traffic at certain hours of the day.
    </p>
  `;
}; // END shuttlePickupMessage

const dropAndPickupAnytime = () =>
  `<span style="${fontSize("14", "px")}">(at anytime)</span>`;

/**
 * Generates HTML markup for email
 * @param {HTMLMarkupData} data object containing properties needed for email
 * @param {string} billingAddressMarkup billing address info in html format as string
 * @param {boolean} shouldExcludeTime whether or not time should be included in email
 * @param {boolean} [isForMercedes] denotes whether or not this email is for mercedes vendor
 * @returns {string} HTML markup for email
 */
export function generateHTMLMarkup(
  data: HTMLMarkupData,
  billingAddressMarkup: string,
  shouldExcludeTime: boolean,
  isForMercedes = false
): string {
  const {
    createdAt: purchaseDate,
    end_time: pickup,
    name: type,
    start_time: dropoff,
    subtotal_price: subtotal,
    total_price: total,
    total_tax: taxes,
    qrCodeData,
    price,
    quantity,
    userName,
  }: HTMLMarkupData = data;

  const dropoffTime: string = formatDateWithTime(dropoff, shouldExcludeTime);
  const pickupTime: string = formatDateWithTime(pickup, shouldExcludeTime);
  // const dropoffTime: string = '10/02/2022 at 07:00:00 AM'; // FOR TESTING ONLY
  // const pickupTime: string = '10/12/2022 at 11:00:00 PM'; // FOR TESTING ONLY

  const href = `${hrefBase}/view/qr?startTime=${dropoff}&endTime=${pickup}&qrcodeData=${qrCodeData}`;
  const shuttlePickupMsg = getShuttlePickupMsg();
  //   <p style="${marginV("10")}">
  //   This email is to confirm your recent order.
  // </p>

  return `
    <html>
    <body>
      <p style="${marginB("16")}"><b>Parking Confirmation Details:</b></p>
      ${generateIconImageForEmailTemplate()}

      <p style="${fontSize("1")} ${marginV("4")}">
        Thank you for placing your order with OMNI Airport Parking!
      </p>
 
      ${isForMercedes ? generateNameHTML(userName) : ""}
      
      <p style="${isForMercedes ? marginB("12") : marginV("12")}">
        <span style="${bold}">Purchased Date:</span> 
        ${purchaseDate}
      </p>

      <p style="${margin0} ${padding0} ${fontSize("1")}">
        <span style="${bold}">
          Drop off
          ${shouldExcludeTime ? dropAndPickupAnytime() : ""}:
        </span> 
        ${dropoffTime}
      </p>
      <p style="${marginB("16")} ${padding0} ${fontSize("1")}">
        <span style="${bold}">
          Pick up 
          ${shouldExcludeTime ? dropAndPickupAnytime() : ""}:
        </span>
        ${pickupTime}
      </p>

      <p style="${margin0} ${padding0}">1x Facility Charge for $4.99 each</p>
      <p style="${margin0} ${padding0}">${quantity}x ${type.toUpperCase()} for $${price} each</p>

      <p style="${padding0} ${marginT("20")}">Subtotal: $${subtotal}</p>
      <p style="${padding0} ${margin0}">Taxes and Fees: $${taxes}</p>
      ${isForMercedes ? getPriceHTML(total) : getPriceHTML(total, false)}

      ${isForMercedes ? "" : generateBillingHTMLMarkup(billingAddressMarkup)}

      <img height="250" width="250" style="${qrCodeStyles}" src="cid:unique-qrcode" alt="QR Code" title="QR Code" />
      
      <p style="${padding0} ${marginT("2")}">
        Can't see the QR Code? View it in your browser by clicking 
        <a style="${inline}" href="${href}" target="_blank" alt="link to qr code">here</a>
      </p>

      ${shuttlePickupMsg}
      <p style="${padding0} ${paddingT("20")}">${shuttlePickupLabel}</p>
      <p style="${padding0} ${paddingT("4")}">${shuttlePickupInfo}</p>
      <p style="${padding0} ${paddingT("12")}">${shuttleDispatchLabel}</p>
      <p style="${padding0} ${paddingT("4")}">${shuttleDispatchInfo}</p>
      <p style="${padding0} ${paddingT("12")}">${cancellationRefundLabel}</p>
      <p style="${padding0} ${paddingT("4")}">${cancellationRefundInfo}</p>
    </body>
  `;
} // END generateHTMLMarkup

/**
 * Generates billing address HTML markup for email
 * @param {BillingAddress} billing_address Object containing properties needed for billing address
 * @returns {string} billing info in HTML markup for email
 */
export function getBillingInfoMarkup(billing_address: BillingAddress): string {
  try {
    if (!billing_address) return "";

    const {
      address1,
      address2,
      city,
      country,
      name,
      province,
      zip,
    }: BillingAddress = billing_address;

    return `
      <section>
        <p style="${margin0} ${padding0}">${name}</p>
        <p style="${margin0} ${padding0}">${address1}</p>
        ${address2 ? `<p style="${margin0} ${padding0}">${address2}</p>` : ""}
        <p style="${margin0} ${padding0}">${city}</p>
        <p style="${margin0} ${padding0}">${province} ${zip}</p>
        <p style="${margin0} ${padding0}">${country}</p>
      </section>
    `;
  } catch (e) {
    console.error("getBillingInfoMarkup => error:", e);
    return "";
  }
} // END getBillingInfoMarkup

/**
 * Sends email to user
 * @param {any} transporter nodemailer sdk
 * @param {EmailData} emailInfo object containing properties needed for email
 * @returns {Promise<boolean>} Indicates whether email was sent or not
 */
export async function sendEmail(
  transporter: any,
  emailInfo: EmailData
): Promise<boolean> {
  try {
    if (!emailInfo || !emailInfo?.to) return false;

    const {
      from: frm,
      attachments,
      cc,
      html,
      orderNum,
      to,
    }: EmailData = emailInfo;

    const from: string = `"Omni Airport Parking" ${frm}`;
    const text: string =
      "Your order has been confirmed for Omni Parking. The QR code is attached";
    const subject: string = `Order #${orderNum} QR Code`;
    const replyTo: string = "info@omniairportparking.com";
    const emailData = {
      attachments,
      cc,
      from,
      html,
      replyTo,
      subject,
      text,
      to,
    };

    // send email
    const emailResponse = await transporter.sendMail(emailData);

    // Check results from request; if email address is found in the 'accepted' array, then email was sent succesfully
    // But if the receiver's email is found in the 'rejected' array, then the email failed to send
    if (emailResponse) {
      const { accepted, rejected } = emailResponse;
      if (accepted?.indexOf(to) > -1 || !rejected?.length) {
        return true;
      } else if (
        rejected?.indexOf(to) > -1 ||
        rejected?.length ||
        !accepted?.length
      ) {
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    console.error("sendEmail => error:", e);
    return false;
  }
} // END sendEmail

/**
 * Generates QR code with order number
 * @param {any} QRCode qrcode sdk
 * @param {string} data data for qr code (order number, default numbers, & trailing zeros)
 * @returns {Promise<string>} QR Code image
 */
export async function generateQRCode(
  QRCode: any,
  data: string
): Promise<string> {
  try {
    // converts data into QR Code
    const qrcodeUrl: string = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "L",
      version: 9,
    });
    return qrcodeUrl;
  } catch (e) {
    console.error("generateQRCode => error:", e);
    return "";
  }
} // END generateQRCode

/**
 * @param {DataForServer} data object containing properties needed for server
 * @returns {string} Data for server
 */
export function generateDataForServer(data: DataForServer): string {
  try {
    const {
      end_time: e,
      first: f,
      last: l,
      order_num: n,
      start_time: s,
    } = data;

    const a: string = '250000;1755164;13.07.2022;63;"USD"\r\n0;5;';
    const zeros: string = ";0;1;07;0;0;0;;;";
    const q: string = ';"";"";"";"";"";""';
    const padding: string = new Array(9 - `${n}`.length).join("0");
    const orderNoFormated: string = `${padding}${n}`;
    const b: string = `ShopQ\\${orderNoFormated}`;
    const st: string = "06.10.202013:00:00";
    const dataForServer = `${a}${b};${s};${e}${zeros}"${f}";"${l}";"";"${orderNoFormated}";"";${st};1;04;${e};200${q}`;

    return dataForServer;
  } catch (e) {
    console.error("generateDataForServer => error:", e);
    return "";
  }
} // END generateDataForServer

/**
 * Sends data to omni servers with reservation info and unique id
 * The unique id is what is stored in the QR code and used to look up the reservation
 * @param {any} client ftp client sdk
 * @param {string} data data sent to server
 * @param {string} orderNumber the order number for this purchase
 * @returns {Promise<boolean>} Boolean indicating whether or not sending data was successful
 */
export async function sendDataToServer(
  ftpClient: any,
  data: string,
  orderNumber: string
): Promise<boolean> {
  let serverResponse: boolean;
  try {
    // generate filename
    const filename =
      `${process.env.FILE_FOR_SERVER}.${orderNumber}`.toLowerCase();
    // add file to ftp server
    const resp = await ftpClient.put(data, filename);
    serverResponse = !resp ? true : false;
  } catch (e) {
    console.error("sendDataToServer => error:", e);
    serverResponse = false;
  } finally {
    // end connection to ftp server
    ftpClient.end();
    return serverResponse;
  }
} // END sendDataToServer

/**
 * Determines quantity of days user parking in lot for mercedes VIP users
 * @param {string} startDateStr start date of reservation as string in format 2024-02-01T18:00:00
 * @param {string} endDateStr end date of reservation as string in format 2024-02-01T18:00:00
 * @returns {number} the quantity of days between start and end time as number
 */
export function calculateDaysBetweenWithTime(
  startDateStr: string,
  endDateStr: string
): number {
  // Convert date strings to Date objects
  const startDate: Date = new Date(startDateStr);
  const endDate: Date = new Date(endDateStr);

  // Calculate the time difference in milliseconds
  const timeDifference: number = endDate.getTime() - startDate.getTime();

  // Convert the time difference to days, including partial days
  const daysDifference: number = timeDifference / (1000 * 60 * 60 * 24);

  return Math.ceil(daysDifference);
} // END calculateDaysBetweenWithTime

/**
 * Determines the start and end date for super saver pass
 * @returns {{ start: string, end: string }} the start and end dates in ISO String format
 */
export function generateTimeForSuperSaverPass(startTime: string): {
  start: string;
  end: string;
} {
  const startDate = new Date(startTime);
  const endDate = new Date(startTime);

  startDate.setHours(0, 1, 0, 0);
  endDate.setDate(endDate.getDate() + 30);
  endDate.setHours(23, 59, 0, 0);

  const result = { start: startDate.toISOString(), end: endDate.toISOString() };

  return result;
} // END generateTimeForSuperSaverPass

/**
 * Formats the user's phone number to ensure +1 is in the front of it for twilio sms
 * @param {string} phoneNumber the user's phone number
 * @returns {string} user phone number with +1 in the beginning
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith("+1")) {
    return phoneNumber;
  }

  if (phoneNumber.startsWith("+")) {
    return `${phoneNumber.substring(0, 1)}1${phoneNumber.substring(1)}`;
  }

  if (!phoneNumber.startsWith("+") && phoneNumber.length === 10) {
    return `+1${phoneNumber}`;
  }

  if (
    !phoneNumber.startsWith("+") &&
    phoneNumber.length === 11 &&
    phoneNumber[0] === "1"
  ) {
    return `+${phoneNumber}`;
  }

  return phoneNumber;
} // END formatPhoneNumber

/**
 *
 * @param {SendSMSProps} param contains data related to sending sms
 * @returns {Promise<boolean>} indicates whether sms was sent successfully
 */
export const sendSMS = async ({
  phoneNumber,
  orderNum,
  startTime,
  endTime,
  qrCodeData,
}: SendSMSProps): Promise<boolean> => {
  let smsResponse;
  try {
    smsResponse = await sendSMSViaSineris(
      phoneNumber,
      orderNum,
      startTime,
      endTime,
      qrCodeData
    );
    return smsResponse;
  } catch (error) {
    console.error("ERROR IN sendSMS function =>", error);
    return false;
  }
};
