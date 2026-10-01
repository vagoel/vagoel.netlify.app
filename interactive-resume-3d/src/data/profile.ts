export type SceneKey = 'hy5' | 'offline' | 'hackathon' | 'client360' | 'components' | 'cat' | 'adia';

export interface Role {
  id: string;
  short: string;
  company: string;
  org?: string;
  title: string;
  start: string;
  end: string | null;
  city: string;
  country: string;
  type: string;
  summary: string;
  bullets: string[];
  tech: string[];
  highlight?: string;
  boss?: boolean;
  scene: SceneKey;
}

export interface SkillGroup {
  id: string;
  name: string;
  color: string;
  skills: string[];
}

export interface Honor {
  title: string;
  event: string;
  org: string;
  date?: string;
  tier: 'gold' | 'silver' | 'star';
  note?: string;
}

export interface Cert {
  title: string;
  short: string;
  issuer: string;
  date: string;
  note?: string;
}

export const profile = {
  name: 'Varun Goel',
  initials: 'VG',
  headline: 'User Interface Specialist',
  tagline: 'High-performance trading applications · AI engineering',
  location: 'Abu Dhabi, United Arab Emirates',
  company: 'Abu Dhabi Investment Authority (ADIA)',
  siteUrl: 'https://www.vagoel.com',
  careerStart: '2011-04',
  languages: ['English (full professional)', 'Hindi (native)'],
  links: { linkedin: 'https://www.linkedin.com/in/goelvarun88' } as Record<string, string>,
  about: [
    'I build the screens where fast decisions get made. For fifteen years I have turned complicated systems into interfaces people trust under pressure, from hybrid mobile platforms in Pune and hackathon-winning demos at Adobe to a global credit-trading command centre in Singapore.',
    'Today, from Abu Dhabi, I lead UI architecture for front-office trading and portfolio platforms at ADIA, set the UI strategy for the teams around me, and bring AI-driven engineering to legacy systems.',
  ],
};

