/*jshint esversion: 8 */

// declaring variables for styling HTML markup
const inline: string = "display: inline-block;";
const padding0: string = "padding: 0px;";
const margin0: string = "margin: 0px;";
const marginV = (px: string): string => `margin: ${px}px 0;`;
const marginT = (px: string): string => `margin: ${px}px 0 0 0;`;
const marginB = (px: string): string => `margin: 0 0 ${px}px 0;`;
const fontSize = (px: string): string => `font-size: ${px}rem;`;

// declaring messages for server response
export const messages = {
  dataMissingMessage: function (source: string): string {
    return `Webhook event failed from ${source}. Critical data is missing from request body!`;
  },
  failedToLoadDataToServerMessage: function (source: string): string {
    return `Failed to load data to server! Source: ${source}`;
  },
  webhookNotLoggedAndEmailSentMessage: function (source: string): string {
    return `Webhook event not logged but email sent successfully. Source: ${source}`;
  },
  webhookNotLoggedAndEmailNotSentMessage: function (source: string): string {
    return `Webhook event not logged and email not sent! Source: ${source}`;
  },
  missingTimeInfoMessage: function (source: string): string {
    return `Webhook Event failed due to missing start/end booking times! Source: ${source}`;
  },
  webhookAlreadyLoggedMessage: function (source: string): string {
    return `Webhook Event failed as it has previously been successfully logged. Source: ${source}`;
  },
  requestNotPostMethodMessage: function (source: string): string {
    return `Webhook Event failed as request not coming from trusted source. Source: ${source}`;
  },
  errorFromMainTryCatchMessage: function (source: string): string {
    return `Webhook Event failed. Error from main try/catch. Source: ${source}`;
  },
  successMessage: function (source: string): string {
    return `Webhook Event logged and Email Successfully logged! Source: ${source}`;
  },
  failedToConnectToFTPServerMessage: function (source: string): string {
    return `Failed to connect to ftp server. Source: ${source}`;
  },
  generateQRCodeError: function (source: string): string {
    return `Failed to generate a QR code! Source: ${source}`;
  },
  sendingSMSFailed: function (source: string, webhookLogged: boolean): string {
    return `Failed to send an SMS to the user! Webhook logged: ${webhookLogged}. Source: ${source}`;
  },
};

export const hrefBase = "https://qr-code-webhook.vercel.app/";

/**
 * @param {string} dateString - date in string format
 * @param {boolean} shouldExcludeTime - determines whether or not time should be added to date string
 * @returns {string} - in the format MM/DD/YYYY or MM/DD/YYYY hh:mm:ss a
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
 * @param {string} inputDate - date in string format
 * @param {boolean} shouldAddGracePeriod - whether or not to set time to beginning of the day
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
 * @param {any} lineItems - line items off body
 * @returns {any} - line item properties for booking
 */
export function checkProperties(lineItems: any): any {
  return lineItems?.[1]?.properties?.length === 3 ||
    lineItems?.[1]?.name === "(MCO) SUPER SAVER 30 DAY PASS"
    ? lineItems[1]
    : lineItems?.[0];
} // END checkProperties

/**
 * Generates Omni Airport Logo as Image Tag
 * @returns {string} - HTML Image Tag of Omni logo
 */
function generateIconImageForEmailTemplate(): string {
  const style: string = 'display: block; margin: 8px 2px 8px 4px;"';
  const alt: string = "Omni Airport Parking logo";
  return `<img width="100" height="50" style="${style}" src="cid:unique-omnilogo" alt="${alt}" title="${alt}" />`;
} // END generateIconImageForEmailTemplate

