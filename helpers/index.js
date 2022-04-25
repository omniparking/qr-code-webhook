/*jshint esversion: 8 */

/*
* Generates HTML markup for email
*/
export function generateHTMLMarkup(data, billingAddressMarkup) {
  const { createdAt: purchaseDate, url, start_time, end_time, quantity, price, name } = data;
  let start = new Date(start_time);
  start = start.toLocaleDateString() + start.toLocaleTimeString();
  let end = new Date(end_time);
  end = end.toLocaleDateString() + end.toLocaleTimeString();
  return `
    <b>Parking Confirmation Details:</b>
    <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
    <p>This email is to confirm your recent order.</p>
    <p>Date ${purchaseDate}</p>
    <p style="font-weight:bold;">Billing Address:</p>
    ${billingAddressMarkup}
    <br />
    <p style="margin-left: 4px;">1x Facility Charge for $4.99 each</p>
    <p>${quantity}x ${name.toUpperCase()} for $${price} each</p>
    <p>Drop off: ${start}</p>
    <p>Pick up: ${end}</p>
    <p>Units: 12/31/69 07:00 PM</p>
    <br />
    <img style="width: 200px; height: 200px; object=fit: contain;" src="${url}" alt="QR Code" />
 `;
}


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
}


/*
* returns true if email was sent and false if not
*/
export async function sendEmail(transporter, emailInfo) {
  const { to, from, html, order_number } = emailInfo;
  const msg = {
    to,
    from,
    html,
    subject: `Order #${order_number} confirmed`,
    text: 'Your order has been confirmed for Omni Parking. The QR code is attached',
  };
  try {
    const results = await transporter.sendMail(msg);
    if (results) {
      if (results.accepted.indexOf(to) > -1) {
        return true;
      } else if (results.rejected.length > 0) {
        return false;
      } 
    } else {
      return false;
    }

    // using send grid;
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
}


/*
* generates qr code with order id, start date, and end date
*/
export async function generateQRCode(QRCode, text) {
  try {
    const codeUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
    return codeUrl;
  } catch (e) {
    console.error('error generating qr code => ', e);
    return '';
  }
}
