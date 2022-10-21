/*jshint esversion: 8 */

// Next types
import type { NextApiRequest, NextApiResponse } from 'next'; // for request/response types

// npm/node imports
import { promises as fs } from 'fs'; // to read icon file as promise
import { Redis } from '@upstash/redis'; // to store webhook_ids to database
import nodemailer from 'nodemailer'; // to send emails
import path from 'path'; // to get path for icon file
import PromiseFtp from 'promise-ftp';
import QRCode from 'qrcode'; // to generate qr code
import moment from 'moment';

// Helpers/Scripts
import * as h from '../../helpers/index';

const errorCode: number = 500;
const successCode: number = 201;

// Deconstruct environment variables from process.env
const {
  OMNI_AIRPORT_GMAIL_PASS: pass, OMNI_AIRPORT_GMAIL_USER: user,
  SMTP_HOST: host, EMAIL_PORT: port,
  UPSTASH_REDIS_REST_TOKEN: token, UPSTASH_REDIS_REST_URL: url,
  SERVER_IP_ADDRESS: IP, SERVER_PASSWORD: S_PASS, SERVER_USER: S_USER,
  SHOPIFY_TOPIC, SHOPIFY_HOST
} = process.env;

// Initialize redis (to store webhook ids)
const redis: Redis = new Redis({ url, token });

// Initialize nodemailer (to send emails)
const transporter: any = nodemailer.createTransport({ auth: { user, pass }, host, port, secure: true });

