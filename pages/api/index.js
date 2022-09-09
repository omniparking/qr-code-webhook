// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
/*jshint esversion: 8 */

// PORT 21 FOR FTP

// Import needed packages
import sendgridMailer from '@sendgrid/mail';
import QRCode from 'qrcode'; // (generates qr code)
import nodemailer from 'nodemailer'; // to send emails
import { Redis } from '@upstash/redis'; // to store webhook_ids to databsae
import AWS from 'aws-sdk'; // to hit S3 to retrieve logo/file for server from AWS
import sharp from 'sharp'; // shortens text for S3 binary image
// import fs from 'fs';
import * as helpers from '../../helpers/index';

// Deconstruct needed env variables from process.env
const {
  AMAZ_ACCESS_KEY_ID: accessKeyId, AMAZ_BUCKET: Bucket, AMAZ_SECRET_ACCESS_KEY: secretAccessKey,
  FILE_FOR_SERVER: Key,
  GO_DADDY_PASS, GO_DADDY_USER,
  OMNI_AIRPORT_GMAIL_PASS: pass, OMNI_AIRPORT_GMAIL_USER: user,
  SENDGRID_API_KEY, SMTP_HOST: host, EMAIL_PORT: port,
  UPSTASH_REDIS_REST_TOKEN: token, UPSTASH_REDIS_REST_URL: url,
} = process.env;

// Initialize s3 connection - using AWS S3 to store company logo
// const s3 = new AWS.S3({ accessKeyId, secretAccessKey });

// Initialize redis (to store webhook ids)
const redis = new Redis({ url, token });

// Initialize nodemailer (to send emails)
const transporter = nodemailer.createTransport({ auth: { user, pass }, host, port, secure: false });
//  const transporter = nodemailer.createTransport({ host: 'smtpout.secureserver.net', secureConnection: false, port: 587, auth: { user: '153210777', pass: GO_DADDY_PASS }, tls: { ciphers: 'SSLv3' } });

// To use sendgrid for emails
sendgridMailer.setApiKey(SENDGRID_API_KEY);

const emailer = true ? transporter : sendgridMailer;

const POST = 'POST';

