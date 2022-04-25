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
    if (req.method === 'POST') {
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
      console.log('payload:', JSON.stringify(payload.price_set))
        const {
          billing_address, created_at, current_subtotal_price, current_total_price,
          current_total_tax, line_items, order_number, /*, email: to, */
        } = payload;
        const lineItems = line_items && line_items[1] && line_items[1].properties || [];
        const billingItems = line_items && line_items[0];
        const { quantity, price, name } = billingItems;
        // const { name } = billing_address;

        // console.log('payload.line_items:', payload && payload.line_items);

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
        if (!start_time) { start_time = '2022-04-24T20:24:36-04:00'; }  /* FOR TESTING ONLY */
        if (!end_time) { end_time = '2022-04-25T06:24:36-04:00'; }  /* FOR TESTING ONLY */
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
    
      const htmlMarkupData = { url, createdAt, start_time, end_time, quantity, price, name, current_subtotal_price, current_total_tax, current_total_price };
      
      // generate HTML markup for email
      const html = generateHTMLMarkup(htmlMarkupData, billingAddress);

      // grab unique webhook id
      const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers

      // method to add webhook id to redis
      const getPrevWebhook = await redis.get(new_webhook_id);

      // variables for sending email
      const to = 'alon.bibring@gmail.com'; // email recipient
      const from = 'omniparkingwebhook@gmail.com'; // email sender
    // const cc = ['alon.bibring@gmail.com']; // cc emails
      
      const emailData = { to, from, html, order_number };
    
      // If webhook_id does not already exist in db
      if (!getPrevWebhook) {
        const userEmailSuccessful = await sendEmail(transporter, emailData); // send email

        // if email is successful, add webhook to redis and send success response
        if (userEmailSuccessful) {
          await redis.set(new_webhook_id, new_webhook_id);
          res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
        } else {
          // if the email is not successful. try sending it again
          try {
            const userEmailSuccessful = await sendEmail(transporter, emailData); // resending email

            // if resent email is siccessful
            if (userEmailSuccessful) {
              try {
                // add webbok_id to redis and send successful response
                await redis.set(new_webhook_id, new_webhook_id);
                res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
              } catch (e) { 
                // adding webhook to redis failed, so send response indicating email sent successfully
                //  but webhook id not stored in redis 
                res.status(201).send({ message: 'Webhook event not logged but email sent successfully.' });
              }
            } else {
              // if retry email is not successful, send response message indicating webhook event logged but email not sent
              res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
            }
          } catch (e) {
            // sending email or adding data to redis db threw an error somewhere
            // send response message indicating webhook event logged but no email sent
            res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
          }
        }
      } else {
        // case wheree webhook_id is already stored, meaning an email has already been sent
        // send response message indicating that webhook failed bc it was already successfully handled
        res.status(201).send({ message: 'Webhook Event failed as it has previously been successfully logged.' }); // send 201 response to Shopify
      }
    } else {
      // case where request method is not of type "POST"
      res.status(201).send({ message: 'Webhook Event failed as request method is not of type "POST".' }); // send 201 response to Shopify
    }
  } catch (e) {
    // case where something failed in the code above
    // send a response message indicating webhook failed
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed. Error from main try/catch.' }); // send 201 response to Shopify
  }
}
