/*jshint esversion: 8 */
import { Buffer } from 'buffer';
import { promisify } from 'util';


const {
  AMAZ_BUCKET: Bucket,
  FILE_FOR_SERVER: Key,
  SERVER_IP_ADDRESS: host,
  SERVER_PASSWORD: password,
  SERVER_USER: user,
} = process.env;

/*
*
*/
const addLeadingZeroIfNecessary = (time: number): string => {
  if (+time < 10) { return `0${time}`; }
  return `${time}`;
} // END addLeadingZeroIfNecessary


/*
*
*/
export function formatDate(dateString: string, justHoursAndMinutes = false): string {
  if (!dateString?.trim() && !justHoursAndMinutes) { return ''; }
  let date: Date;
  
  if (!dateString && justHoursAndMinutes) {
    date = new Date();
  } else {
    date = new Date(dateString);
  }
  const h = date.getHours();
  const mi = date.getMinutes();
  const s = date.getSeconds();
  const seconds = addLeadingZeroIfNecessary(s);
  const minutes = addLeadingZeroIfNecessary(mi);
  const hours = addLeadingZeroIfNecessary(h);
  const m = date.getUTCMonth() + 1; // months from 1-12
  const d = date.getUTCDate();
  const y = date.getUTCFullYear();
  const month = addLeadingZeroIfNecessary(m);
  const day = addLeadingZeroIfNecessary(d);
  const year = addLeadingZeroIfNecessary(y);

  if (justHoursAndMinutes) { return `${hours}:${minutes}`; }
  return `${day}.${month}.${year}${hours}:${minutes}:${seconds}`;
} // END formatDate


/*
*
*/
function generateIconImageForEmailTemplate(logoImageBase64: string): string {
  const styles = 'display: block; margin-right: 2px; margin-left: 4px;';
  const heightAndWidth = 'width="100" height="50"';
  const alt = 'Omni Airport Parking logo';
  const title = 'Omni Airport Parking logo';
  const src = `data:image/png;base64, ${logoImageBase64}`;
  return `<img ${heightAndWidth} style="${styles}" src="${src}" alt="${alt}" title="${title}" />`;
} // END generateIconImageForEmailTemplate


/*
* Generates HTML markup for email
*/
export function generateHTMLMarkup(data: any, billingAddressMarkup: string): string {
  const {
    createdAt: purchaseDate, end_time, logoImageBase64, price, name, quantity,
    start_time, subtotal_price, total_price, total_tax, title, qrcodeUrl,
  } = data;

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  const start = formatDateTimeAsString(start_time, true);
  const end = formatDateTimeAsString(end_time, true);

  // To have image directly in email template (instead of attachment) - add to last line of text:
  // <img height="200" width="200" style="display: block; object=fit: contain;" src="${qrcodeUrl}" alt="QR Code" title="QR Code" />

  return `
    <html>
    <body>
      <b>Parking Confirmation Details:</b>
      <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
      <p>This email is to confirm your recent order.</p>
      <p>Date ${purchaseDate}</p>
      <p style="font-weight: bold; margin: 0px 0px 1px 0px; padding 0px;">Billing Address:</p>
      <p>${billingAddressMarkup}</p>
      <br />
      ${generateIconImageForEmailTemplate(logoImageBase64)}
      <p style="margin: 0px 0px 1px 0px;">1x Facility Charge for $4.99 each</p>
      <p style="margin: 1px 0px 0px 0px; padding: 0px;">${quantity}x ${name.toUpperCase()} for $${price} each</p>
      <p style="margin: 8px 0px 0px 0px; padding: 0px;">Drop off: ${start}</p>
      <p style="margin: 1px 0px 0px 0px; padding: 0px;">Pick up: ${end}</p>
      <br />
      <p style="margin: 0px; padding: 0px;">Subtotal: $${subtotal_price}</p>
      <p style="margin: 0px; padding: 0px;">Taxes and Fees: $${total_tax}</p>
      <p style="margin: 0px; padding: 0px;">Total: $${total_price}</p>
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique@omniparking.com" alt="QR Code" title="QR Code" />
      <br />
    </body>
    `;
} // END generateHTMLMarkup