/*
* Handler function which handles http requests coming in (webhook calls from shopify)
*/
export default async function handler(req, res) {
  try {
    const { body, headers, method } = req;
    // res.status(201).send({ message: 'Webhook turned off. ' });
    // return;
    // console.log('readFile:', )
    fs.readFile('./omni-parking-logo.png', (err, data) => {
      if (err) {
        console.error('error retrieving data:', err)
      } else {
        console.log('data from file', data)
      }
    })
    if (method === POST) {
      // Grab needed data from request object
      // (i.e., line_items property has start/end times & req body has order_number/billing_address & billing info such as price & address)
      const {
        billing_address, created_at, current_subtotal_price, current_total_price, current_total_tax,
        /* email: to, */ id, line_items, order_number, subtotal_price, total_price, total_tax,
      } = body;
      const bookingTimes = line_items && line_items[1] && line_items[1].properties || [];
      const billingItems = line_items && line_items[1];
      const { first_name, last_name } = body.customer;
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
      if (!start_time || !end_time) {
        res.status(201).send({ message: 'Webhook event failed. No start/end times available. '});
        return;
        // if (!start_time) { start_time = '2022-04-24T20:24:36-04:00'; }  /* FOR TESTING ONLY */
        // if (!end_time) { end_time = '2022-04-25T06:24:36-04:00'; }  /* FOR TESTING ONLY */
      }
      console.log('GOT HERE')
      // Set Headers
      // Describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

      // Generate date in MM/DD/YYYY format for email
      const createdAt = helpers.generateDateTimeAsString(created_at);

      // Get subtotal, taxes, and total price for email template
      const subtotalPrice = subtotal_price || current_subtotal_price;
      const totalTax = total_tax || current_total_tax;
      const totalPrice = total_price || current_total_price;

      let imagePath = '';
      // Make call to AWS S3 bucket where logo image is stored, response in binary format which is then translated to string
      // try {
      //   const { Body } = await s3.getObject({ Bucket, Key: `${Bucket}-logo.png` }).promise();
      //   imagePath = await (await sharp(Body).toFormat('png').png({ quality: 100, compressionLevel: 6 }).toBuffer()).toString('base64');
      // } catch (e) { console.error('error getting image from aws => ', e); }

      // Grab unique webhook_id
      const new_webhook_id = headers['x-shopify-webhook-id'] || '';

      // Data required in qr code
      const uniqueIdForQRCode = `1755164${order_number}`;

      // Generate barcode with order information
      const qrCodeUrl = await helpers.generateQRCode(QRCode, uniqueIdForQRCode); // generate qr code for nodemailer

      let fileForServer, respFromServer;
      let fileHasBeenSaved = false;
      // Code to send data to omni airport parking server
      try {
        const dataForServer = { end_time, first_name, last_name, order_number, start_time };
        fileForServer = await helpers.generateFileForServer(dataForServer);
        // if (fileForServer) {
        //   const uploadSuccessful = await helpers.uploadFileToS3(s3, fileForServer);
        //   fileHasBeenSaved = uploadSuccessful;
        // }
      } catch (e) { console.error('error calling generateFileForServer =>', e); }

      try {
        // if (fileHasBeenSaved) { fileForServer = await helpers.getHOSFileAsStringFromS3(s3); }
        // console.log('fileForServer:', fileForServer);
      } catch (e) { console.error('error calling s3.getObject =>', e); }

      try {
        if (fileForServer) {
          // respFromServer = await helpers.sendDataToServer(fileForServer);
          // console.log('respFromServer:', respFromServer);
        }
      } catch (e) {
        console.error('data not sent to omni airport parking server =>', e);
      }

      // Generate markup for user's billing address to display in email
      const billingAddressMarkup = helpers.formatBillingAddressForHTMLMarkup(billing_address);

      // Define object for generating the HTML markup in generateHTMLMarkup function
      const htmlMarkupData = {
        end_time, imagePath, name, price, qrCodeUrl, createdAt, quantity, start_time,
        subtotal_price: subtotalPrice, title, total_price: totalPrice, total_tax: totalTax,
      };

      // Generate HTML markup for email
      const html = helpers.generateHTMLMarkup(htmlMarkupData, billingAddressMarkup);

      // Method to add webhook_id to redis
      const prevWebhook = await redis.get(new_webhook_id);
      console.log('prevWebhook:', prevWebhook);
      // Define variables for sending email
      const to = 'alon.bibring@gmail.com'; // email recipient
    // const cc = ['alon.bibring@gmail.com']; // cc emails

      const attachments = [{ path: qrCodeUrl, filename: 'attachment-1.png', cid: 'unique@omniparking.com' }];

      const emailData = { from: 'omniairportparking@gmail.com', attachments, html, name, order_number, to, qrCodeUrl };

      // If webhook_id does not already exist in db
      if (true || !prevWebhook) {
        let userEmailSuccessful;
        try {
          userEmailSuccessful = await helpers.sendEmail(emailer, emailData); // send email nodemailer - PUT BACK IN FOR EMAILS
        } catch (e) { console.error('2222 error sending email:', e); }
        
        console.log('userEmailSuccessful:', userEmailSuccessful);

        // If email is successful, add webhook to redis and send success response
        if (userEmailSuccessful) {
          await redis.set(new_webhook_id, new_webhook_id);
          res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged.' });
        } else {
          // If the email is not successful, try sending it again
          try {
            // Resending email using Nodemailer
            const userEmailSuccessful = await helpers.sendEmail(emailer, emailData); // PUT BACK IN FOR EMAILS

            // If resent email is successful
            if (userEmailSuccessful) {
              try {
                // Add webhook_id to redis and send successful response
                await redis.set(new_webhook_id, new_webhook_id);
                res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
              } catch (e) {
                // Adding webhook_id to redis failed, so send response indicating email sent successfully but webhook_id not stored in redis
                console.error('error saving wehook but email send =>', e);
                res.status(201).send({ message: 'Webhook event not logged but email sent successfully.' });
              }
            } else {
              // If retry email is not successful, send response message indicating webhook event logged but email not sent
              res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
            }
          } catch (e) {
            console.error('111 error sending email => ', e);
            // Sending email or adding data to redis db threw an error somewhere send response message indicating webhook event logged but no email sent
            res.status(201).send({ message: 'Webhook Event logged but email not sent. '});
          }
        }
      } else {
        console.error('Case where webhook id already exists in database!');
        // Case where webhook_id is already stored, meaning an email has already been sent send response message indicating that webhook failed bc it was already successfully handled
        res.status(201).send({ message: 'Webhook Event failed as it has previously been successfully logged.' });
      }
    } else {
      // Case where request method is not of type "POST"
      res.status(201).send({ message: 'Webhook Event failed as request method is not of type "POST".' });
    }
  } catch (e) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed. Error from main try/catch.' });
  }
}
