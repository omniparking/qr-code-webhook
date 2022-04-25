// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

/*jshint esversion: 8 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const getRawBody = require('raw-body');
const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');

// to use sendgrid for emails
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// initialize redis (to store webhook ids)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});


// initialize nodemailer (to send emails)
const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'omniparkingwebhook@gmail.com',
    pass: process.env.GMAIL_PASSWORD
  },
  secure: true
});


/*
* generates qr code with order id, start date, and end date
*/
async function generateQRCode(text) {
  try {
    const codeUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
    return codeUrl;
  } catch (e) {
    console.error('error generating qr code => ', e);
    return '';
  }
}


/*
* returns true if email was sent and false if not
*/
async function sendEmail(emailInfo) {
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
    console.log('results from send email:', results);
    return true;

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


function generateHTMLMarkup(url, purchase_date, billing_address) {
  return `
    <b style="font-weight:bold;">Parking Confirmation Details:</b>
    <p style="font-size:1.2rem">Thank you for placing your order with OMNI Airport Parking!</p>
    <p>This email is to confirm your recent order.</p>
    <p>Date ${purchase_date}</p>
    <p style="font-weight:bold;">Billing Address:</p>
    ${billing_address}
    <br />< br />
    <img style="width: 90%; height: 90%; object=fit: contain;" src="${url}" alt="QR Code"/>
 `;
}


function formatBillingAddressForHTMLMarkup(billing_address) {
  try {
    console.log('billing_address:', billing_address);
    const { name, address1, address2, city, province, zip, country } = billing_address;
    return `
      <div>
        <p style="padding: 0px; margin: 0px;>${name}</p>
        <p style="padding: 0px; margin: 0px;>${address1}</p>
        ${address2 ? `<p style="padding: 0px; margin: 0px;>${address2}</p>` : ''}
        <p style="padding: 0px; margin: 0px;>${city}</p>
        <p style="padding: 0px; margin: 0px;>${province} ${zip}</p>
        <p style="padding: 0px; margin: 0px;>${country}</p>
      </div>
    `;
  } catch (e) {
    console.error('error formating billing address => ', e);
    return '';
  }

}

// handler function which handles http requests coming in
export default async function handler(req, res) {
  try {
      // try {
        // to check that webhook call is coming from certified shopify but not needed
      //   const hmac = req.get('X-Shopify-Hmac-Sha256');
      //   const rawBody = await getRawBody(req);
      //   const generated_hash = crypto
      //     .createHmac('sha256', process.env.SHOPIFY_SECRET)
      //     .update(rawBody)
      //     .digest('base64');

      //   if (generated_hash !== hmac) {
      //     res.status(201).send({ message: 'Webhook verification failed '});
      //     return;
      //   }
      // } catch (e) {
      //   res.status(201).send({ message: 'Webhook verification failed '});
      //   return;
      // }
      
      // Grab needed data from reqeest object
      const { body: payload, headers } = req;
      const { order_number, line_items, created_at, billing_address /*, email: to, customer, */ } = payload;
      // const { first_name, last_name } = customer;
      const lineItems = line_items && line_items[1] && line_items[1].properties || []; // start and end times should be here

      let start_time, end_time;
      if (lineItems && lineItems.length) {
        // get start time of booking
        start_time = lineItems.filter(item => {
          if (item.name === 'booking-start') { return item.value; }
        });
              
        // get end time of booking
        end_time = lineItems.filter(item => {
          if (item.name === 'booking-end') { return item.value; }
        });
      }

      // set headers
      res.setHeader('Content-Type', 'text/html');
      // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      
      const qrCodeData = { order_number, start_time, end_time };
      
      // generate barcode with order information
      const url = await generateQRCode(JSON.stringify(qrCodeData));

      // generate date in MM/DD/YYYY format for email
      let createdAt = new Date(created_at);
      createdAt = createdAt.toLocaleDateString();

      // generate markup for user address in email
      const billingAddress = formatBillingAddressForHTMLMarkup(billing_address);

    // generate HTML markup for email
    const html = generateHTMLMarkup(url, createdAt, billingAddress);

    
    const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers
    console.log('new_webhook_id:', new_webhook_id);
    console.log('headers:', headers);
    console.log('created_at:', created_at);

    // if no start or end times from booking, event failed
    if (!start_time && !end_time) {
      // res.status(201).send({ message: 'Webhook event failed. No start/end times available. '});
      // return;
      start_time = '2022-04-24T20:24:36-04:00';
      end_time = '2022-04-25T06:24:36-04:00';
    }

    // method to add webhook id to redis
    const getPrevWebhook = await redis.get(new_webhook_id);
    console.log('getPrevWebhook:', getPrevWebhook);

    // variables for sending email
    const to = 'alon.bibring@gmail.com';
    const from = 'omniparkingwebhook@gmail.com'; // sender
    // const cc = ['alon.bibring@gmail.com']; // cc emails
    const emailData = { to, from, html, order_number };

    // If webhook_id does not already exist in db
    if (!getPrevWebhook) {
      // const d = new Date();
      // const date = d.toLocaleDateString();
      // const time = d.toLocaleTimeString();
      // const dateTime = `${date} ${time}`;
      const userEmailSuccessful = await sendEmail(emailData);
      console.log('userEmailSuccessful:', userEmailSuccessful)
      if (userEmailSuccessful) {
        await redis.set(new_webhook_id, new_webhook_id);
        res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
      } else {
        try {
          const userEmailSuccessful = await sendEmail(emailData);
          if (userEmailSuccessful) {
            try {
              await redis.set(new_webhook_id, new_webhook_id);
              res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
            } catch (e) {
              res.status(201).send({ message: 'Webhook event not logged, email sent successfully.' });
            }
          } else {
            res.status(201).send({ message: 'Webhook Event logged but email failed. '});
          }
        } catch (e) {
          res.status(201).send({ message: 'Webhook Event logged but email failed. '});
        }
      }
    } else {
      res.status(201).send({ message: 'Webhook Event failed as it has previously been successfully logged.' }); // send 201 response to Shopify
    }
  } catch (e) {
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed.' }); // send 201 response to Shopify
  }
}
