// declaring messages for server response
export const messages = {
  dataMissingMessage: function (source: string): string {
    return `Webhook event failed from ${source}. Critical data is missing from request body!`;
  },
  failedToLoadDataToServerMessage: function (source: string): string {
    return `Failed to load data to server! Source: ${source}`;
  },
  webhookNotLoggedAndEmailSentMessage: function (source: string): string {
    return `Webhook event not logged but email sent successfully. Source: ${source}`;
  },
  webhookNotLoggedAndEmailNotSentMessage: function (source: string): string {
    return `Webhook event not logged and email not sent! Source: ${source}`;
  },
  missingTimeInfoMessage: function (source: string): string {
    return `Webhook Event failed due to missing start/end booking times! Source: ${source}`;
  },
  webhookAlreadyLoggedMessage: function (source: string): string {
    return `Webhook Event failed as it has previously been successfully logged. Source: ${source}`;
  },
  requestNotPostMethodMessage: function (source: string): string {
    return `Webhook Event failed as request not coming from trusted source. Source: ${source}`;
  },
  errorFromMainTryCatchMessage: function (source: string): string {
    return `Webhook Event failed. Error from main try/catch. Source: ${source}`;
  },
  successMessage: function (source: string): string {
    return `Webhook Event logged and Email Successfully logged! Source: ${source}`;
  },
  failedToConnectToFTPServerMessage: function (source: string): string {
    return `Failed to connect to ftp server. Source: ${source}`;
  },
  generateQRCodeError: function (source: string): string {
    return `Failed to generate a QR code! Source: ${source}`;
  },
  sendingSMSFailed: function (source: string, webhookLogged: boolean): string {
    return `Failed to send an SMS to the user! Webhook logged: ${webhookLogged}. Source: ${source}`;
  },
};
