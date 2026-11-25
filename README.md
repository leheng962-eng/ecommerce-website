# ShopNest – Full-Stack E-commerce Website

A beginner-friendly, complete online store.
**Customers** can browse, search, filter, add to cart, register/login and place orders.
**Admins** can manage products, categories, orders, customers and see sales statistics.

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS (CDN), vanilla JavaScript |
| Backend | Node.js + Express.js (REST API) |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt password hashing |
| Deploy | Docker, Docker Compose, AWS EC2 |

> **About the folder structure:** your sample tree showed `App.vue`, but your technology list says HTML/CSS/JavaScript, so this project uses plain HTML pages. There is no build step: the backend serves the frontend files itself.

---

## 1. Project structure

```
ecommerce-website/
├── backend/
│   ├── config/db.js              # connects to MongoDB
│   ├── models/                   # database schemas (User, Product, Category, Cart, Order)
│   ├── controllers/              # the logic of each API endpoint
│   ├── routes/                   # maps URLs to controllers (+ validation rules)
│   ├── middleware/               # auth (JWT), validation, error handling
│   ├── server.js                 # starts Express
│   ├── seed.js                   # fills the DB with sample data + admin user
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html shop.html product.html cart.html checkout.html
│   ├── order-success.html login.html register.html profile.html admin.html
│   ├── css/styles.css            # buttons, inputs, cards, dark mode helpers
│   └── js/
│       ├── api.js                # fetch() wrapper that talks to the API
│       ├── store.js              # login state (Auth) + shopping cart (Cart)
│       ├── ui.js                 # header, footer, product card, toast (reusable components)
│       ├── tw-config.js          # Tailwind dark-mode setting
│       └── pages/                # one script per page
├── Dockerfile
├── docker-compose.yml
└── README.md
```

**Request flow (how one click travels):**
`Browser button → js/pages/*.js → Api.post() → Express route → validation middleware → auth middleware → controller → Mongoose model → MongoDB → JSON back to the browser → page updates`.

---

## 2. Run it on your computer (no Docker)