/**
* Handler function which handles http request coming in (webhook calls from shopify)
* @param {NextApiRequest} req - request object
* @param {NextApiResponse} res - response object
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { body, headers, method } = req;
    const shopifyTopic: string = (headers?.['x-shopify-topic'] as string)?.trim() || '';
    const host: string = headers?.host?.trim() || '';

    // return res.status(successCode).send({ message: 'Webhook turned off!' }); // UNCOMMENT LINE TO TURN WEBHOOK OFF

    if (method === 'POST' && shopifyTopic === SHOPIFY_TOPIC && host === SHOPIFY_HOST) {
      // Grab needed data from request object, i.e., start/end times, order num, address, price, etc.
      const {
        order_number: orderNum,
        email: to,
        billing_address,
        customer,
        created_at,
        current_subtotal_price,
        current_total_price,
        current_total_tax,
        line_items,
        subtotal_price,
        total_price,
        total_tax,
      } = body;

      const bookingTimes: BookingTime[] = line_items?.[1]?.properties || [];
      const { quantity, price, name } = line_items?.[1];
      const { first_name: first, last_name: last } = customer;
      let start_time: string;
      let end_time: string;

      if (!bookingTimes?.length || !price || !name || !customer) { return res.status(successCode).send({ message: h.dataMissingMessage }); }

      // Get start and end times of booking
      if (bookingTimes?.length) {
        bookingTimes.forEach(({ name, value }: BookingTime) => {
          if (name === 'booking-start') { start_time = value; }
          if (name === 'booking-finish') { end_time = value; }
        });
      }

      // If no start or end times from booking, event failed
      if (!start_time || !end_time) { return res.status(errorCode).send({ message: h.missingTimeInfoMessage }); }

      // const startTimeFormatted: string = h.formatDate(start_time);
      // const endTimeFormatted: string = h.formatDate(end_time);
      const startTime = moment(start_time);
      const gracePeriod = moment.duration('01:00:00');
      startTime.subtract(gracePeriod);
      const startTimeFormattedWithGracePeriod: string = moment(startTime).format('MM.DD.YYYYhh:mm:ss');
      const endTimeFormatted = moment(end_time).format('MM.DD.YYYYhh:mm:ss');
      // const startTimeFormatted = '02.02.202202:00:00'; // FOR TESTING ONLY
      // const endTimeFormatted = '02.03.202203:00:00'; // FOR TESTING ONLY

      // Generate date in MM/DD/YYYY format for email
      const createdAt: string = h.formatDateTimeAsString(created_at);

      // Get subtotal, taxes, and total price for email template
      const subtotalPrice: string = subtotal_price || current_subtotal_price || '';
      const totalTax: string = total_tax || current_total_tax || '';
      const totalPrice: string = total_price || current_total_price || '';

      // Grab unique webhook_id
      const newWebhookId: string = headers?.["x-shopify-webhook-id"] as string || '';

      // Format data for QR Code
      const qrcodeLength: number = `1755164${orderNum}`.length;
      const zeros: string = new Array(16 - qrcodeLength).join('0');
      const qrcodeData: string = `1755164${zeros}${orderNum}`; // add zero placeholders to qrcode data

      // Generate qrcode with order information
      const qrcodeUrl: string = await h.generateQRCode(QRCode, qrcodeData);

      // Generate file for server
      const dataForServer: DataForServer = { end_time: endTimeFormatted, start_time: startTimeFormattedWithGracePeriod, first, last, orderNum };
      const fileForServer: string = h.generateDataForServer(dataForServer);

      // Initiate ftp client
      const ftpClient: PromiseFtp = new PromiseFtp();

      try {
        await ftpClient.connect({ host: IP, user: S_USER, password: S_PASS, port: 21, secure: false });
      } catch (e) {
        // If we fail to connect to ftp server, send error response
        console.error('error connecting to ftp server:', e);
        return res.status(errorCode).send({ message: h.failedToConnectToServerMessage });
      }

      let serverResponse = false;
      try {
        // Send data to server
        serverResponse = await h.sendDataToServer(ftpClient, fileForServer, orderNum);
        console.log('Response from server:', serverResponse);
      } catch (e) {
        // If sending data to server fails, send error response
        console.error('error sending data to server =>', e)
        res.status(errorCode).send({ message: h.failedToLoadDataToServerMessage })
      }

      // if sending data to server fails, end request
      if (!serverResponse) { return res.status(errorCode).send({ message: h.failedToLoadDataToServerMessage }); }

      // Get icon for email template
      const iconPath: string = path.join(process.cwd(), 'public/img/omni-parking-logo.png');
      const logoImageBase64: string = await fs.readFile(iconPath, { encoding: 'base64' });

      // Generate markup for user's billing address to display in email
      const billingAddressMarkup: string = h.formatBillingInfoForEmail(billing_address);

      // Define object for generating the HTML markup in generateHTMLMarkup function
      const htmlMarkupData: HTMLMarkupData = {
        subtotal_price: subtotalPrice,
        total_price: totalPrice,
        total_tax: totalTax,
        createdAt,
        end_time,
        name,
        price,
        quantity,
        start_time,
      };

      // Generate HTML markup for email
      const htmlMarkup: string = h.generateHTMLMarkup(htmlMarkupData, billingAddressMarkup);

      // Method to add webhook_id to redis
      const storedWebhook: string = await redis.get(newWebhookId);

      const cc: string[] = ['info@omniairportparking.com']; // cc emails

      const attachments: MailAttachments[] = [
        {
          cid: 'unique-qrcode',
          filename: 'qrcode.png',
          path: qrcodeUrl
        },
        {
          cid: 'unique-omnilogo',
          filename: 'logo.png',
          path: `data:text/plain;base64, ${logoImageBase64}`
        }
      ];

      const emailData: EmailData = {
        from: user,
        html: htmlMarkup,
        attachments,
        cc,
        orderNum,
        to,
      };

      // If webhook_id does not already exist in db
      if (!storedWebhook) {
        const emailResponse: boolean = await h.sendEmail(transporter, emailData);
        console.log('emailResponse:', emailResponse);

        // If email is successful, add webhook to redis and send success response
        if (emailResponse) {
          try {
            await redis.set(newWebhookId, newWebhookId);
            return res.status(successCode).send({ message: h.successMessage });
          } catch (e) {
            return res.status(errorCode).send({ message: h.webhookNotLoggedAndEmailSentMessage });
          }
        } else {
          // If email is unsuccessful, try once more
          const emailRetryResponse: boolean = await h.sendEmail(transporter, emailData);

          // If resent email is successful
          if (emailRetryResponse) {
            try {
              // Add webhook_id to redis and send successful response
              await redis.set(newWebhookId, newWebhookId);
              res.status(successCode).send({ message: h.successMessage });
            } catch (e) {
              // Adding webhook_id to redis failed, so send response indicating email sent successfully but webhook_id not stored in redis
              console.error('Error -- saving wehook but email send =>', e);
              return res.status(errorCode).send({ message: h.webhookNotLoggedAndEmailSentMessage });
            }
          } else {
            // If retry email is not successful, send response message indicating webhook event logged but email not sent
            return res.status(errorCode).send({ message: h.webhookNotLoggedAndEmailNotSentMessage });
          }
        }
      } else {
        console.error('Hit case where webhook id already exists in database');
        // Case where webhook_id is already stored, meaning an email has already been sent send response message indicating that webhook failed bc it was already successfully handled
        res.status(errorCode).send({ message: h.webhookAlreadyLoggedMessage });
      }
    } else {
      // Case where request method is not of type "POST"
      res.status(errorCode).send({ message: h.requestNotPostMethodMessage });
    }
  } catch (e) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error('Error -- main try/catch in handler =>', e);
    res.status(errorCode).send({ message: h.errorFromMainTryCatchMessage });
  }
}
