// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

/*jshint esversion: 8 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const getRawBody = require('raw-body');
const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');

const { generateHTMLMarkup, formatBillingAddressForHTMLMarkup, sendEmail, generateQRCode } = require('../../helpers/index');

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
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  secure: true
});


// handler function which handles http requests coming in (webhook calls from shopify)
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
      // i.e., line_items property has start/end times & req body has order_number/billing_address
      const { body: payload, headers } = req;
      console.log('payload.line_items:', payload && payload.line_items)
      const { order_number, line_items, created_at, billing_address /*, email: to, */ } = payload;
      const lineItems = line_items && line_items[1] && line_items[1].properties || [];
      const billingItems = line_items && line_items[0];
      const { quantity, price, name } = billingItems;
      
      // const { name } = billing_address;
     
      let start_time, end_time;
      // get start and end times of booking
      if (lineItems && lineItems.length > 0) {
        lineItems.forEach(({ name, value }) => {
          if (name === 'booking-start') { start_time = value; }
          if (name === 'booking-end') { end_time = value; }
        });
      }

    // if no start or end times from booking, event failed
    if (!start_time || !end_time) {
      // res.status(201).send({ message: 'Webhook event failed. No start/end times available. '});
      // return;
      /* FOR TESTING ONLY */
      if (!start_time) { start_time = '2022-04-24T20:24:36-04:00'; }
      if (!end_time) { end_time = '2022-04-25T06:24:36-04:00'; }
    }

      // set headers
      res.setHeader('Content-Type', 'text/html'); // set content-type as text/html
      // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      
      // data required in qr code
      const qrCodeData = { order_number, start_time, end_time };
      
      // generate barcode with order information
      const url = await generateQRCode(QRCode, JSON.stringify(qrCodeData));

      // generate date in MM/DD/YYYY format for email
      let createdAt = new Date(created_at);
      createdAt = createdAt.toLocaleDateString();

      // generate markup for user address in email
      const billingAddress = formatBillingAddressForHTMLMarkup(billing_address);
    const htmlMarkupData = { url, createdAt, start_time, end_time, quantity, price, name };
    // generate HTML markup for email
    const html = generateHTMLMarkup(htmlMarkupData, billingAddress);

    // grab unique webhook id
    const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers

    // method to add webhook id to redis
    const getPrevWebhook = await redis.get(new_webhook_id);

    // variables for sending email
    const to = 'alon.bibring@gmail.com';
    const from = 'omniparkingwebhook@gmail.com'; // sender
    // const cc = ['alon.bibring@gmail.com']; // cc emails
    const emailData = { to, from, html, order_number };

    // If webhook_id does not already exist in db
    if (!getPrevWebhook) {
      const userEmailSuccessful = await sendEmail(transporter, emailData);
      if (userEmailSuccessful) {
        await redis.set(new_webhook_id, new_webhook_id);
        res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
      } else {
        try {
          const userEmailSuccessful = await sendEmail(transporter, emailData);
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
