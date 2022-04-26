/*jshint esversion: 8 */



/*
*
*/
function generateIconImageForEmailTemplate(imgPath) {
  // https://cid:omniairportparking384619@nodemailer.com/
  return `<img width="100" height="50" style="display: block; margin-right: 2px; margin-left: 4px;" src="cid:omniairportparking384619@nodemailer.com" alt="Omni Airport Parking logo" title="Omni Airport Parking logo" />`;
  // return `<img width="100" height="50" style="display: block; margin-right: 2px; margin-left: 4px;" src="data:image/png;base64, ${imgPath}" alt="Omni Airport Parking logo" title="Omni Airport Parking logo" />`;
} // END generateIconImageForEmailTemplate


/*
* Generates HTML markup for email
*/
export function generateHTMLMarkup(data, billingAddressMarkup) {
  const {
    createdAt: purchaseDate, start_time, end_time, quantity, price, name,
    subtotal_price, total_tax, total_price, imagePath, title, url // url is src for qr code
  } = data;

  // Format start and end times to 'MM/DD/YYYY 12:00:00 PM' format
  const start = generateDateTimeAsString(start_time, true);
  const end = generateDateTimeAsString(end_time, true);

  // To have image directly in email template (instead of attachment)
  // Add to last line of text:
  // <br /><br />
  // <img height="200" width="200" style="display: block; object=fit: contain;" src="${url}" alt="QR Code" title="QR Code" />

  return `
      <b>Parking Confirmation Details:</b>
      <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
      <p>This email is to confirm your recent order.</p>
      <p>Date ${purchaseDate}</p>
      <p style="font-weight: bold; margin: 0px 0px 1px 0px; padding 0px;">Billing Address:</p>
      ${billingAddressMarkup}
      <br />
      <p style="margin-left: 4px;">1x Facility Charge for $4.99 each</p>
      <p>${generateIconImageForEmailTemplate(imagePath)}<span>${quantity}x ${name.toUpperCase()} for $${price} each</span></p>
      <p style="margin: 2px 0px 0px 0px; padding: 0px;">Drop off: ${start}</p>
      <p style="margin: 1px 0px 0px 0px; padding: 0px;">Pick up: ${end}</p>
      <br />
      <p style="margin: 0px; padding: 0px;">Subtotal: $${subtotal_price}</p>
      <p style="margin: 0px; padding: 0px;">State Tax: $${total_tax}</p>
      <p style="margin: 0px; padding: 0px;">Total: $${total_price}</p>
    `;
} // END generateHTMLMarkup



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
export async function sendEmail(transporter, emailInfo) {
  // Define variables needed for sending emails
  const { to, from, html, order_number, attachments } = emailInfo;
  const text = 'Your order has been confirmed for Omni Parking. The QR code is attached';
  const subject = `Order #${order_number} confirmed`;

  try {
    // Send email (using nodemailer)
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

    // Using send grid;
    // let didEmailSend = false;
    // const results = await sgMail.send(msg);
    // if (results[0].statusCode === 202) {
    //   didEmailSend = true;
    // } else {
    //   didEmailSend = false;
    // }
    // if (didEmailSend) { return true; }
    // return false;
  } catch (e) {
    console.error('error sending email =>', e);
    return false;
  }
} // END sendEmail


/*
* Generates qr code with order id, start date, and end date
*/
export async function generateQRCode(QRCode, text) {
  try {
    const codeUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
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
  if (!addTime) {
    return newDate.toLocaleDateString();
  } else {
    return`${newDate.toLocaleDateString()} ${newDate.toLocaleTimeString()}`;
  }
} // END generateDateTimeAsString
