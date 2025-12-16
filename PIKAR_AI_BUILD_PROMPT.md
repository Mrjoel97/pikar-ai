# Build Pikar AI: Complete Application Specification

## Project Overview
Build a comprehensive AI-powered business automation platform called **Pikar AI** that provides workflow automation, AI agent deployment, analytics, and business intelligence across four distinct tiers: Solopreneur, Startup, SME, and Enterprise.

## Tech Stack Requirements
- **Frontend**: React 19, TypeScript, Vite, React Router v7
- **Styling**: Tailwind v4, Shadcn UI components
- **Backend**: Convex (serverless backend & real-time database)
- **Authentication**: Convex Auth with Google OAuth and email OTP
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Package Manager**: pnpm

## Core Features by Tier

### Solopreneur Tier ($99/mo)
- **Dashboard**: Personal productivity hub with quick actions
- **AI Agents**: 3 essential agents (Content Creator, Marketing Assistant, Productivity Coach)
- **Workflows**: Basic automation templates
- **Analytics**: Simple KPI tracking and social media performance
- **Features**:
  - Brain Dump (voice notes & text capture)
  - Initiative Journey tracker (6 phases: Discovery → Sustainability)
  - Content Calendar widget
  - Email campaign analytics
  - Customer segmentation (basic)
  - Invoice generation
  - Schedule assistant

### Startup Tier ($297/mo)
- **Dashboard**: Team collaboration hub
- **AI Agents**: 10 agents with team coordination
- **Workflows**: Advanced automation with assignments
- **Analytics**: Growth metrics, A/B testing, customer journey mapping
- **Features**:
  - All Solopreneur features
  - Team chat with department channels
  - CRM integration sync
  - Revenue attribution tracking
  - Workflow assignments
  - Team performance metrics
  - Collaboration feed
  - Goal tracking (OKRs)

### SME Tier ($597/mo)
- **Dashboard**: Multi-department orchestration
- **AI Agents**: Unlimited with custom configurations
- **Workflows**: Cross-department handoffs with SLA tracking
- **Analytics**: Department-level KPIs, budget forecasting
- **Features**:
  - All Startup features
  - Governance & compliance automation
  - Policy management with approval workflows
  - Vendor management
  - Risk analytics & mitigation tracking
  - Department budgets with optimization
  - Multi-location support
  - Advanced approval queues with SLA monitoring

### Enterprise Tier (Custom)
- **Dashboard**: Global command center with strategic insights
- **AI Agents**: Unlimited custom agents with API access
- **Workflows**: Enterprise-grade orchestration
- **Analytics**: Predictive analytics, portfolio management, workforce optimization
- **Features**:
  - All SME features
  - Data warehouse with ETL pipelines
  - Security dashboard (threat intelligence, incident response)
  - Portfolio management across multiple businesses
  - SSO/SAML configuration
  - SCIM provisioning
  - White-label branding
  - Custom API builder
  - Crisis management tools
  - Social listening & sentiment analysis
  - Workforce analytics (capacity, skills, attrition)

## Database Schema Structure

### Core Tables
1. **users**: User accounts with email, name, business association
2. **businesses**: Company profiles with tier, subscription, settings, limits
3. **aiAgents**: AI agent instances with config, status, capabilities
4. **workflows**: Automation workflows with steps, triggers, governance
5. **playbooks**: Reusable workflow templates with versioning
6. **tasks**: Task management with priorities and initiative linking
7. **notifications**: Real-time alerts with types (approval, SLA, system)
8. **contacts**: Customer/lead database with journey tracking
9. **emailCampaigns**: Email marketing with stats and A/B testing
10. **socialPosts**: Social media content with scheduling and analytics

### Advanced Tables
- **approvalQueue**: Multi-stage approval workflows with SLA deadlines
- **workflowHandoffs**: Cross-department workflow transitions
- **governanceViolations**: Compliance tracking and remediation
- **policies**: Policy documents with versioning and acknowledgments
- **customerSegments**: Dynamic customer segmentation with rules
- **revenueAttribution**: Multi-touch attribution tracking
- **audit_logs**: Comprehensive audit trail
- **teamChannels** & **teamMessages**: Internal team communication
- **dataWarehouse**: ETL pipelines and data quality monitoring