export const roles: Role[] = [
  {
    id: 'tcs',
    short: 'TCS',
    company: 'Tata Consultancy Services',
    org: 'TRDDC',
    title: 'Systems Engineer',
    start: '2011-04',
    end: '2013-06',
    city: 'Pune',
    country: 'India',
    type: 'Full-time',
    summary:
      'Began at the Tata Research Development and Design Centre, prototyping a way to build hybrid mobile apps at speed. That prototype matured into TCS Hy5 Canvas.',
    bullets: [
      'Prototyped rapid hybrid-mobile app generation at TRDDC',
      'Prototype matured into TCS Hy5 Canvas: an HTML5 platform generating OS-agnostic apps for Android, iOS and more from one codebase',
    ],
    tech: ['Java', 'Phonegap', 'ExtJs', 'HTML', 'JavaScript', 'CSS'],
    highlight: 'Star of the Batch · Top Performer',
    scene: 'hy5',
  },
  {
    id: 'extentia',
    short: 'Extentia',
    company: 'Extentia Information Technology',
    title: 'Software Professional',
    start: '2013-06',
    end: '2014-06',
    city: 'Pune',
    country: 'India',
    type: 'Full-time',
    summary: 'Modernised banking software for SunGard (now FIS) and shipped an offline-first app for oil and gas plants.',
    bullets: [
      'Built a web-based suite of banking products at SunGard (now FIS), moving a legacy codebase to HTML5 and AngularJS',
      'Delivered an offline-first data-collection app for oil and gas plants: runs fully offline, stores locally, syncs when connectivity returns',
    ],
    tech: ['HTML5', 'CSS3', 'AngularJs', 'ES5', 'IndexedDB', 'SQLite', 'Application Cache'],
    highlight: 'Hackathon13 finalist, SunGard global coding challenge',
    scene: 'offline',
  },
  {
    id: 'adobe',
    short: 'Adobe',
    company: 'Adobe',
    org: 'Global Services',
    title: 'Tools Developer',
    start: '2014-06',
    end: '2016-07',
    city: 'Noida',
    country: 'India',
    type: 'Full-time',
    summary: 'Built the demo apps and internal tools global sales consultants used to show what Adobe could do, and won the company hackathon.',
    bullets: [
      'Built platform-agnostic demo mobile apps (Phonegap, Ionic) showing design experiences, usage analytics and engagement via Adobe Mobile Services and AEM',
      'Key owner of AGSInsight, an internal desktop app built with web technology that helps management track sales activity',
    ],
    tech: ['AEM', 'AEM Mobile', 'Adobe Mobile Services', 'Phonegap', 'Ionic', 'BackboneJs', 'AngularJs', 'NodeJs'],
    highlight: 'Overall Winner: Adobe Hackathon & Google IO Extended',
    scene: 'hackathon',
  },
  {
    id: 'scb-dev',
    short: 'StanChart',
    company: 'Standard Chartered Bank',
    title: 'Senior Developer',
    start: '2016-07',
    end: '2018-01',
    city: 'Singapore',
    country: 'Singapore',
    type: 'Contract',
    summary: 'Gave client-engagement staff a holistic 360-degree view of every client, across every product segment.',
    bullets: [
      'Developed modules of an enterprise workbench for a 360° client view across all product segments',
      'Contributed to the component library and built reusable components used widely across the workbench',
    ],
    tech: ['EmberJs', 'ES6', 'HTML5', 'CSS3', 'Google Material Design', 'NodeJs'],
    scene: 'client360',
  },
  {
    id: 'aviva',
    short: 'Aviva',
    company: 'Aviva',
    org: 'Digital Garage',
    title: 'Senior Frontend Developer',
    start: '2018-01',
    end: '2019-09',
    city: 'Singapore',
    country: 'Singapore',
    type: 'Full-time',
    summary: 'Built the reusable component library that every global Aviva website stands on.',
    bullets: [
      'Built a UI component library consumed directly by all global Aviva sites: accessible, testable, fully responsive',
      'Reviewed pull requests across teams to keep fortnightly deliverables on quality',
      'Ran weekly UI meetups to spread best practice, performance wins and automation',
      'Shipped Aviva Singapore, Aviva Corporate and Aviva UK from standalone, composable components',
    ],
    tech: ['ReactJS', 'ES6', 'HTML5', 'CSS3', 'AEM', 'NodeJs', 'Gulp', 'Webpack', 'WebdriverIO', 'Jasmine'],
    scene: 'components',
  },
  {
    id: 'scb-cat',
    short: 'StanChart',
    company: 'Standard Chartered Bank',
    title: 'User Interface Specialist',
    start: '2019-09',
    end: '2025-03',
    city: 'Singapore',
    country: 'Singapore',
    type: 'Full-time',
    summary:
      'Built the UI framework for Cognitive Algorithmic Trading (CAT), a greenfield digitalisation of global credit trading that puts front-office data and functions into one command centre.',
    bullets: [
      'Micro-application architecture: granular components that combine into complex custom layouts',
      'React + Openfin desktop app on a high-performance Solace messaging bus into financial market systems',
      'Server-Driven UI: layout and data controlled server-side, cutting turnaround time for new apps',
      'Multi-desktop workspaces users can save, restore and share with peers',
    ],
    tech: ['ReactJS', 'TypeScript', 'Material-UI', 'Openfin', 'Solace', 'Highcharts', 'Ag-Grid', 'Java', 'Azure'],
    highlight: 'Boss level: the CAT platform',
    boss: true,
    scene: 'cat',
  },
  {
    id: 'adia',
    short: 'ADIA',
    company: 'Abu Dhabi Investment Authority',
    org: 'ADIA',
    title: 'Senior Specialist',
    start: '2025-03',
    end: null,
    city: 'Abu Dhabi',
    country: 'United Arab Emirates',
    type: 'Full-time',
    summary: 'Leading UI architecture for front-office trading and portfolio management, and bringing AI into legacy systems.',
    bullets: [
      'Lead UI architecture for front-office trading and portfolio management platforms',
      'Set the UI development strategy so every project shares consistent design and best practice',
      'Modernise legacy systems with AI-driven capabilities',
      'Enable and mentor teams to build high-performance modern web applications',
    ],
    tech: ['TypeScript', 'React', 'AI Engineering', 'Agentic workflows', 'Design systems'],
    highlight: 'Present day',
    boss: true,
    scene: 'adia',
  },
];

export const skillGroups: SkillGroup[] = [
  {
    id: 'core',
    name: 'Front-end Core',
    color: '#4dd8ff',
    skills: ['TypeScript', 'JavaScript', 'React', 'Redux', 'HTML5', 'CSS3', 'Accessibility', 'UX'],
  },
  {
    id: 'trading',
    name: 'Trading Systems',
    color: '#ffc857',
    skills: ['Openfin', 'Solace EDA', 'Ag-Grid', 'Highcharts', 'Low latency', 'Server-driven UI'],
  },
  {
    id: 'platforms',
    name: 'Platforms & Tooling',
    color: '#ff6b9a',
    skills: ['Material-UI', 'Ember', 'Angular', 'Backbone', 'Node.js', 'Webpack', 'AEM', 'Ionic'],
  },
  {
    id: 'cloud',
    name: 'Cloud & Data',
    color: '#7cf29c',
    skills: ['Azure', 'Java', 'IndexedDB', 'Tableau', 'Git'],
  },
  {
    id: 'ai',
    name: 'AI Engineering',
    color: '#b388ff',
    skills: ['Agentic AI', 'GenAI', 'Voice agents', 'AI modernisation', 'LLM tooling'],
  },
];

