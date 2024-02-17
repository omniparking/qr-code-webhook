import { hrefBase } from ".";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require("twilio")(accountSid, authToken);

/**
 * Generates text that gets sent in SMS to user
 * @param {string} orderNum order num of booking
 * @param {string} startTime start time of booking
 * @param {string} endTime end time of booking
 * @param {string} qrcodeData data send to server
 * @returns {string} message for SMS
 */
const generateSMSMessage = (
  orderNum: string,
  startTime: string,
  endTime: string,
  qrcodeData: string
): string => {
  const href = `${hrefBase}/view/qr?startTime=${startTime}&endTime=${endTime}&qrcodeData=${qrcodeData}`;

  const message = `OMNI AIRPORT PARKING
    [ORDER #${orderNum}]
    Please click on the following link for the QR code needed to scan for entry and for exit at our facility. 
    Do not reply to this message. Any further questions can be directed to 689-267-2327 via phone call or text message. 
    Thank you for choosing Omni.
    ${href}
  `;
  console.log("message:", message);
  return message;
}; // END generateSMSMessage

/**
 *
 * @param {string} to the users phone number
 * @param {string} OrderNum the order number
 * @param {string} qrcodeLink the url to the qr code
 * @returns {Promise<any>} response from twilio api
 */
export const sendQRCodeSMSToUser = async (
  to: string,
  orderNum: string,
  startTime: string,
  endTime: string,
  qrcodeData: string
): Promise<any> => {
  try {
    const body = generateSMSMessage(orderNum, startTime, endTime, qrcodeData);
    const from = process.env.TWILIO_PHONE_NUMBER;
    // const response = await client.messages.create({ to, body, from });
    // console.log("response is:", response);
    // return response;
  } catch (error) {
    console.error("sendQRCodeSMSToUser Error =>", error);
  }
};
