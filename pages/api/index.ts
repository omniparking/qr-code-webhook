/*jshint esversion: 8 */

/* eslint max-len: ["error", { "code": 120 }] */

// Types
import type { NextApiRequest, NextApiResponse } from "next"; // for request/response types
import { IncomingHttpHeaders } from "http";

// npm/node imports
import { promises as fs } from "fs"; // to read icon file as promise

// Helpers
import * as h from "../../helpers/index";
import { messages } from "../../helpers/statusMessages";
// import { sendQRCodeSMSToUser } from "../../helpers/sms";

// npm
import { Redis } from "@upstash/redis"; // to store webhook_ids to database
import nodemailer from "nodemailer"; // to send emails
import path from "path"; // to get path for icon file
import PromiseFtp from "promise-ftp";
import QRCode from "qrcode"; // to generate qr code

export const enum Vendor {
  general = "general",
  mercedes = "mercedes",
}

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
 * @param {NextApiRequest} req request object
 * @param {NextApiResponse} res response object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // return res.status(successCode).send({ message: 'Webhook turned off!' }); // TO TURN OFF WEBHOOK

  try {
    const {
      headers,
      method,
      body,
    }: {
      body: any;
      headers: IncomingHttpHeaders;
      method?: string | undefined;
    } = req;

    const shopifyTopic = (
      (headers?.["x-shopify-topic"] as string) || ""
    )?.trim();
    const sourceName = (headers["x-hookdeck-source-name"] as string)?.trim();

    const isTrustedSrc = h.isTrustedSource(method, shopifyTopic, sourceName);

    if (!isTrustedSrc) {
      return res.status(errorCode).send({
        message: messages.notFromTrustedSource(),
      });
    }

    if (h.isMercedesIntegration(body)) {
      return handleWebhook(req, res, Vendor.mercedes);
    } else {
      return handleWebhook(req, res);
    }
  } catch (error) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error("Error main try/catch in handler =>", error);
    return res.status(errorCode).send({
      message: messages.errorFromMainTryCatchMessage(Vendor.general),
    });
  }
}

