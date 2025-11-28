# Lawnr — Spec v0.3 Skeleton

```text

lawnr/                ← root folder

  ├── backend/        ← backend server code

  │     ├── app/           ← application code / modules

  │     │     ├── models/      ← database models / ORM schema files

  │     │     ├── controllers/ ← request handlers / business logic

  │     │     ├── routes/      ← API route definitions

  │     │     ├── services/    ← payment integration, media upload, notifications, scheduling, etc.

  │     │     ├── utils/       ← helper modules, validation, auth, etc.

  │     ├── config/       ← config (env, payment keys, DB, feature flags)

  │     ├── migrations/   ← DB migration scripts

  │     ├── scripts/      ← background jobs / cron / maintenance scripts

  │     └── server.js (or main.ts / app entry)

  ├── mobile/         ← mobile front-end (cross-platform)

  │     ├── src/            ← source code

  │     │     ├── screens/       ← UI screens (homeowner & contractor flows)

  │     │     ├── components/    ← reusable UI components (maps, media upload, lists, forms)

  │     │     ├── navigation/    ← routing / navigation logic

  │     │     ├── services/      ← API clients, auth, state management, storage, push notifications

  │     │     ├── assets/        ← icons, images, styles, branding assets (colors, fonts)

  │     ├── App entry point (App.js / main.dart)

  │     └── build/ / config files

  ├── admin_dashboard/ ← optional — web UI for platform operators

  │     ├── src/ … (similar structure to mobile / web app)

  ├── docs/           ← specification docs (md), design docs, business docs, legal docs templates

  │     ├── spec_v0.3.md  ← this doc + any expanded docs

  │     ├── api_spec.md

  │     ├── db_schema.sql

  │     ├── design_guidelines.md

  │     ├── legal_templates/ …

  └── README.md

```

---

## 📄 Database Schema (SQL / ORM-style)

Here's a simplified SQL-style schema for key tables. (You can expand / adapt to your SQL dialect or ORM of choice.)

