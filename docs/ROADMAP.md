# Lawnr Development Roadmap

This roadmap follows the specifications outlined in the Lawnr spec documents (v0.1, v0.2, v0.3) and organizes development into phases with specific, actionable tasks.

## Current Status

✅ **Completed:**
- Project structure (backend, mobile, admin_dashboard)
- Database schema and migrations
- Backend API foundation (auth, models, routes)
- Basic mobile app structure (Flutter)
- Authentication system (JWT)
- Core API endpoints (properties, contractors, requests, jobs, payments, reviews)

## Phase 1: MVP Completion (Weeks 1-12)

### 1.1 Backend Enhancements

#### Media Upload & Storage
- [ ] Set up AWS S3 (or equivalent) integration
- [ ] Create media upload service (`backend/app/services/media.service.js`)
- [ ] Implement property media upload endpoint (`POST /api/properties/:id/media`)
- [ ] Implement job before/after media upload
- [ ] Add media compression and optimization
- [ ] Set up CDN for media delivery
- [ ] Add media size limits and validation

#### Notifications System
- [ ] Create notification service (`backend/app/services/notification.service.js`)
- [ ] Implement notification model and database operations
- [ ] Set up Firebase Cloud Messaging (FCM) or equivalent
- [ ] Create notification scheduling system
- [ ] Implement notification triggers:
  - [ ] 24h job reminder
  - [ ] 1h job reminder
  - [ ] Job status updates (on_way, started, completed)
  - [ ] New quote received
  - [ ] Quote accepted/rejected
  - [ ] Payment received/due
- [ ] Create notification API endpoints (`GET /api/notifications`, `PUT /api/notifications/:id/read`)

#### Quote Expiration & Business Logic
- [ ] Implement quote expiration check (cron job)
- [ ] Auto-expire quotes after 48 hours
- [ ] Add quote re-submission logic
- [ ] Implement conflict/double booking prevention
- [ ] Add job cancellation policy logic
- [ ] Create cancellation fee calculation

#### Payment Enhancements
- [ ] Complete Stripe integration (webhooks, payout logic)
- [ ] Implement escrow/hold payment until job completion
- [ ] Add dispute window logic (e.g., 48h hold after completion)
- [ ] Implement contractor payout automation
- [ ] Add payment failure handling and retry logic
- [ ] Create refund processing
- [ ] Add commission calculation (configurable %)

#### Request Media Support
- [ ] Add request media table/model
- [ ] Implement request media upload endpoint
- [ ] Link media to service requests for contractor viewing

### 1.2 Mobile App - Homeowner Screens

#### Property Management
- [ ] Create `AddPropertyScreen` with address form
- [ ] Add geocoding integration (convert address to lat/lon)
- [ ] Implement property media upload (photos/video yard tour)
- [ ] Create `PropertyDetailScreen` with map view
- [ ] Add property edit/delete functionality
- [ ] Implement property list view

#### Service Request Flow
- [ ] Create `ServiceRequestScreen`:
  - [ ] Service type selection (mowing, trimming, cleanup, etc.)
  - [ ] Schedule preference (ASAP vs scheduled date/time)
  - [ ] Notes/special instructions input
  - [ ] Media upload (photos/video)
- [ ] Create `QuoteReviewScreen`:
  - [ ] Display all quotes for a request
  - [ ] Show contractor info, rating, price
  - [ ] Accept quote functionality
- [ ] Create `BookingConfirmationScreen`:
  - [ ] Show scheduled date/time
  - [ ] Contractor details
  - [ ] Payment/deposit screen

#### Job Tracking
- [ ] Create `JobStatusScreen`:
  - [ ] Real-time job status updates
  - [ ] Map view (optional - show contractor location if enabled)
  - [ ] Contact contractor button
  - [ ] Special instructions display
- [ ] Implement job status notifications
- [ ] Add "on the way" and "arrival ETA" display

#### Payment & Review
- [ ] Create `PaymentScreen`:
  - [ ] Secure payment input
  - [ ] Card tokenization
  - [ ] Save payment method option
- [ ] Create `BeforeAfterGalleryScreen`:
  - [ ] Display contractor-uploaded photos
  - [ ] Before/after comparison view
- [ ] Create `ReviewScreen`:
  - [ ] Star rating input
  - [ ] Review text input
  - [ ] Submit review functionality

