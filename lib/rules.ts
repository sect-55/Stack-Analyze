export interface Rule {
  match: string;
  name: string;
  category: string;
  tracks: string;
  risk: number;
  alternatives: string[];
  detail: string;
  // which ecosystems this rule applies to (empty = all)
  ecosystems?: string[];
}

export const RULES: Rule[] = [
  // ── Analytics ──────────────────────────────────────────────────────────────
  { match: "firebase",            name: "Firebase",           category: "Analytics",     tracks: "User events, sessions, device fingerprints", risk: 4, alternatives: ["Plausible", "PostHog (self-hosted)"],  detail: "Google-owned. Sends behavioral data to Google infra." },
  { match: "firebase-admin",      name: "Firebase Admin",     category: "Analytics",     tracks: "Admin-level data access",                    risk: 4, alternatives: ["Supabase self-hosted"],               detail: "Server-side Firebase SDK. Full data access." },
  { match: "mixpanel",            name: "Mixpanel",           category: "Analytics",     tracks: "User events, funnels, retention",             risk: 4, alternatives: ["PostHog", "Umami"],                   detail: "Tracks every click, session, and user path in detail." },
  { match: "amplitude",           name: "Amplitude",          category: "Analytics",     tracks: "Behavioral analytics, A/B tests",             risk: 4, alternatives: ["PostHog", "Countly"],                 detail: "Deep behavioral profiling across sessions." },
  { match: "posthog",             name: "PostHog",            category: "Analytics",     tracks: "Events, session recordings, feature flags",   risk: 3, alternatives: ["PostHog self-hosted", "Matomo"],      detail: "Privacy-friendlier but cloud by default." },
  { match: "segment",             name: "Segment",            category: "Analytics",     tracks: "User identity, event pipeline",               risk: 5, alternatives: ["Rudderstack (self-hosted)", "Jitsu"], detail: "Pipes data to dozens of third-party tools simultaneously." },
  { match: "heap",                name: "Heap",               category: "Analytics",     tracks: "Auto-capture of all interactions",            risk: 5, alternatives: ["PostHog", "Plausible"],               detail: "Captures every single interaction without explicit code." },
  { match: "fullstory",           name: "FullStory",          category: "Analytics",     tracks: "Session replays, rage clicks",                risk: 5, alternatives: ["OpenReplay (self-hosted)", "Clarity"], detail: "Records full screen sessions of every user." },
  { match: "hotjar",              name: "Hotjar",             category: "Analytics",     tracks: "Heatmaps, session recordings",                risk: 4, alternatives: ["Microsoft Clarity (free)", "OpenReplay"], detail: "Visual tracking of cursor and scroll behavior." },
  { match: "google-analytics",    name: "Google Analytics",   category: "Analytics",     tracks: "Page views, demographics, interests",         risk: 5, alternatives: ["Plausible", "Fathom", "Umami"],       detail: "Extensive profiling shared with Google ad network." },
  { match: "@vercel/analytics",   name: "Vercel Analytics",   category: "Analytics",     tracks: "Page views, vitals",                          risk: 2, alternatives: ["Plausible"],                          detail: "Lightweight but still third-party." },
  { match: "logrocket",           name: "LogRocket",          category: "Analytics",     tracks: "Session replays, Redux state",                risk: 5, alternatives: ["OpenReplay (self-hosted)"],           detail: "Captures full app state including Redux store." },
  { match: "analytics-python",    name: "Segment (Python)",   category: "Analytics",     tracks: "User events, identity",                       risk: 5, alternatives: ["Rudderstack (self-hosted)"],          detail: "Python Segment SDK. Pipes to all Segment destinations.", ecosystems: ["Python"] },
  { match: "mixpanel-python",     name: "Mixpanel (Python)",  category: "Analytics",     tracks: "User events, funnels",                        risk: 4, alternatives: ["PostHog Python SDK"],                 detail: "Python Mixpanel integration.", ecosystems: ["Python"] },

  // ── Error Monitoring ───────────────────────────────────────────────────────
  { match: "sentry",              name: "Sentry",             category: "Monitoring",    tracks: "Stack traces, user context, breadcrumbs",    risk: 4, alternatives: ["GlitchTip", "Highlight.io"],          detail: "Attaches user identity to every error report." },
  { match: "sentry-sdk",         name: "Sentry (Python)",    category: "Monitoring",    tracks: "Stack traces, user context",                 risk: 4, alternatives: ["GlitchTip"],                          detail: "Python Sentry SDK.", ecosystems: ["Python"] },
  { match: "datadog",             name: "Datadog",            category: "Monitoring",    tracks: "Infra metrics, traces, logs",                 risk: 4, alternatives: ["Prometheus + Grafana", "VictoriaMetrics"], detail: "Comprehensive but expensive telemetry platform." },
  { match: "ddtrace",             name: "Datadog (Python)",   category: "Monitoring",    tracks: "APM traces, infra metrics",                  risk: 4, alternatives: ["OpenTelemetry + Grafana"],             detail: "Python Datadog tracing SDK.", ecosystems: ["Python"] },
  { match: "newrelic",            name: "New Relic",          category: "Monitoring",    tracks: "APM, browser monitoring, logs",               risk: 4, alternatives: ["Prometheus + Grafana", "Signoz"],     detail: "Deep app instrumentation sent to cloud." },
  { match: "rollbar",             name: "Rollbar",            category: "Monitoring",    tracks: "Errors, user fingerprints",                  risk: 3, alternatives: ["GlitchTip"],                          detail: "Error tracking with person fingerprinting." },
  { match: "bugsnag",             name: "Bugsnag",            category: "Monitoring",    tracks: "Errors, device info, user data",             risk: 3, alternatives: ["GlitchTip", "Sentry self-hosted"],    detail: "Rich device and user metadata on each error." },
  { match: "raygun",              name: "Raygun",             category: "Monitoring",    tracks: "Errors, performance, sessions",              risk: 3, alternatives: ["GlitchTip"],                          detail: "Combines error tracking and APM." },

  // ── Auth ───────────────────────────────────────────────────────────────────
  { match: "auth0",               name: "Auth0",              category: "Auth",          tracks: "User identity, login metadata",              risk: 4, alternatives: ["Lucia Auth", "Keycloak"],              detail: "Okta-owned. User identity flows through their servers." },
  { match: "@clerk",              name: "Clerk",              category: "Auth",          tracks: "Auth events, user sessions",                 risk: 3, alternatives: ["Lucia Auth", "NextAuth.js"],           detail: "Managed auth with telemetry sent to Clerk." },
  { match: "next-auth",           name: "NextAuth.js",        category: "Auth",          tracks: "Session tokens (local)",                     risk: 1, alternatives: ["Lucia Auth"],                         detail: "Open-source and self-hosted. Low risk." },
  { match: "lucia",               name: "Lucia Auth",         category: "Auth",          tracks: "Minimal (self-managed)",                     risk: 1, alternatives: ["NextAuth.js"],                        detail: "Lightweight, no telemetry. Best choice." },
  { match: "python-jose",         name: "python-jose",        category: "Auth",          tracks: "None (JWT lib)",                             risk: 1, alternatives: [],                                     detail: "JWT library. No telemetry.", ecosystems: ["Python"] },
  { match: "authlib",             name: "Authlib (Python)",   category: "Auth",          tracks: "OAuth/OIDC tokens",                          risk: 2, alternatives: [],                                     detail: "OAuth library. Self-managed flows.", ecosystems: ["Python"] },
  { match: "devise",              name: "Devise (Ruby)",      category: "Auth",          tracks: "Session data (local)",                       risk: 1, alternatives: [],                                     detail: "Rails auth gem. Self-hosted. Low risk.", ecosystems: ["Ruby"] },
  { match: "omniauth",            name: "OmniAuth (Ruby)",    category: "Auth",          tracks: "OAuth provider tokens",                      risk: 2, alternatives: [],                                     detail: "OAuth middleware. Depends on providers used.", ecosystems: ["Ruby"] },

  // ── Hosting ────────────────────────────────────────────────────────────────
  { match: "vercel",              name: "Vercel",             category: "Hosting",       tracks: "Deploy logs, edge telemetry",                risk: 2, alternatives: ["Coolify", "Railway", "Fly.io"],       detail: "Logs requests and performance at edge." },
  { match: "netlify",             name: "Netlify",            category: "Hosting",       tracks: "Deploy logs, function logs",                 risk: 2, alternatives: ["Coolify", "Render"],                  detail: "Serverless function invocations logged." },
  { match: "heroku",              name: "Heroku",             category: "Hosting",       tracks: "Dyno logs, metrics",                         risk: 3, alternatives: ["Railway", "Fly.io"],                  detail: "Salesforce-owned. Logs all dyno activity." },

  // ── Database ───────────────────────────────────────────────────────────────
  { match: "supabase",            name: "Supabase",           category: "Database",      tracks: "Query patterns, DB usage",                   risk: 3, alternatives: ["Self-hosted Postgres", "PocketBase"], detail: "Usage and query patterns sent to Supabase." },
  { match: "mongodb",             name: "MongoDB Atlas",      category: "Database",      tracks: "Query telemetry, usage metrics",             risk: 3, alternatives: ["Self-hosted MongoDB", "PostgreSQL"],  detail: "Atlas sends telemetry to MongoDB Inc." },
  { match: "pymongo",             name: "PyMongo",            category: "Database",      tracks: "Connection metadata (if Atlas)",             risk: 2, alternatives: ["Self-hosted MongoDB"],               detail: "Python MongoDB driver. Risk depends on hosting.", ecosystems: ["Python"] },
  { match: "planetscale",         name: "PlanetScale",        category: "Database",      tracks: "Query patterns",                             risk: 2, alternatives: ["Neon", "Self-hosted MySQL"],          detail: "Managed MySQL with usage analytics." },
  { match: "neon",                name: "Neon",               category: "Database",      tracks: "Connection/query metrics",                   risk: 2, alternatives: ["Self-hosted Postgres"],               detail: "Serverless Postgres with platform telemetry." },
  { match: "prisma",              name: "Prisma",             category: "Database",      tracks: "Telemetry (opt-outable)",                    risk: 2, alternatives: ["Drizzle ORM"],                        detail: "Sends anonymous usage stats. Can be disabled." },
  { match: "drizzle",             name: "Drizzle ORM",        category: "Database",      tracks: "None",                                       risk: 1, alternatives: [],                                     detail: "Zero telemetry. Best ORM for privacy." },
  { match: "sqlalchemy",          name: "SQLAlchemy",         category: "Database",      tracks: "None",                                       risk: 1, alternatives: [],                                     detail: "Python ORM. No telemetry.", ecosystems: ["Python"] },
  { match: "django",              name: "Django",             category: "Database",      tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Django ORM is fully self-managed.", ecosystems: ["Python"] },
  { match: "activerecord",        name: "ActiveRecord",       category: "Database",      tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Rails ORM. No telemetry.", ecosystems: ["Ruby"] },

  // ── Payments ───────────────────────────────────────────────────────────────
  { match: "stripe",              name: "Stripe",             category: "Payments",      tracks: "Transaction metadata, fraud signals",        risk: 3, alternatives: ["Lemon Squeezy", "Paddle"],            detail: "Deep transaction fingerprinting for fraud detection." },
  { match: "stripe-python",       name: "Stripe (Python)",    category: "Payments",      tracks: "Transaction metadata",                       risk: 3, alternatives: ["Lemon Squeezy", "Paddle"],            detail: "Python Stripe SDK.", ecosystems: ["Python"] },
  { match: "lemonsqueezy",        name: "Lemon Squeezy",      category: "Payments",      tracks: "Purchase events",                            risk: 2, alternatives: ["Stripe"],                             detail: "Lighter footprint. Merchant-of-record model." },
  { match: "paddle",              name: "Paddle",             category: "Payments",      tracks: "Billing events",                             risk: 2, alternatives: ["Lemon Squeezy"],                      detail: "Merchant-of-record. Handles VAT/compliance." },
  { match: "paypal",              name: "PayPal",             category: "Payments",      tracks: "Transaction data, device fingerprints",      risk: 4, alternatives: ["Stripe", "Paddle"],                  detail: "Extensive cross-merchant user tracking." },

  // ── Email / Comms ──────────────────────────────────────────────────────────
  { match: "sendgrid",            name: "SendGrid",           category: "Email",         tracks: "Open rates, click tracking, IP",             risk: 4, alternatives: ["Resend", "Postal (self-hosted)"],    detail: "Twilio-owned. Tracks recipient behavior." },
  { match: "sendgrid-python",     name: "SendGrid (Python)",  category: "Email",         tracks: "Open rates, click tracking",                 risk: 4, alternatives: ["Resend", "Postal"],                  detail: "Python SendGrid SDK.", ecosystems: ["Python"] },
  { match: "resend",              name: "Resend",             category: "Email",         tracks: "Delivery events",                            risk: 2, alternatives: ["Postal (self-hosted)"],               detail: "Developer-first. Lighter tracking." },
  { match: "mailgun",             name: "Mailgun",            category: "Email",         tracks: "Opens, clicks, bounces",                     risk: 3, alternatives: ["Resend", "Postal"],                  detail: "Sinch-owned. Tracks email engagement." },
  { match: "mailchimp",           name: "Mailchimp",          category: "Email",         tracks: "Subscriber behavior, opens",                 risk: 4, alternatives: ["Listmonk (self-hosted)", "Buttondown"], detail: "Intuit-owned. Deep subscriber profiling." },
  { match: "mailchimp-marketing", name: "Mailchimp API",      category: "Email",         tracks: "Subscriber behavior",                        risk: 4, alternatives: ["Listmonk (self-hosted)"],             detail: "Official Mailchimp API client.", ecosystems: ["Python"] },
  { match: "twilio",              name: "Twilio",             category: "Comms",         tracks: "Message metadata, call logs",                risk: 3, alternatives: ["Vonage", "Plivo"],                   detail: "All message metadata logged by Twilio." },
  { match: "pusher",              name: "Pusher",             category: "Comms",         tracks: "Connection events, message counts",          risk: 3, alternatives: ["Soketi (self-hosted)", "Ably"],       detail: "Third-party WebSocket broker." },

  // ── CMS ────────────────────────────────────────────────────────────────────
  { match: "contentful",          name: "Contentful",         category: "CMS",           tracks: "API usage, access patterns",                 risk: 3, alternatives: ["Payload CMS", "Strapi"],              detail: "SaaS CMS with usage analytics." },
  { match: "sanity",              name: "Sanity",             category: "CMS",           tracks: "API calls, content access",                  risk: 2, alternatives: ["Payload CMS", "Directus"],           detail: "Managed CMS. Telemetry on API usage." },
  { match: "payload",             name: "Payload CMS",        category: "CMS",           tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Self-hosted. Zero telemetry." },
  { match: "strapi",              name: "Strapi",             category: "CMS",           tracks: "Telemetry (opt-outable)",                    risk: 2, alternatives: ["Payload CMS"],                        detail: "Sends anonymous usage stats. Can disable." },

  // ── Search ─────────────────────────────────────────────────────────────────
  { match: "algoliasearch",       name: "Algolia",            category: "Search",        tracks: "Search queries, click analytics",            risk: 4, alternatives: ["Meilisearch (self-hosted)", "Typesense"], detail: "All user search queries processed on Algolia servers." },
  { match: "algolia",             name: "Algolia",            category: "Search",        tracks: "Search queries, click analytics",            risk: 4, alternatives: ["Meilisearch (self-hosted)", "Typesense"], detail: "All user search queries processed on Algolia servers." },
  { match: "meilisearch",         name: "Meilisearch",        category: "Search",        tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Open-source. No cloud telemetry." },
  { match: "typesense",           name: "Typesense",          category: "Search",        tracks: "Minimal (self-hostable)",                    risk: 1, alternatives: ["Meilisearch"],                        detail: "Open-source. Fully self-hostable." },

  // ── Feature Flags ──────────────────────────────────────────────────────────
  { match: "launchdarkly",        name: "LaunchDarkly",       category: "Feature Flags", tracks: "Flag evaluations, user targeting",           risk: 4, alternatives: ["Unleash (self-hosted)", "Flipt"],     detail: "Every flag evaluation logged with user context." },
  { match: "unleash",             name: "Unleash",            category: "Feature Flags", tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Open-source. Self-hostable." },
  { match: "optimizely",          name: "Optimizely",         category: "A/B Testing",   tracks: "User exposure, experiment data",             risk: 4, alternatives: ["GrowthBook (self-hosted)"],           detail: "Deep user behavioral data for experiments." },
  { match: "growthbook",          name: "GrowthBook",         category: "A/B Testing",   tracks: "Experiment exposure (if cloud)",             risk: 2, alternatives: ["GrowthBook self-hosted"],             detail: "Open-source. Self-hostable option." },

  // ── Storage / CDN ──────────────────────────────────────────────────────────
  { match: "cloudinary",          name: "Cloudinary",         category: "Storage",       tracks: "Asset access patterns",                      risk: 2, alternatives: ["Uploadthing", "Self-hosted MinIO"],   detail: "Logs all asset delivery requests." },
  { match: "uploadthing",         name: "Uploadthing",        category: "Storage",       tracks: "Upload events",                              risk: 2, alternatives: ["Self-hosted S3/MinIO"],               detail: "Simple upload service. Minimal tracking." },
  { match: "boto3",               name: "AWS SDK (Python)",   category: "Infrastructure",tracks: "API calls, CloudTrail logs",                 risk: 3, alternatives: ["Self-hosted equivalents"],            detail: "All calls logged by AWS CloudTrail.", ecosystems: ["Python"] },
  { match: "@aws-sdk",            name: "AWS SDK",            category: "Infrastructure",tracks: "API calls, usage metrics",                   risk: 3, alternatives: ["Self-hosted equivalents"],            detail: "All calls logged by AWS CloudTrail." },
  { match: "aws-sdk",             name: "AWS SDK",            category: "Infrastructure",tracks: "API calls, usage metrics",                   risk: 3, alternatives: ["Self-hosted equivalents"],            detail: "All calls logged by AWS CloudTrail." },

  // ── Support / CRM ──────────────────────────────────────────────────────────
  { match: "intercom",            name: "Intercom",           category: "Support",       tracks: "User attributes, behavior, messages",        risk: 5, alternatives: ["Crisp", "Chatwoot (self-hosted)"],   detail: "Extremely detailed user profiling for sales/support." },
  { match: "zendesk",             name: "Zendesk",            category: "Support",       tracks: "Support tickets, user data",                 risk: 4, alternatives: ["Zammad (self-hosted)", "Chatwoot"],   detail: "Salesforce-adjacent. Deep customer data." },
  { match: "hubspot",             name: "HubSpot",            category: "CRM",           tracks: "User identity, form data, tracking pixels",  risk: 5, alternatives: ["Twenty CRM (self-hosted)"],          detail: "Extensive cross-site tracking and profiling." },
  { match: "hubspot-api-client",  name: "HubSpot (Python)",   category: "CRM",           tracks: "Contact data, pipeline events",              risk: 5, alternatives: ["Twenty CRM (self-hosted)"],          detail: "Python HubSpot SDK.", ecosystems: ["Python"] },

  // ── AI / LLM ───────────────────────────────────────────────────────────────
  { match: "openai",              name: "OpenAI SDK",         category: "AI",            tracks: "Prompts and completions (by default)",       risk: 4, alternatives: ["Ollama (local)", "LM Studio"],        detail: "All API calls may be logged for safety monitoring." },
  { match: "@anthropic-ai",       name: "Anthropic SDK",      category: "AI",            tracks: "API usage, prompts",                         risk: 3, alternatives: ["Ollama (local)"],                     detail: "API usage logged. Privacy policy applies." },
  { match: "anthropic",           name: "Anthropic (Python)", category: "AI",            tracks: "API usage, prompts",                         risk: 3, alternatives: ["Ollama (local)"],                     detail: "Python Anthropic SDK.", ecosystems: ["Python"] },
  { match: "langchain",           name: "LangChain",          category: "AI",            tracks: "Telemetry (opt-outable)",                    risk: 3, alternatives: ["Custom orchestration", "LlamaIndex"], detail: "Sends anonymous telemetry. Can opt out." },
  { match: "langchain-core",      name: "LangChain Core",     category: "AI",            tracks: "Telemetry (opt-outable)",                    risk: 3, alternatives: ["Custom orchestration"],               detail: "Python LangChain core.", ecosystems: ["Python"] },
  { match: "replicate",           name: "Replicate",          category: "AI",            tracks: "Model runs, inputs/outputs",                 risk: 4, alternatives: ["Self-hosted models"],                 detail: "Inputs and outputs stored on Replicate." },
  { match: "google-cloud-aiplatform", name: "Vertex AI",     category: "AI",            tracks: "Prompts, completions, usage",                risk: 4, alternatives: ["Ollama (local)"],                     detail: "Google-owned. All usage logged.", ecosystems: ["Python"] },

  // ── Observability ──────────────────────────────────────────────────────────
  { match: "prometheus",          name: "Prometheus",         category: "Observability", tracks: "None (self-hosted)",                         risk: 1, alternatives: [],                                     detail: "Fully open-source. Zero telemetry." },
  { match: "grafana",             name: "Grafana",            category: "Observability", tracks: "Metrics (self-hostable)",                    risk: 1, alternatives: [],                                     detail: "Open-source. Self-hosted = no tracking." },
  { match: "opentelemetry",       name: "OpenTelemetry",      category: "Observability", tracks: "None (self-managed)",                        risk: 1, alternatives: [],                                     detail: "Open standard. Fully self-managed." },
  { match: "opentelemetry-sdk",   name: "OpenTelemetry (Python)", category: "Observability", tracks: "None (self-managed)",                   risk: 1, alternatives: [],                                     detail: "Python OTel SDK.", ecosystems: ["Python"] },

  // ── Build / DevOps ─────────────────────────────────────────────────────────
  { match: "nx",                  name: "Nx",                 category: "Build",         tracks: "Anonymous usage telemetry",                  risk: 2, alternatives: ["Turborepo"],                          detail: "Sends anonymous usage data. Can opt out." },
  { match: "turbo",               name: "Turborepo",          category: "Build",         tracks: "Telemetry (opt-outable)",                    risk: 2, alternatives: ["Nx"],                                 detail: "Vercel-owned. Sends anonymous build telemetry." },

  // ── Frameworks ─────────────────────────────────────────────────────────────
  { match: "next",                name: "Next.js",            category: "Framework",     tracks: "Anonymous CLI telemetry, build stats",       risk: 2, alternatives: ["Astro", "Remix"],                     detail: "Collects anonymous telemetry by default. Can opt out via `next telemetry disable`." },
  { match: "nuxt",                name: "Nuxt",               category: "Framework",     tracks: "Anonymous telemetry",                        risk: 2, alternatives: ["Astro", "SvelteKit"],                 detail: "Vue meta-framework with opt-outable telemetry." },
  { match: "gatsby",              name: "Gatsby",             category: "Framework",     tracks: "Anonymous telemetry, plugin analytics",      risk: 3, alternatives: ["Astro", "Next.js"],                   detail: "Sends anonymous build telemetry. Netlify-owned." },
  { match: "astro",               name: "Astro",              category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Privacy-first static site framework." },
  { match: "svelte",              name: "SvelteKit",          category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Open-source." },
  { match: "angular",             name: "Angular",            category: "Framework",     tracks: "Anonymous CLI analytics",                    risk: 2, alternatives: ["Svelte", "React"],                    detail: "Google-owned. CLI collects anonymous usage stats." },
  { match: "vue",                 name: "Vue.js",             category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Open-source." },
  { match: "react",               name: "React",              category: "Framework",     tracks: "None (but Meta-owned)",                     risk: 1, alternatives: ["Preact", "Solid.js"],                 detail: "No telemetry in the library itself. Meta-maintained." },
  { match: "express",             name: "Express.js",         category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Minimal web framework." },
  { match: "fastapi",             name: "FastAPI",            category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Python web framework.", ecosystems: ["Python"] },
  { match: "flask",               name: "Flask",              category: "Framework",     tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Python micro-framework.", ecosystems: ["Python"] },
  { match: "rails",               name: "Ruby on Rails",      category: "Framework",     tracks: "None (self-managed)",                       risk: 1, alternatives: [],                                     detail: "No telemetry in framework.", ecosystems: ["Ruby"] },

  // ── Social Embeds ──────────────────────────────────────────────────────────
  { match: "react-tweet",         name: "React Tweet",        category: "Social Embed",  tracks: "Loads Twitter/X tracking scripts",           risk: 3, alternatives: ["Static screenshots", "Custom embeds"], detail: "Embeds Twitter content which loads X.com tracking scripts and cookies." },
  { match: "react-share",         name: "React Share",        category: "Social Embed",  tracks: "Social share buttons may load trackers",    risk: 2, alternatives: ["Custom share links"],                 detail: "Share buttons may load third-party social scripts." },
  { match: "disqus-react",        name: "Disqus",             category: "Social Embed",  tracks: "User identity, ad targeting, browsing",     risk: 5, alternatives: ["Giscus", "Utterances"],              detail: "Heavy ad-tracking embedded comment system." },
  { match: "react-facebook",      name: "Facebook Embed",     category: "Social Embed",  tracks: "Facebook Pixel, browsing behavior",         risk: 5, alternatives: ["Static links"],                       detail: "Loads Facebook's tracking pixel and SDK." },
  { match: "react-instagram-embed", name: "Instagram Embed",  category: "Social Embed",  tracks: "Meta tracking scripts",                     risk: 4, alternatives: ["Static screenshots"],                 detail: "Loads Meta/Instagram tracking when embedded." },

  // ── Fonts / CDN ────────────────────────────────────────────────────────────
  { match: "geist",               name: "Geist Font",         category: "Fonts",         tracks: "Font requests to Vercel CDN",               risk: 2, alternatives: ["Self-hosted fonts", "Fontsource"],    detail: "Loads fonts from Vercel's CDN. Requests expose visitor IPs to Vercel." },
  { match: "next-google-fonts",   name: "Google Fonts (Next)", category: "Fonts",        tracks: "Font requests to Google CDN",               risk: 3, alternatives: ["Fontsource", "Self-hosted fonts"],    detail: "Font requests to Google expose visitor IPs. Self-host for privacy." },
  { match: "fontsource",          name: "Fontsource",         category: "Fonts",         tracks: "None (self-hosted)",                        risk: 1, alternatives: [],                                     detail: "Self-hosted fonts. No CDN requests. Best for privacy." },
  { match: "@fontsource",         name: "Fontsource",         category: "Fonts",         tracks: "None (self-hosted)",                        risk: 1, alternatives: [],                                     detail: "Self-hosted fonts. Zero tracking." },

  // ── Email (expanded) ──────────────────────────────────────────────────────
  { match: "nodemailer",          name: "Nodemailer",         category: "Email",         tracks: "None (self-managed SMTP)",                  risk: 1, alternatives: [],                                     detail: "Self-managed email sending. No third-party tracking." },
  { match: "@sendgrid/mail",      name: "SendGrid Mail",      category: "Email",         tracks: "Open/click tracking, delivery events",      risk: 4, alternatives: ["Resend", "Nodemailer"],               detail: "Twilio-owned. Tracks opens and clicks by default." },
  { match: "postmark",            name: "Postmark",           category: "Email",         tracks: "Delivery events, open tracking",            risk: 3, alternatives: ["Resend", "Nodemailer"],               detail: "Tracks delivery and opens. ActiveCampaign-owned." },
  { match: "ses-sdk",             name: "AWS SES",            category: "Email",         tracks: "Delivery events, bounce tracking",          risk: 3, alternatives: ["Nodemailer (self-hosted SMTP)"],      detail: "AWS-managed. All sends logged in CloudWatch." },
  { match: "react-email",         name: "React Email",        category: "Email",         tracks: "None (rendering only)",                     risk: 1, alternatives: [],                                     detail: "Email template rendering. No tracking." },

  // ── Maps / Location ───────────────────────────────────────────────────────
  { match: "@googlemaps",         name: "Google Maps",        category: "Maps",          tracks: "API key usage, user location queries",      risk: 4, alternatives: ["Leaflet + OpenStreetMap", "MapLibre"], detail: "Google-owned. All map requests logged with API key." },
  { match: "google-maps-react",   name: "Google Maps React",  category: "Maps",          tracks: "API key usage, user interactions",           risk: 4, alternatives: ["react-leaflet"],                      detail: "Loads Google Maps JS SDK which tracks usage." },
  { match: "react-google-maps",   name: "Google Maps React",  category: "Maps",          tracks: "API key usage, location queries",            risk: 4, alternatives: ["react-leaflet", "MapLibre"],          detail: "Google Maps wrapper. All queries go through Google." },
  { match: "mapbox",              name: "Mapbox",             category: "Maps",          tracks: "Map views, tile requests",                   risk: 3, alternatives: ["MapLibre (self-hosted)", "Leaflet"],  detail: "Tile requests tracked. Usage-based billing." },
  { match: "leaflet",             name: "Leaflet",            category: "Maps",          tracks: "None (self-hosted tiles possible)",          risk: 1, alternatives: [],                                     detail: "Open-source. Use with OSM tiles for zero tracking." },
  { match: "react-leaflet",       name: "React Leaflet",      category: "Maps",          tracks: "None (depends on tile server)",              risk: 1, alternatives: [],                                     detail: "React wrapper for Leaflet. Self-hostable." },

  // ── State / Data Fetching ──────────────────────────────────────────────────
  { match: "@tanstack/react-query", name: "TanStack Query",   category: "Data",          tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "No telemetry. Client-side data fetching." },
  { match: "swr",                 name: "SWR",                category: "Data",          tracks: "None",                                      risk: 1, alternatives: ["TanStack Query"],                     detail: "Vercel-maintained but no telemetry. Open-source." },
  { match: "redux",               name: "Redux",              category: "Data",          tracks: "None",                                      risk: 1, alternatives: ["Zustand", "Jotai"],                   detail: "No telemetry. Client-side state management." },
  { match: "zustand",             name: "Zustand",            category: "Data",          tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Lightweight state manager. No telemetry." },
  { match: "apollo-client",       name: "Apollo Client",      category: "Data",          tracks: "Usage telemetry (if Apollo Studio)",        risk: 2, alternatives: ["urql", "graphql-request"],            detail: "Apollo Studio integration sends usage analytics." },
  { match: "graphql",             name: "GraphQL",            category: "Data",          tracks: "None (spec)",                               risk: 1, alternatives: [],                                     detail: "Open specification. No tracking." },

  // ── Styling ────────────────────────────────────────────────────────────────
  { match: "tailwindcss",         name: "Tailwind CSS",       category: "Styling",       tracks: "Anonymous CLI telemetry",                   risk: 1, alternatives: ["UnoCSS", "Vanilla CSS"],              detail: "Opt-outable anonymous build telemetry. Minimal risk." },
  { match: "styled-components",   name: "Styled Components",  category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "CSS-in-JS. No telemetry." },
  { match: "emotion",             name: "Emotion",            category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "CSS-in-JS. No telemetry." },
  { match: "sass",                name: "Sass",               category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "CSS preprocessor. No telemetry." },
  { match: "chakra-ui",           name: "Chakra UI",          category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Component library. No telemetry." },
  { match: "@chakra-ui",          name: "Chakra UI",          category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Component library. No telemetry." },
  { match: "@mui",                name: "Material UI",        category: "Styling",       tracks: "None",                                      risk: 1, alternatives: ["Chakra UI", "Radix UI"],             detail: "Component library. No telemetry." },
  { match: "radix-ui",            name: "Radix UI",           category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Unstyled component primitives. No telemetry." },
  { match: "@radix-ui",           name: "Radix UI",           category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Unstyled component primitives. No telemetry." },
  { match: "shadcn",              name: "shadcn/ui",          category: "Styling",       tracks: "None (copy-paste)",                         risk: 1, alternatives: [],                                     detail: "CLI copies components to your project. No runtime telemetry." },
  { match: "motion",              name: "Framer Motion",      category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Animation library. No telemetry." },
  { match: "framer-motion",       name: "Framer Motion",      category: "Styling",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Animation library. No telemetry." },

  // ── Notifications / Push ───────────────────────────────────────────────────
  { match: "onesignal",           name: "OneSignal",          category: "Notifications", tracks: "Device tokens, push engagement, user tags", risk: 4, alternatives: ["ntfy (self-hosted)", "Web Push API"], detail: "Tracks device identity and push engagement." },
  { match: "firebase-messaging",  name: "Firebase Messaging", category: "Notifications", tracks: "Device tokens, delivery metrics",           risk: 4, alternatives: ["Web Push API", "ntfy"],               detail: "Google-managed push. Device tokens stored by Google." },
  { match: "web-push",            name: "Web Push",           category: "Notifications", tracks: "None (self-managed)",                       risk: 1, alternatives: [],                                     detail: "Self-managed Web Push API. No third-party tracking." },

  // ── Captcha / Bot Protection ───────────────────────────────────────────────
  { match: "recaptcha",           name: "reCAPTCHA",          category: "Security",      tracks: "Browser fingerprints, behavioral data",     risk: 5, alternatives: ["hCaptcha", "Turnstile"],              detail: "Google-owned. Extensive browser fingerprinting and behavioral tracking." },
  { match: "hcaptcha",            name: "hCaptcha",           category: "Security",      tracks: "Challenge completion data",                 risk: 3, alternatives: ["Cloudflare Turnstile"],               detail: "Privacy-focused alternative. Less tracking than reCAPTCHA." },
  { match: "@cloudflare/turnstile", name: "Turnstile",        category: "Security",      tracks: "Minimal challenge data",                    risk: 2, alternatives: [],                                     detail: "Privacy-preserving CAPTCHA. Minimal fingerprinting." },

  // ── Image Optimization ─────────────────────────────────────────────────────
  { match: "next-image",          name: "Next.js Image",      category: "Media",         tracks: "Image requests via Vercel optimization",    risk: 2, alternatives: ["Self-hosted sharp", "imgproxy"],     detail: "Default image optimization proxied through Vercel." },
  { match: "sharp",               name: "Sharp",              category: "Media",         tracks: "None (local processing)",                   risk: 1, alternatives: [],                                     detail: "Local image processing. No network calls." },
  { match: "imgix",               name: "imgix",              category: "Media",         tracks: "Image delivery analytics",                  risk: 3, alternatives: ["imgproxy (self-hosted)", "Sharp"],    detail: "CDN-based image delivery with analytics." },

  // ── Testing / CI ───────────────────────────────────────────────────────────
  { match: "jest",                name: "Jest",               category: "Testing",       tracks: "None",                                      risk: 1, alternatives: ["Vitest"],                             detail: "Test runner. No telemetry." },
  { match: "vitest",              name: "Vitest",             category: "Testing",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Test runner. No telemetry." },
  { match: "cypress",             name: "Cypress",            category: "Testing",       tracks: "Telemetry if Cypress Cloud used",           risk: 2, alternatives: ["Playwright"],                         detail: "Cypress Cloud analytics. Self-run has no telemetry." },
  { match: "playwright",          name: "Playwright",         category: "Testing",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Microsoft. No telemetry in test runner." },

  // ── Misc / Utilities ──────────────────────────────────────────────────────
  { match: "axios",               name: "Axios",              category: "Utility",       tracks: "None",                                      risk: 1, alternatives: ["fetch API"],                          detail: "HTTP client. No telemetry." },
  { match: "lodash",              name: "Lodash",             category: "Utility",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Utility library. No telemetry." },
  { match: "date-fns",            name: "date-fns",           category: "Utility",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Date utility. No telemetry." },
  { match: "dayjs",               name: "Day.js",             category: "Utility",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Date library. No telemetry." },
  { match: "moment",              name: "Moment.js",          category: "Utility",       tracks: "None",                                      risk: 1, alternatives: ["date-fns", "Day.js"],                detail: "Legacy date library. No telemetry but large bundle." },
  { match: "typescript",          name: "TypeScript",         category: "Build",         tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Type checker. No telemetry." },
  { match: "eslint",              name: "ESLint",             category: "Build",         tracks: "None",                                      risk: 1, alternatives: ["Biome"],                              detail: "Linter. No telemetry." },
  { match: "prettier",            name: "Prettier",           category: "Build",         tracks: "None",                                      risk: 1, alternatives: ["Biome"],                              detail: "Formatter. No telemetry." },
  { match: "webpack",             name: "Webpack",            category: "Build",         tracks: "Anonymous telemetry (opt-outable)",         risk: 2, alternatives: ["Vite", "esbuild"],                   detail: "Build telemetry can be disabled." },
  { match: "vite",                name: "Vite",               category: "Build",         tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Fast build tool. No telemetry." },
  { match: "esbuild",             name: "esbuild",            category: "Build",         tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Fast bundler. No telemetry." },

  // ── Ad Tech / Marketing ────────────────────────────────────────────────────
  { match: "react-ga",            name: "React GA",           category: "Analytics",     tracks: "Page views, events, demographics",          risk: 5, alternatives: ["Plausible", "Umami"],                 detail: "Google Analytics React wrapper. Full GA tracking." },
  { match: "react-gtm-module",    name: "Google Tag Manager", category: "Analytics",     tracks: "All configured tags and pixels",            risk: 5, alternatives: ["Plausible", "Self-hosted analytics"], detail: "Loads arbitrary third-party scripts via GTM." },
  { match: "react-pixel",         name: "Facebook Pixel",     category: "Analytics",     tracks: "Page views, conversions, demographics",    risk: 5, alternatives: ["Server-side tracking"],               detail: "Meta's cross-site tracking pixel." },
  { match: "react-facebook-pixel", name: "Facebook Pixel",    category: "Analytics",     tracks: "Conversions, cross-site tracking",          risk: 5, alternatives: ["Plausible"],                          detail: "Meta's advertising pixel. Heavy tracking." },

  // ── Scheduling / Cron ──────────────────────────────────────────────────────
  { match: "cron",                name: "Cron",               category: "Utility",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Cron job scheduler. No telemetry." },
  { match: "node-cron",           name: "Node Cron",          category: "Utility",       tracks: "None",                                      risk: 1, alternatives: [],                                     detail: "Cron scheduler. No telemetry." },
  { match: "bull",                name: "Bull Queue",         category: "Utility",       tracks: "None (Redis-backed)",                       risk: 1, alternatives: [],                                     detail: "Job queue. No telemetry. Requires Redis." },

  // ── Deployment / Containers ────────────────────────────────────────────────
  { match: "docker",              name: "Docker",             category: "Infrastructure",tracks: "Docker Hub pull analytics",                  risk: 2, alternatives: ["Podman"],                             detail: "Docker Hub tracks image pulls. Self-hosted registries avoid this." },
  { match: "kubernetes",          name: "Kubernetes",         category: "Infrastructure",tracks: "None (self-managed)",                       risk: 1, alternatives: [],                                     detail: "Container orchestration. No telemetry." },

  // ── Cloud Functions ────────────────────────────────────────────────────────
  { match: "@google-cloud",       name: "Google Cloud SDK",   category: "Infrastructure",tracks: "API calls, usage metrics",                  risk: 3, alternatives: ["Self-hosted equivalents"],             detail: "All calls logged by Google Cloud." },
  { match: "azure",               name: "Azure SDK",          category: "Infrastructure",tracks: "API calls, telemetry",                      risk: 3, alternatives: ["Self-hosted equivalents"],             detail: "Microsoft Azure. Usage telemetry collected." },
];
