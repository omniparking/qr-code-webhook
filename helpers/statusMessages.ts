// declaring messages for server response
export const messages = {
  // Existing messages
  notFromTrustedSource: () => "Request not from trusted source",

  errorFromMainTryCatchMessage: (vendor: string) =>
    `Error processing ${vendor} webhook - main exception`,

  webhookAlreadyLoggedMessage: (vendor: string, webhookId: string) =>
    `Webhook ${webhookId} for ${vendor} order has already been processed`,

  dataMissingMessage: (vendor: string) =>
    `Missing required data in ${vendor} order`,

  missingTimeInfoMessage: (vendor: string) =>
    `Missing start or end time in ${vendor} order`,

  emailSentButWebhookIDNotRegistered: (vendor: string) =>
    `${vendor} order processed but webhook ID not registered in database`,

  // New messages for NetParks integration
  missingWebhookIdMessage: (vendor: string) =>
    `Missing Shopify webhook ID for ${vendor} order`,

  failedToTransformOrder: (vendor: string) =>
    `Failed to transform ${vendor} order data into NetParks reservation format`,

  failedToPostReservationToNetpark: (vendor: string) =>
    `Failed to create reservation in NetParks system for ${vendor} order after retry`,

  reservationCreatedButWebhookNotLogged: (vendor: string) =>
    `Reservation created successfully for ${vendor} order but webhook ID was not stored in Redis`,

  reservationCreatedSuccessfully: (vendor: string) =>
    `Successfully created ${vendor} reservation in NetParks system`,

  reservationQuoteFailed: (vendor: string) =>
    `Failed to create reservation quote for ${vendor}`,
};
