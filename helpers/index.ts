/*jshint esversion: 8 */
import { Buffer } from 'buffer';
import { Readable } from 'stream';

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
function generateIconImageForEmailTemplate(logoImageBase64: string): string {
  let imgElString = `<img width="100" height="50" style="display: block; margin-right: 2px; margin-left: 4px;" `;
  imgElString += `src="data:image/png;base64, ${logoImageBase64}" alt="Omni Airport Parking logo" title="Omni Airport Parking logo" />`;
  return imgElString;
} // END generateIconImageForEmailTemplate


/*
* Generates HTML markup for email
*/
export function generateHTMLMarkup(data: any, billingAddressMarkup: string): string {
  const {
    createdAt: purchaseDate, end_time, logoImageBase64, price, name, quantity,
    start_time, subtotal_price, total_price, total_tax, title, qrCodeUrl,
  } = data;

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  const start = generateDateTimeAsString(start_time, true);
  const end = generateDateTimeAsString(end_time, true);

  // To have image directly in email template (instead of attachment) - add to last line of text:
  // <img height="200" width="200" style="display: block; object=fit: contain;" src="${qrCodeUrl}" alt="QR Code" title="QR Code" />

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
      <br />
      <img height="200" width="200" style="display: block; object=fit: contain;" src="cid:unique@omniparking.com" alt="QR Code" title="QR Code" /> 
    </body>
    `;
} // END generateHTMLMarkup


/*
* Generates billing address HTML markup for email
*/
export function formatBillingAddressForHTMLMarkup(billing_address: any): string {
  try {
    const { name, address1, address2, city, province, zip, country } = billing_address;
    return `
      <section>
        <p style="padding: 0px; margin: 0px;">${name}</p>
        <p style="padding: 0px; margin: 0px;">${address1}</p>
        ${address2 ? `<p style="padding: 0px; margin: 0px;">${address2}</p>` : ''}
        <p style="padding: 0px; margin: 0px;">${city}</p>
        <p style="padding: 0px; margin: 0px;">${province} ${zip}</p>
        <p style="padding: 0px; margin: 0px;">${country}</p>
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
export async function sendEmail(transporter, emailInfo: any, useSendGrid = false): Promise<boolean> {
  // Define variables needed for sending emails
  const { to, from, html, order_number, attachments, qrCodeUrl: content, name, /*sendgridQrCode*/ } = emailInfo;
  const text = 'Your order has been confirmed for Omni Parking. The QR code is attached';
  const subject = `Order #${order_number} confirmed`;

  try {
    if (!useSendGrid) {
      // To send emails using nodemailer
      const results = await transporter.sendMail({ to, from, html, text, subject, attachments });

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
    } else {
      // To use emails using SendGrid
      const attachment = [{ content, filename: 'qrcode.png', type: 'application/png', disposition: 'inline', content_id: 'qrcode' }];
      const sendgridTo = { name, email: to };
      const sendgridFrom = { email: 'info@omniairportparking.com', name: 'Omni Airport Parking' };

      const msg = { to: sendgridTo, from: sendgridFrom, subject, html, text, attachments: attachment }; // 
      let didEmailSend = false;
      const results = await transporter.send(msg);
      if (results?.[0]?.statusCode === 202) {
        didEmailSend = true;
      } else {
        didEmailSend = false;
      }
      if (didEmailSend) { return true; }
      return false;
    }
  } catch (e) {
    if (useSendGrid) {
      console.error('Error in sendEmail (using sendGrid) =>', e?.response?.body?.errors || e);
    } else {
      console.error('Error in sendEmail (using nodemailer) =>', e);
    }
    return false;
  }
} // END sendEmail


/*
* Generates qr code with order id, start date, and end date for sendgrid or nodemailer 
*/
export async function generateQRCode(QRCode, data, forSendgrid = false): Promise<string> {
  try {
    let codeUrl = '';
    if (forSendgrid) {
    } else {
      codeUrl = await QRCode.toDataURL(data, { errorCorrectionLevel: 'L', version: 9 });
    }
    // codeUrl = codeUrl.replace('data:image/png;base64, ', '');
    return codeUrl;
  } catch (e) {
    console.error('Error in generateQRCode => ', e);
    return '';
  }
} // END generateQRCode


/*
* Generates date as string in format MM/DD/YYYY
* If addTime equals true, then time is added in 12:00:00 PM format, else just date is returned
*/
export function generateDateTimeAsString(date, addTime = false) {
  const newDate = new Date(date);
  if (!addTime) { return newDate.toLocaleDateString(); }
  return `${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
} // END generateDateTimeAsString


/*
*
*/
export async function uploadFileToS3(s3, file) {
  try {
    const Body = Buffer.from(file, 'binary');
    const ContentType = 'application/javascript';
    const awsResp = await s3.putObject({ Body, Bucket, ContentType, Key }).promise();
    return awsResp ? true : false;
  } catch (e) {
    console.error('error in uploadFileToS3 =>', e);
    return false;
  }
} // END uploadFileToS3


/*
*
*/
export async function getHOSFileAsStringFromS3(s3) {
  try {
    const params = { Bucket, Key };
    const { Body } = await s3.getObject(params).promise();
    const file = Body.toString('utf-8');
    return file;
  } catch (e) {
    console.error('error in getHOSFileAsStringFromS3 =>', e);
    return null;
  }
} // END getHOSFileAsStringFromS3

/*
*
*/
export function generateFileForServer(data) {
  try {
    const { end_time, first_name, last_name, order_number, start_time } = data;
    const resNum = `ShopQ\\${order_number}`;
    const dataForFile = `250000;1755164;13.07.2022;63;"USD"\n0;5;${resNum};${start_time};${end_time};0;0;0;0;0;0;;;"${first_name}";"${last_name}";"";"${order_number}";"";${start_time};1;0;${end_time};0;"";"";"";"";"";""`;
    return dataForFile;
  } catch (e) {
    console.error('Error in generateFileForServer =>', e);
    return null;
  }
} // END generateFileForServer


/*
* Sends data to omni servers with reservation info and unique id
* The unique id is what is stored in the QR code and used to look up the reservation
*/
export async function sendDataToServer(client, data) {
  try {
    await client.access({ host, user, password, port: 21, secure: false });
    const stream: Readable = new Readable();
    stream._read = () => { };
    stream.push(data);
    const response = await client.upload(stream, 'RS220713.HOS'); // uploadFrom
    return true;
  } catch (e) {
    console.error('error in sendDataToServer =>', e);
    return false;
  }
} // END sendDataToServer