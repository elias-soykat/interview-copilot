export const DEFAULT_RESUME_OBJECT = {
  personal_information: {
    full_name: 'Elias Soykat',
    professional_title: 'Senior Full Stack Developer',
    email: 'elias.soykat1@gmail.com',
    portfolio: 'https://elias-soykat.pages.dev',
    linkedin: 'https://linkedin.com/in/elias-soykat',
    github: 'https://github.com/elias-soykat',
    location: 'Dhaka, Bangladesh',
    availability: 'Open to Remote'
  },
  professional_summary:
    'Senior Full Stack Software Engineer with 6+ years of experience designing and building production web applications, SaaS platforms, and distributed backend systems across E-commerce, Fintech, and GovTech. Proficient in TypeScript, React.js, Next.js, Node.js, NestJS, PostgreSQL, Redis, Kafka, and AWS. Experienced in system architecture, event-driven services, technical documentation, code reviews, and mentoring, with a track record of building bulk catalog pipelines processing 100K+ products (80% reduction in manual operations), real-time trading interfaces with TOTP MFA and KYC/AML workflows, and GraphQL APIs sustaining 99.9% uptime while reducing third-party integration time by 40%.',
  technical_skills: {
    languages: ['TypeScript', 'JavaScript (ES2022+)', 'SQL', 'Bash'],
    frontend: [
      'React.js',
      'Next.js',
      'React Native',
      'Vite',
      'Redux',
      'TanStack Query',
      'Tailwind CSS',
      'SSR',
      'SSG',
      'ISR',
      'Accessibility (WCAG)'
    ],
    backend: [
      'Node.js',
      'NestJS',
      'Express.js',
      'REST APIs',
      'GraphQL',
      'Apollo GraphQL',
      'gRPC',
      'WebSockets',
      'BullMQ',
      'Kafka'
    ],
    databases: ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma', 'Drizzle ORM'],
    ai_and_media: [
      'MCP',
      'Gemini',
      'Claude Code',
      'Deepgram',
      'ElevenLabs',
      'LiveKit',
      'WebRTC',
      'FFmpeg'
    ],
    infrastructure_and_tools: [
      'AWS Lambda',
      'AWS S3',
      'AWS EC2',
      'AWS DynamoDB',
      'Docker',
      'CI/CD',
      'Datadog',
      'Linux',
      'Nginx',
      'Git',
      'System Design',
      'Distributed Systems',
      'Agile',
      'Scrum'
    ]
  },
  professional_experience: [
    {
      company: 'TechnoNext Software Limited',
      position: 'Senior Full Stack Developer',
      location: 'Dhaka, Bangladesh',
      start_date: '2025-06',
      end_date: null,
      currently_working: true,
      responsibilities_and_achievements: [
        'Architected a bulk product import pipeline using Node.js, NestJS, BullMQ workers, and AWS S3 with multi-stage validation workflows, automating catalog onboarding for 100K+ products and achieving an 80% reduction in manual operations.',
        'Engineered event-driven microservices with Apache Kafka and TypeScript, authoring architecture decision records to formalize service boundaries, asynchronous messaging contracts, and fault-tolerant execution.',
        'Implemented internal gRPC services backed by NestJS and PostgreSQL for structured inter-service communication across real-time inventory management, seller validation, voucher processing, and logistics integrations.',
        'Delivered an end-to-end order lifecycle system integrating third-party logistics APIs, SLA tracking, automated notifications, and live operational monitoring to keep multi-vendor fulfillment reliable.',
        'Diagnosed and resolved BullMQ and Redis queue bottlenecks, retry failures, and timeout instability under peak catalog workloads, stabilizing background job execution and system throughput.',
        'Built full-stack seller and administration dashboards with React.js, TypeScript, and NestJS to streamline complex catalog management and operational order workflows.',
        'Conducted peer code reviews, provided technical mentoring to engineers, and contributed to shared engineering standards and codebase maintainability across backend and full-stack modules.'
      ]
    },
    {
      company: 'NEXT Ventures',
      position: 'Senior Frontend Developer',
      location: 'Dhaka, Bangladesh',
      start_date: '2023-08',
      end_date: '2025-05',
      currently_working: false,
      responsibilities_and_achievements: [
        'Architected core frontend modules and reusable React component patterns in Next.js and TypeScript for a fintech trading platform handling live market data, transactional workflows, and compliance-sensitive operations.',
        'Engineered WebSocket-driven real-time market and portfolio dashboards for high-frequency activity, applying React memoization and structured state isolation to prevent unnecessary re-renders.',
        'Designed scalable client state management and authorization workflows synchronizing authentication, trader onboarding, trading execution, and real-time portfolio balances.',
        'Implemented TOTP-based multi-factor authentication (MFA), device fingerprinting, and KYC/AML onboarding using Sumsub OCR verification to strengthen account security and streamline identity checks.',
        'Delivered multilingual internationalization across 5+ languages using Next.js and i18next, standardizing modular dashboard layouts and reusable UI structures.',
        'Conducted code reviews, mentored engineers, and documented frontend architectural decisions and component standards to improve code quality and maintainability.',
        'Collaborated with backend, product, and QA teams to ship responsive financial workflows end-to-end, including server-side PDF certificate generation and operational dashboard features.'
      ]
    },
    {
      company: 'Dorik AI',
      position: 'Backend Developer (Node.js)',
      location: 'Sylhet, Bangladesh',
      start_date: '2022-06',
      end_date: '2023-07',
      currently_working: false,
      responsibilities_and_achievements: [
        'Designed and maintained a public-facing Node.js and GraphQL API platform powering integrations with Zapier, Notion, and Google Docs across thousands of daily developer requests.',
        'Reduced third-party partner integration time by 40% through cleaner GraphQL schema design, consistent error contracts, and structured developer documentation.',
        'Implemented OAuth2 authentication, token-based rate limiting, and fault-tolerant error handling to safeguard API reliability under high-concurrency traffic.',
        'Integrated Airtable as a headless CMS backend, achieving a 20% reduction in internal content operations workload.',
        'Instrumented Datadog observability across metrics, traces, and alerting for production services, sustaining 99.9% API uptime.'
      ]
    },
    {
      company: 'Penta Global Limited',
      position: 'Frontend Developer',
      location: 'Dhaka, Bangladesh',
      start_date: '2019-04',
      end_date: '2022-05',
      currently_working: false,
      responsibilities_and_achievements: [
        'Engineered core frontend architecture and reusable React.js modules for a government-backed digital investment platform, contributing to a 23% increase in regional investment registrations.',
        'Developed a QR-code digital certificate issuance and verification system integrated with backend REST APIs, achieving a 30% reduction in manual certificate processing time.',
        'Migrated 30+ legacy Laravel views to modular React.js components while preserving data integrity and REST API compatibility.',
        'Partnered with backend and QA teams to deliver responsive, cross-browser compatible production features with improved usability across public-sector workflows.'
      ]
    }
  ],
  "key_projects": [
    {
      "name": "HelpGrid",
      "tagline": "AI-Powered Customer Support & Sales Automation Platform",
      "url": "https://helpgrid.pages.dev",
      "description":
        "Architecting a multi-tenant SaaS customer support and sales automation platform integrating shared inbox, ticket management, contact management, and AI-powered workflows. Building a unified AI orchestration layer with RAG-based knowledge retrieval and multi-LLM support. Designed modular services for API, AI agents, background processing, and customer-facing interfaces, with omnichannel integrations, role-based access control, and approval workflows."
    },
    {
      "name": "Interview Copilot",
      "tagline": "Open-Source Real-Time AI Interview Assistant",
      "url": "https://github.com/elias-soykat/interview-copilot",
      "description":
        "Developed a cross-platform Electron application for real-time AI-powered interview assistance. Integrated microphone and system audio capture with Whisper speech-to-text, intelligent question detection, and GPT-generated contextual responses. Implemented screenshot-based code analysis using OpenAI Vision, secure IPC communication, encrypted settings storage, and interview session management."
    }
  ],
  "education": [
    {
      "institution": "National University Bangladesh",
      "degree": "Bachelor of Science (BSc) Coursework",
      "field_of_study": null,
      "status": "Incomplete",
      "location": "Dhaka, Bangladesh",
      "start_year": 2015,
      "end_year": 2020
    }
  ]
}

export const DEFAULT_RESUME_DESCRIPTION = JSON.stringify(DEFAULT_RESUME_OBJECT, null, 2)
