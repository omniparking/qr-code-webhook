// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
/*jshint esversion: 8 */

// Import needed packages
// import crypto from 'crypto';
// import getRawBody from 'raw-body';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';
import AWS from 'aws-sdk';
import sharp from 'sharp';
import {
  generateHTMLMarkup, formatBillingAddressForHTMLMarkup,
  sendEmail, generateQRCode, generateDateTimeAsString
} from '../../helpers/index';

// Deconstruct needed env variables from process.env
const {
  UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token,
  GMAIL_USER: user, GMAIL_PASSWORD: pass,
  SHOPIFY_SECRET, SENDGRID_API_KEY
} = process.env;

// Initialize s3 connection - this is to get logo in email
const s3 = new AWS.S3({
  accessKeyId: process.env.AMAZ_ACCESS_KEY_ID,
  secretAccessKey: process.env.AMAZ_SECRET_ACCESS_KEY
});

// To use sendgrid for emails
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/*
* Initialize redis (to store webhook ids)
*/
const redis = new Redis({ url, token });

/*
* Initialize nodemailer (to send emails)
*/
const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: { user, pass },
  secure: true
});

/*
* Handler function which handles http requests coming in (webhook calls from shopify)
*/
export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      // try {
        // To check that webhook call is coming from certified shopify but not needed
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
      // i.e., line_items property has start/end times & req body has order_number/billing_address,
      // and billing info such as price and address
      const { body: payload, headers } = req;
      const {
        billing_address, created_at, subtotal_price, total_price, total_tax, line_items, order_number,
        current_subtotal_price, current_total_price, current_total_tax /* , email: to */
      } = payload;
      const bookingTimes = line_items && line_items[1] && line_items[1].properties || [];
      const billingItems = line_items && line_items[1];
      const { quantity, price, name, title } = billingItems;

      let start_time, end_time;
      // Get start and end times of booking
      if (bookingTimes && bookingTimes.length > 0) {
        bookingTimes.forEach(({ name, value }) => {
          if (name === 'booking-start') { start_time = value; }
          if (name === 'booking-finish') { end_time = value; }
        });
      }

      // If no start or end times from booking, event failed
      // FOR TESTING ONLY -  adding in fake start_time and end_time
      if (!start_time || !end_time) {
        // res.status(201).send({ message: 'Webhook event failed. No start/end times available. '});
        // return;
        if (!start_time) { start_time = '2022-04-24T20:24:36-04:00'; }  /* FOR TESTING ONLY */
        if (!end_time) { end_time = '2022-04-25T06:24:36-04:00'; }  /* FOR TESTING ONLY */
      }

      // Set Headers
      // Set Content-Type as text/html
      res.setHeader('Content-Type', 'text/html charset=UTF-8');
      res.setHeader('X-Attachment-Id', 'filename.png')
      // Describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      
      // Data required in qr code
      const qrCodeData = { order_number, start_time, end_time };
      
      // Generate barcode with order information
      const qrCodeUrl = await generateQRCode(QRCode, JSON.stringify(qrCodeData));

      // Generate date in MM/DD/YYYY format for email
      const createdAt = generateDateTimeAsString(created_at);

      const subPrice = subtotal_price || current_subtotal_price;
      const totalTax = total_tax || current_total_tax;
      const totalPrice = total_price || current_total_price;

      let imagePath = '';

      try {
        const awsResponse = await s3.getObject({ Bucket: 'omni-airport-parking', Key: 'omni-airport-parking-logo.png' }).promise();
        // imagePath = Buffer.from(awsResponse.Body).toString('base64');
        const resizedImageFileBuffer = await sharp(awsResponse.Body)
          // .resize({ width: 200, height: 200, fit: 'contain' })
          .toFormat('png')
          .png({ quality: 100, compressionLevel: 6 })
          .toBuffer();
        //Now we will convert resized buffer to base64
        imagePath = resizedImageFileBuffer.toString('base64');
      } catch (e) {
        console.error('error getting image from aws => ', e);
      }

      // Generate markup for user's billing address to display in email
      const billingAddressMarkup = formatBillingAddressForHTMLMarkup(billing_address);

      const htmlMarkupData = {
        subtotal_price: subPrice, total_tax: totalTax, total_price: totalPrice,
        qrCodeUrl, createdAt, start_time, end_time, quantity, price, name, title, imagePath: '/_next/static/omni-parking-logo.png'
      };
      
      // Generate HTML markup for email
      const html = generateHTMLMarkup(htmlMarkupData, billingAddressMarkup);

      // Grab unique webhook id
      const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers

      // Method to add webhook id to redis
      const getPrevWebhook = await redis.get(new_webhook_id);

      // Define variables for sending email
      const to = 'alon.bibring@gmail.com'; // email recipient
      const from = 'omniparkingwebhook@gmail.com'; // email sender
    // const cc = ['alon.bibring@gmail.com']; // cc emails

      const attachments = [{ path: qrCodeUrl }];

      const emailData = { to, from, html, order_number, attachments };

      // If webhook_id does not already exist in db
      if (!getPrevWebhook) {
        const userEmailSuccessful = await sendEmail(transporter, emailData); // send email

        // If email is successful, add webhook to redis and send success response
        if (userEmailSuccessful) {
          await redis.set(new_webhook_id, new_webhook_id);
          res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged.' });
        } else {
          // If the email is not successful, try sending it again
          try {
            // Resending email
            const userEmailSuccessful = await sendEmail(transporter, emailData);

            // If resent email is successful
            if (userEmailSuccessful) {
              try {
                // Add webbok_id to redis and send successful response
                await redis.set(new_webhook_id, new_webhook_id);
                res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
              } catch (e) {
                // Adding webhook to redis failed, so send response indicating email sent successfully
                // but webhook id not stored in redis
                console.error('error saving wehook but email send =>', e);
                res.status(201).send({ message: 'Webhook event not logged but email sent successfully.' });
              }
            } else {
              // If retry email is not successful, send response message indicating webhook event logged but email not sent
              res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
            }
          } catch (e) {
            console.error('error sending email => ', e);
            // Sending email or adding data to redis db threw an error somewhere
            // send response message indicating webhook event logged but no email sent
            res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
          }
        }
      } else {
        console.error('Case where webhook id already exists in database!');
        // Case where webhook_id is already stored, meaning an email has already been sent
        // send response message indicating that webhook failed bc it was already successfully handled
        res.status(201).send({ message: 'Webhook Event failed as it has previously been successfully logged.' });
      }
    } else {
      // Case where request method is not of type "POST"
      res.status(201).send({ message: 'Webhook Event failed as request method is not of type "POST".' });
    }
  } catch (e) {
    // Case where something failed in the code above
    // send a response message indicating webhook failed
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed. Error from main try/catch.' });
  }
}
