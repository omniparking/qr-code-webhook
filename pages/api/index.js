// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

/*jshint esversion: 8 */

const QRCode = require('qrcode');
// const nodemailer = require('nodemailer');
const { Redis } = require('@upstash/redis');
const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
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
    const results = await sgMail.send(msg);
    console.log('email results:', results);
    return true;
  } catch (e) {
    console.error('error sending email =>', e);
    return false;
  }
}

// handler function which handles http requests coming in
export default async function handler(req, res) {
  // res.status(200).json({ name: 'John Doe' })

  try {
    if (req.METHOD === 'POST') {
    // Grab needed data from reqeest object
    const { body: payload, headers } = req;
    const { /*email: to, */ order_number, customer, line_items, created_at, total_line_items_price } = payload;
    const { first_name, last_name } = customer;
    const startAndEndTimes = line_items && line_items[0] && line_items[0].properties || []; // start and end times should be here    
    const to = 'alon.bibring@gmail.com';
    // set headers
    res.setHeader('Content-Type', 'text/html');
    // describes lifetime of our resource telling CDN to serve from cache and update in background (at most once per second)
    res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
    
    console.log('\n\npayload:', payload, '\n\n');
    console.log('\n\nlines_items[0].properties', startAndEndTimes, '\n\n');
    console.log('\n\ncustomer:', customer, '\n\n')
    console.log('\n\order_number:', order_number, '\n\n');
    console.log('\n\nline_items', line_items, '\n\n');
    
    // generate barcode with order information
    const url = await generateQRCode(`{order_number: ${order_number}}`);
    
    // generate HTML markup for email
    const html =  `
      <b style="font-size:1.5rem;">Parking Confirmation Details:</b>
      <p style="color:blue;font-size:1.2rem">Hi ${first_name}, thank you for using Omni Parking.  To enter the parking lot, please use the QR code below.</p>
      <p><span style="font-weight:bold;">Total Amount:</span> $${total_line_items_price}</p>
      <br />< br/>
      <img style="width: 90%;, height: 90%;object=fit:contain;" src="${url}"/>
     `;
    
    const new_webhook_id = headers['x-shopify-webhook-id'] || ''; // grab webhook_id from headers
    // const total_items = line_items.length || 0;
    const time = created_at || '';
    console.log('new_webhook_id:', new_webhook_id);
    console.log('headers:', headers);
    console.log('created_at:', created_at);

    // method to add members
    const members = await redis.smembers();
    const webhookAlreadyExists = members.find(member => member === new_webhook_id);

    // If webhook_id does not already exist in db
    if (!webhookAlreadyExists) {
      const from = 'omniparkingwebhook@gmail.com'; // sender
      // const cc = ['alon.bibring@gmail.com']; // cc emails
      const userEmailSuccessful = sendEmail({ to, from, html, order_number });
      if (userEmailSuccessful) {
        redis.sadd(`webhook_id_${new_webhook_id}`, new_webhook_id);
        res.status(201).send({ message: 'Webhook Event and Email Successfully logged. '});
      } else {
        try {
          const userEmailSuccessful = sendEmail({ to, from, html, order_number });
          if (userEmailSuccessful) {
            redis.sadd(`webhook_id_${new_webhook_id}`, new_webhook_id);
            res.status(201).send({ message: 'Webhook Event and Email Successfully logged. '});
          } else {
            res.status(201).send({ message: 'Webhook Event logged but email failed. '});
          }
        } catch (e) {
          res.status(201).send({ message: 'Webhook Event logged but email failed. '});
        }
      }
    }
    
      res.status(201).send({ message: 'Webhook Event successfully logged' }); // send 201 response to Shopify
    }
  } catch (e) {
    console.error('Error from webhook =>:', e);
    res.status(201).send({ message: 'Webhook Event failed' }); // send 201 response to Shopify
  }
}