export const sideQuest = {
  title: 'SightSpeak',
  subtitle: 'Control any website with your voice',
  context: 'AI Tinkerers hackathon · OpenAI Agents',
  summary:
    'Built with a teammate at an AI Tinkerers hackathon: one click to interact with any webpage by voice. Speak naturally to ask for information, navigate, scroll, click, fill forms and run multi-step workflows.',
  tech: ['OpenAI Agents', 'CopilotKit', 'OpenRouter', 'Exa', 'Auth0', 'Trigger.dev'],
  prompts: ['"scroll to pricing"', '"fill in my details"', '"open the second result"'],
};

export const honors: Honor[] = [
  { title: 'Overall Winner', event: 'Google IO Extended Hackathon', org: 'Adobe', date: '2016-05', tier: 'gold' },
  { title: 'Overall Winner', event: 'Adobe Hackathon', org: 'Adobe', date: '2016-04', tier: 'gold', note: 'Three days around the clock to deliver a multi-solution, multi-platform architecture' },
  { title: 'Multi Channel Award', event: 'Adobe Hackathon', org: 'Adobe', date: '2016-04', tier: 'gold' },
  { title: 'Finalist', event: 'Hackathon13, SunGard global coding challenge', org: 'Extentia', tier: 'silver' },
  { title: 'Bit Fighter, 2nd prize', event: 'ISTE university-level competition', org: 'Kurukshetra University', tier: 'silver' },
  { title: 'Techyard, 2nd prize', event: 'ISTE competition', org: 'Kurukshetra University', tier: 'silver' },
  { title: 'Star of the Batch', event: 'Tata Consultancy Services', org: 'TCS', tier: 'star' },
  { title: 'Top Performer', event: 'TCS training period', org: 'TCS', tier: 'star' },
  { title: 'Social Media Ambassador', event: 'Adobe', org: 'Adobe', tier: 'star' },
];

export const certs: Cert[] = [
  { title: 'Elastic GenAI Associate', short: 'ELASTIC', issuer: 'Elastic', date: '2025-03' },
  { title: 'Data Storytelling & Visualisation for Finance', short: 'DATA', issuer: 'Tertiary Infotech Academy', date: '2023-09' },
  { title: 'Powerful Storytelling & Cut Through Communication', short: 'STORY', issuer: 'Eagles Flight Asia Pacific', date: '2023-01' },
  { title: 'Microsoft Certified: Azure Developer Associate', short: 'AZ-204', issuer: 'Microsoft', date: '2022-07' },
  { title: 'Hands-on Practical Applications of Blockchain', short: 'CHAIN', issuer: 'Singapore Management University', date: '2021-12' },
  { title: 'Advanced Certificate in Blockchain for Business', short: 'BLOCK', issuer: 'Singapore Management University', date: '2021-11' },
  { title: 'Solace Certified EDA Practitioner', short: 'SOLACE', issuer: 'Solace', date: '2021-06' },
  { title: 'Internet of Things: Technology & Applications', short: 'IOT', issuer: 'Singapore Management University', date: '2020-12' },
  { title: 'Microsoft Certified: Azure Fundamentals', short: 'AZ-900', issuer: 'Microsoft', date: '2020-07' },
  { title: 'Mobile Web Specialist', short: 'MWS', issuer: 'Google', date: '2019-09' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : String(y);
};

export const fmtRange = (r: Role) => `${fmtMonth(r.start)} – ${r.end ? fmtMonth(r.end) : 'Present'}`;

export const monthsBetween = (a: string, b: string | null) => {
  const [y1, m1] = a.split('-').map(Number);
  const now = new Date();
  const [y2, m2] = b ? b.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  return (y2 - y1) * 12 + (m2 - m1);
};

export const fmtDuration = (r: Role) => {
  const m = monthsBetween(r.start, r.end);
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', mo ? `${mo} mo${mo > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ');
};

export const yearsOfExperience = () => Math.floor(monthsBetween(profile.careerStart, null) / 12);

export const stats = () => [
  { value: `${yearsOfExperience()}+`, label: 'Years building UI' },
  { value: String(new Set(roles.map((r) => r.company)).size), label: 'Companies' },
  { value: String(new Set(roles.map((r) => r.city)).size), label: 'Cities' },
  { value: String(honors.filter((h) => h.tier === 'gold').length), label: 'Hackathon wins' },
  { value: String(certs.length), label: 'Certifications' },
];
