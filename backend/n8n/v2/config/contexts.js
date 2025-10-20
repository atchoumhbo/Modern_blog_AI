/**
 * Configuration des contextes pour génération de prompts enrichis
 * Support: Tech, Microsoft 365, Sécurité, Cloud, DevOps
 */

const CONTEXTS = {
  // ============================================================================
  // MICROSOFT 365 & AZURE
  // ============================================================================
  microsoft365: {
    category: 'Microsoft 365',
    keywords: ['office 365', 'o365', 'microsoft 365', 'm365', 'office', 'microsoft suite'],
    visualStyle: 'modern Microsoft Office interface, blue and white color scheme, productivity workspace, clean corporate design',
    technicalElements: ['cloud applications', 'collaboration tools', 'business productivity'],
    dominantColors: ['#0078D4', '#FFFFFF', '#50E6FF'], // Microsoft Blue
    style: 'photographic'
  },

  teams: {
    category: 'Microsoft Teams',
    keywords: ['teams', 'microsoft teams', 'ms teams', 'teams meeting', 'teams chat'],
    visualStyle: 'Microsoft Teams collaboration interface, purple accent, video conferencing, team chat bubbles, modern communication',
    technicalElements: ['video call grid', 'chat interface', 'collaboration workspace'],
    dominantColors: ['#6264A7', '#FFFFFF', '#8B8CC7'], // Teams Purple
    style: 'digital-art'
  },

  sharepoint: {
    category: 'SharePoint',
    keywords: ['sharepoint', 'sharepoint online', 'sp online', 'document management'],
    visualStyle: 'SharePoint document library interface, organized folders, file sharing concept, enterprise content management',
    technicalElements: ['document icons', 'folder structure', 'collaboration hub'],
    dominantColors: ['#036C70', '#FFFFFF', '#00B7C3'], // SharePoint Teal
    style: 'digital-art'
  },

  intune: {
    category: 'Microsoft Intune',
    keywords: ['intune', 'microsoft intune', 'mdm', 'mobile device management', 'endpoint management'],
    visualStyle: 'device management dashboard, mobile devices and laptops, security shield, enterprise mobility',
    technicalElements: ['device icons', 'security badges', 'management console'],
    dominantColors: ['#0078D4', '#107C10', '#FFFFFF'], // Microsoft Blue + Green
    style: 'digital-art'
  },

  azure: {
    category: 'Microsoft Azure',
    keywords: ['azure', 'microsoft azure', 'azure cloud', 'azure services'],
    visualStyle: 'cloud infrastructure diagram, Azure logo, data center visualization, cloud computing network',
    technicalElements: ['cloud icons', 'network connections', 'server racks'],
    dominantColors: ['#0078D4', '#50E6FF', '#FFFFFF'], // Azure Blue
    style: 'digital-art'
  },

  powershell: {
    category: 'PowerShell',
    keywords: ['powershell', 'ps1', 'powershell script', 'pwsh', 'powershell core'],
    visualStyle: 'PowerShell terminal window, blue console background, white command text, scripting automation',
    technicalElements: ['terminal interface', 'code snippets', 'automation icons'],
    dominantColors: ['#012456', '#FFFFFF', '#0178D4'], // PowerShell Blue
    style: 'digital-art'
  },

  // ============================================================================
  // SÉCURITÉ & CYBERSECURITY
  // ============================================================================
  cve: {
    category: 'Vulnerability (CVE)',
    keywords: ['cve', 'vulnerability', 'security flaw', 'exploit', 'patch', 'security update'],
    visualStyle: 'cybersecurity alert, vulnerability scanner display, red warning indicators, security patch concept',
    technicalElements: ['warning symbols', 'security shield', 'code vulnerabilities'],
    dominantColors: ['#D13438', '#FFB900', '#000000'], // Red + Yellow (Alert)
    style: 'digital-art',
    mood: 'urgent, critical, technical'
  },

  malware: {
    category: 'Malware & Threats',
    keywords: ['malware', 'virus', 'trojan', 'ransomware', 'spyware', 'adware', 'rootkit'],
    visualStyle: 'cybersecurity threat visualization, malicious code, virus scanning, dark cyber background with red alerts',
    technicalElements: ['virus icons', 'infected files', 'threat detection'],
    dominantColors: ['#D13438', '#000000', '#FF4343'], // Red + Black
    style: 'digital-art',
    mood: 'threatening, dangerous, dark'
  },

  ransomware: {
    category: 'Ransomware',
    keywords: ['ransomware', 'crypto-locker', 'encryption attack', 'ransom demand'],
    visualStyle: 'locked encrypted files, ransom note display, skull and crossbones, dark cyber crime aesthetic',
    technicalElements: ['padlock icons', 'encrypted data', 'bitcoin symbols'],
    dominantColors: ['#D13438', '#FFB900', '#000000'], // Red + Gold
    style: 'digital-art',
    mood: 'menacing, criminal, urgent'
  },

  zeroday: {
    category: 'Zero-Day Exploit',
    keywords: ['zero-day', 'zero day', '0-day', 'undisclosed vulnerability', 'exploit kit'],
    visualStyle: 'critical security breach, unknown threat visualization, emergency cyber alert, sophisticated attack diagram',
    technicalElements: ['breach indicators', 'emergency alerts', 'sophisticated code'],
    dominantColors: ['#D13438', '#FF4343', '#000000'], // Bright Red + Black
    style: 'digital-art',
    mood: 'critical, sophisticated, emergency'
  },

  databreach: {
    category: 'Data Breach',
    keywords: ['data breach', 'breach', 'leaked data', 'exposed data', 'hacked database'],
    visualStyle: 'broken database visualization, leaked information concept, compromised server, data flowing out',
    technicalElements: ['broken shields', 'leaking data streams', 'compromised servers'],
    dominantColors: ['#D13438', '#000000', '#737373'], // Red + Black + Gray
    style: 'digital-art',
    mood: 'compromised, exposed, critical'
  },

  phishing: {
    category: 'Phishing Attack',
    keywords: ['phishing', 'spear phishing', 'email scam', 'fake email', 'social engineering'],
    visualStyle: 'email with fishing hook, deceptive message, warning about fake emails, social engineering concept',
    technicalElements: ['email icons', 'fishing hook', 'warning signs'],
    dominantColors: ['#FFB900', '#D13438', '#0078D4'], // Yellow + Red + Blue
    style: 'digital-art',
    mood: 'deceptive, warning, cautionary'
  },

  pentest: {
    category: 'Penetration Testing',
    keywords: ['pentest', 'penetration test', 'ethical hacking', 'security audit', 'red team'],
    visualStyle: 'ethical hacking terminal, penetration testing tools, security assessment dashboard, professional cyber testing',
    technicalElements: ['hacking tools', 'terminal interfaces', 'network diagrams'],
    dominantColors: ['#107C10', '#000000', '#50E6FF'], // Green + Black + Cyan
    style: 'digital-art',
    mood: 'professional, technical, analytical'
  },

  encryption: {
    category: 'Encryption & Cryptography',
    keywords: ['encryption', 'cryptography', 'encrypted', 'cipher', 'ssl', 'tls', 'aes'],
    visualStyle: 'encrypted data visualization, cryptographic symbols, padlock and key, secure communication flow',
    technicalElements: ['lock symbols', 'key icons', 'encrypted streams'],
    dominantColors: ['#107C10', '#0078D4', '#FFFFFF'], // Green + Blue
    style: 'digital-art',
    mood: 'secure, protected, technical'
  },

  firewall: {
    category: 'Firewall & Network Security',
    keywords: ['firewall', 'network security', 'packet filtering', 'iptables', 'waf'],
    visualStyle: 'network firewall barrier, packet filtering visualization, protective wall with data streams, network security',
    technicalElements: ['firewall icons', 'network traffic', 'security barriers'],
    dominantColors: ['#D13438', '#107C10', '#0078D4'], // Red + Green + Blue
    style: 'digital-art',
    mood: 'protective, defensive, technical'
  },

  // ============================================================================
  // TECHNOLOGIES GÉNÉRALES
  // ============================================================================
  webdev: {
    category: 'Web Development',
    keywords: ['web development', 'webdev', 'frontend', 'backend', 'full-stack'],
    visualStyle: 'modern web development workspace, clean code editor interface, responsive design mockups',
    technicalElements: ['browser windows', 'code editor', 'responsive layouts'],
    dominantColors: ['#0078D4', '#FFFFFF', '#50E6FF'],
    style: 'digital-art'
  },

  javascript: {
    category: 'JavaScript',
    keywords: ['javascript', 'js', 'ecmascript', 'node.js', 'nodejs'],
    visualStyle: 'JavaScript development, yellow JS logo prominent, modern coding environment, async code visualization',
    technicalElements: ['JS logo', 'code snippets', 'async patterns'],
    dominantColors: ['#F7DF1E', '#000000', '#FFFFFF'], // JS Yellow
    style: 'digital-art'
  },

  react: {
    category: 'React.js',
    keywords: ['react', 'reactjs', 'react.js', 'react hooks', 'jsx'],
    visualStyle: 'React components diagram, blue React logo, component tree visualization, modern UI framework',
    technicalElements: ['React logo', 'component diagrams', 'virtual DOM'],
    dominantColors: ['#61DAFB', '#282C34', '#FFFFFF'], // React Cyan
    style: 'digital-art'
  },

  nextjs: {
    category: 'Next.js',
    keywords: ['nextjs', 'next.js', 'vercel', 'server components', 'app router'],
    visualStyle: 'Next.js full-stack development, black framework logo, server-side rendering concept, modern web framework',
    technicalElements: ['Next.js logo', 'SSR diagrams', 'routing visualization'],
    dominantColors: ['#000000', '#FFFFFF', '#0070F3'], // Next.js Black + Vercel Blue
    style: 'digital-art'
  },

  // ============================================================================
  // CLOUD & DEVOPS
  // ============================================================================
  docker: {
    category: 'Docker',
    keywords: ['docker', 'container', 'containerization', 'dockerfile'],
    visualStyle: 'Docker containers, blue whale logo, container orchestration, microservices architecture',
    technicalElements: ['container icons', 'Docker logo', 'layered architecture'],
    dominantColors: ['#2496ED', '#FFFFFF', '#384D54'], // Docker Blue
    style: 'digital-art'
  },

  kubernetes: {
    category: 'Kubernetes',
    keywords: ['kubernetes', 'k8s', 'kubectl', 'pod', 'cluster'],
    visualStyle: 'Kubernetes cluster diagram, blue hexagonal logo, pod orchestration, cloud native infrastructure',
    technicalElements: ['K8s logo', 'cluster nodes', 'pod networks'],
    dominantColors: ['#326CE5', '#FFFFFF', '#249EF0'], // Kubernetes Blue
    style: 'digital-art'
  },

  cicd: {
    category: 'CI/CD',
    keywords: ['ci/cd', 'continuous integration', 'continuous deployment', 'pipeline', 'github actions'],
    visualStyle: 'DevOps pipeline visualization, automated deployment flow, CI/CD workflow diagram',
    technicalElements: ['pipeline icons', 'automation symbols', 'deployment stages'],
    dominantColors: ['#2088FF', '#28A745', '#FFFFFF'], // Blue + Green
    style: 'digital-art'
  },

  aws: {
    category: 'AWS',
    keywords: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    visualStyle: 'AWS cloud infrastructure, orange AWS logo, scalable cloud architecture diagram',
    technicalElements: ['AWS services icons', 'cloud architecture', 'scalability symbols'],
    dominantColors: ['#FF9900', '#232F3E', '#FFFFFF'], // AWS Orange
    style: 'digital-art'
  },

  // ============================================================================
  // CONCEPTS TECHNIQUES
  // ============================================================================
  performance: {
    category: 'Performance Optimization',
    keywords: ['performance', 'optimization', 'speed', 'fast', 'benchmark'],
    visualStyle: 'performance metrics dashboard, speed indicators, optimization graphs, loading speed visualization',
    technicalElements: ['speed gauges', 'performance graphs', 'metric displays'],
    dominantColors: ['#107C10', '#0078D4', '#FFFFFF'], // Green + Blue
    style: 'digital-art'
  },

  architecture: {
    category: 'Software Architecture',
    keywords: ['architecture', 'design pattern', 'microservices', 'monolith', 'system design'],
    visualStyle: 'system architecture diagram, technical blueprint, component relationships, scalable design patterns',
    technicalElements: ['architecture diagrams', 'component blocks', 'connection lines'],
    dominantColors: ['#0078D4', '#737373', '#FFFFFF'], // Blue + Gray
    style: 'digital-art'
  },

  api: {
    category: 'API Development',
    keywords: ['api', 'rest', 'graphql', 'endpoint', 'api design'],
    visualStyle: 'API integration network, RESTful endpoint diagram, data flow between services, API documentation',
    technicalElements: ['endpoint icons', 'data flow arrows', 'integration points'],
    dominantColors: ['#0078D4', '#107C10', '#FFFFFF'], // Blue + Green
    style: 'digital-art'
  },

  database: {
    category: 'Database',
    keywords: ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'],
    visualStyle: 'database architecture diagram, data tables, relationships visualization, storage infrastructure',
    technicalElements: ['table icons', 'relationship lines', 'data structures'],
    dominantColors: ['#336791', '#FFFFFF', '#E8E8E8'], // PostgreSQL Blue
    style: 'digital-art'
  }
};

