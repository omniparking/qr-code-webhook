// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

/*jshint esversion: 8 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const getRawBody = require('raw-body');
const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: 'omniparkingwebhook@gmail.com',
    pass: process.env.GMAIL_PASSWORD
  },
  secure: true
});


// generates qr code with order id, start date, and end date
async function generateQRCode(text) {
  try {
    const codeUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'L' });
    return codeUrl;
  } catch (e) {
    console.error('error generating qr code => ', e);
    return '';
  }
}

// returns true if email was sent and false if not
async function sendEmail(emailInfo) {
  const { to, from, html, order_number } = emailInfo;
  const msg = {
    to,
    from,
    html,
    subject: `Order #${order_number} confirmed`,
    text: 'Your order has been confirmed for Omni Parking. The QR code is attached',
  };
  try {
    await transporter.sendMail(msg);
    return true;
    // let didEmailSend = false;
    // const results = sgMail.send(msg)
    // .then(response => {
    //   if (response[0].statusCode === 202) {
    //     didEmailSend = true;
    //   }
    // })
    // .catch(error => {
    //   console.error('error sending email =>', error);
    //   didEmailSend = false;
    // });
    // if (didEmailSend) {
    //   return true;
    // } else {
    //   return false;
    // }
  } catch (e) {
    console.error('error sending email =>', e);
    return false;
  }
}

// handler function which handles http requests coming in
export default async function handler(req, res) {
  try {
    // if (req.METHOD === 'POST') {
      // try {
      //   const hmac = req.get('X-Shopify-Hmac-Sha256');
      //   const rawBody = await getRawBody(req);
      //   const generated_hash = crypto
      //     .createHmac('sha256', process.env.SHOPIFY_SECRET)
      //     .update(rawBody)
      //     .digest('base64');

      //   if (generated_hash !== hmac) {
      //     res.status(201).send({ message: 'Webhook verification failed '});
      //     return;
      //   }
      // } catch (e) {
      //   res.status(201).send({ message: 'Webhook verification failed '});
      //   return;
      // }

        // Grab needed data from reqeest object
        const { body: payload, headers } = req;
        const { /*email: to, */ order_number, customer, line_items, created_at, total_line_items_price } = payload;
        const { first_name, last_name } = customer;
        const lineItems = line_items && line_items[1] && line_items[1].properties || []; // start and end times should be here

        let start_time, end_time;
        if (lineItems && lineItems.length) {
          // get start time of booking
          start_time = lineItems.filter(item => {
            if (item.name === 'booking-start') { return item.value; }
          });
              
          // get end time of booking
          end_time = lineItems.filter(item => {
            if (item.name === 'booking-end') { return item.value; }
          });
        }

    // set headers
    res.setHeader('Content-Type', 'text/html');
    // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    
    const qrCodeData = { order_number, start_time, end_time };

    // generate barcode with order information
    const url = await generateQRCode(JSON.stringify(qrCodeData));
    
    // generate HTML markup for email
    const html =  `
      <b style="font-size:1.5rem;">Parking Confirmation Details:</b>
      <p style="color:blue;font-size:1.2rem">Hi ${first_name}, thank you for using Omni Parking.  To enter the parking lot, please use the QR code below.</p>
      <p><span style="font-weight:bold;">Total Amount:</span> $${total_line_items_price}</p>
      <br />< br/>
      <img style="width: 90%;, height: 90%;object=fit:contain;" src="${url}"/>
     `;
    
    const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers
    console.log('new_webhook_id:', new_webhook_id);
    console.log('headers:', headers);
    console.log('created_at:', created_at);

    // // if no start or end times from booking, event failed
    // if (!start_time && !end_time) {
    //   res.status(201).send({ message: 'Webhook event failed. No start/end times available. '});
    //   return;
    // }

    // method to add members
    const members = await redis.smembers();
    const webhookAlreadyExists = members.find(member => member === new_webhook_id);

    const to = 'omniparkingwebhook@gmail.com@gmail.com';
    const from = 'omniparkingwebhook@gmail.com'; // sender
    const cc = ['alon.bibring@gmail.com']; // cc emails
    const emailData = { to, from, html, order_number };

    // If webhook_id does not already exist in db
    if (!webhookAlreadyExists) {

      const userEmailSuccessful = sendEmail(emailData);
      if (userEmailSuccessful) {
        await redis.sadd(`webhook_id_${new_webhook_id}`, new_webhook_id);
        res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
      } else {
        try {
          const userEmailSuccessful = sendEmail(emailData);
          if (userEmailSuccessful) {
            await redis.sadd(`webhook_id_${new_webhook_id}`, new_webhook_id);
            res.status(201).send({ message: 'Webhook Event logged and Email Successfully logged. '});
          } else {
            res.status(201).send({ message: 'Webhook Event logged but email failed. '});
          }
        } catch (e) {
          res.status(201).send({ message: 'Webhook Event logged but email failed. '});
        }
      }
    } else {
      res.status(201).send({ message: 'Webhook Event has previously been successfully logged' }); // send 201 response to Shopify
    }
    // } else {
    //   res.status(201).send({ message: 'Webhook Event failed. Wrong HTTP Method. Must be of type POST.' });
    // }
  } catch (e) {
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed' }); // send 201 response to Shopify
  }
}