```sql

-- USERS

CREATE TABLE users (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  role VARCHAR(20) NOT NULL CHECK (role IN ('homeowner','contractor','admin')),

  email VARCHAR(255) UNIQUE NOT NULL,

  password_hash VARCHAR(255) NOT NULL,

  full_name VARCHAR(255) NOT NULL,

  phone_number VARCHAR(50),

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- CONTRACTOR_PROFILES

CREATE TABLE contractor_profiles (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  business_name VARCHAR(255) NOT NULL,

  business_logo_url TEXT,

  description TEXT,

  service_area_geom GEOGRAPHY,    -- polygon or circle/radius

  service_types TEXT[],            -- e.g. ['mowing','hedge_trimming','cleanup']

  base_rate_per_hour NUMERIC(10,2),

  per_service_rate JSONB,

  availability JSONB,

  is_verified BOOLEAN DEFAULT FALSE,

  premium_listing VARCHAR(20) DEFAULT 'none' CHECK (premium_listing IN ('none','boosted','featured')),

  rating_avg NUMERIC(3,2) DEFAULT NULL,

  rating_count INTEGER DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- PROPERTIES

CREATE TABLE properties (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  address_line1 VARCHAR(255),

  address_line2 VARCHAR(255),

  city VARCHAR(100),

  province VARCHAR(100),

  postal_code VARCHAR(20),

  country VARCHAR(100),

  geo_location GEOGRAPHY,          -- lat/lon point

  yard_size_estimate VARCHAR(20),

  yard_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- PROPERTY_MEDIA

CREATE TABLE property_media (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  media_type VARCHAR(10) CHECK (media_type IN ('photo','video')),

  media_url TEXT NOT NULL,

  uploaded_at TIMESTAMP NOT NULL DEFAULT now()

);



-- SERVICE_REQUESTS

CREATE TABLE service_requests (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  homeowner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  requested_services TEXT[] NOT NULL,  -- list of service type enums

  schedule_preference VARCHAR(20) NOT NULL CHECK (schedule_preference IN ('ASAP','scheduled')),

  preferred_date DATE,

  preferred_time_from TIME,

  preferred_time_to TIME,

  notes TEXT,

  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','quoted','accepted','scheduled','cancelled','expired')),

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- QUOTES

CREATE TABLE quotes (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,

  contractor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  quoted_price NUMERIC(10,2) NOT NULL,

  breakdown JSONB,

  valid_until TIMESTAMP NOT NULL,

  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','accepted','rejected','expired')),

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- JOBS

CREATE TABLE jobs (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,

  contractor_id UUID NOT NULL REFERENCES users(id),

  property_id UUID NOT NULL REFERENCES properties(id),

  scheduled_date DATE NOT NULL,

  scheduled_time_from TIME,

  scheduled_time_to TIME,

  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled','on_way','started','completed','cancelled')),

  actual_start TIMESTAMP,

  actual_end TIMESTAMP,

  before_media JSONB,

  after_media JSONB,

  cost_log JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- INVOICES

CREATE TABLE invoices (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  homeowner_id UUID NOT NULL REFERENCES users(id),

  contractor_id UUID NOT NULL REFERENCES users(id),

  amount_total NUMERIC(10,2) NOT NULL,

  platform_commission NUMERIC(10,2) NOT NULL,

  contractor_payout NUMERIC(10,2) NOT NULL,

  payment_method VARCHAR(20),

  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending','paid','failed','refunded')),

  issued_at TIMESTAMP NOT NULL DEFAULT now(),

  paid_at TIMESTAMP,

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- REVIEWS

CREATE TABLE reviews (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

  homeowner_id UUID NOT NULL REFERENCES users(id),

  contractor_id UUID NOT NULL REFERENCES users(id),

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),

  review_text TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now()

);



-- SUBSCRIPTIONS (Recurring Jobs)

CREATE TABLE subscriptions (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  homeowner_id UUID NOT NULL REFERENCES users(id),

  contractor_id UUID NOT NULL REFERENCES users(id),

  property_id UUID NOT NULL REFERENCES properties(id),

  service_types TEXT[] NOT NULL,

  frequency VARCHAR(20) NOT NULL,  -- 'weekly','biweekly','monthly','seasonal','custom'

  next_scheduled_date DATE NOT NULL,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- NOTIFICATIONS

CREATE TABLE notifications (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id),

  job_id UUID,

  type VARCHAR(30) NOT NULL,

  payload JSONB,

  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','sent','read')),

  scheduled_for TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);



-- SUPPORT_TICKETS / DISPUTES (optional)

CREATE TABLE disputes (

  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_id UUID NOT NULL REFERENCES jobs(id),

  homeowner_id UUID NOT NULL REFERENCES users(id),

  contractor_id UUID NOT NULL REFERENCES users(id),

  issue_type VARCHAR(30),

  description TEXT,

  status VARCHAR(20) NOT NULL CHECK (status IN ('open','in_review','resolved','rejected')),

  resolution_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now(),

  updated_at TIMESTAMP NOT NULL DEFAULT now()

);

```

> This schema covers the core entities and relationships needed for Lawnr: users, contractors, properties, requests, quotes, jobs, payments/invoices, reviews, subscriptions, notifications, and optional support/dispute tracking.

---

## 🔗 API Spec — Example Endpoints & JSON Shapes

Below are representative API endpoints for core functionality. (Auth handled via JWT; assume `Authorization: Bearer <token>` header.)

### Auth & User

#### `POST /auth/register`

```json

{

  "email": "alice@example.com",

  "password": "password123",

  "full_name": "Alice Doe",

  "phone_number": "+1-555-0123",

  "role": "homeowner"   // or "contractor"

}

```

Response (on success):

```json

{

  "user": { "id": "...", "role": "homeowner", "email": "...", "full_name": "Alice Doe" },

  "token": "<JWT token>"

}

```

#### `POST /auth/login`

```json

{

  "email": "alice@example.com",

  "password": "password123"

}

```

Response: user info + token.

#### `GET /user/me`

Response: user profile (id, name, role, contact info, if contractor then profile info)

---

### Contractor Profile & Listing

#### `POST /contractors/profile`