/**
 * Mapping des subreddits vers leurs contextes principaux
 */
const SUBREDDIT_CONTEXT_MAP = {
  // Microsoft & Cloud
  'office365': 'microsoft365',
  'microsoft365': 'microsoft365',
  'MicrosoftTeams': 'teams',
  'sharepoint': 'sharepoint',
  'Intune': 'intune',
  'azure': 'azure',
  'PowerShell': 'powershell',

  // Security
  'netsec': 'cve',
  'cybersecurity': 'malware',
  'security': 'encryption',
  'hacking': 'pentest',
  'AskNetsec': 'firewall',

  // Development
  'webdev': 'webdev',
  'javascript': 'javascript',
  'reactjs': 'react',
  'nextjs': 'nextjs',
  'node': 'javascript',
  'Frontend': 'webdev',
  'Backend': 'api',

  // DevOps & Cloud
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'devops': 'cicd',
  'aws': 'aws',

  // General Tech
  'programming': 'webdev',
  'learnprogramming': 'webdev',
  'coding': 'webdev'
};

/**
 * Fallback par défaut
 */
const DEFAULT_CONTEXT = {
  category: 'Technology',
  visualStyle: 'modern technology illustration, digital art, clean professional design',
  technicalElements: ['tech symbols', 'digital interface'],
  dominantColors: ['#0078D4', '#FFFFFF', '#737373'],
  style: 'digital-art',
  mood: 'professional, modern, technical'
};

module.exports = {
  CONTEXTS,
  SUBREDDIT_CONTEXT_MAP,
  DEFAULT_CONTEXT
};
