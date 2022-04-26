## omni-parking-webhook

This repo contains code to receive a webhook event (i.e., order payment) from Shopify.  The idea being that once a user makes a purchase, they will receive an email with their purchase information and a QR code that contains the start_time, end_time, and order_number of the user's purchase.

Once a request comes in, the start_time, end_time, payment info, etc. is retrieved from the 
incoming request. A QR Code is generated with the start_time, end_time, and order_number data,
and is added as an attachment to the email template.  It is added as an attachment, rather than being displayed directly in the email, to ensure that it will display in all email providers (i.e., gmail does not allow images to display directly in the email).  In addition to the QR code, the email template contains information about the order such as the user billing info, order subtotal, tax, and total price, start and end times, etc.

## To Run Repo Locally

run `npm install` from the root folder (must add dotenv package from npm and import it accordingly to use process.env variables locally)
run `npm start` from the root folder (Will run locally on port 8080)

## To Update Production

Whenever a new push is made to the 'main' branch in GitHub, vercel will redeploy the application.

## Repo Contents

Within the /pages/api folder you will find an index.js file.  This file contains the function which receives and processes incoming requests from Shopify's webhook.  

Within the /helpers/index.js file, you will find the helper functions being used inside the /pages/api/index.js file.  These two files together comprise the code necessary for this application to work.