/**
 * Generates HTML markup for email
 * @param {HTMLMarkupData} data - object containing properties needed for email
 * @param {string} billingAddressMarkup - billing address info in html format as string
 * @param {boolean} shouldExcludeTime - whether or not time should be included in email
 * @param {boolean} isForMercedes - denotes whether or not this email is for mercedes vendor
 * @returns {string} - HTML markup for email
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
    qrcodeData,
    price,
    quantity,
    userName,
  }: HTMLMarkupData = data;

  const dropoffTime: string = formatDateWithTime(dropoff, shouldExcludeTime);
  const pickupTime: string = formatDateWithTime(pickup, shouldExcludeTime);
  // const dropoffTime: string = '10/02/2022 at 07:00:00 AM'; // FOR TESTING ONLY
  // const pickupTime: string = '10/12/2022 at 11:00:00 PM'; // FOR TESTING ONLY

  const href = `${hrefBase}/view/qr?startTime=${dropoff}&endTime=${pickup}&qrcodeData=${qrcodeData}`;

  return `
    <html>
    <body>
      <b>Parking Confirmation Details:</b>
      ${generateIconImageForEmailTemplate()}
      <p style="${fontSize("1")} ${marginV("8")}">
        Thank you for placing your order with OMNI Airport Parking!
      </p>
      <p style="${marginV("8")}">This email is to confirm your recent order.</p>
      ${
        isForMercedes
          ? `<p style="${padding0} ${marginT("4")}">
              <b>Name:</b> ${userName}
            </p>`
          : ""
      }
      <p style="${marginB("8")}"><b>Purchased Date:</b> ${purchaseDate}</p>
      <p style="${marginT("4")} ${padding0} ${fontSize("1")}">
        <b>Drop off:</b> ${dropoffTime}
      </p>
      <p style="margin: 1px 0 16px 0; ${padding0} ${fontSize("1")}">
        <b>Pick up:</b> ${pickupTime}
      </p>

      <p style="${marginB("1")} ${padding0}">
        1x Facility Charge for $4.99 each
      </p>
      <p style="${margin0} ${padding0}">${quantity}x ${type.toUpperCase()} for $${price} each</p>
      
      <p style="${padding0} ${marginT("8")}">Subtotal: $${subtotal}</p>
      <p style="${padding0} ${margin0}">Taxes and Fees: $${taxes}</p>
      ${
        isForMercedes
          ? `<p style="${padding0} ${margin0}">Total Before Discount: $${total}</p>
          <p style="${padding0} ${margin0}">Total After Discount: $0.00</p>`
          : `<p style="${padding0} ${margin0}">Total: $${total}</p>`
      }
      
      <br />
      ${
        isForMercedes
          ? ""
          : `<p style="font-weight: bold; ${marginB("1")} ${padding0}">
              Billing Address:
            </p>
            <p style="${padding0} ${marginV("4")};">${billingAddressMarkup}</p>`
      }
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique-qrcode" alt="QR Code" title="QR Code" />
      <div>
        <p style="${padding0} ${margin0} ${inline}">Can't see the QR Code? View it in your browser by clicking</p>
        <a style="${inline}" href="${href}" target="_blank" alt="link to qr code">here</a>
      </div>
    </body>
  `;
} // END generateHTMLMarkup

/**
 * Generates billing address HTML markup for email
 * @param {BillingAddress} billing_address - Object containing properties needed for billing address
 * @returns {string} - billing info in HTML markup for email
 */
export function formatBillingInfoForEmail(
  billing_address: BillingAddress
): string {
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
    console.error("formatBillingInfoForEmail => error:", e);
    return "";
  }
} // END formatBillingInfoForEmail

/**
 * Sends email to user
 * @param {any} transporter - nodemailer sdk
 * @param {EmailData} emailInfo - object containing properties needed for email
 * @returns {Promise<boolean>} - Indicates whether email was sent or not
 */
export async function sendEmail(
  transporter: any,
  emailInfo: EmailData
): Promise<boolean> {
  try {
    if (!emailInfo || !emailInfo?.to) {
      return false;
    }

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
 * @param {any} QRCode - qrcode sdk
 * @param {string} data - data for qr code (order number, default numbers, & trailing zeros)
 * @returns {Promise<string>} - QR Code image
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
 * @param {DataForServer} data - object containing properties needed for server
 * @returns {string} - Data for server
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

    // generate string as data for file for ftp server
    return `${a}${b};${s};${e}${zeros}"${f}";"${l}";"";"${orderNoFormated}";"";${st};1;04;${e};200${q}`;
  } catch (e) {
    console.error("generateDataForServer => error:", e);
    return "";
  }
} // END generateDataForServer

/**
 * Sends data to omni servers with reservation info and unique id
 * The unique id is what is stored in the QR code and used to look up the reservation
 * @param {any} client - ftp client sdk
 * @param {string} data - data sent to server
 * @param {string} orderNumber - the order number for this purchase
 * @returns {Promise<boolean>} - Boolean indicating whether or not sending data was successful
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
 * @param {string} startDateStr - start date of reservation as string in format 2024-02-01T18:00:00
 * @param {string} endDateStr - end date of reservation as string in format 2024-02-01T18:00:00
 * @returns {number} - the quantity of days between start and end time as number
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
 * @returns {{ start: string, end: string }} -  the start and end dates in ISO String format
 */
export function generateTimeForSuperSaverPass(): {
  start: string;
  end: string;
} {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);

  startDate.setHours(0, 1, 0, 0);
  endDate.setHours(23, 59, 0, 0);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  return { start, end };
} // END generateTimeForSuperSaverPass

/**
 * Formats the user's phone number to ensure +1 is in the front of it for twilio sms
 * @param {string} phoneNumber - the user's phone number
 * @returns {string} - user phone number with +1 in the beginning
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
