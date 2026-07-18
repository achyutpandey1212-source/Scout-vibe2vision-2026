import {
  ATSProvider,
  CompanyCandidate,
  CompanyStage,
  CompanyType,
  Confidence,
  DiscoverySource,
  EcosystemCategory,
} from './company.types';

/**
 * Deterministic ecosystem + company registry.
 *
 * No network, no LLM. Every ecosystem and company is curated statically so the
 * engine scales to tens of thousands of companies without architectural change.
 * Connectors read from this registry; networks are only used for optional
 * careers/ATS probing.
 */

export interface EcosystemDefinition {
  label: string;
  category: EcosystemCategory;
  source: DiscoverySource;
  /** Deterministic strength of the ecosystem (0-1) used in scoring. */
  strength: number;
  /** Curated companies that belong to this ecosystem. */
  companies: SeedCompany[];
}

export interface SeedCompany {
  name: string;
  website: string;
  country: string;
  city?: string;
  stage?: CompanyStage;
  type?: CompanyType;
  careersUrl?: string;
  ats?: ATSProvider;
  confidence?: Confidence;
}

/**
 * Curated seed companies for each ecosystem. These are the deterministic
 * "portfolio" lists that drive multi-hop discovery.
 */
export const ECOSYSTEMS: EcosystemDefinition[] = [
  // ─── Startup Accelerators ──────────────────────────────────────────────
  {
    label: 'Y Combinator',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 1.0,
    companies: [
      {
        name: 'OpenAI',
        website: 'https://openai.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Stripe',
        website: 'https://stripe.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Airbnb',
        website: 'https://airbnb.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'DoorDash',
        website: 'https://doordash.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Instacart',
        website: 'https://instacart.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Cursor',
        website: 'https://cursor.com',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Ashby',
      },
      {
        name: 'Retool',
        website: 'https://retool.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Loom',
        website: 'https://loom.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
      },
      {
        name: 'Ramp',
        website: 'https://ramp.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'STARTUP',
        ats: 'Greenhouse',
      },
      {
        name: 'Coinbase',
        website: 'https://coinbase.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
    ],
  },
  {
    label: 'Techstars',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.85,
    companies: [
      {
        name: 'SendGrid',
        website: 'https://sendgrid.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
      },
      {
        name: 'Zayo',
        website: 'https://zayo.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'ClassPass',
        website: 'https://classpass.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'STARTUP',
      },
      {
        name: 'DigitalOcean',
        website: 'https://digitalocean.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
    ],
  },
  {
    label: '500 Global',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.8,
    companies: [
      {
        name: 'Canva',
        website: 'https://canva.com',
        country: 'Australia',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Lever',
      },
      {
        name: 'Talkdesk',
        website: 'https://talkdesk.com',
        country: 'USA',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Grab',
        website: 'https://grab.com',
        country: 'Singapore',
        stage: 'UNICORN',
        type: 'BIG_TECH',
      },
    ],
  },
  {
    label: 'Antler',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.75,
    companies: [
      {
        name: 'TensorFlight',
        website: 'https://tensorflight.com',
        country: 'USA',
        stage: 'EARLY',
        type: 'AI_LAB',
      },
      {
        name: 'Hevo Data',
        website: 'https://hevodata.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'GROWTH',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'EpiFi',
        website: 'https://epifi.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'GROWTH',
        type: 'STARTUP',
      },
      {
        name: 'Covr',
        website: 'https://covr.com',
        country: 'Denmark',
        stage: 'EARLY',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'Sequoia Surge',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.9,
    companies: [
      {
        name: 'Khatabook',
        website: 'https://khatabook.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'GROWTH',
        type: 'STARTUP',
      },
      {
        name: 'Razorpay',
        website: 'https://razorpay.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
        confidence: 'HIGH',
      },
      {
        name: 'Vedantu',
        website: 'https://vedantu.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'Peak XV',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.92,
    companies: [
      {
        name: 'Groww',
        website: 'https://groww.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
        confidence: 'HIGH',
      },
      {
        name: 'Dream11',
        website: 'https://dream11.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Gupshup',
        website: 'https://gupshup.io',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Licious',
        website: 'https://licious.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'MCaffeine',
        website: 'https://mcaffeine.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'GROWTH',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'Accel',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.9,
    companies: [
      {
        name: 'Flipkart',
        website: 'https://flipkart.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Swiggy',
        website: 'https://swiggy.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Zomato',
        website: 'https://zomato.com',
        country: 'India',
        city: 'Gurugram',
        stage: 'PUBLIC',
        type: 'STARTUP',
      },
      {
        name: 'Freshworks',
        website: 'https://freshworks.com',
        country: 'India',
        city: 'Chennai',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Workable',
        confidence: 'HIGH',
      },
      {
        name: 'BrowserStack',
        website: 'https://browserstack.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
        confidence: 'HIGH',
      },
    ],
  },
  {
    label: 'Nexus Venture Partners',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.78,
    companies: [
      {
        name: 'Postman',
        website: 'https://postman.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
        confidence: 'HIGH',
      },
      {
        name: 'Delhivery',
        website: 'https://delhivery.com',
        country: 'India',
        city: 'Gurugram',
        stage: 'PUBLIC',
        type: 'STARTUP',
      },
      {
        name: 'Turtlefin',
        website: 'https://turtlefin.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'EARLY',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'Blume Ventures',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.8,
    companies: [
      {
        name: 'Porter',
        website: 'https://porter.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'OfBusiness',
        website: 'https://ofbusiness.com',
        country: 'India',
        city: 'Gurugram',
        stage: 'UNICORN',
        type: 'STARTUP',
        confidence: 'HIGH',
      },
      {
        name: 'Unacademy',
        website: 'https://unacademy.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        confidence: 'HIGH',
      },
      {
        name: 'Cashfree',
        website: 'https://cashfree.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'India Quotient',
    category: 'STARTUP_ACCELERATOR',
    source: 'STARTUP_ACCELERATOR',
    strength: 0.7,
    companies: [
      {
        name: 'ShareChat',
        website: 'https://sharechat.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        confidence: 'HIGH',
      },
      {
        name: 'Lendingkart',
        website: 'https://lendingkart.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'GROWTH',
        type: 'STARTUP',
      },
      {
        name: 'Vedantu',
        website: 'https://vedantu.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
    ],
  },

  // ─── Indian Startup Ecosystem ──────────────────────────────────────────
  {
    label: 'Startup India',
    category: 'INDIAN_STARTUP_ECOSYSTEM',
    source: 'INDIAN_STARTUP_ECOSYSTEM',
    strength: 0.7,
    companies: [
      {
        name: 'Razorpay',
        website: 'https://razorpay.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
      },
      {
        name: 'Meesho',
        website: 'https://meesho.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'CRED',
        website: 'https://cred.club',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Zepto',
        website: 'https://zepto.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Groww',
        website: 'https://groww.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
    ],
  },
  {
    label: 'YourStory Startups',
    category: 'INDIAN_STARTUP_ECOSYSTEM',
    source: 'INDIAN_STARTUP_ECOSYSTEM',
    strength: 0.55,
    companies: [
      {
        name: 'Freshworks',
        website: 'https://freshworks.com',
        country: 'India',
        city: 'Chennai',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Workable',
      },
      {
        name: 'Chargebee',
        website: 'https://chargebee.com',
        country: 'India',
        city: 'Chennai',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Postman',
        website: 'https://postman.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
    ],
  },
  {
    label: 'Inc42',
    category: 'INDIAN_STARTUP_ECOSYSTEM',
    source: 'INDIAN_STARTUP_ECOSYSTEM',
    strength: 0.5,
    companies: [
      {
        name: 'PhonePe',
        website: 'https://phonepe.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Juspay',
        website: 'https://juspay.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
      },
      {
        name: 'ElasticRun',
        website: 'https://elastic.run',
        country: 'India',
        city: 'Pune',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
    ],
  },

  // ─── Unicorns (maintained deterministic registry) ─────────────────────
  {
    label: 'Unicorn Registry',
    category: 'UNICORN',
    source: 'UNICORN_REGISTRY',
    strength: 0.95,
    companies: [
      {
        name: 'Razorpay',
        website: 'https://razorpay.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
      },
      {
        name: 'Meesho',
        website: 'https://meesho.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'CRED',
        website: 'https://cred.club',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Zepto',
        website: 'https://zepto.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Groww',
        website: 'https://groww.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'BrowserStack',
        website: 'https://browserstack.com',
        country: 'India',
        city: 'Mumbai',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Postman',
        website: 'https://postman.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'PhonePe',
        website: 'https://phonepe.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Juspay',
        website: 'https://juspay.in',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
        ats: 'Greenhouse',
      },
      {
        name: 'Unacademy',
        website: 'https://unacademy.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'ShareChat',
        website: 'https://sharechat.com',
        country: 'India',
        city: 'Bengaluru',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'ElasticRun',
        website: 'https://elastic.run',
        country: 'India',
        city: 'Pune',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'OfBusiness',
        website: 'https://ofbusiness.com',
        country: 'India',
        city: 'Gurugram',
        stage: 'UNICORN',
        type: 'STARTUP',
      },
      {
        name: 'Freshworks',
        website: 'https://freshworks.com',
        country: 'India',
        city: 'Chennai',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Workable',
      },
      {
        name: 'Chargebee',
        website: 'https://chargebee.com',
        country: 'India',
        city: 'Chennai',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
    ],
  },

  // ─── Developer Companies ──────────────────────────────────────────────
  {
    label: 'Developer Companies',
    category: 'DEVELOPER_COMPANY',
    source: 'DEVELOPER_REGISTRY',
    strength: 0.88,
    companies: [
      {
        name: 'Supabase',
        website: 'https://supabase.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Ashby',
      },
      {
        name: 'Cloudflare',
        website: 'https://cloudflare.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Vercel',
        website: 'https://vercel.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Ashby',
      },
      {
        name: 'Netlify',
        website: 'https://netlify.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Redis',
        website: 'https://redis.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Lever',
      },
      {
        name: 'Databricks',
        website: 'https://databricks.com',
        country: 'USA',
        stage: 'UNICORN',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Snowflake',
        website: 'https://snowflake.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'PlanetScale',
        website: 'https://planetscale.com',
        country: 'USA',
        stage: 'GROWTH',
        type: 'DEVELOPER_TOOLS',
        ats: 'Ashby',
      },
      {
        name: 'MongoDB',
        website: 'https://mongodb.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Hashicorp',
        website: 'https://hashicorp.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Docker',
        website: 'https://docker.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'GitHub',
        website: 'https://github.com',
        country: 'USA',
        stage: 'ENTERPRISE',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'GitLab',
        website: 'https://gitlab.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'PostHog',
        website: 'https://posthog.com',
        country: 'USA',
        stage: 'GROWTH',
        type: 'DEVELOPER_TOOLS',
        ats: 'Ashby',
      },
    ],
  },

  // ─── AI Companies ─────────────────────────────────────────────────────
  {
    label: 'AI Companies',
    category: 'AI_COMPANY',
    source: 'AI_REGISTRY',
    strength: 0.92,
    companies: [
      {
        name: 'OpenAI',
        website: 'https://openai.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Anthropic',
        website: 'https://anthropic.com',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Perplexity',
        website: 'https://perplexity.ai',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Ashby',
      },
      {
        name: 'Cursor',
        website: 'https://cursor.com',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Ashby',
      },
      {
        name: 'Cohere',
        website: 'https://cohere.com',
        country: 'Canada',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Mistral',
        website: 'https://mistral.ai',
        country: 'France',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'HuggingFace',
        website: 'https://huggingface.co',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'ElevenLabs',
        website: 'https://elevenlabs.io',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Runway',
        website: 'https://runwayml.com',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Scale AI',
        website: 'https://scale.com',
        country: 'USA',
        stage: 'UNICORN',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
      {
        name: 'Together AI',
        website: 'https://together.ai',
        country: 'USA',
        stage: 'GROWTH',
        type: 'AI_LAB',
        ats: 'Ashby',
      },
      {
        name: 'Weights & Biases',
        website: 'https://wandb.ai',
        country: 'USA',
        stage: 'SCALEUP',
        type: 'AI_LAB',
        ats: 'Greenhouse',
      },
    ],
  },

  // ─── Big Tech ─────────────────────────────────────────────────────────
  {
    label: 'Big Tech',
    category: 'BIG_TECH',
    source: 'BIG_TECH_REGISTRY',
    strength: 0.85,
    companies: [
      {
        name: 'Google',
        website: 'https://google.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
        ats: 'Greenhouse',
      },
      {
        name: 'Microsoft',
        website: 'https://microsoft.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Meta',
        website: 'https://meta.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
        ats: 'Greenhouse',
      },
      {
        name: 'Amazon',
        website: 'https://amazon.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
        ats: 'Greenhouse',
      },
      {
        name: 'NVIDIA',
        website: 'https://nvidia.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Apple',
        website: 'https://apple.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
      {
        name: 'Adobe',
        website: 'https://adobe.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
        ats: 'Greenhouse',
      },
      {
        name: 'Atlassian',
        website: 'https://atlassian.com',
        country: 'Australia',
        stage: 'PUBLIC',
        type: 'DEVELOPER_TOOLS',
        ats: 'Greenhouse',
      },
      {
        name: 'Salesforce',
        website: 'https://salesforce.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
        ats: 'Greenhouse',
      },
      {
        name: 'Oracle',
        website: 'https://oracle.com',
        country: 'USA',
        stage: 'PUBLIC',
        type: 'BIG_TECH',
      },
    ],
  },
];

/**
 * Flattened lookup of every curated company keyed by normalized website host.
 */
export const SEED_COMPANIES_BY_HOST: Map<string, { ecosystem: string; company: SeedCompany }> =
  (() => {
    const map = new Map<string, { ecosystem: string; company: SeedCompany }>();
    for (const eco of ECOSYSTEMS) {
      for (const company of eco.companies) {
        const host = normalizeHost(company.website);
        if (host && !map.has(host)) {
          map.set(host, { ecosystem: eco.label, company });
        }
      }
    }
    return map;
  })();

export function normalizeHost(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return host;
  } catch {
    return url
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/^https?:\/\//, '');
  }
}

/**
 * Converts a curated seed company into a CompanyCandidate.
 */
export function seedToCandidate(eco: EcosystemDefinition, company: SeedCompany): CompanyCandidate {
  const careersUrl = company.careersUrl || deriveCareersUrl(company.website);
  return {
    name: company.name,
    website: company.website,
    careersUrl,
    ecosystem: eco.category,
    country: company.country,
    city: company.city,
    companyStage: company.stage,
    companyType: company.type,
    source: eco.source,
    confidence: company.confidence || 'HIGH',
    ats: company.ats,
    ecosystemLabel: eco.label,
  };
}

/**
 * Deterministic careers URL derivation from a known homepage.
 */
export function deriveCareersUrl(website: string): string {
  const base = website.replace(/\/+$/, '');
  return `${base}/careers`;
}
