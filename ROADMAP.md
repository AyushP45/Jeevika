# Jeevika - Implementation Roadmap

This plan outlines the steps required to transition from the current MVP to a production-ready platform.

## Phase 1: MVP Stabilization & Polish (Current Priority)
*Focus: Ensuring the hackathon demo is flawless and core flows are secure.*

- [ ] **Realize Escrow Logic**: Replace mock toasts with actual backend calls to the Wallet API.
  - Implement `lockFunds` when a contract starts.
  - Implement `releaseFunds` when a contract is marked complete.
- [ ] **Worker Verification Flow**: Add a "Verify Profile" section for workers to upload ID documents (simulated or real).
- [ ] **Job Bidding UI**: Enhance the `JobDetailsPage` to allow workers to "Express Interest" or "Bid" with a custom price.
- [ ] **Admin Moderation Tools**: Complete the `AdminPage` to allow banning users or removing suspicious job posts.
- [ ] **PWA Finalization**: Ensure the manifest and service workers are correctly caching the dashboard for offline use.

## Phase 2: Advanced Features & Trust
*Focus: Adding layers of reliability and user retention.*

- [ ] **Review & Rating System**: Implement post-job reviews for both workers and employers.
- [ ] **Dispute Resolution**: Create a flow where employers can "Flag" a job if the work isn't done, pausing the escrow release.
- [ ] **Skill Badges**: Implement an automated badge system (e.g., "Top Rated", "Reliable", "Verified Expert").
- [ ] **Interactive Maps Enhancement**: Show "Workers Nearby" on the landing page map to demonstrate platform activity.
- [ ] **Multilingual Support**: Add Hindi and local language support to make it accessible to the primary target demographic.

## Phase 3: Scaling & Production
*Focus: Moving from a local environment to the cloud.*

- [ ] **Cloud Deployment**: Deploy the frontend to Vercel/Netlify and the backend to Render/AWS.
- [ ] **Image Storage**: Integrate Cloudinary or AWS S3 for profile pictures and job site photos.
- [ ] **Analytics Dashboard**: Add a "Platform Health" dashboard for admins (total transactions, active users, job completion rate).
- [ ] **Security Hardening**: Implement Rate Limiting, CORS policies, and deeper JWT validation.
- [ ] **Integration with Payment Gateways**: Connect Razorpay or Stripe to allow users to "Add Funds" to their digital wallet via UPI/Cards.

---

## 📅 Hackathon Demo Strategy
1. **The Discovery**: Show an employer finding a worker on the map.
2. **The Connection**: Open a real-time chat between them.
3. **The Commitment**: Employer locks funds in escrow.
4. **The Completion**: Worker finishes the job, employer releases funds, and both see the wallet balance update instantly.