**Requirements:** Node.js 18+ and MongoDB (local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
cd ecommerce-website/backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Open `.env` and set:
- `MONGO_URI` – local default `mongodb://127.0.0.1:27017/shopnest`, or your Atlas string.
- `JWT_SECRET` – a long random string. Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Then:

```bash
npm run seed     # creates the admin user, 6 categories, 14 products (deletes old data!)
npm run dev      # starts http://localhost:5000
```

Open **http://localhost:5000**.
Admin panel: **http://localhost:5000/admin.html** – login `admin@shopnest.com` / `Admin12345` (or what you put in `.env`). **Change this password for any real site.**

---

## 3. Run with Docker

```bash
cd ecommerce-website
cp .env.example .env        # edit JWT_SECRET and ADMIN_PASSWORD
docker compose up -d --build
docker compose exec api node seed.js   # first time only: sample data + admin
```

Open **http://localhost**. Stop with `docker compose down` (data stays in the `mongo_data` volume; add `-v` to erase it).

---

## 4. Deploy to AWS (EC2 + Docker Compose)

The simplest path for a student project:

1. **Launch an EC2 instance** (Amazon Linux 2023 or Ubuntu, `t3.small` or larger).
2. **Security group:** open port **22** (SSH, *only your IP*), **80** (HTTP) and later **443** (HTTPS). Do **not** open 27017.
3. **SSH in and install Docker** (Ubuntu example):
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker $USER   # log out and back in
   ```
4. **Copy the project** (`git clone <your repo>` or `scp`), then:
   ```bash
   cp .env.example .env && nano .env      # strong JWT_SECRET and admin password!
   docker compose up -d --build
   docker compose exec api node seed.js
   ```
5. Visit `http://<EC2-public-IP>`.
6. **HTTPS:** point a domain at the instance (Route 53 or any DNS), then put a reverse proxy with free Let's Encrypt certificates in front (Caddy or Nginx + Certbot), or use an AWS Application Load Balancer with an ACM certificate. Without HTTPS, passwords and tokens travel unencrypted, so do not skip this for a real store.

**Production upgrades (when you are ready):**
- Use **MongoDB Atlas** or Amazon DocumentDB instead of a database on the same server, and set `MONGO_URI` accordingly.
- Use **ECR + ECS Fargate** to run the same Docker image without managing servers.
- Tailwind is loaded from a CDN for simplicity. That CDN build is meant for development; for production, compile CSS with the Tailwind CLI so the file is small and has no runtime dependency.
- Take regular database backups.

---

## 5. Database design (MongoDB collections)

```
User      { name, email (unique), password (hashed), role: customer|admin, phone, address{street,city,state,zip,country} }
Category  { name (unique), description, icon }
Product   { name, description, price, oldPrice, category → Category, brand, image, stock, sold, rating, numReviews, featured }
Cart      { user → User (unique), items: [ { product → Product, quantity } ] }
Order     { user → User, items: [ { product, name, image, price, quantity } ], shippingAddress{...},
            paymentMethod, itemsPrice, shippingPrice, totalPrice, status, isPaid }
```

**Relationships**
- One **Category** has many **Products** (`Product.category`).
- One **User** has one **Cart** and many **Orders**.
- A **Cart** item *references* a product, so the cart always shows the current price.
- An **Order** item *copies* name, image and price, so old orders never change when a product is edited or deleted.

---

## 6. REST API

| Method | URL | Who | What |
|---|---|---|---|
| POST | `/api/auth/register` | public | create account |
| POST | `/api/auth/login` | public | returns JWT + user |
| GET / PUT | `/api/auth/me` | user | read / update profile |
| PUT | `/api/auth/password` | user | change password |
| GET | `/api/products` | public | list. Query: `search, category, minPrice, maxPrice, sort (price_asc, price_desc, popular, newest), featured, onSale, page, limit` |
| GET | `/api/products/:id` | public | one product |
| POST / PUT / DELETE | `/api/products[/:id]` | admin | manage products |
| GET | `/api/categories` | public | list with product counts |
| POST / PUT / DELETE | `/api/categories[/:id]` | admin | manage categories |
| GET / POST / DELETE | `/api/cart` | user | read / add / clear cart |
| PUT / DELETE | `/api/cart/:productId` | user | change quantity / remove |
| POST | `/api/cart/merge` | user | merge guest cart after login |
| POST | `/api/orders` | user | place an order from your cart |
| GET | `/api/orders/mine` | user | your order history |
| GET | `/api/orders/:id` | owner/admin | one order |
| GET | `/api/orders` | admin | all orders (`?status=`) |
| PUT | `/api/orders/:id/status` | admin | change status |
| GET | `/api/admin/stats` | admin | dashboard numbers |
| GET | `/api/admin/users` | admin | customers |

Send the token like this: `Authorization: Bearer <token>`.

---

## 7. Key ideas explained (for beginners)

1. **Password safety.** `models/User.js` hashes passwords with bcrypt *before* saving. The database never contains the real password, and `select: false` hides the hash from normal queries.
2. **JWT login.** After login the server signs a token containing the user id. The browser stores it and sends it with every request. `middleware/auth.js → protect` verifies it; `adminOnly` checks `role === 'admin'`.
3. **Never trust the browser.** The role is always `customer` on registration; order prices and stock come from the database, not from the request; every rule is validated again on the server (`express-validator`).
4. **Guest cart.** Visitors keep a cart in `localStorage`. On login, `Cart.mergeGuest()` moves it into the database cart.
5. **Stock safety.** When ordering, stock is reduced with an atomic update (`stock >= quantity`), and restored if the order is cancelled.
6. **Error handling.** `asyncHandler` forwards errors to `middleware/error.js`, which always answers with clean JSON `{ message }`.
7. **XSS protection.** All user/database text is passed through `esc()` before it goes into HTML.
8. **Dark mode.** The `dark` class on `<html>` switches Tailwind `dark:` styles; the choice is saved in `localStorage`.

---

## 8. Important notes and next steps

- **Payments are a demo.** Card and PayPal options only record the choice; **no money is taken and no card number is collected** (never store card data yourself). For real payments, integrate Stripe Checkout or PayPal on the server, then set `isPaid` from their webhook.
- **Security checklist before going live:** strong `JWT_SECRET`, change the seeded admin password, HTTPS, rate limiting on login (`express-rate-limit`), restrict CORS to your domain, regular backups.
- **Ideas to extend:** product reviews, wishlist, image upload (S3), email confirmations, coupon codes, password reset, automated tests.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `Missing JWT_SECRET or MONGO_URI` | You did not create `backend/.env` (copy `.env.example`). |
| `MongoDB connection error` | MongoDB is not running, or `MONGO_URI` is wrong / Atlas IP not allowed. |
| Page shows "Cannot reach the server" | Open the site through `http://localhost:5000`, not by double-clicking the HTML file. |
| Empty shop | Run `npm run seed`. |
| Images missing | Sample images load from Unsplash and need internet access. |
