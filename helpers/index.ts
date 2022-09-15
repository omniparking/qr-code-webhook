/*jshint esversion: 8 */

const padding0 = 'padding: 0px;';
const margin0 = 'margin: 0px;';
const margin1000 = 'margin: 1px 0px 0px 0px;';
const margin0010 = 'margin: 0px 0px 1px 0px;';
const margin8000 = 'margin: 8px 0px 0px 0px;';


// declaring message variables for server response
export const dataMissingMessage = 'Webhook event failed. Critical data is missing from request body!';
export const failedToLoadDataToServerMessage = 'Failed to load data to server!';
export const emailNotSentMessage = 'Webhook event not logged but email sent successfully.';
export const missingTimeInfoMessage = 'Webhook Event logged and Email Successfully logged.';
export const webhookAlreadyLoggedMessage = 'Webhook Event failed as it has previously been successfully logged.';
export const requestNotPostMethodMessage = 'Webhook Event failed as request method is not of type "POST".';
export const errorFromMainTryCatchMessage = 'Webhook Event failed. Error from main try/catch.';
export const successMessage = 'Webhook Event logged and Email Successfully logged!';

/**
 * @param {number} value - Represents either day, month, year, hour, minute, or second
 */
const addLeadingZeroIfNecessary = (value: number): string => {
  if (+value < 10) { return `0${value}`; }
  return `${value}`;
} // END addLeadingZeroIfNecessary


/**
 * Returns date as dd.mm.yyyyhour:minute:second format i.e., 01.01.202216:14:14
 * @param {string} dateString - date in string form
 */
export function formatDate(dateString: string): string {
  if (!dateString?.trim()) { return ''; }

  const date = new Date(dateString);
  const day = addLeadingZeroIfNecessary(date.getUTCDate());
  const month = addLeadingZeroIfNecessary(date.getUTCMonth() + 1); // months from 1-12
  const year = addLeadingZeroIfNecessary(date.getUTCFullYear());
  const hours = addLeadingZeroIfNecessary(date.getHours());
  const minutes = addLeadingZeroIfNecessary(date.getMinutes());
  const seconds = addLeadingZeroIfNecessary(date.getSeconds());

  return `${day}.${month}.${year}${hours}:${minutes}:${seconds}`;
} // END formatDate


/**
 * Returns date as dd.mm.yyyyhour:minute:second format i.e., 01.01.202216:14:14
 * @param {string} logoImageBase64 - omni logo in base64
 */
function generateIconImageForEmailTemplate(logoImageBase64: string): string {
  const style = 'display: block; margin-right: 2px; margin-left: 4px;';
  const alt = 'Omni Airport Parking logo';
  const src = `data:image/png;base64, ${logoImageBase64}`;
  return `<img width="100" height="50" style="${style}" src="${src}" alt="${alt}" title="${alt}" />`;
} // END generateIconImageForEmailTemplate


/**
 * Generates HTML markup for email
 * Returns date as dd.mm.yyyyhour:minute:second format i.e., 01.01.202216:14:14
 * @param {any} data - object containing properties needed for email
 * @param {string} billingAddressMarkup - billing address info in html format as string
 */
export function generateHTMLMarkup(data: any, billingAddressMarkup: string): string {
  const {
    createdAt: purchaseDate, end_time, logoImageBase64, price,
    name, quantity, start_time, subtotal_price, total_price, total_tax
  } = data;

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  // const start = formatDateTimeAsString(start_time, true);
  // const end = formatDateTimeAsString(end_time, true);
  const start = '09/13/2022 at 07:00:00 AM';
  const end = '09/17/2022 at 11:00:00 PM';

  return `
    <html>
    <body>
      <b>Parking Confirmation Details:</b>
      <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
      <p>This email is to confirm your recent order.</p>
      <p><b>Date:</b> ${purchaseDate}</p>
      <p style="font-weight: bold; ${margin0010} ${padding0}">Billing Address:</p>
      <p style="${padding0} margin: 2px 0;">${billingAddressMarkup}</p>
      ${generateIconImageForEmailTemplate(logoImageBase64)}
      <p style="${margin0010}">1x Facility Charge for $4.99 each</p>
      <p style="${margin1000} ${padding0}">${quantity}x ${name.toUpperCase()} for $${price} each</p>
      <p style="${margin8000} ${padding0}"><b>Drop off:</b> ${start}</p>
      <p style="${margin1000} ${padding0}"><b>Pick up:</b> ${end}</p>
      <br />
      <p style="${padding0} ${margin0}">Subtotal: $${subtotal_price}</p>
      <p style="${padding0} ${margin0}">Taxes and Fees: $${total_tax}</p>
      <p style="${padding0} ${margin0}">Total: $${total_price}</p>
      <br />
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique-qrcode" alt="QR Code" title="QR Code" />
    </body>
    `;
} // END generateHTMLMarkup