#### Dashboard
- [ ] Enhance `HomeScreen`:
  - [ ] List of properties
  - [ ] Upcoming jobs list
  - [ ] Past jobs history
  - [ ] Quick "Request Service" button
  - [ ] Navigation to all features

### 1.3 Mobile App - Contractor Screens

#### Profile Setup
- [ ] Create `ContractorProfileSetupScreen`:
  - [ ] Business name, logo upload
  - [ ] Description/description editor
  - [ ] Service types selection
  - [ ] Service area map (draw radius or polygon)
  - [ ] Base rates and per-service pricing
  - [ ] Availability calendar
  - [ ] Portfolio upload (past work photos)
- [ ] Create `ProfileEditScreen` for updates

#### Incoming Requests
- [ ] Create `IncomingRequestsScreen`:
  - [ ] List of available service requests
  - [ ] Filter by service type, distance
  - [ ] View property media and details
  - [ ] Quick bid/quote button
- [ ] Create `QuoteSubmissionScreen`:
  - [ ] Price input
  - [ ] Breakdown (hours, materials, extras)
  - [ ] Submit quote

#### Job Management
- [ ] Create `ContractorJobsScreen`:
  - [ ] Calendar view of scheduled jobs
  - [ ] List view with status
  - [ ] Filter by status, date
- [ ] Create `JobWorkflowScreen`:
  - [ ] "On the way" button
  - [ ] "Start job" button
  - [ ] "Complete job" with:
    - [ ] After photos upload
    - [ ] Cost log (materials, fuel, hours)
    - [ ] Submit completion
- [ ] Create `RoutePlannerScreen`:
  - [ ] Map view with job locations
  - [ ] Route optimization (if multiple jobs)
  - [ ] Navigation integration

#### Dashboard
- [ ] Enhance `ContractorHomeScreen`:
  - [ ] Upcoming jobs overview
  - [ ] Pending quotes/requests count
  - [ ] Earnings summary
  - [ ] Quick actions

### 1.4 Shared Components

#### Map & Geolocation
- [ ] Create `MapView` component:
  - [ ] Google Maps or OpenStreetMap integration
  - [ ] Custom map pins (lawnmower/grass icons)
  - [ ] Contractor location markers
  - [ ] Job location markers
  - [ ] Route display
- [ ] Create `LocationPicker` component
- [ ] Implement geocoding service

#### Media Components
- [ ] Create `MediaUploadWidget`:
  - [ ] Photo picker
  - [ ] Video picker
  - [ ] Image compression
  - [ ] Upload progress indicator
- [ ] Create `MediaGalleryWidget`:
  - [ ] Photo/video gallery
  - [ ] Slideshow view
  - [ ] Before/after comparison view

#### Forms & Inputs
- [ ] Create reusable form components:
  - [ ] Address input with autocomplete
  - [ ] Date/time picker
  - [ ] Service type selector
  - [ ] Rating input (stars)
- [ ] Add form validation

#### Lists & Cards
- [ ] Create `ContractorCard` component
- [ ] Create `JobCard` component
- [ ] Create `RequestCard` component
- [ ] Add pull-to-refresh functionality

#### Notifications
- [ ] Create `NotificationCenter` screen
- [ ] Implement push notification handling
- [ ] Add in-app notification badges
- [ ] Create notification list item component

### 1.5 Testing & Quality Assurance

- [ ] Write unit tests for backend models
- [ ] Write integration tests for API endpoints
- [ ] Write unit tests for Flutter services
- [ ] Write widget tests for key screens
- [ ] Set up CI/CD pipeline
- [ ] Add error logging and monitoring
- [ ] Performance testing

### 1.6 Documentation

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Mobile app setup guide
- [ ] Deployment guide
- [ ] Developer onboarding docs

---

## Phase 2: Enhanced Features (Weeks 13-20)

### 2.1 Recurring Maintenance / Subscriptions

#### Backend
- [ ] Create subscription service
- [ ] Implement subscription CRUD endpoints
- [ ] Create scheduler job for auto-generating requests
- [ ] Add subscription management logic
- [ ] Implement skip/reschedule/cancel functionality

#### Mobile
- [ ] Create `SubscriptionScreen` for homeowners
- [ ] Create subscription setup flow
- [ ] Add subscription management (edit, cancel)
- [ ] Create recurring jobs view for contractors
- [ ] Add subscription renewal notifications

### 2.2 Enhanced Contractor Features

