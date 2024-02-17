/*jshint esversion: 8 */

/* eslint max-len: ["error", { "code": 120 }] */

// Types
import type { NextApiRequest, NextApiResponse } from "next"; // for request/response types
import { IncomingHttpHeaders } from "http";

// npm/node imports
import { promises as fs } from "fs"; // to read icon file as promise
import { Redis } from "@upstash/redis"; // to store webhook_ids to database
import moment from "moment";
import nodemailer from "nodemailer"; // to send emails
import path from "path"; // to get path for icon file
import PromiseFtp from "promise-ftp";
import QRCode from "qrcode"; // to generate qr code

// Helpers
import {
  checkProperties,
  messages,
  formatBillingInfoForEmail,
  formatTime,
  generateDataForServer,
  generateHTMLMarkup,
  generateQRCode,
  sendDataToServer,
  sendEmail,
  calculateDaysBetweenWithTime,
  generateHTMLMarkupMercedes,
  generateTimeForSuperSaverPass,
  formatPhoneNumber,
} from "../../helpers/index";
// import { sendQRCodeSMSToUser } from "../../helpers/sms";

const errorCode: number = 400;
const successCode: number = 201;
const ftpPort: number = 21;

const defaultObj = {
  name: "NA",
  price: "00.00",
  properties: [],
  quantity: "00.00",
};

// Deconstruct environment variables from process.env
const {
  OMNI_AIRPORT_GMAIL_PASS: pass,
  OMNI_AIRPORT_GMAIL_USER: user,
  SMTP_HOST: host,
  EMAIL_PORT: emailPort,
  UPSTASH_REDIS_REST_TOKEN: token,
  UPSTASH_REDIS_REST_URL: url,
  SERVER_IP_ADDRESS: SERVER_IP,
  SERVER_PASSWORD: SERVER_PASS,
  SERVER_USER: SERVER_USER,
  M_NAME,
  M_VENDOR,
  // SHOPIFY_TOPIC,
  // SHOPIFY_HOST,
  // HOOKDECK_SOURCE,
} = process.env;

// Initialize redis (to store webhook ids)
const redis: Redis = new Redis({ url, token });

// Initialize nodemailer (to send emails)
const transporter: any = nodemailer.createTransport({
  auth: { user, pass },
  host,
  port: emailPort,
  secure: true,
});