/*
* Generates billing address HTML markup for email
*/
export function formatBillingAddressForHTMLMarkup(billing_address: any): string {
  try {
    const { name, address1, address2, city, province, zip, country } = billing_address;
    const style = 'padding: 0px; margin: 0px;';
    return `
      <section>
        <p style="${style}">${name}</p>
        <p style="${style}">${address1}</p>
        ${address2 ? `<p style="${style}">${address2}</p>` : ''}
        <p style="${style}">${city}</p>
        <p style="${style}">${province} ${zip}</p>
        <p style="${style}">${country}</p>
      </section>
    `;
  } catch (e) {
    console.error('Error in formatBillingAddressForHTMLMarkup: => ', e);
    return '';
  }
} // END formatBillingAddressForHTMLMarkup


/*
* Sends email to user - returns true if email was sent and false if not
*/
export async function sendEmail(transporter: any, emailInfo: any): Promise<boolean> {
  // Define variables needed for sending emails
  const { to, from, html, order_number, attachments } = emailInfo;
  const text = 'Your order has been confirmed for Omni Parking. The QR code is attached';
  const subject = `Order #${order_number} confirmed`;

  try {
      // To send emails using nodemailer
    const results = await transporter.sendMail({ attachments, from, html, subject, text, to });
    console.log('email results:', results)

    // Check results from email request -> if receiver is found in the accepted array, then email was sent succesfully
    // However if the receiver's email is found in the rejected array, then the email was not sent successfully
    if (results) {
      if (results?.accepted?.indexOf(to) > -1) {
        return true;
      } else if (results?.rejected?.indexOf(to) > -1) {
        return false;
      } else if ((results?.rejected?.length > 0) || results?.accepted?.length === 0) {
        return false;
      } else if (results?.rejected?.length === 0) {
        return true;
      }
    } else {
      return false;
    }
  } catch (e) {
    console.error('Error in sendEmail (using nodemailer) =>', e);
    return false;
  }
} // END sendEmail


/*
* Generates qr code with order id
*/
export async function generateQRCode(QRCode: any, data: any): Promise<string> {
  try {
    const qrcodeUrl = await QRCode.toDataURL(data, { errorCorrectionLevel: 'L', version: 9 });
    return qrcodeUrl;
  } catch (e) {
    console.error('Error in generateQRCode => ', e);
    return '';
  }
} // END generateQRCode


/*
* Generates date as string in format MM/DD/YYYY
* If addTime equals true, then time is added in 12:00:00 PM format, else just date is returned
*/
export function formatDateTimeAsString(date: string, addTime = false): string {
  const newDate = new Date(date);
  if (!addTime) { return newDate.toLocaleDateString(); }
  return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
} // END formatDateTimeAsString


/*
*
*/
export function generateFileForServer(data: any): string {
  try {
    const { end_time, first_name, last_name, order_number, start_time } = data;
    const resNum = `ShopQ\\${order_number}`;
    const dataForFile = `250000;1755164;13.07.2022;63;"USD"\n0;5;${resNum};${start_time};${end_time};0;0;0;0;0;0;;;"${first_name}";"${last_name}";"";"${order_number}";"";${start_time};1;0;${end_time};0;"";"";"";"";"";""`;
    return dataForFile;
  } catch (e) {
    console.error('Error in generateFileForServer =>', e);
    return '';
  }
} // END generateFileForServer


/*
* Sends data to omni servers with reservation info and unique id
* The unique id is what is stored in the QR code and used to look up the reservation
*/
export function sendDataToServer(client: any, data: string): any {
  try {
    const ftpPut = promisify(client.put.bind(client));

    client.on('ready', async () => {
      await ftpPut(data, `${Key}${formatDate('', true)}`);
      client.end();
    });

  } catch (e) {
    console.error('error in sendDataToServer =>', e);
    return false;
  }
} // END sendDataToServer