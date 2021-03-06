/*jshint esversion: 8 */
import fs from 'fs';

/*
*
*/
export function encode(data) {
  const str = data.reduce((a, b) => { return a + String.fromCharCode(b); },'');
  return Buffer.from(str).toString('base64').replace(/.{76}(?=.)/g, '$&\n');
} // END encode


/*
*
*/
function generateIconImageForEmailTemplate(imgPath) {
  // const src = encode(imgPath);
  // return `<img width="100" height="50" style="display: block; margin-right: 2px; margin-left: 4px;" src="${imgPath}" alt="Omni Airport Parking logo" title="Omni Airport Parking logo" />`;
  return `<img width="100" height="50" style="display: block; margin-right: 2px; margin-left: 4px;" src="data:image/png;base64, ${imgPath}" alt="Omni Airport Parking logo" title="Omni Airport Parking logo" />`;
} // END generateIconImageForEmailTemplate


/*
* Generates HTML markup for email
*/
export function generateHTMLMarkup(data, billingAddressMarkup) {
  const {
    createdAt: purchaseDate, end_time, imagePath, price, name, quantity,
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
      ${billingAddressMarkup}
      <br />
      ${generateIconImageForEmailTemplate(imagePath)}
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
//         
//       <img height="200" width="200" style="display: block; object=fit: contain;" src="${qrCodeUrl}" alt="QR Code" title="QR Code" />


/*
* Generates billing address HTML markup for email
*/
export function formatBillingAddressForHTMLMarkup(billing_address) {
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
    console.error('error formating billing address => ', e);
    return '';
  }
} // END formatBillingAddressForHTMLMarkup


/*
* Sends email to user - returns true if email was sent and false if not
*/
export async function sendEmail(transporter, emailInfo, useSendGrid = false) {
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
        if (results.accepted && results.accepted.indexOf(to) > -1) {
          return true;
        } else if (results.rejected && results.rejected.indexOf(to) > -1) {
          return false;
        } else if ((results.rejected && results.rejected.length > 0) || results.accepted && results.accepted.length === 0) {
          return false;
        } else if (results.rejected && results.rejected.length === 0) {
          return true;
        }
      } else {
        return false;
      }
    } else {
      // To use emails using SendGrid
      const qrCodeContent = fs.readFileSync(`${__dirname}./qrcode.png`).toString('base64');
      const attachment = [{ content, filename: 'qrcode.png', type: 'application/png', disposition: 'inline', content_id: 'qrcode' }];
      const sendgridTo = { name, email: to };
      const sendgridFrom = { email: 'info@omniairportparking.com', name: 'Omni Airport Parking' };

      const msg = { to: sendgridTo, from: sendgridFrom, subject, html, text, attachments: attachment }; // 
      let didEmailSend = false;
      const results = await transporter.send(msg);
      if (results && results[0] && results[0].statusCode === 202) {
        didEmailSend = true;
      } else {
        didEmailSend = false;
      }
      if (didEmailSend) { return true; }
      return false;
    }
  } catch (e) {
    if (useSendGrid) {
      console.error('error sending email =>', e && e.response && e.response.body && e.response.body.errors || e);
    } else {
      console.error('error sending email =>', e);
    }
    return false;
  }
} // END sendEmail


/*
* Generates qr code with order id, start date, and end date for sendgrid or nodemailer 
*/
export async function generateQRCode(QRCode, data, forSendgrid = false) {
  try {
    let codeUrl = '';
    if (forSendgrid) {
      codeUrl = await QRCode.toFile(`${__dirname}./qrcode.png`, data);
    } else {
      codeUrl = await QRCode.toDataURL(data, { errorCorrectionLevel: 'L', version: 9 });
    }
    // codeUrl = codeUrl.replace('data:image/png;base64, ', '');
    return codeUrl;
  } catch (e) {
    console.error('error generating qr code => ', e);
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
* Sends data to omni servers with reservation info and unique id
* The unique id is what is stored in the QR code and used to look up the reservation
*/
export function sendDataToOmniAirportParkingServers(data) {

} // END sendDataToOmniAirportParkingServers