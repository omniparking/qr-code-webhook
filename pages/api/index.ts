/*jshint esversion: 8 */
"use server";
/* eslint max-len: ["error", { "code": 120 }] */

import type { NextApiRequest, NextApiResponse } from "next";

import * as h from "@/helpers/index";
import { messages } from "@/helpers/statusMessages";
import { ReservationPayload, ShopifyOrder } from "@/helpers/interfaces";
import {
  isMercedesOrder,
  transformShopifyOrderToReservation,
} from "@/helpers/reservationTransform";

import { Redis } from "@upstash/redis";
import { IncomingHttpHeaders } from "http";

export const enum Vendor {
  general = "general",
  mercedes = "mercedes",
}

export const errorCode: number = 400;
export const successCode: number = 201;

// Env variables
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const url = process.env.UPSTASH_REDIS_REST_URL;
// const netparksApiUrl = process.env.NETPARK_API_URL;
const netparksSourceId = process.env.NETPARKS_SOURCE_ID;

// Initialize redis (to store webhook ids)
const redis: Redis = new Redis({
  url,
  token,
});

const turnOffWebhook = (res: NextApiResponse): void => {
  return res.status(successCode).send({ message: "Webhook turned off!" });
};

/**
 * Handler function which handles http request coming in (webhook calls from shopify)
 * @param {NextApiRequest} req request object
 * @param {NextApiResponse} res response object
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // return turnOffWebhook(res) // ** CAUTION: UNCOMMENT TO TURN OFF WEBHOOK **

  try {
    const {
      headers,
      method,
      body,
    }: {
      body: ShopifyOrder;
      headers: IncomingHttpHeaders;
      method?: string | undefined;
    } = req;

    const shopifyTopic = (
      (headers?.["x-shopify-topic"] as string) || ""
    )?.trim();
    const sourceName = (headers["x-hookdeck-source-name"] as string)?.trim();

    const isTrustedSrc = h.isTrustedSource(method, shopifyTopic, sourceName);

    if (!isTrustedSrc) {
      // return res.status(errorCode).send({
      //   message: messages.notFromTrustedSource(),
      // });
    }

    // Determine vendor based on order data
    const vendorName = isMercedesOrder(body) ? Vendor.mercedes : Vendor.general;

    return handleWebhook(req, res, vendorName);
  } catch (error) {
    // Case where something failed in the code above send a response message indicating webhook failed
    console.error("Error main try/catch in handler =>", error);
    return res.status(errorCode).send({
      message: messages.errorFromMainTryCatchMessage(Vendor.general),
    });
  }
}

/**
 * Handles the webhook by transforming Shopify order data and posting to NetParks API
 */