```json

{

  "business_name": "GreenBlade Lawn Care",

  "description": "Mowing, trimming, cleanup",

  "service_types": ["mowing","cleanup"],

  "service_area": { "center": { "lat": 43.7, "lon": -79.4 }, "radius_km": 20 },

  "base_rate_per_hour": 45.00,

  "per_service_rate": { "mowing_small": 60.00, "cleanup_standard": 120.00 },

  "availability": {

     "mon": ["08:00-17:00"],

     "tue": ["08:00-17:00"],

     "...": []

  }

}

```

Response: contractor profile created

#### `GET /contractors`  (search / listing)

Query parameters (optional): `service_types[]=mowing`, `lat`, `lon`, `radius_km`, `min_rating`, `premium_only`

Response: list of contractor profiles + metadata (distance, rating, premium status)

---

### Property (Homeowner)

#### `POST /properties`

```json

{

  "address": { "line1": "...", "city": "Cityname", "province": "Province", "postal_code": "A1B2C3", "country": "Canada" },

  "geo_location": { "lat": 43.7, "lon": -79.4 },

  "yard_size_estimate": "medium",

  "yard_notes": "Gate code 1234"

}

```

#### `POST /properties/:id/media`

Upload photos/videos (multipart/form-data) — returns media URLs

---

### Service Request → Quote → Job Flow

#### `POST /requests`  (create service request)

```json

{

  "property_id": "...",

  "requested_services": ["mowing","hedge_trimming"],

  "schedule_preference": "ASAP",

  "notes": "Please also trim front hedges.",

  "media_urls": [ "https://cdn.example.com/media/xyz.jpg" ]

}

```

#### `GET /requests/available`  (contractor side)

Return list of pending requests within contractor's area & matching service types

#### `POST /requests/:id/quote`

```json

{

  "quoted_price": 110.00,

  "breakdown": { "hours": 2, "materials": 0, "extras": 0 }

}

```

#### `POST /requests/:id/accept-quote`  (homeowner accepts)

→ returns job scheduled confirmation, triggers payment flow

---

### Jobs & Payment

#### `GET /jobs`  — list jobs (homeowner or contractor)

#### `POST /jobs/:id/on_way`

Marks contractor as en route, maybe triggers push to homeowner

#### `POST /jobs/:id/start`

Marks job started (logs actual_start timestamp)

#### `POST /jobs/:id/complete`

```json

{

  "after_media_urls": [ "https://cdn.example.com/media/after1.jpg" ],

  "cost_log": { "fuel": 5.75, "materials": 0, "hours": 2 }

}

```

This triggers invoice creation

#### `POST /payments`  (homeowner pays)

```json

{

  "job_id": "...",

  "payment_method": "card",

  "payment_token": "tok_abc123"

}

```

Payment processor webhook updates payment status → then contractor payout after commission cut

---

### Reviews

#### `POST /jobs/:id/review`

```json

{

  "rating": 5,

  "review_text": "Great job, yard looks amazing!"

}

```

---

(The pattern continues similarly for subscriptions, recurring plans, notifications, admin endpoints, etc.)

---

## 🧰 Tech Stack & Key Integrations

Based on previous research and best practices for on-demand home services apps / gig-economy platforms:

* **Frontend / Mobile:** cross-platform framework (e.g. Flutter) — for iOS + Android with a unified codebase. This simplifies maintenance and speeds up development. This approach is widely used for marketplace / on-demand apps. ([IT Path Solutions][1])

* **Backend:** Node.js + Express (or NestJS) + PostgreSQL (or similar relational DB) — good balance of performance, flexibility, structured data handling (users, jobs, payments, scheduling). Many on-demand home services apps use this architecture. ([IT Path Solutions][1])

* **Media Storage & CDN:** Store photos/videos (property media, before/after, portfolio) in object storage (e.g. AWS S3 or equivalent), with CDN for delivery — needed for performance, especially with rich-media uploads & galleries (common for lawn/yard care apps) ([WebCodeGenie][2])

