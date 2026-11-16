SHREE FOOD COURT - FULL WEBSITE PROJECT
=======================================

FEATURES
--------
- Customer-facing restaurant website
- Menu with categories, search and add-to-cart
- 86 menu items based on the menu list shared in the chat
- UPI QR generated with the cart total
- Cash on Delivery option
- Orders saved to a local SQLite database on the server
- Private owner login at /owner
- Owner can see monthly orders, monthly sales, pending payments
  and update payment/order statuses
- Google Maps and Instagram buttons open the supplied links
- Restaurant phone and business hours displayed

IMPORTANT MENU NOTE
-------------------
Menu names and prices are based on the earlier typed list in the chat.
Please verify every item and price against your printed menu before going live.
The photo cards currently use category emoji illustrations, not verified
photographs of each individual dish.

REQUIREMENTS
------------
- Node.js 20 or newer
- Internet connection for the QR library CDN
- A hosting provider that supports Node.js and persistent disk storage

INSTALL ON WINDOWS
------------------
1. Install Node.js from https://nodejs.org/
2. Extract the ZIP file.
3. Open the extracted shree-food-court folder in VS Code.
4. Open VS Code Terminal > New Terminal.
5. Run: npm install
6. Copy .env.example and rename the copy to .env
7. Open .env and change:
   SESSION_SECRET to a long random secret
   ADMIN_USERNAME to your private owner username
   ADMIN_PASSWORD to a strong unique password
   Keep UPI_ID as Q050896036@ybl (confirm this UPI ID is correct)
8. Run: npm start
9. Open http://localhost:3000
10. Owner dashboard: http://localhost:3000/owner

UPI PAYMENT IMPORTANT
---------------------
The website creates a UPI intent QR with the payable amount and merchant UPI ID.
A QR scan does NOT prove that money reached the bank account.
This project does not have payment gateway callbacks or automatic verification.
Verify every payment in your bank/merchant UPI app before marking it PAID
in the owner dashboard. Never mark paid just because a customer shows a screenshot.

ORDER PRIVACY
-------------
Customer orders are stored on the server in data/orders.sqlite.
The owner dashboard requires the username and password in .env.
Customers cannot open the owner orders API without an authenticated owner session.
Do not share your .env file or owner password.
Use HTTPS when deployed publicly.
The built-in Express MemoryStore is suitable only for local testing/small demo.
For production, configure a persistent session store and database backups.

DEPLOYMENT
----------
This is a Node.js backend website, not a plain static HTML site.
Deploy it to a Node.js host with persistent disk/volume support.
Set the .env variables in the hosting provider's secret/environment settings.
Do not upload .env or data/orders.sqlite to a public Git repository.
After deployment, use HTTPS and test an order and owner login.

BUSINESS LINKS
--------------
Maps: https://maps.app.goo.gl/6hBhWymSRDdwS5my7
Instagram: https://www.instagram.com/shree_foodcourt_?xtok=eHFkMnh3dHB1c3p4
UPI: 7878017123-3@ibl
Phone: 8824180056
Address: Salawas Bus Stand
Hours: 11:00 AM to 10:00 PM