/**
 * Handler function which handles http request coming in (webhook calls from shopify)
 * @param {NextApiRequest} req - request object
 * @param {NextApiResponse} res - response object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // return res.status(successCode).send({ message: 'Webhook turned off!' }); // TO TURN OFF WEBHOOK

  try {
    const {
      // headers,
      // method,
      body,
    }: {
      body: any;
      headers: IncomingHttpHeaders;
      method?: string | undefined;
    } = req;

    // const shopifyTopic: string =
    //   (headers?.["x-shopify-topic"] as string)?.trim() || "";

    // const sourceName = (req["x-hookdeck-source-name"] as string)?.trim();

    // const isTrustedSource = (): boolean => {
    //   return (
    //     method === "POST" &&
    //     shopifyTopic === SHOPIFY_TOPIC &&
    //     sourceName === HOOKDECK_SOURCE
    //   );
    // };

    const isMercedesIntegration = (): boolean => {
      return (
        body?.note_attributes?.[0]?.name === M_VENDOR &&
        body?.note_attributes?.[0]?.value === M_NAME
      );
    };

    if (isMercedesIntegration()) {
      return handleWebhook(req, res, "mercedes");
    } else {
      return handleWebhook(req, res);
    }
  } catch (error) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error("Error main try/catch in handler =>", error);
    return res
      .status(errorCode)
      .send({ message: messages.errorFromMainTryCatchMessage("general") });
  }
}

const handleWebhook = async (
  req: NextApiRequest,
  res: NextApiResponse,
  vendorName: Vendor = "general"
): Promise<void> => {
  try {
    const {
      body,
      headers,
    }: {
      body: any;
      headers: IncomingHttpHeaders;
      method?: string | undefined;
    } = req;

    // Grab needed data from request object (i.e., start/end times, order num, address, price, etc.)
    const {
      order_number: order_num,
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

    const lineItems = checkProperties(line_items) || defaultObj;
    const { quantity, price, name } = lineItems;
    const bookingTimes: BookingTime[] = lineItems?.properties || [];
    const { first_name: first, last_name: last } = customer;
    let phoneNumber;

    if (vendorName === "general") {
      phoneNumber = formatPhoneNumber(billing_address.phone);
    } else {
      phoneNumber = formatPhoneNumber(body.phone);
    }

    let start_time: string;
    let end_time: string;
    const isSuperSavePass =
      line_items?.[1]?.name === "(MCO) SUPER SAVER 30 DAY PASS";

    if (isSuperSavePass) {
      const { start, end } = generateTimeForSuperSaverPass();
      start_time = start;
      end_time = end;
    } else {
      // Get start and end times of booking
      bookingTimes?.forEach(({ name, value }: BookingTime) => {
        if (name === "booking-start") {
          start_time = value;
        } else if (name === "booking-finish") {
          end_time = value;
        }
      });
    }

    const missingData = (vendor: Vendor) => {
      if (vendor === "general") {
        return !bookingTimes?.length || !price || !name || !customer;
      } else {
        return !bookingTimes || !start_time || !end_time;
      }
    };

    if (missingData(vendorName)) {
      return res
        .status(successCode)
        .send({ message: messages.dataMissingMessage(vendorName) });
    }

    // If no start or end times from booking, event failed
    if (!start_time || !end_time) {
      return res
        .status(errorCode)
        .send({ message: messages.missingTimeInfoMessage(vendorName) });
    }

    const startTimeWithGrace = formatTime(start_time);
    const endTime = formatTime(end_time, false);
    // const startTime = '02.02.202202:00:00'; // FOR TESTING ONLY
    // const endTime = '02.03.202203:00:00'; // FOR TESTING ONLY

    // Generate date in MM/DD/YYYY format for email
    const createdAt: string = moment(created_at).format("MM/DD/YYYY");

    // Get subtotal, taxes, and total price for email template
    const subtotalPrice: string =
      subtotal_price || current_subtotal_price || "";
    const totalTax: string = total_tax || current_total_tax || "";
    const totalPrice: string = total_price || current_total_price || "";

    // Grab unique webhook_id
    const newWebhookId: string =
      (headers?.["x-shopify-webhook-id"] as string) || "";

    // Format data for QR Code
    const qrcodeLength: number = `1755164${order_num}`.length;
    const zeros: string = new Array(16 - qrcodeLength).join("0");
    const qrcodeData: string = `1755164${zeros}${order_num}`; // add zero placeholders to qrcode data

    let qrcodeUrl: string;
    try {
      // Generate qrcode with order information
      qrcodeUrl = await generateQRCode(QRCode, qrcodeData);
    } catch (error) {
      res.status(errorCode).send({
        message: messages.generateQRCodeError(vendorName),
      });
    }

    // Generate file for server
    const dataForServer: DataForServer = {
      end_time: endTime,
      start_time: startTimeWithGrace,
      first,
      last,
      order_num,
    };

    const fileForServer: string = generateDataForServer(dataForServer);

    // Initiate ftp client
    const ftpClient: PromiseFtp = new PromiseFtp();

    try {
      const ftpOptions: FTPServer = {
        host: SERVER_IP,
        user: SERVER_USER,
        password: SERVER_PASS,
        port: ftpPort,
        secure: false,
      };

      await ftpClient.connect(ftpOptions);
    } catch (error) {
      // If we fail to connect to ftp server, send error response
      console.error("Error connecting to ftp server =>", error);
      return res.status(errorCode).send({
        message: messages.failedToConnectToFTPServerMessage(vendorName),
      });
    }

    let serverResponse = false;
    try {
      // Send data to server
      serverResponse = await sendDataToServer(
        ftpClient,
        fileForServer,
        order_num
      );
    } catch (error) {
      // If sending data to server fails, send error response
      console.error("Error sending data to server =>", error);
      res.status(errorCode).send({
        message: messages.failedToLoadDataToServerMessage(vendorName),
      });
    }

    // if sending data to server fails, end request
    if (!serverResponse) {
      return res.status(errorCode).send({
        message: messages.failedToLoadDataToServerMessage(vendorName),
      });
    }

    // Get icon for email template
    const iconPath: string = path.join(
      process.cwd(),
      "public/img/omni-parking-logo.png"
    );

    const logoImageBase64: string = await fs.readFile(iconPath, {
      encoding: "base64",
    });

    // Generate markup for user's billing address to display in email
    const billingAddressMarkup: string =
      formatBillingInfoForEmail(billing_address);

    let htmlMarkup: string;

    if (vendorName === "mercedes") {
      const qty = calculateDaysBetweenWithTime(start_time, end_time);
      const subtotal = +(12.99 * qty + 4.99).toFixed(2);
      const tax = +(+subtotal * 0.165).toFixed(2);
      const total = parseFloat((subtotal + tax).toFixed(2));

      // Generate HTML markup for email (mercedes)
      htmlMarkup = generateHTMLMarkupMercedes({
        subtotal_price: `${subtotal}`,
        total_price: `${total}`,
        total_tax: `${tax}`,
        quantity: `${qty}`,
        createdAt,
        end_time,
        name,
        price,
        start_time,
        qrcodeData,
        userName: `${first} ${last}`,
      });
    } else {
      // Generate HTML markup for email (general)
      htmlMarkup = generateHTMLMarkup(
        {
          subtotal_price: subtotalPrice,
          total_price: totalPrice,
          total_tax: totalTax,
          createdAt,
          end_time,
          name,
          price,
          quantity,
          start_time,
          qrcodeData,
        },
        billingAddressMarkup
      );
    }

    let storedWebhook: string;
    try {
      // Method to add webhook_id to redis
      storedWebhook = await redis.get(newWebhookId);
    } catch (error) {
      console.error("Error getting stored webhook from redis =>", error);
    }

    const cc: string[] =
      vendorName === "mercedes"
        ? ["info@omniairportparking.com", "Bdc_service@mbso.com"]
        : ["info@omniairportparking.com"]; // cc emails

    const attachments: MailAttachments[] = [
      {
        cid: "unique-qrcode",
        filename: "qrcode.png",
        path: qrcodeUrl,
      },
      {
        cid: "unique-omnilogo",
        filename: "logo.png",
        path: `data:text/plain;base64, ${logoImageBase64}`,
      },
    ];

    const emailData: EmailData = {
      from: user,
      html: htmlMarkup,
      orderNum: order_num,
      attachments,
      cc,
      to,
    };

    // If webhook_id does not already exist in db
    if (!storedWebhook) {
      let emailResponse: boolean;

      try {
        emailResponse = await sendEmail(transporter, emailData);
      } catch (error) {
        console.error("Error sending email =>", error);
        emailResponse = false;
      }

      // If email is successful, add webhook to redis and send success response
      if (emailResponse) {
        let webhookLogged = false;
        try {
          await redis.set(newWebhookId, newWebhookId);
          webhookLogged = true;
          return res
            .status(successCode)
            .send({ message: messages.successMessage(vendorName) });
        } catch (error) {
          console.error("Error redis webhook =>", error);
          // remove return below for
          return res.status(errorCode).send({
            message: messages.webhookNotLoggedAndEmailSentMessage(vendorName),
          });
        }

        // // send SMS to user
        // try {
        //   const smsResponse = await sendQRCodeSMSToUser(
        //     phoneNumber,
        //     order_num,
        //     start_time,
        //     end_time,
        //     qrcodeData
        //   );
        //   console.log("smsResponse:", smsResponse);
        //   return res
        //     .status(successCode)
        //     .send({ message: messages.successMessage(vendorName) });
        // } catch (error) {
        //   return res.status(errorCode).send({
        //     message: messages.sendingSMSFailed(vendorName, webhookLogged),
        //   });
        // }
      } else {
        // If email is unsuccessful, try once more
        let emailRetryResponse: boolean;

        try {
          emailRetryResponse = await sendEmail(transporter, emailData);
        } catch (error) {
          console.error("Error retrying email =>", error);
          emailRetryResponse = false;
        }

        // If resent email is successful
        if (emailRetryResponse) {
          try {
            // Add webhook_id to redis and send successful response
            await redis.set(newWebhookId, newWebhookId);
            res
              .status(successCode)
              .send({ message: messages.successMessage(vendorName) });
          } catch (error) {
            // Adding webhook_id to redis failed, so send response indicating email sent
            // successfully but webhook_id not stored in redis
            console.error("Error saving webhook but email sent =>", error);
            return res.status(errorCode).send({
              message: messages.webhookNotLoggedAndEmailSentMessage(vendorName),
            });
          }
        } else {
          // If retry email is not successful, send response message indicating webhook event logged but email not sent
          return res.status(errorCode).send({
            message:
              messages.webhookNotLoggedAndEmailNotSentMessage(vendorName),
          });
        }
      }
    } else {
      console.error("Hit case where webhook id already exists in database");
      // Case where webhook_id is already stored, meaning an email has already been
      // sent send response message indicating that webhook failed bc it was already successfully handled
      return res
        .status(errorCode)
        .send({ message: messages.webhookAlreadyLoggedMessage(vendorName) });
    }
  } catch (error) {
    console.error(`Error with main webhook. Source ${vendorName} =>`, error);
    return res
      .status(errorCode)
      .send({ message: messages.errorFromMainTryCatchMessage(vendorName) });
  }
};