#### Expense & Cost Tracking
- [ ] Create expense logging model
- [ ] Implement expense tracking per job
- [ ] Create `ExpenseLogScreen`:
  - [ ] Materials input
  - [ ] Fuel cost input
  - [ ] Labor hours input
  - [ ] Other expenses
- [ ] Add expense history view

#### Analytics Dashboard
- [ ] Create `AnalyticsScreen`:
  - [ ] Per-job revenue vs cost
  - [ ] Profit calculation
  - [ ] Monthly/weekly summaries
  - [ ] Client list
  - [ ] Repeat customers
  - [ ] Route/fuel efficiency metrics
- [ ] Add data export (CSV) functionality
- [ ] Create charts and visualizations

#### Contractor Branding
- [ ] Enhance contractor profile with:
  - [ ] Logo upload and display
  - [ ] Custom tagline
  - [ ] Portfolio gallery
  - [ ] Verified badge display
- [ ] Create contractor public profile view

### 2.3 Map & Geolocation Enhancements

- [ ] Implement full map-based search
- [ ] Add contractor clustering on map
- [ ] Implement distance-based filtering
- [ ] Add "near me" search functionality
- [ ] Create route optimization algorithm
- [ ] Add offline map support for contractors

### 2.4 Media Enhancements

- [ ] Implement video upload and playback
- [ ] Add media compression for videos
- [ ] Create media gallery with filters
- [ ] Add before/after photo comparison tool
- [ ] Implement media sharing functionality

### 2.5 Premium Listing / Boost

#### Backend
- [ ] Create boost subscription model
- [ ] Implement boost payment processing
- [ ] Add boost status to contractor search ranking
- [ ] Create boost management endpoints

#### Mobile
- [ ] Create `BoostSubscriptionScreen`
- [ ] Add boost status display
- [ ] Implement boost purchase flow
- [ ] Add "Featured" badges to boosted contractors

---

## Phase 3: Monetization & Growth Infrastructure (Weeks 21-28)

### 3.1 Admin Dashboard

#### Web Application Setup
- [ ] Set up admin dashboard project (React/Next.js or Flutter Web)
- [ ] Create admin authentication
- [ ] Design admin UI layout

#### Contractor Management
- [ ] Create contractor list view with filters
- [ ] Implement contractor verification workflow
- [ ] Add suspend/remove contractor functionality
- [ ] Create contractor detail view
- [ ] Add verification document review

#### Job & Transaction Management
- [ ] Create job overview dashboard
- [ ] Implement job filtering and search
- [ ] Add payment/commission tracking
- [ ] Create payout management interface
- [ ] Implement dispute handling workflow

#### Analytics & Reporting
- [ ] Create analytics dashboard:
  - [ ] Active users (homeowners, contractors)
  - [ ] Job volume (per region, date)
  - [ ] Revenue tracking
  - [ ] Seasonal trends
  - [ ] Popular services
  - [ ] Average order value
  - [ ] Contractor earnings
  - [ ] Churn rate
  - [ ] Repeat rate
- [ ] Add export functionality (CSV, PDF)
- [ ] Create custom report builder

#### Platform Settings
- [ ] Create settings management interface:
  - [ ] Commission rate configuration
  - [ ] Subscription/boost pricing
  - [ ] Feature flags
  - [ ] Payment processor settings
  - [ ] Notification templates
  - [ ] Regional settings

### 3.2 Support & Dispute Resolution

#### Backend
- [ ] Enhance dispute model and endpoints
- [ ] Create support ticket system
- [ ] Implement dispute resolution workflow
- [ ] Add admin mediation tools

#### Mobile
- [ ] Create `SupportScreen` for users
- [ ] Create `DisputeScreen` for homeowners
- [ ] Add dispute submission flow
- [ ] Implement support chat/messaging

### 3.3 Marketing & Growth Features

- [ ] Implement referral system
- [ ] Create promotion/discount codes
- [ ] Add contractor onboarding incentives
- [ ] Implement email marketing integration
- [ ] Create promotional campaigns system

### 3.4 Enhanced Notifications

- [ ] Implement SMS notifications (Twilio)
- [ ] Add email notifications
- [ ] Create notification preferences
- [ ] Implement notification scheduling system
- [ ] Add rich push notifications

---

## Phase 4: Service Expansion & Verticalization (Weeks 29-36)

### 4.1 Multi-Service Support

