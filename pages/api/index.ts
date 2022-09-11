// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
/*jshint esversion: 8 */

// Import needed packages
import type { NextApiRequest, NextApiResponse } from 'next';

import QRCode from 'qrcode'; // to generate qr code
import nodemailer from 'nodemailer'; // to send emails
import { Redis } from '@upstash/redis'; // to store webhook_ids to databsae
import AWS from 'aws-sdk'; // to hit S3 to retrieve logo/file for server from AWS
import sharp from 'sharp'; // to shorten text for S3 binary image
import Client from 'ftp';

import * as helpers from '../../helpers/index';


// Deconstruct needed env variables from process.env
const {
  AMAZ_ACCESS_KEY_ID: accessKeyId, AMAZ_BUCKET: Bucket, AMAZ_SECRET_ACCESS_KEY: secretAccessKey,
  OMNI_AIRPORT_GMAIL_PASS: pass, OMNI_AIRPORT_GMAIL_USER: user,
  SMTP_HOST: host, EMAIL_PORT: port,
  UPSTASH_REDIS_REST_TOKEN: token, UPSTASH_REDIS_REST_URL: url,
  SHOPIFY_WEBHOOK_ID, SHOPIFY_SECRET
} = process.env;

// Initialize s3 connection - using AWS S3 to store company logo
const s3 = new AWS.S3({ accessKeyId, secretAccessKey });

// Initialize redis (to store webhook ids)
const redis = new Redis({ url, token });

// Initialize nodemailer (to send emails)
const transporter = nodemailer.createTransport({ auth: { user, pass }, host, port, secure: true });


