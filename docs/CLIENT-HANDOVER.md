# ZOOM X online store: handover guide

For the ZOOM X team. This explains what the new website does, where things are managed, and what we still need from you. No technical knowledge is needed.

---

## 1. How the new store works

- **The website** (zoomx.lk) is what customers see. It's fast, works on phones, and gets all its information from your store system.
- **Your store system** is WordPress + WooCommerce, at a separate address (for example `cms.zoomx.lk/wp-admin`). **Everything you manage happens here**: products, prices, stock, orders, customers, coupons and delivery charges.
- When you change something in WooCommerce, the website updates by itself, usually within seconds.

You never need to log in to the website itself to manage the shop.

## 2. Everyday tasks (in WooCommerce)

### Products
- **Add or edit**: *Products → Add New / All Products*.
- **Name**: as printed on the pack, e.g. "Laundry Detergent".
- **Sizes** (500 ml, 1 L…): use a **Variable product** with a "Size" attribute, and create one variation per size, each with its own **price, SKU and stock**. Customers can't buy a size that's out of stock.
- **Prices**: in LKR. To run a sale, fill in the *Sale price*; the website shows the old price crossed out and a "Sale" label.
- **Stock**: turn on *Manage stock* and enter the quantity. Stock goes down with each order and comes back if an unpaid card order is cancelled.
- **Images**: upload clear packshots on a plain white or light background, square, at least 1500 × 1500 px. Fill in the image **Alt text** (e.g. "ZOOM X Laundry Detergent 1 L bottle"); it helps blind customers and search engines.
- **Descriptions**: the short description appears beside the price, the full description below. Only include claims you can prove (see §6).
- **Featured**: click the ☆ in the product list to show a product under "Picked for you" on the home page. "Best sellers" are chosen automatically by sales.

### Categories
*Products → Categories*. Each category gets its own page. A name, short description and image make those pages look their best.

### Coupons
*Marketing → Coupons*. Create a code (e.g. `AVURUDU10`), the discount, an expiry and any limits. Customers type it in their bag.

### Delivery charges
*WooCommerce → Settings → Shipping*. Charges are calculated from the customer's address and shown before they pay.

## 3. Orders

Find orders in *WooCommerce → Orders*. What each status means:

| Status | Meaning | What to do |
|---|---|---|
| **Processing** | Paid by card, **or** a Cash on Delivery order | Pack and dispatch. For COD, collect cash on delivery |
| **Pending payment** | The customer chose card payment but hasn't paid yet | Nothing. If unpaid, it cancels itself after 60 minutes and the stock returns |
| **On hold** | Needs your attention, e.g. the amount paid didn't match, or a chargeback | Read the order notes, check the PayHere portal, then decide |
| **Failed** | The card payment failed | Nothing (the customer may try again) |
| **Completed** | Delivered | Set this yourself after delivery |
| **Cancelled / Refunded** | — | — |

**Card payments are only marked paid after PayHere confirms them securely.** The order notes show "PayHere payment … verified". If a customer says they paid but the order isn't *Processing*, check the PayHere merchant portal before dispatching.

**Tracking numbers**: if you'd like customers to see courier tracking numbers, install the "WooCommerce Shipment Tracking" plugin and add numbers to orders. The website shows them automatically.

### Refunds
1. Card payments: refund in the **PayHere merchant portal** first.
2. Then in WooCommerce: open the order → **Refund** → enter the amount → **Refund manually**. This records it and can return items to stock.
3. Cash on Delivery: refund the customer by your agreed method, then record it the same way.

## 4. Customers

- Customers can buy as **guests** or **create an account** to see their orders and save their address.
- Guests can check an order at **zoomx.lk/orders/track** with the order number and their email.
- Customer accounts are in *Users* / *WooCommerce → Customers*. Staff accounts can't sign in on the shop website; they use wp-admin.
- Password resets are handled by email automatically.

## 5. Website text that isn't in WooCommerce

These pages are part of the website's design, so text changes go through your developer:

- Home page wording, About, Sustainability, For Businesses, Contact, FAQs.
- **Policies**: Delivery, Returns & Refunds, Privacy, Terms. **These are drafts.** They're marked "Draft — awaiting approval" and hidden from Google until you approve them.

## 6. What we need from you before launch

| # | Item | Why |
|---|---|---|
| 1 | Access to WordPress (admin) and the web host, or a decision to set up a new staging copy | WooCommerce must be installed and configured |
| 2 | **Product list**: every product and size with SKU, price, stock, weight, descriptions | Nothing is invented on the website |
| 3 | **Real product photos** (packshots) and lifestyle images you hold rights to | The images on the old site are computer-generated renders with unreadable labels |
| 4 | **Delivery**: areas, charges, free-delivery amount, delivery times, courier | For WooCommerce shipping and the Delivery Policy |
| 5 | **VAT**: do prices include VAT? | For correct totals and the Terms |
| 6 | **Cash on Delivery rules** (limits, areas) | Checkout and the Delivery Policy |
| 7 | **PayHere** sandbox and live merchant accounts; approve the website domain in PayHere | Card payments |
| 8 | **WEBXPAY**: is it needed? | Only built if required |
| 9 | **Policies**: approve or provide Delivery, Returns & Refunds, Privacy and Terms (fill in everything in [brackets]) | Legal requirement before selling |
| 10 | **Official email address** and social media links | Shown on Contact and in the footer (currently hidden) |
| 11 | **Evidence for product claims**: "dermatologically tested", "biodegradable", "phosphate/paraben free", "non-toxic", "99.9% germ kill", recyclable packaging | We left these out until they can be backed up |
| 12 | A real promotion or delivery message for the top announcement bar (optional) | Currently hidden |
| 13 | Access to the domain's DNS (Cloudflare) and a Vercel / GitHub account owner | To go live and to own the code |

## 7. Getting help

| Problem | First check |
|---|---|
| A price or stock change isn't showing | Wait a minute and refresh. If it's still wrong, your developer can refresh the website's cache in one step |
| Customer paid but the order isn't Processing | PayHere merchant portal, then the order notes |
| Customer didn't get an email | WordPress email (SMTP) settings / spam folder |
| Website is down or shows errors | Contact your developer: they'll check Vercel logs and can roll back instantly |

Technical documentation for developers: `README.md` and the `docs/` folder in the code repository.