/**
* Generates billing address HTML markup for email
* @param {any} billing_address - Object containing properties needed for billing address
*/
export function formatBillingInfoForEmail(billing_address: any): string {
  try {
    if (!billing_address) { return ''; }
    const { address1, address2, city, country, name, province, zip } = billing_address;
    return `
      <section>
        <p style="${margin0} ${padding0}">${name}</p>
        <p style="${margin0} ${padding0}">${address1}</p>
        ${address2 ? `<p style="${margin0} ${padding0}">${address2}</p>` : ''}
        <p style="${margin0} ${padding0}">${city}</p>
        <p style="${margin0} ${padding0}">${province} ${zip}</p>
        <p style="${margin0} ${padding0}">${country}</p>
      </section>
    `;
  } catch (e) {
    console.error('Error -- formatBillingInfoForEmail: => ', e);
    return '';
  }
} // END formatBillingInfoForEmail

/**
* Sends email to user - returns true if email was sent and false if not
* @param {any} transporter - nodemailer sdk
* @param {any} emailInfo - object containing properties needed for email
*/
export async function sendEmail(transporter: any, emailInfo: any): Promise<boolean> {
  try {
    if (!emailInfo) { return false; }

    // Define variables
    const { attachments, from, html, orderNum, to } = emailInfo;
    const text = 'Your order has been confirmed for Omni Parking. The QR code is attached';
    const subject = `Order #${orderNum} confirmed`;

    // send email
    const emailResponse = await transporter.sendMail({ attachments, from, html, subject, text, to });

    // Check results from request; if email address is found in the 'accepted' array, then email was sent succesfully
    // But if the receiver's email is found in the 'rejected' array, then the email failed to send
    if (emailResponse) {
      const { accepted, rejected } = emailResponse;
      if (accepted?.indexOf(to) > -1 || !rejected?.length) {
        return true;
      } else if (rejected?.indexOf(to) > -1 || rejected?.length || !accepted?.length) {
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    console.error('Error -- sendEmail =>', e);
    return false;
  }
} // END sendEmail

/**
* Generates QR code with order number
* @param {any} QRCode - qrcode sdk
* @param {string} data - data for qr code (order number, default numbers, & trailing zeros)
*/
export async function generateQRCode(QRCode: any, data: string): Promise<string> {
  try {
    const qrcodeUrl: string = await QRCode.toDataURL(data, { errorCorrectionLevel: 'L', version: 9 });
    return qrcodeUrl;
  } catch (e) {
    console.error('Error -- generateQRCode => ', e);
    return '';
  }
} // END generateQRCode

/**
* Generates date as string in format MM/DD/YYYY
* If addTime equals true, then result is MM/DD/YYYY 12:00:00 PM format
* @param {string} date - date in string format
* @param {boolean} addTime - determines whether date should include time or not
*/
export function formatDateTimeAsString(date: string, includeTime = false): string {
  const newDate: Date = new Date(date);
  if (!includeTime) { return newDate?.toLocaleDateString() || ''; }
  return `${newDate?.toLocaleDateString() || ''} at ${newDate?.toLocaleTimeString() || ''}`;
} // END formatDateTimeAsString

/**
* @param {any} data - object containing properties needed for server
*/
export function generateDataForServer(data: any): string {
  try {
    const { end_time: e, first: f, last: l, orderNum: n, start_time: s } = data;
    const a = '250000;1755164;13.07.2022;63;"USD"\n0;5;';
    const zeros = ';0;0;0;0;0;0;;;';
    const q = '"";"";"";"";"";""';
    const paddingZeros = new Array(9 - `${n}`.length).join('0');
    const orderNoPadded = `${paddingZeros}${n}`;
    const b = `ShopQ\\${orderNoPadded}`;

    return `${a}${b};${s};${e}${zeros}"${f}";"${l}";"";"${orderNoPadded}";"";${s};1;0;${e};0;${q}`;
  } catch (e) {
    console.error('Error -- generateDataForServer =>', e);
    return '';
  }
} // END generateDataForServer

/**
* Sends data to omni servers with reservation info and unique id
* The unique id is what is stored in the QR code and used to look up the reservation
* @param {any} client - ftp client sdk
* @param {string} data - data sent to server 
* @param {string} orderNumber - the order number for this purchase
*/
export async function sendDataToServer(client: any, data: string, orderNumber: string): Promise<boolean> {
  try {
    const filename = `${process.env.FILE_FOR_SERVER}.${orderNumber}`.toLowerCase();
    const resultsFromServer: boolean = await new Promise(resolve => {
      client.on('ready', () => {
        client.put(data, filename, err => {
          if (err) { return resolve(false); }
          resolve(true);
        });
      });
    });
    console.log('resultsFromServer:', resultsFromServer);
    return resultsFromServer;
  } catch (e) {
    console.error('Error -- sendDataToServer =>', e);
    const falsePromise: boolean = await Promise.resolve(false);
    return falsePromise;
  }
} // END sendDataToServer
