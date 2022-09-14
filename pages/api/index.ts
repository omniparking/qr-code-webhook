/*jshint esversion: 8 */

// Next types
import type { NextApiRequest, NextApiResponse } from 'next'; // for request/response types

// npm packages
import nodemailer from 'nodemailer'; // to send emails
import QRCode from 'qrcode'; // to generate qr code
import Client from 'ftp'; // to connect to ftp server
import { Redis } from '@upstash/redis'; // to store webhook_ids to database
import { promises as fs } from 'fs'; // to read icon file as promise
import path from 'path'; // to get path for icon file

// Helpers/Scripts
import * as h from '../../helpers/index';

// Deconstruct environment variables from process.env
const {
  OMNI_AIRPORT_GMAIL_PASS: pass, OMNI_AIRPORT_GMAIL_USER: user,
  SMTP_HOST: host, EMAIL_PORT: port,
  UPSTASH_REDIS_REST_TOKEN: token, UPSTASH_REDIS_REST_URL: url,
  SERVER_IP_ADDRESS: IP, SERVER_PASSWORD: S_PASS, SERVER_USER: S_USER,
} = process.env;

// Initialize redis (to store webhook ids)
const redis = new Redis({ url, token });

// Initialize nodemailer (to send emails)
const transporter = nodemailer.createTransport({ auth: { user, pass }, host, port, secure: true });

/**
* Handler function which handles http request coming in (webhook calls from shopify)
* @param {NextApiRequest} req - request object
* @param {NextApiResponse<any>} res - response object
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { body, headers, method } = req;

    return res.status(201).send({ message: 'Webhook turned off!' }); // REMOVE WHEN READY FOR PROD

    if (method === 'POST') {
      // Grab needed data from request object, i.e., start/end times, order num, address, price, etc.
      const {
        billing_address, customer, created_at, current_subtotal_price, current_total_price,
        current_total_tax, email, line_items, order_number: orderNum, subtotal_price, total_price, total_tax,
      } = body;
      const bookingTimes = line_items?.[1]?.properties || [];
      const { quantity, price, name } = line_items?.[1];
      const { first_name: first, last_name: last } = customer;
      let start_time: string;
      let end_time: string;

      if (!bookingTimes?.length || !price || !name || !customer) { return res.status(201).send({ message: h.dataMissingMessage }); }

      // Get start and end times of booking
      if (bookingTimes?.length) {
        bookingTimes.forEach(({ name, value }: { name: string, value: string }) => {
          if (name === 'booking-start') { start_time = value; }
          if (name === 'booking-finish') { end_time = value; }
        });
      }

      // If no start or end times from booking, event failed
      if (!start_time || !end_time) { return res.status(201).send({ message: h.missingTimeInfoMessage }); }

      const startTimeFormatted: string = h.formatDate(start_time);
      const endTimeFormatted: string = h.formatDate(end_time);
      // const startTimeFormatted = '13.09.202207:00:00';
      // const endTimeFormatted = '16.09.202223:00:00';

      // Generate date in MM/DD/YYYY format for email
      const createdAt: string = h.formatDateTimeAsString(created_at);

      // Get subtotal, taxes, and total price for email template
      const subtotalPrice: string = subtotal_price || current_subtotal_price || '';
      const totalTax: string = total_tax || current_total_tax || '';
      const totalPrice: string = total_price || current_total_price || '';

      // Grab unique webhook_id
      const new_webhook_id = headers?.['x-shopify-webhook-id'] as string || '';

      // Format data for QR Code
      const qrcodeLength = `1755164${orderNum}`.length;
      const zeros = new Array(16 - qrcodeLength).join('0');
      const qrcodeData = `1755164${zeros}${orderNum}`; // add zero placeholders to qrcode data

      // Generate qrcode with order information
      const qrcodeUrl = await h.generateQRCode(QRCode, qrcodeData);

      // Generate file for server
      const fileForServer: string = h.generateDataForServer({ end_time: endTimeFormatted, start_time: startTimeFormatted, first, last, orderNum });

      // Initiate ftp client
      const client = new Client();

      // Connect to ftp server
      client.connect({ host: IP, password: S_PASS, port: 21, secure: false, user: S_USER });

      // Send data to server
      const respFromServer = await h.sendDataToServer(client, fileForServer, orderNum);

      // Close connection to ftp server
      client.end();

      // if sending data to server fails, end request
      if (!respFromServer) { return res.status(201).send({ message: h.failedToLoadDataToServerMessage }); }

      // Get icon for email template
      const iconPath = path.join(process.cwd(), 'public/img/omni-parking-logo.png');
      const logoImageBase64 = await fs.readFile(iconPath, { encoding: 'base64' });

      // Generate markup for user's billing address to display in email
      const billingAddressMarkup: string = h.formatBillingInfoForEmail(billing_address);

      // Define object for generating the HTML markup in generateHTMLMarkup function
      const htmlMarkupData = {
        subtotal_price: subtotalPrice, total_price: totalPrice, total_tax: totalTax, createdAt,
        end_time, logoImageBase64, name, price, quantity, start_time,
      };

      // Generate HTML markup for email
      const html = h.generateHTMLMarkup(htmlMarkupData, billingAddressMarkup);

      // Method to add webhook_id to redis
      const prevWebhook: string = await redis.get(new_webhook_id);

      const to = 'alon.bibring@gmail.com'; // email recipient
      // const cc = ['alon.bibring@gmail.com']; // cc emails

      const attachments = [{ cid: 'unique-qrcode', filename: 'qrcode.png', path: qrcodeUrl }];

      const emailData = { from: user, attachments, html, orderNum, to };

      if (!prevWebhook) { // If webhook_id does not already exist in db
        const emailSuccessful = await h.sendEmail(transporter, emailData);
        console.log('emailSuccessful:', emailSuccessful);

        if (emailSuccessful) { // If email is successful, add webhook to redis and send success response
          await redis.set(new_webhook_id, new_webhook_id);
          return res.status(201).send({ message: h.successMessage });
        } else {
          // If email is unsuccessful, try once more
          const emailRetrySuccessful = await h.sendEmail(transporter, emailData);

          // If resent email is successful
          if (emailRetrySuccessful) {
            try {
              // Add webhook_id to redis and send successful response
              await redis.set(new_webhook_id, new_webhook_id);
              res.status(201).send({ message: h.successMessage });
            } catch (e) {
              // Adding webhook_id to redis failed, so send response indicating email sent successfully but webhook_id not stored in redis
              console.error('Error -- saving wehook but email send =>', e);
              return res.status(201).send({ message: h.emailNotSentMessage });
            }
          } else {
            // If retry email is not successful, send response message indicating webhook event logged but email not sent
            return res.status(201).send({ message: h.emailNotSentMessage });
          }
        }
      } else {
        console.error('Hit case where webhook id already exists in database');
        // Case where webhook_id is already stored, meaning an email has already been sent send response message indicating that webhook failed bc it was already successfully handled
        res.status(201).send({ message: h.webhookAlreadyLoggedMessage });
      }
    } else {
      // Case where request method is not of type "POST"
      res.status(201).send({ message: h.requestNotPostMethodMessage });
    }
  } catch (e) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error('Error -- main try/catch in handler =>', e);
    res.status(201).send({ message: h.errorFromMainTryCatchMessage });
  }
}
