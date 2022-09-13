## omni-parking-webhook

This repo contains code to receive a webhook event (i.e., order payment) from Shopify, generate a QR code with order information, send relevant info to Omni Airport Parking FTP servers, and then send the user an email with order details and QR code.

Once a request comes in, the start_time, end_time, payment info, etc. is retrieved from the 
incoming request. A QR Code is generated with the order_number and is added as an attachment to the email template.  It is added as an attachment, rather than being displayed directly in the email, to ensure that it will display in all email providers (i.e., gmail does not allow images to display directly in the email).  In addition to the QR code, the email template contains information about the order such as the user billing info, order subtotal, tax, and total price, start and end times, etc.

## To Run Repo Locally

run `npm install` from the root folder (must add dotenv package from npm and import it accordingly to use process.env variables locally)
run `npm run build` from the root folder to have next.js make a build
run `npm start` from the root folder will run the code just built (default runs locally on port 8080) 

## To Update Production

Whenever a new push is made to the 'main' branch in GitHub, Vercel automatically redeploys the application.

## Repo Contents

Within the /pages/api/index.js file you will find the handler function which receives and processes incoming requests from Shopify's webhook.

Within the /helpers/index.js file, you will find the helper functions being used inside the /pages/api/index.js file.  These two files together comprise the code necessary for this application to work.

## Integrations

This application is deployed using Vercel.  The application uses Upstash (Redis db - to store webhook ids), Logflare (for logs), and AWS S3 to store and retrieve Omni Airport Parking logo. Both Upstash and Logflare are configured directly through Vercel, while the AWS sdk is not connected to Vercel.