## Key Functional Requirements

### 1. Authentication & Onboarding
- Google OAuth integration (fully configured)
- Email OTP fallback
- Guest mode for tier exploration
- Multi-step onboarding wizard based on tier
- Business profile setup with industry selection

### 2. AI Agent System
- **Agent Catalog**: Pre-built agents (Content Creator, Email Drafter, Social Media Manager, etc.)
- **Agent Builder**: Custom agent creation with personality, capabilities, training
- **Agent Marketplace**: Browse and deploy template agents
- **Agent Collaboration**: Multi-agent workflows with handoffs
- **Agent Memory**: Context retention and learning from interactions
- **Agent Performance**: Execution tracking, cost monitoring, response times

### 3. Workflow Automation
- **Visual Workflow Builder**: Drag-and-drop interface
- **Workflow Templates**: Industry-specific templates
- **Triggers**: Event-based, time-based, condition-based
- **Actions**: Email, notifications, data updates, API calls, agent invocations
- **Approval Stages**: Multi-level approvals with SLA tracking
- **Governance**: Automated compliance checks and remediation
- **Cross-Department Handoffs**: Seamless workflow transitions between teams

### 4. Analytics & Reporting
- **KPI Dashboard**: Real-time metrics by tier
- **Revenue Attribution**: Multi-touch attribution modeling
- **Customer Journey**: Stage tracking, conversion rates, drop-off analysis
- **Cohort Analysis**: User behavior over time
- **Churn Prediction**: ML-based churn risk scoring
- **A/B Testing**: Experiment management and statistical analysis
- **Predictive ROI**: Forecasting based on historical data

### 5. Communication & Collaboration
- **Team Chat**: Department channels, threads, reactions
- **Brain Dump**: Voice notes with transcription and AI summarization
- **Notifications**: Real-time alerts with priority levels
- **Activity Feed**: Team collaboration timeline
- **Help Coach**: Interactive tutorials and contextual help

### 6. Compliance & Governance
- **Policy Management**: Document creation, versioning, distribution
- **Approval Workflows**: Multi-stage approvals with audit trail
- **Governance Automation**: Auto-remediation of violations
- **Escalation Queue**: Priority-based issue management
- **Audit Logs**: Comprehensive activity tracking with search
- **Compliance Reports**: Scheduled report generation

### 7. Integrations
- **CRM**: Salesforce, HubSpot sync
- **Email**: Resend, SendGrid, AWS SES
- **Calendar**: Google Calendar, Outlook integration
- **Social Media**: Platform connectors with OAuth
- **Payment**: Stripe, PayPal for invoicing
- **SSO**: SAML, OIDC for enterprise

## UI/UX Requirements

