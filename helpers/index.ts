/*jshint esversion: 8 */
// npm
import moment from "moment";

// declaring variables for styling HTML markup
const padding0: string = "padding: 0px;";
const margin0: string = "margin: 0px;";
const margin1000: string = "margin: 1px 0px 0px 0px;";
const margin0010: string = "margin: 0px 0px 1px 0px;";
const margin8000: string = "margin: 8px 0px 0px 0px;";

// declaring message variables for server response
export const dataMissingMessage: string =
  "Webhook event failed. Critical data is missing from request body!";
export const failedToLoadDataToServerMessage: string =
  "Failed to load data to server!";
export const webhookNotLoggedAndEmailSentMessage: string =
  "Webhook event not logged but email sent successfully.";
export const webhookNotLoggedAndEmailNotSentMessage: string =
  "Webhook event not logged and email not sent!";
export const missingTimeInfoMessage: string =
  "Webhook Event failed due to missing start/end booking times!";
export const webhookAlreadyLoggedMessage: string =
  "Webhook Event failed as it has previously been successfully logged.";
export const requestNotPostMethodMessage: string =
  "Webhook Event failed as request not coming from trusted source.";
export const errorFromMainTryCatchMessage: string =
  "Webhook Event failed. Error from main try/catch.";
export const successMessage: string =
  "Webhook Event logged and Email Successfully logged!";
export const failedToConnectToServerMessage: string =
  "Failed to connect to ftp server.";

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
};

// const hrefBase =
//   process.env.NODE_ENV === "production"
//     ? "https://qr-code-webhook-git-master-omniairportparking.vercel.app/"
//     : "http://localhost:3000";

const hrefBase =
  "https://qr-code-webhook-git-master-omniairportparking.vercel.app/";

export function convertDateFormat(inputDate: string): string {
  // Parse the input date string
  const parsedDate = new Date(inputDate);

  // Format the output date
  const formattedDate = `${
    parsedDate.getMonth() + 1
  }/${parsedDate.getDate()}/${parsedDate
    .getFullYear()
    .toString()
    .slice(-2)} ${parsedDate.getHours()}:${
    (parsedDate.getMinutes() < 10 ? "0" : "") + parsedDate.getMinutes()
  } ${parsedDate.getHours() >= 12 ? "PM" : "AM"}`;

  return formattedDate;
}

/**
 * Checks line items property for booking time or
 * @param {any} lineItems - line items off body
 */
export function checkProperties(lineItems: any): any {
  return lineItems?.[1]?.properties?.length === 3
    ? lineItems[1]
    : lineItems?.[0];
} // END checkProperties

/**
 * Returns date as dd.mm.yyyyhour:minute:second format i.e., 01.01.202216:14:14
 * @param {string} dateString - date in string form
 */
export function formatTime(
  dateString: string,
  shouldHaveGracePeriod = true
): string {
  if (!dateString?.trim()) {
    return "";
  }

  const timeFormat = "DD.MM.YYYYHH:mm:ss";

  if (shouldHaveGracePeriod) {
    const time = moment(dateString);
    time.subtract(moment.duration("02:00:00"));
    return moment(time).format(timeFormat);
  }

  return moment(dateString).format(timeFormat);
} // END formatTime

/**
 * Returns date as dd.mm.yyyyhour:minute:second format
 *
 */
function generateIconImageForEmailTemplate(): string {
  const style: string = 'display: block; margin: 0px 2px 8px 4px;"';
  const alt: string = "Omni Airport Parking logo";
  return `<img width="100" height="50" style="${style}" src="cid:unique-omnilogo" alt="${alt}" title="${alt}" />`;
} // END generateIconImageForEmailTemplate

/**
 * Generates HTML markup for email
 * Returns date as dd.mm.yyyyhour:minute:second format
 * @param {HTMLMarkupData} data - object containing properties needed for email
 * @param {string} billingAddressMarkup - billing address info in html format as string
 */
export function generateHTMLMarkup(
  data: HTMLMarkupData,
  billingAddressMarkup: string
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
  }: HTMLMarkupData = data;

  const timeFormat: string = "MM/DD/YYYY hh:mm:ss a";

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  const dropoffTime: string = moment(dropoff).format(timeFormat)?.toUpperCase();
  const pickupTime: string = moment(pickup).format(timeFormat)?.toUpperCase();
  // const dropoffTime: string = '10/02/2022 at 07:00:00 AM'; // FOR TESTING ONLY
  // const pickupTime: string = '10/12/2022 at 11:00:00 PM'; // FOR TESTING ONLY

  const href = `${hrefBase}/view/qr?startTime=${dropoff}&endTime=${pickup}&qrcodeData=${qrcodeData}`;

  return `
    <html>
    <body>
      <b>Parking Confirmation Details:</b>
      <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
      <p>This email is to confirm your recent order.</p>
      <p><b>Date:</b> ${purchaseDate}</p>
      <p style="font-weight: bold; ${margin0010} ${padding0}">Billing Address:</p>
      <p style="${padding0} margin: 2px 0;">${billingAddressMarkup}</p>
      ${generateIconImageForEmailTemplate()}
      <p style="${margin0010}">1x Facility Charge for $4.99 each</p>
      <p style="${margin1000} ${padding0}">${quantity}x ${type.toUpperCase()} for $${price} each</p>
      <p style="${margin8000} ${padding0}"><b>Drop off:</b> ${dropoffTime}</p>
      <p style="${margin1000} ${padding0}"><b>Pick up:</b> ${pickupTime}</p>
      <br />
      <p style="${padding0} ${margin0}">Subtotal: $${subtotal}</p>
      <p style="${padding0} ${margin0}">Taxes and Fees: $${taxes}</p>
      <p style="${padding0} ${margin0}">Total: $${total}</p>
      <br />
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique-qrcode" alt="QR Code" title="QR Code" />
      <br />
      <p style="${padding0} ${margin0}">Can't see the QR Code? View it in your browser by clicking the link below:</p>
      <a href="${href}" target="_blank" alt="link to qr code">
        View QR Code
      </a>
    </body>
  `;
} // END generateHTMLMarkup