const handleWebhook = async (
  req: NextApiRequest,
  res: NextApiResponse,
  vendorName: Vendor = Vendor.general,
): Promise<void> => {
  let newWebhookId = "";

  try {
    const {
      body,
      headers,
    }: {
      body: ShopifyOrder;
      headers: IncomingHttpHeaders;
    } = req;

    // Grab unique webhook_id
    newWebhookId = (headers?.["x-shopify-webhook-id"] as string) || "";

    if (!newWebhookId) {
      console.error("Missing webhook ID from Shopify");
      return res.status(errorCode).send({
        message: messages.missingWebhookIdMessage(vendorName),
      });
    }

    console.log(`\n=== Processing Shopify Webhook ===`);
    console.log(`Webhook ID: ${newWebhookId}`);
    console.log(`Order Number: ${body.order_number}`);
    console.log(`Vendor: ${vendorName}`);
    console.log(`Customer: ${body.email}`);

    // Check if webhook has already been processed
    let storedWebhook: string | null = null;
    try {
      storedWebhook = await redis.get(newWebhookId);
    } catch (error) {
      console.error("Error getting stored webhook from redis =>", error);
    }

    // If webhook_id already exists in db, it's a duplicate
    if (storedWebhook) {
      console.error(
        `Duplicate webhook detected - already processed: ${newWebhookId}`,
      );
      return res.status(errorCode).send({
        message: messages.webhookAlreadyLoggedMessage(vendorName, newWebhookId),
      });
    }

    // Get source ID from environment variables
    const sourceId = parseInt(netparksSourceId || "1");

    // Transform Shopify order to NetParks reservation payload
    console.log("Transforming Shopify order to NetParks reservation format...");
    const reservationPayload = transformShopifyOrderToReservation(
      body,
      sourceId,
    );

    if (!reservationPayload) {
      console.error("Failed to transform Shopify order to reservation payload");
      return res.status(errorCode).send({
        message: messages.failedToTransformOrder(vendorName),
      });
    }

    console.log("Transformation successful");
    console.log(
      `Processing ${vendorName} order #${body.name} - Webhook ID: ${newWebhookId}`,
    );
    console.log(
      "Reservation payload:",
      JSON.stringify(reservationPayload, null, 2),
    );

    // Post reservation to NetParks API
    console.log("Posting reservation to NetParks API...");
    let apiCallSuccess = false;
    let netparksResponse: any = null;
    let attemptCount = 0;

    try {
      attemptCount = 1;
      console.log(`Attempt ${attemptCount}: Calling NetParks API...`);
      netparksResponse = await postReservationToNetparks(reservationPayload);
      apiCallSuccess = true;
      console.log("✓ NetParks API call successful");
      console.log("Response:", JSON.stringify(netparksResponse, null, 2));
    } catch (error) {
      console.error(`✗ Attempt ${attemptCount} failed:`, error);
      apiCallSuccess = false;
    }

    // If first attempt failed, retry once
    if (!apiCallSuccess) {
      console.log("Retrying NetParks API call...");
      try {
        attemptCount = 2;
        console.log(`Attempt ${attemptCount}: Calling NetParks API...`);
        netparksResponse = await postReservationToNetparks(reservationPayload);
        apiCallSuccess = true;
        console.log("✓ NetParks API retry successful");
        console.log("Response:", JSON.stringify(netparksResponse, null, 2));
      } catch (error) {
        console.error(`✗ Attempt ${attemptCount} failed:`, error);
        console.error("All retry attempts exhausted");
        return res.status(errorCode).send({
          message: messages.failedToPostReservationToNetpark(vendorName),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // If API call succeeded, store webhook ID in Redis
    if (apiCallSuccess) {
      console.log("Storing webhook ID in Redis...");
      let webhookLogged = false;
      try {
        webhookLogged = await h.sendWebhookIdToRedis(redis, newWebhookId);
      } catch (error) {
        console.error("Error saving webhook to redis =>", error);
      }

      if (!webhookLogged) {
        console.warn(
          `⚠ Reservation created but webhook ID not stored: ${newWebhookId}`,
        );
        return res.status(successCode).send({
          message: messages.reservationCreatedButWebhookNotLogged(vendorName),
          data: netparksResponse,
          orderNumber: body.name,
          webhookId: newWebhookId,
        });
      }

      // Complete success
      console.log("=== Webhook Processing Complete ===\n");
      return res.status(successCode).send({
        message: messages.reservationCreatedSuccessfully(vendorName),
        data: netparksResponse,
        webhookId: newWebhookId,
        orderNumber: body.name,
      });
    }
  } catch (error) {
    console.error(`Error processing webhook (${vendorName}):`, error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return res.status(errorCode).send({
      message: messages.errorFromMainTryCatchMessage(vendorName),
      error: error instanceof Error ? error.message : "Unknown error",
      webhookId: newWebhookId || "unknown",
    });
  }
};

/**
 * Posts reservation data to NetParks API
 * @param payload - Reservation payload
 * @param apiUrl - NetParks API URL
 * @param apiToken - NetParks API authentication token
 * @returns API response data
 */
async function postReservationToNetparks(
  payload: ReservationPayload,
): Promise<any> {
  const apiUrl = process.env.NETPARK_API_URL;
  const apiToken = process.env.NETPARKS_API_TOKEN;
  if (!apiUrl) {
    throw new Error("NetParks API URL not configured in environment variables");
  }

  if (!apiToken) {
    throw new Error(
      "NetParks API Token not configured in environment variables",
    );
  }

  const endpoint = `${apiUrl}/reservations`;

  console.log(`Making POST request to: ${endpoint}`);
  console.log("POST PAYLOAD:", JSON.stringify(payload), "\n\n");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiToken,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.json();

  if (!response.ok) {
    console.error(
      `NetParks API error response (${response.status}):`,
      JSON.stringify(responseText),
    );
    throw new Error(
      `NetParks API request failed with status ${response.status}:`,
    );
  }

  // Try to parse as JSON, fallback to text if not JSON
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    data = { raw: responseText };
  }

  return data;
}