/*
* Handler function which handles http requests coming in (webhook calls from shopify)
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { body, headers, method } = req;
    // return res.status(201).send({ message: 'Webhook turned off!' });

    if (method === 'POST') {
      // Grab needed data from request object
      // (i.e., line_items property has start/end times & req body has order_number/billing_address & billing info such as price & address)
      const {
        billing_address, created_at, current_subtotal_price, current_total_price, current_total_tax,
        /* email: to, */ id, line_items, order_number, subtotal_price, total_price, total_tax,
      } = body;
      const bookingTimes = line_items?.[1]?.properties || [];
      const billingItems = line_items?.[1];
      const { first_name, last_name } = body?.customer;
      const { quantity, price, name, title } = billingItems;
      let start_time: string;
      let end_time: string;
      let logoImageBase64 = '';
      let respFromServer;

      if (!(bookingTimes || bookingTimes?.length) || !billingItems || !(body?.customer)) {
        const message = 'Webhook event failed. Critical data is missing from request body!';
        return res.status(201).send({ message });
      }

      // Get start and end times of booking
      if (bookingTimes?.length) {
        bookingTimes.forEach(({ name, value }: { name: string, value: string }) => {
          if (name === 'booking-start') { start_time = value; }
          if (name === 'booking-finish') { end_time = value; }
        });
      }
      // If no start or end times from booking, event failed
      if (!start_time || !end_time) {
        return res.status(201).send({ message: 'Webhook event failed. No start/end times available. ' });
      }

      const bookingStartServer: string = helpers.formatDate(start_time);
      const bookingEndServer: string = helpers.formatDate(end_time);

      // Generate date in MM/DD/YYYY format for email
      const createdAt: string = helpers.formatDateTimeAsString(created_at);

      // Get subtotal, taxes, and total price for email template
      const subtotalPrice: string = subtotal_price || current_subtotal_price || '';
      const totalTax: string = total_tax || current_total_tax || '';
      const totalPrice: string = total_price || current_total_price || '';

      // Make call to AWS S3 bucket where logo image is stored, response in binary format which is then translated to string
      try {
        const { Body } = await s3.getObject({ Bucket, Key: `${Bucket}-logo.png` }).promise();
        logoImageBase64 = await (await sharp(Body).toFormat('png').png({ quality: 100, compressionLevel: 6 }).toBuffer()).toString('base64');
      } catch (e) {
        console.error('error getting image from aws => ', e);
      }

      // Grab unique webhook_id
      const new_webhook_id = headers?.['x-shopify-webhook-id'] as string || '';

      // Data required in qr code
      const uniqueIdForQRCode = `1755164${order_number}`;

      // Generate barcode with order information
      const qrcodeUrl = await helpers.generateQRCode(QRCode, uniqueIdForQRCode);
      const fileForServer: string = helpers.generateFileForServer({ end_time: bookingEndServer, start_time: bookingStartServer, first_name, last_name, order_number });

      const client = new Client();
      client.connect({
        host: process.env.SERVER_IP_ADDRESS,
        port: 21,
        secure: false,
        user: process.env.SERVER_USER,
        password: process.env.SERVER_PASSWORD
      });

      try {
        respFromServer = await helpers.sendDataToServer(client, fileForServer);
        console.log('respFromServer:', respFromServer)
        client.close();
        // if (respFromServer === false) {
        //   return res.status(201).send({ message: 'Failed to load data to server!' });
        // }
      } catch (e) {
        console.error('data not sent to omni airport parking server =>', e);
      }

      // Generate markup for user's billing address to display in email
      const billingAddressMarkup: string = helpers.formatBillingAddressForHTMLMarkup(billing_address);

      // Define object for generating the HTML markup in generateHTMLMarkup function
      const htmlMarkupData = {
        end_time, logoImageBase64, name, price, qrcodeUrl, createdAt, quantity, start_time,
        subtotal_price: subtotalPrice, title, total_price: totalPrice, total_tax: totalTax,
      };

      // Generate HTML markup for email
      const html = helpers.generateHTMLMarkup(htmlMarkupData, billingAddressMarkup);

      // Method to add webhook_id to redis
      const prevWebhook: string = await redis.get(new_webhook_id);
      console.log('previous webhook id:', prevWebhook)
      // Define variables for sending email
      const to = 'alon.bibring@gmail.com'; // email recipient
      // const cc = ['alon.bibring@gmail.com']; // cc emails

      const attachments = [{ path: qrcodeUrl, filename: 'attachment-1.png', cid: 'unique@omniparking.com' }];

      const emailData = { from: 'omniairportparking@gmail.com', attachments, html, order_number, to };

      // If webhook_id does not already exist in db
      if (true || !prevWebhook) {
        let userEmailSuccessful;
        try {
          userEmailSuccessful = await helpers.sendEmail(transporter, emailData);
        } catch (e) {
          console.error('error sending email (first time):', e);
        }

        // If email is successful, add webhook to redis and send success response
        if (userEmailSuccessful) {
          await redis.set(new_webhook_id, new_webhook_id);
          return res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged.' });
        } else {
          // If the email is not successful, try sending it again
          try {
            // Resending email using Nodemailer
            const userEmailSuccessful = await helpers.sendEmail(transporter, emailData);

            // If resent email is successful
            if (userEmailSuccessful) {
              try {
                // Add webhook_id to redis and send successful response
                await redis.set(new_webhook_id, new_webhook_id);
                res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged.' });
              } catch (e) {
                // Adding webhook_id to redis failed, so send response indicating email sent successfully but webhook_id not stored in redis
                console.error('error saving wehook but email send =>', e);
                return res.status(201).send({ message: 'Webhook event not logged but email sent successfully.' });
              }
            } else {
              // If retry email is not successful, send response message indicating webhook event logged but email not sent
              return res.status(201).send({ message: 'Webhook Event logged but email not sent.' });
            }
          } catch (e) {
            console.error('error sending email (2nd attempt) => ', e);
            // Sending email or adding data to redis db threw an error somewhere send response message indicating webhook event logged but no email sent
            res.status(201).send({ message: 'Webhook Event logged but email not sent.' });
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