#### Backend
- [ ] Extend service types model
- [ ] Add service categories (lawn care, pressure washing, snow removal, etc.)
- [ ] Create service-specific pricing models
- [ ] Implement seasonal service flags

#### Mobile
- [ ] Update service type selection to support all services
- [ ] Add service-specific request forms
- [ ] Create service category browsing
- [ ] Add seasonal service promotions

### 4.2 Pressure Washing (Floosh Foundation)

- [ ] Create pressure washing specific features
- [ ] Add pressure washing service types
- [ ] Implement pressure washing pricing models
- [ ] Create specialized contractor profiles

### 4.3 Snow Removal

- [ ] Add snow removal service type
- [ ] Implement weather-based scheduling
- [ ] Create snow removal specific workflows
- [ ] Add seasonal availability management

### 4.4 Additional Services

- [ ] Gutter cleaning
- [ ] Landscaping
- [ ] Garden maintenance
- [ ] General home services

### 4.5 Multi-Service Contractor Support

- [ ] Allow contractors to offer multiple service categories
- [ ] Create service-specific availability
- [ ] Implement service-specific pricing
- [ ] Add service portfolio management

---

## Phase 5: Long-Term Optimization & Scaling (Weeks 37+)

### 5.1 Advanced Route Optimization

- [ ] Implement multi-crew route optimization
- [ ] Add real-time traffic integration
- [ ] Create dynamic route adjustment
- [ ] Add fuel cost optimization

### 5.2 Dynamic Pricing

- [ ] Implement surge pricing logic
- [ ] Add demand-based pricing
- [ ] Create seasonal pricing adjustments
- [ ] Add contractor pricing suggestions

### 5.3 Advanced Analytics

- [ ] Create predictive analytics
- [ ] Implement demand forecasting
- [ ] Add contractor performance scoring
- [ ] Create market insights dashboard

### 5.4 B2B Integrations

- [ ] Equipment supplier partnerships
- [ ] Material supply chain integration
- [ ] Equipment rental integration
- [ ] Create partner API

### 5.5 Performance & Scalability

- [ ] Database optimization and indexing
- [ ] Implement caching (Redis)
- [ ] Add CDN optimization
- [ ] Load testing and optimization
- [ ] Implement horizontal scaling

### 5.6 Security & Compliance

- [ ] Implement comprehensive security audit
- [ ] Add data encryption at rest
- [ ] Implement audit logging
- [ ] Add compliance reporting (PIPEDA)
- [ ] Create data retention policies

### 5.7 Internationalization

- [ ] Multi-language support
- [ ] Multi-currency support
- [ ] Regional payment methods
- [ ] Localized content

---

## Ongoing Tasks (All Phases)

### Testing
- [ ] Continuous unit testing
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] User acceptance testing

### Documentation
- [ ] Keep API docs updated
- [ ] Update user guides
- [ ] Maintain developer docs
- [ ] Create video tutorials

### Monitoring & Maintenance
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics
- [ ] Regular security updates

### Legal & Compliance
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Contractor Agreement template
- [ ] Service Contract template
- [ ] Liability disclaimers
- [ ] Data protection policy

---

## Success Metrics

### Phase 1 (MVP)
- [ ] 100+ registered users
- [ ] 20+ active contractors
- [ ] 50+ completed jobs
- [ ] 90%+ payment success rate
- [ ] <2s API response time

### Phase 2 (Enhanced)
- [ ] 500+ registered users
- [ ] 50+ active contractors
- [ ] 200+ completed jobs
- [ ] 30%+ subscription adoption
- [ ] 4.5+ average contractor rating

### Phase 3 (Monetization)
- [ ] 2000+ registered users
- [ ] 100+ active contractors
- [ ] 1000+ completed jobs
- [ ] Positive revenue
- [ ] <5% dispute rate

### Phase 4 (Expansion)
- [ ] 5000+ registered users
- [ ] 200+ active contractors
- [ ] 5000+ completed jobs
- [ ] Multiple service categories active
- [ ] Regional expansion

### Phase 5 (Scale)
- [ ] 10,000+ registered users
- [ ] 500+ active contractors
- [ ] 20,000+ completed jobs
- [ ] Profitable operations
- [ ] Multi-region presence

---

## Notes

- This roadmap is based on the specifications in `docs/specs/`
- Priorities may shift based on user feedback and market needs
- Each phase should be validated with users before moving to the next
- Regular reviews and adjustments should be made monthly
- Focus on MVP completion first before moving to enhanced features