const handleWebhook = async (
  req: NextApiRequest,
  res: NextApiResponse,
  vendorName: Vendor = Vendor.general
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
      billing_address,
      created_at,
      current_subtotal_price,
      current_total_price,
      current_total_tax,
      customer,
      email,
      line_items,
      order_number,
      subtotal_price,
      total_price,
      total_tax,
    } = body;

    const lineItems = h.checkProperties(line_items) || defaultObj;
    const { quantity, price, name, bookingTimes, first, last } =
      h.getInfoFromRequest(lineItems, customer);
    let phoneNumber;

    if (vendorName === Vendor.general) {
      phoneNumber = h.formatPhoneNumber(billing_address.phone);
    } else {
      phoneNumber = h.formatPhoneNumber(body.phone);
    }

    let start_time: string;
    let end_time: string;
    const isSuperSavePass = lineItems?.name === "(MCO) SUPER SAVER 30 DAY PASS";

    if (isSuperSavePass) {
      const { start, end } = h.generateTimeForSuperSaverPass();
      start_time = start;
      end_time = end;
    } else {
      // Get start and end times of booking
      const { start_time: st, end_time: et } =
        h.getStartAndEndBookingTimes(bookingTimes);
      start_time = st;
      end_time = et;
    }

    const isMissingDataFromRequest = h.missingData(
      vendorName,
      bookingTimes,
      price,
      name,
      customer,
      start_time,
      end_time
    );

    if (isMissingDataFromRequest) {
      return res
        .status(errorCode)
        .send({ message: messages.dataMissingMessage(vendorName) });
    }

    // If no start or end times from booking, event failed
    if (!start_time || !end_time) {
      return res
        .status(errorCode)
        .send({ message: messages.missingTimeInfoMessage(vendorName) });
    }

    const startTimeWithGrace = h.formatDate(start_time, true);
    const endTime = h.formatDate(end_time, false);
    // const startTime = '02.02.202202:00:00'; // FOR TESTING ONLY
    // const endTime = '02.03.202203:00:00'; // FOR TESTING ONLY

    // Generate date in MM/DD/YYYY format for email
    const createdAt: string = h.formatDateWithTime(created_at, true);

    // Get subtotal, taxes, and total price for email template
    const subtotalPrice: string =
      subtotal_price || current_subtotal_price || "";
    const totalTax: string = total_tax || current_total_tax || "";
    const totalPrice: string = total_price || current_total_price || "";

    // Grab unique webhook_id
    const newWebhookId: string =
      (headers?.["x-shopify-webhook-id"] as string) || "";

    // Format data for QR Code
    const qrcodeData = h.generateQRCodeData(order_number);

    let qrcodeUrl: string;
    try {
      // Generate qrcode with order info
      qrcodeUrl = await h.generateQRCode(QRCode, qrcodeData);
    } catch (error) {
      res.status(errorCode).send({
        message: messages.generateQRCodeError(vendorName),
      });
    }

    // Generate file for server
    const fileForServer: string = h.generateDataForServer({
      end_time: endTime,
      start_time: startTimeWithGrace,
      first,
      last,
      order_num: order_number,
    });

    // Initiate ftp client
    const ftpClient: PromiseFtp = new PromiseFtp();

    try {
      await ftpClient.connect({
        host: SERVER_IP,
        user: SERVER_USER,
        password: SERVER_PASS,
        port: ftpPort,
        secure: false,
      });
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
      serverResponse = await h.sendDataToServer(
        ftpClient,
        fileForServer,
        order_number
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
      h.getBillingInfoMarkup(billing_address);

    const {
      quantity: mercQty,
      subtotal: mercSubtotal,
      tax: mercTax,
      total: mercTotal,
    } = h.generatePricesForMercedes(start_time, end_time);

    let payload: HTMLMarkupData = {
      quantity: vendorName === Vendor.mercedes ? mercQty : quantity,
      subtotal_price:
        vendorName === Vendor.mercedes ? mercSubtotal : subtotalPrice,
      total_price: vendorName === Vendor.mercedes ? mercTotal : totalPrice,
      total_tax: vendorName === Vendor.mercedes ? mercTax : totalTax,
      userName: vendorName === Vendor.mercedes ? `${first} ${last}` : "",
      createdAt,
      end_time,
      name,
      price,
      qrcodeData,
      start_time,
    };

    // generate html markup for email
    const htmlMarkup = h.generateHTMLMarkup(
      payload,
      vendorName === Vendor.mercedes ? "" : billingAddressMarkup,
      vendorName === Vendor.mercedes ? false : isSuperSavePass,
      vendorName === Vendor.mercedes ? true : false
    );

    let storedWebhook: string;
    try {
      // Method to add webhook_id to redis
      storedWebhook = await redis.get(newWebhookId);
    } catch (error) {
      console.error("Error getting stored webhook from redis =>", error);
    }

    const cc: string[] = h.generateCC(vendorName);
    const attachments: MailAttachment[] = h.generateAttachments(
      qrcodeUrl,
      logoImageBase64
    );

    const emailData: EmailData = {
      from: user,
      html: htmlMarkup,
      orderNum: order_number,
      attachments,
      cc,
      to: email,
    };

    // If webhook_id does not already exist in db
    if (!storedWebhook) {
      let emailResponse: boolean;

      try {
        emailResponse = await h.sendEmail(transporter, emailData);
      } catch (error) {
        console.error("Error sending email =>", error);
        emailResponse = false;
      }

      // If email is successful, add webhook to redis and send success response
      if (emailResponse) {
        const webhookLogged = await h.sendWebhookIdToRedis(redis, newWebhookId);
        if (webhookLogged) {
          return res
            .status(successCode)
            .send({ message: messages.successMessage(vendorName) });
        } else {
          return res.status(errorCode).send({
            message: messages.webhookNotLoggedAndEmailSentMessage(vendorName),
          });
        }

        // // send SMS to user
        // try {
        //   const smsResponse = await sendQRCodeSMSToUser(
        //     phoneNumber,
        //     order_num: order_number,
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
          emailRetryResponse = await h.sendEmail(transporter, emailData);
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