/**
 * Generates billing address HTML markup for email
 * @param {BillingAddress} billing_address - Object containing properties needed for billing address
 */
export function formatBillingInfoForEmail(
  billing_address: BillingAddress
): string {
  try {
    if (!billing_address) {
      return "";
    }

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
 * Sends email to user - returns true if email was sent and false if not
 * @param {any} transporter - nodemailer sdk
 * @param {EmailData} emailInfo - object containing properties needed for email
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
 * Generates HTML markup for email returned as string
 * @param {HTMLMarkupData} data - object containing properties needed for email
 */
export function generateHTMLMarkupMercedes(data: HTMLMarkupData): string {
  const {
    createdAt: purchaseDate,
    end_time: endTime,
    name: type,
    start_time: startTime,
    subtotal_price: subtotal,
    total_price: total,
    total_tax: taxes,
    qrcodeData,
    price,
    quantity,
    userName,
  }: HTMLMarkupData = data;

  const timeFormat: string = "MM/DD/YYYY hh:mm:ss a";

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  const dropoffTime: string = moment(startTime)
    .format(timeFormat)
    ?.toUpperCase();

  const pickupTime: string = moment(endTime).format(timeFormat)?.toUpperCase();
  // const dropoffTime: string = '10/02/2022 at 07:00:00 AM'; // FOR TESTING ONLY
  // const pickupTime: string = '10/12/2022 at 11:00:00 PM'; // FOR TESTING ONLY

  const href = `${hrefBase}/view/qr?startTime=${startTime}&endTime=${endTime}&qrcodeData=${qrcodeData}`;

  return `
    <html>
    <body>
      <b>Parking Confirmation Details:</b>
      <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
      <p>This email is to confirm your recent order.</p>
      <p style="${padding0} margin: 2px 0;"><b>Name:</b> ${userName}</p>
      <p><b>Date:</b> ${purchaseDate}</p>
      ${generateIconImageForEmailTemplate()}
      <p style="${margin0010}">1x Facility Charge for $4.99 each</p>
      <p style="${margin1000} ${padding0}">${quantity}x ${type.toUpperCase()} for $${price} each</p>
      <p style="${margin8000} ${padding0}"><b>Drop off:</b> ${dropoffTime}</p>
      <p style="${margin1000} ${padding0}"><b>Pick up:</b> ${pickupTime}</p>
      <br />
      <p style="${padding0} ${margin0}">Subtotal: $${subtotal}</p>
      <p style="${padding0} ${margin0}">Taxes and Fees: $${taxes}</p>
      <p style="${padding0} ${margin0}">Total Before Discount: $${total}</p>
      <p style="${padding0} ${margin0}">Total After Discount: $0.00</p>
      <br />
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique-qrcode" alt="QR Code" title="QR Code" />
      <br />
      <p style="${padding0} ${margin0}">Can't see the QR Code? View it in your browser by clicking the link below:</p>
      <a href="${href}" target="_blank" alt="link to qr code">
        View QR Code
      </a>
    </body>
  `;
} // END generateHTMLMarkupMercedes

/**
 * Determines quantity of days user parking in lot for mercedes VIP users
 * Returns the quantity as an integer
 * @param {string} startDateStr - start date of reservation as string in format 2024-02-01T18:00:00
 * @param {string} endDateStr - end date of reservation as string in format 2024-02-01T18:00:00
 */
export const calculateDaysBetweenWithTime = (
  startDateStr: string,
  endDateStr: string
): number => {
  // Convert date strings to Date objects
  const startDate: Date = new Date(startDateStr);
  const endDate: Date = new Date(endDateStr);

  // Calculate the time difference in milliseconds
  const timeDifference: number = endDate.getTime() - startDate.getTime();

  // Convert the time difference to days, including partial days
  const daysDifference: number = timeDifference / (1000 * 60 * 60 * 24);

  return Math.ceil(daysDifference);
}; // END calculateDaysBetweenWithTime
