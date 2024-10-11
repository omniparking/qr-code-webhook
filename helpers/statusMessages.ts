// declaring messages for server response
export const messages = {
  dataMissingMessage: function (source: string): string {
    return `Webhook event failed from ${source}. Critical data is missing from request body!`;
  },
  failedToLoadDataToServerMessage: function (source: string): string {
    return `Failed to load data to server! Source: ${source}`;
  },
  emailSentButWebhookIDNotRegistered: function (source: string): string {
    return `Webhook event not logged but email sent successfully. Source: ${source}`;
  },
  webhookNotLoggedAndEmailAndOrSMSNotSentMessage: function (
    source: string
  ): string {
    return `Webhook event not logged and email not sent! Source: ${source}`;
  },
  missingTimeInfoMessage: function (source: string): string {
    return `Webhook Event failed due to missing start/end booking times! Source: ${source}`;
  },
  webhookAlreadyLoggedMessage: function (
    source: string,
    webhookId: string
  ): string {
    return `Webhook Event failed as webhook Id has previously been successfully stored. Source: ${source}. Webhook ID: ${webhookId}`;
  },
  requestNotPostMethodMessage: function (source: string): string {
    return `Webhook Event failed as request not coming from trusted source. Source: ${source}`;
  },
  errorFromMainTryCatchMessage: function (source: string): string {
    return `Webhook Event failed. Error from main try/catch. Source: ${source}`;
  },
  successMessage: function (source: string, smsSent: boolean): string {
    return `Webhook Event logged and Email Successfully logged! Was sms sent: ${smsSent}. Source: ${source}`;
  },
  failedToConnectToFTPServerMessage: function (source: string): string {
    return `Failed to connect to ftp server. Source: ${source}`;
  },
  generateQRCodeError: function (source: string): string {
    return `Failed to generate a QR code! Source: ${source}`;
  },
  sendingSMSFailed: function (
    source: string,
    webhookLogged: boolean,
    emailSent: boolean
  ): string {
    return `Failed to send an SMS to the user! Was webhook logged: ${webhookLogged}. Was email sent: ${emailSent} Source: ${source}`;
  },
  notFromTrustedSource: function (): string {
    return `The incoming request was not sent from a trusted source.`;
  },
};
