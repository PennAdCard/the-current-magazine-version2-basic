# The Current Magazine

The Current Magazine is an online magazine and storefront project built for IST 256.

The project uses:

- HTML
- CSS
- Bootstrap
- JavaScript
- jQuery
- AngularJS
- Node.js
- Express.js
- MongoDB
- Mongoose

## Features

The website includes:

- Magazine articles and category pages
- Content management
- Member management
- Article publishing
- Editorial review
- Product storefront
- Shopping cart
- Shipping information
- Billing and checkout
- Product return requests

## Database Integration

The application uses MongoDB for persistent storage.

The main MongoDB collections are:

- `products`
- `shopping_carts`
- `shipping`
- `billing`
- `returns`

The project also uses:

- `editorial_submissions`

MongoDB data remains stored after the Node.js server is stopped or restarted.

## Project Structure

```text
the-current-magazine/
├── config/
│   └── database.js
├── data/
│   └── products.js
├── models/
│   ├── Billing.js
│   ├── Product.js
│   ├── ReturnRequest.js
│   ├── Shipping.js
│   ├── ShoppingCart.js
│   └── Submission.js
├── public/
│   ├── css/
│   ├── images/
│   ├── js/
│   └── *.html
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Installation

Clone the repository and open the project directory:

```bash
git clone YOUR_REPOSITORY_URL
cd the-current-magazine-version2-basic
```

Install the required packages:

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the project root.

For a local MongoDB server:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/the_current_magazine
```

The `.env` file is excluded from Git.

Use `.env.example` as the configuration template.

## Running the Project

Make sure MongoDB is running.

Start the Node.js server:

```bash
node server.js
```

The terminal should display messages confirming that MongoDB and Express are running.

Open the application at:

```text
http://localhost:3000
```

Storefront:

```text
http://localhost:3000/cart.html
```

Returns page:

```text
http://localhost:3000/returns.html
```

Database health check:

```text
http://localhost:3000/api/health
```

## REST API

### Products

```text
GET    /api/products
GET    /api/products/:productId
POST   /api/products
PATCH  /api/products/:productId
DELETE /api/products/:productId
```

### Shopping Carts

```text
GET    /api/carts
GET    /api/carts/:cartId
POST   /api/carts
PUT    /api/carts/:cartId
PATCH  /api/carts/:cartId
DELETE /api/carts/:cartId
```

### Shipping

```text
GET    /api/shipping
GET    /api/shipping/:shippingId
POST   /api/shipping
PATCH  /api/shipping/:shippingId
DELETE /api/shipping/:shippingId
```

### Billing

```text
GET    /api/billing
GET    /api/billing/:confirmationNumber
POST   /api/billing
PATCH  /api/billing/:confirmationNumber
DELETE /api/billing/:confirmationNumber
```

### Returns

```text
GET    /api/returns
GET    /api/returns/:returnId
POST   /api/returns
PATCH  /api/returns/:returnId
DELETE /api/returns/:returnId
```

## Security

The application does not store full card numbers or security codes.

Only limited payment information is stored, such as:

- Payment type
- Last four card digits
- Expiration date

The `.env` file and `node_modules` directory are excluded through `.gitignore`.
