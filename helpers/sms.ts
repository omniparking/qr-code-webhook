import { hrefBase } from ".";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require("twilio")(accountSid, authToken);

const twilio = require("twilio");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 *
 * @param {string} recipient user phone number
 * @param {string} orderNum number associated with this order
 * @param {string} startTime the drop off time of the order
 * @param {string} endTime the pickup time of the order
 * @param {string} qrCodeData the qr code data of the order
 * @returns {Promise<boolean>} flag which denotes whether or not sms was sent
 */
export const sendSMS = async (
  recipient: string,
  orderNum: string,
  startTime: string,
  endTime: string,
  qrCodeData: string
): Promise<boolean> => {
  const service_type = "sms";
  const api_key = process.env.SEND_MESSAGE_API_KEY;
  const sender = process.env.SEND_MESSAGE_SENDER;
  const message = `OMNI AIRPORT PARKING\n\n[ORDER #${orderNum}]\n\nPlease click on the following link for the QR code needed to scan for entry and for exit at our facility.\n\n${hrefBase}view/qr?startTime=${startTime}&endTime=${endTime}&qrcodeData=${qrCodeData}\n\nAny further questions can be responded to this number, via phone call or text message.\n\nThank you for choosing Omni.`;

  const payload: SMSPayload = {
    api_key,
    sender,
    service_type,
    message,
    recipient,
  };
  try {
    const response = await fetch(process.env.SEND_MESSAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.error === 0 ? true : false;
  } catch (error) {
    console.error("ERROR SENDING SMS =>", error);
  }
}; // END sendSMS

/**
 * Generates text that gets sent in SMS to user
 * @param {string} orderNum order num of booking
 * @param {string} startTime start time of booking
 * @param {string} endTime end time of booking
 * @param {string} qrCodeData data send to server
 * @returns {string} message for SMS
 */
const generateSMSMessage = (
  orderNum: string,
  startTime: string,
  endTime: string,
  qrCodeData: string
): string => {
  const href = `${hrefBase}/view/qr?startTime=${startTime}&endTime=${endTime}&qrcodeData=${qrCodeData}`;

  const message = `OMNI AIRPORT PARKING
    [ORDER #${orderNum}]
    Please click on the following link for the QR code needed to scan for entry and for exit at our facility. 
    Do not reply to this message. Any further questions can be directed to 689-267-2327 via phone call or text message. 
    Thank you for choosing Omni.
    ${href}
  `;

  return message;
}; // END generateSMSMessage

/**
 *
 * @param {string} receipient the users phone number
 * @param {string} OrderNum the order number
 * * @param {string} startTime the start time of the reservation
 * * @param {string} endTime the end time of the reservation
 * @param {string} qrCodeData the ID used to reference this order, utilizes order_number of the reservation
 * @returns {Promise<any>} response from twilio api
 */
export const sendSMSViaTwilio = async (
  recipient: string,
  orderNum: string,
  startTime: string,
  endTime: string,
  qrCodeData: string
): Promise<boolean> => {
  try {
    const body = generateSMSMessage(orderNum, startTime, endTime, qrCodeData);
    const from = process.env.SEND_MESSAGE_SENDER;
    const message = await client.messages.create({
      body,
      from,
      to: recipient,
    });

    console.log("\n\n\n\nmessage response from twilio sms:", message);
    if (!message.error_code) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("sendSMSViaTwilio Error =>", error);
    return false;
  }
}; // END sendSMSViaTwilio