### Design System
- **Theme**: Modern, clean, professional with neobrutalism accents
- **Colors**: Emerald primary (#10b981), slate neutrals, amber accents
- **Typography**: Inter font, tracking-tight for headings
- **Components**: Shadcn UI primitives throughout
- **Animations**: Framer Motion for page transitions, hover states, loading states
- **Responsive**: Mobile-first design, collapsible sidebar on mobile

### Key Pages
1. **Landing Page**: Hero, features, pricing, testimonials, demo videos, live chat
2. **Auth Page**: Google OAuth + email OTP with guest mode option
3. **Onboarding**: Multi-step wizard (business info → tier selection → agent setup)
4. **Dashboard**: Tier-specific with quick actions, stats, recent activity
5. **Agents**: Tabs for My Agents, Builder, Marketplace, Templates, Monitoring
6. **Workflows**: List view, builder, templates, analytics
7. **Analytics**: Charts, tables, filters, export options
8. **Settings**: Tier-specific settings, integrations, team management
9. **Admin**: System configuration, agent catalog, playbook management

### Navigation
- **Sidebar**: Tier-specific menu items, user profile, plan badge
- **Mobile Nav**: Bottom sheet with hamburger menu
- **Breadcrumbs**: For deep navigation paths
- **Global Search**: Cmd+K search across all entities

## Backend Architecture

### Convex Functions
- **Queries**: Real-time data fetching with automatic subscriptions
- **Mutations**: Data modifications with optimistic updates
- **Actions**: External API calls, email sending, AI invocations (use "use node")
- **Cron Jobs**: Scheduled tasks (min 5-minute intervals)
- **HTTP Endpoints**: Webhooks, OAuth callbacks

### Key Backend Modules
1. **aiAgents.ts**: Agent CRUD, execution, collaboration
2. **workflows.ts**: Workflow management, execution, handoffs
3. **analytics/**: Cohorts, churn, funnel, retention, ROI calculations
4. **governance/**: Violations, remediation, escalations
5. **customerJourney/**: Stage tracking, triggers, analytics
6. **emailDrafts.ts** & **emails.ts**: Campaign management, sending
7. **socialPosts.ts**: Content scheduling, publishing, analytics
8. **audit.ts**: Logging, search, compliance reports
9. **telemetry.ts**: Usage tracking, upgrade nudges

### Security & Performance
- **Rate Limiting**: Using @convex-dev/rate-limiter component
- **Pagination**: Cursor-based for large datasets (max 100-1000 items)
- **Indexes**: Proper indexing on all query fields (never filter without index)
- **Batch Operations**: Group mutations to reduce database calls
- **Cost Safeguards**: No unbounded .collect(), always use .take(N) or pagination

## Special Features

### 1. Guest Mode
- Allow users to explore any tier without authentication
- Demo data pre-populated for realistic experience
- "Sign In to Get Started" CTAs throughout
- URL parameter: `?guest=1&tier=startup`

### 2. Trial Management
- 14-day free trial on signup
- Trial countdown banner on dashboard
- Upgrade prompts when trial expires
- Feature gating based on tier

### 3. Progressive Disclosure
- Usage-based upgrade nudges (e.g., "You've used 80% of your workflow limit")
- Contextual help and tooltips
- Onboarding checklists
- Feature discovery prompts

### 4. Real-time Collaboration
- Live updates across all users in same business
- Presence indicators
- Optimistic UI updates
- Conflict resolution

### 5. AI-Powered Features
- Content generation (emails, social posts, blog articles)
- Smart summarization (voice notes, documents)
- Predictive analytics (churn, revenue, capacity)
- Intelligent routing (support tickets, approvals)
- Sentiment analysis (social media, customer feedback)

## Implementation Priorities

### Phase 1: Foundation (Week 1-2)
1. Set up project structure with Vite + Convex
2. Implement authentication (Google OAuth + email OTP)
3. Create core schema (users, businesses, agents, workflows)
4. Build landing page with pricing
5. Implement guest mode

### Phase 2: Core Features (Week 3-4)
1. Dashboard for all tiers
2. AI agent catalog and builder
3. Basic workflow builder
4. Email campaign management
5. Analytics dashboard (KPIs, charts)

### Phase 3: Advanced Features (Week 5-6)
1. Approval workflows with SLA tracking
2. Governance automation
3. Customer journey mapping
4. Revenue attribution
5. Team collaboration (chat, channels)

### Phase 4: Enterprise Features (Week 7-8)
1. Data warehouse and ETL
2. Security dashboard
3. Portfolio management
4. SSO/SAML configuration
5. White-label branding
6. Custom API builder

### Phase 5: Polish & Launch (Week 9-10)
1. Performance optimization
2. Mobile responsiveness
3. Comprehensive testing
4. Documentation
5. Demo videos and tutorials
6. Launch preparation

## Testing Requirements
- Unit tests for critical backend functions
- Integration tests for workflows and approvals
- E2E tests for auth, onboarding, and core user flows
- Performance testing for large datasets
- Security testing for auth and data access

## Documentation Needs
- API documentation for custom integrations
- User guides for each tier
- Admin documentation for system configuration
- Developer documentation for extending the platform
- Video tutorials for key features

## Success Metrics
- User onboarding completion rate > 80%
- Time to first workflow execution < 10 minutes
- Dashboard load time < 2 seconds
- Workflow execution success rate > 95%
- User retention (30-day) > 60%
- Upgrade conversion rate > 15%

---

## Quick Start Command