* **Payment Processing:** Integrate a payment gateway (supports Canadian payments, cards) — card + possibly local payment methods (depending on region) — secure transaction + payout flow. On-demand home service apps typically integrate payments + commission / payout handling. ([https://oyelabs.com][3])

* **Geolocation & Maps + Route / Dispatch Support:** Use open or licensed map/geolocation solution (e.g. OpenStreetMap + map UI), to support search by area, service-provider mapping, map-based listing & route planning — essential for lawn-care / field-service apps. Real-time data syncing, route optimization, offline support for field workers are recognized features in good lawn-care apps. ([RealGreen Blog][4])

* **Notifications / Push / Reminders:** Use push notification service + scheduling (backend job queue) to send reminders, status updates, ETA / arrival, job completion, payment notifications, recurring-job alerts, etc. Push / notification is considered essential for on-demand service apps. ([Arka Softwares][5])

* **Background / Verification / Rating & Trust System:** As with many on-demand marketplace apps, building in contractor verification, reviews & ratings, and trust mechanisms is critical for user safety and platform reputation. ([https://oyelabs.com][6])

---

## 📌 Additional Notes & Implementation Considerations

* **Use "service_types" as flexible JSON / enum list** — so you can easily add more services in future (e.g. snow removal, pressure-washing, gutter cleaning) without major schema refactor.

* **Cost logging & profit calculation for contractors** — store cost log per job (fuel, labor hours, materials) so contractors can see real profit, not just gross pay — useful for long-term contractor retention and transparency.

* **Media / Gallery & Proof-of-Work** — before/after photos (or short video) should be mandatory for certain job types (e.g. cleanup, landscaping, pressure-washing) — helps avoid disputes, improves trust.

* **Recurring / Subscription maintenance support** — important for steady revenue and predictable scheduling (especially for lawn-care in seasonal climates). Schema includes a "subscriptions" table to manage this.

* **Admin / Platform-level controls & configuration** — commission rate, premium listing pricing, fee changes, dispute resolution, ability to suspend/verify contractors, manage promotions or discounts.

* **Scalability & future-proofing** — design architecture modularly so you can add new service categories / verticals (e.g. pressure washing, snow removal, gutter cleaning) without redesigning core data model.

* **Localization / Region-specific configuration (for Canada / different provinces)** — allow storing address components with structure, support localization (currency, taxes, payment methods), and configuration per region (feature flags, seasonal services).

---

## ✅ What This Gives You Right Now

With this v0.3 skeleton, you have:

* A **project folder layout template** to start coding (or hand off to developers)

* A **database schema** covering all core entities & relationships needed for a full-fledged lawn-care marketplace + operations app

* A **rough but concrete API spec** (endpoints + JSON shapes + flow) for core functionality (auth, profile, listing, booking, jobs, payments, reviews) — good for backend + frontend integration

* A **tech stack recommendation & integration plan** — chosen for scalability, cross-platform support, real-world requirements (media, maps, payments, notifications)

* Notes & constraints to guide implementation, keep schema flexible, and support growth / future features

---

If you want — in the next step I can also **sketch a minimal ER-diagram** (entity-relationship diagram) **and a high-level sequence diagram** (for a typical job flow: request → quote → accept → job → payment → review), as ASCII-art or textual — to help visualize data relationships and flow before coding.

Do you want me to generate those diagrams now?

[1]: https://www.itpathsolutions.com/build-an-app-like-taskrabbit?utm_source=chatgpt.com "Build An App Like TaskRabbit: Cost, Steps, And ..."

[2]: https://webcodegenie.com/blog/on-demand-lawn-mowing-app/?utm_source=chatgpt.com "Creating an On-Demand Lawn Mowing App: A Step-by- ..."

[3]: https://oyelabs.com/build-lawn-care-app/?utm_source=chatgpt.com "Build an On-demand Lawn Care Service App like Plowz & ..."

[4]: https://blog.realgreen.com/the-best-lawn-care-routing-software-to-service-more-customers/?utm_source=chatgpt.com "The Best Lawn Care Routing Software to Service More ..."

[5]: https://www.arkasoftwares.com/blog/on-demand-business-model-app-best-bet-for-startups/?utm_source=chatgpt.com "How to Develop an On-Demand Mobile App? A Complete ..."

[6]: https://oyelabs.com/on-demand-home-services-marketplace-apps-in-usa/?utm_source=chatgpt.com "Booming On-Demand Home Services Marketplace Apps in ..."

