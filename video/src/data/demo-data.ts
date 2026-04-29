export type DemoService = {
  id: number;
  title: string;
  category: string;
  providerName: string;
  providerInitial: string;
  price: number;
  priceUnit: "flat" | "hourly" | "custom";
  rating: number;
  reviewCount: number;
  imageColor: string;
};

export type DemoMessage = {
  sender: "provider" | "client";
  text: string;
  time: string;
  isImage?: boolean;
  isLink?: boolean;
  linkTitle?: string;
  linkDomain?: string;
};

export type DemoOrderEvent = {
  status: string;
  label: string;
  time: string;
};

export type DemoLeaderboardEntry = {
  rank: number;
  name: string;
  initial: string;
  username: string;
  buzzScore: number;
  rating: number;
  reviewCount: number;
  ordersCompleted: number;
  frameGradient?: string;
  frameGlow?: string;
  badgeTag?: string;
  badgeBg?: string;
  badgeText?: string;
};

export const DEMO_SERVICES: DemoService[] = [
  { id: 1, title: "Full-Stack Web App Development", category: "Coding", providerName: "Marcus Rivera", providerInitial: "M", price: 120, priceUnit: "hourly", rating: 4.9, reviewCount: 47, imageColor: "#DBEAFE" },
  { id: 2, title: "Resume & Cover Letter Polish", category: "Career", providerName: "Aisha Patel", providerInitial: "A", price: 35, priceUnit: "flat", rating: 4.8, reviewCount: 82, imageColor: "#DCFCE7" },
  { id: 3, title: "Portrait Photography Session", category: "Photography", providerName: "Elena Kovacs", providerInitial: "E", price: 75, priceUnit: "flat", rating: 4.7, reviewCount: 31, imageColor: "#EDE9FE" },
  { id: 4, title: "Organic Chemistry Tutoring", category: "Tutoring", providerName: "David Chen", providerInitial: "D", price: 40, priceUnit: "hourly", rating: 4.9, reviewCount: 96, imageColor: "#FEF3C7" },
  { id: 5, title: "Personal Training & Meal Plans", category: "Fitness", providerName: "Jordan Williams", providerInitial: "J", price: 50, priceUnit: "hourly", rating: 4.6, reviewCount: 23, imageColor: "#FFE4E6" },
  { id: 6, title: "Logo & Brand Identity Design", category: "Design", providerName: "Priya Nair", providerInitial: "P", price: 200, priceUnit: "flat", rating: 4.8, reviewCount: 54, imageColor: "#FFEDD5" },
  { id: 7, title: "Spanish Conversation Practice", category: "Language", providerName: "Sofia Gutierrez", providerInitial: "S", price: 25, priceUnit: "hourly", rating: 4.5, reviewCount: 18, imageColor: "#CFFAFE" },
  { id: 8, title: "Event Photography & Videography", category: "Events", providerName: "Tyler Brooks", providerInitial: "T", price: 150, priceUnit: "flat", rating: 4.7, reviewCount: 29, imageColor: "#FEF9C3" },
  { id: 9, title: "Python & Data Science Help", category: "Coding", providerName: "Mei Zhang", providerInitial: "M", price: 55, priceUnit: "hourly", rating: 4.8, reviewCount: 61, imageColor: "#DBEAFE" },
  { id: 10, title: "Moving & Furniture Assembly", category: "Moving", providerName: "Andre Jackson", providerInitial: "A", price: 30, priceUnit: "hourly", rating: 4.4, reviewCount: 37, imageColor: "#ECFCCB" },
  { id: 11, title: "Piano Lessons for Beginners", category: "Music", providerName: "Clara Reyes", providerInitial: "C", price: 45, priceUnit: "hourly", rating: 4.7, reviewCount: 14, imageColor: "#FEF3C7" },
  { id: 12, title: "Dog Walking & Pet Sitting", category: "Pet Care", providerName: "Noah Kim", providerInitial: "N", price: 20, priceUnit: "flat", rating: 4.6, reviewCount: 42, imageColor: "#FFEDD5" },
];

export const DEMO_SERVICE_DETAIL = {
  ...DEMO_SERVICES[0],
  description: "I build production-ready web applications from concept to deployment. React, Next.js, Node, PostgreSQL — the full stack. Clean code, tested, documented.",
  included: [
    "Initial consultation & requirements review",
    "UI/UX wireframes and component architecture",
    "Full frontend + backend implementation",
    "Database design and API development",
    "Deployment to your preferred platform",
    "2 weeks of post-launch bug fixes",
  ],
  reviews: [
    { name: "Liam O'Brien", initial: "L", rating: 5, text: "Marcus built my entire capstone project backend in a weekend. Absolute legend.", date: "Mar 2026" },
    { name: "Fatima Al-Hassan", initial: "F", rating: 5, text: "Clean code, great communication, delivered ahead of schedule.", date: "Feb 2026" },
    { name: "Jake Morrison", initial: "J", rating: 4, text: "Solid work on the API. Would hire again for the next sprint.", date: "Feb 2026" },
  ],
  providerBio: "CS senior at UB. 3 years freelancing. I ship fast and I ship clean.",
  providerRating: 4.9,
  providerReviewCount: 47,
  providerResponseTime: "~2 hours",
  university: "University at Buffalo",
};

export const DEMO_BOOKING = {
  serviceTitle: "Full-Stack Web App Development",
  providerName: "Marcus Rivera",
  basePrice: 120,
  quantity: 10,
  unit: "hours",
  serviceFee: 60,
  total: 1260,
  scheduledDate: "Apr 15, 2026",
  scheduledTime: "2:00 PM",
  balance: 2450,
};

export const DEMO_MESSAGES: DemoMessage[] = [
  { sender: "client", text: "Hey Marcus! I saw your service listing — I need help building a marketplace app for my startup. Is that something you can take on?", time: "10:23 AM" },
  { sender: "provider", text: "Absolutely! I've built a few marketplace projects before. What's the scope — do you have wireframes or a spec doc?", time: "10:25 AM" },
  { sender: "client", text: "Yeah, here's the Figma link. It's a peer-to-peer tutoring platform with scheduling and payments.", time: "10:27 AM", isLink: true, linkTitle: "TutorMatch — Figma Wireframes", linkDomain: "figma.com" },
  { sender: "provider", text: "This is really well thought out. I can definitely build this. Let me put together a timeline — thinking 10 hours total across 2 weeks.", time: "10:31 AM" },
  { sender: "client", text: "That works! I'll go ahead and book you.", time: "10:32 AM" },
];

export const DEMO_ORDER_EVENTS: DemoOrderEvent[] = [
  { status: "booked", label: "Order placed", time: "Apr 10, 2:15 PM" },
  { status: "accepted", label: "Provider accepted", time: "Apr 10, 2:18 PM" },
  { status: "in_progress", label: "Work started", time: "Apr 11, 9:00 AM" },
  { status: "completed", label: "Marked complete", time: "Apr 18, 4:30 PM" },
];

export const DEMO_DISPUTE = {
  reason: "Incomplete deliverables",
  description: "The API endpoints were not fully tested and 2 of the 6 agreed features were missing documentation.",
  proposedSplit: { provider: 60, client: 40 },
  status: "Settlement Proposed",
};

export const DEMO_DASHBOARD_STATS = {
  totalEarnings: 2450,
  completedOrders: 12,
  currentBalance: 1820,
  activeOrders: 3,
  pendingCount: 1,
  inProgressCount: 2,
  awaitingCount: 0,
  averageRating: 4.8,
  servicesOffered: 4,
  responseTime: "~2 hrs",
};

export const DEMO_DASHBOARD_ORDERS = [
  { id: 101, title: "Full-Stack Web App Development", otherParty: "Liam O'Brien", role: "seller" as const, status: "In Progress", price: 1200, scheduledDate: "Apr 15" },
  { id: 102, title: "Resume & Cover Letter Polish", otherParty: "Nina Vasquez", role: "seller" as const, status: "Pending", price: 35, scheduledDate: "Apr 12" },
  { id: 103, title: "Python & Data Science Help", otherParty: "Mei Zhang", role: "buyer" as const, status: "In Progress", price: 165, scheduledDate: "Apr 14" },
];

export const DEMO_LEADERBOARD: DemoLeaderboardEntry[] = [
  { rank: 1, name: "Marcus Rivera", initial: "M", username: "marcusdev", buzzScore: 9420, rating: 4.9, reviewCount: 47, ordersCompleted: 52, frameGradient: "linear-gradient(135deg, #F5B540, #E9A020, #C47F14)", frameGlow: "rgba(233,160,32,0.5)", badgeTag: "TOP PROVIDER", badgeBg: "#131210", badgeText: "#E9A020" },
  { rank: 2, name: "Aisha Patel", initial: "A", username: "aishawrites", buzzScore: 8710, rating: 4.8, reviewCount: 82, ordersCompleted: 45, frameGradient: "linear-gradient(135deg, #C0C0C0, #A0A0A0)", frameGlow: "rgba(192,192,192,0.3)" },
  { rank: 3, name: "David Chen", initial: "D", username: "dchem", buzzScore: 8340, rating: 4.9, reviewCount: 96, ordersCompleted: 41, frameGradient: "linear-gradient(135deg, #F97316, #EA580C)", frameGlow: "rgba(249,115,22,0.3)" },
  { rank: 4, name: "Priya Nair", initial: "P", username: "priyadesigns", buzzScore: 7890, rating: 4.8, reviewCount: 54, ordersCompleted: 38 },
  { rank: 5, name: "Elena Kovacs", initial: "E", username: "elenashots", buzzScore: 7420, rating: 4.7, reviewCount: 31, ordersCompleted: 34 },
  { rank: 6, name: "Jordan Williams", initial: "J", username: "jfitness", buzzScore: 6980, rating: 4.6, reviewCount: 23, ordersCompleted: 29 },
  { rank: 7, name: "Mei Zhang", initial: "M", username: "meidata", buzzScore: 6540, rating: 4.8, reviewCount: 61, ordersCompleted: 27 },
  { rank: 8, name: "Tyler Brooks", initial: "T", username: "tylerfilms", buzzScore: 6120, rating: 4.7, reviewCount: 29, ordersCompleted: 24 },
  { rank: 9, name: "Sofia Gutierrez", initial: "S", username: "sofialang", buzzScore: 5680, rating: 4.5, reviewCount: 18, ordersCompleted: 21 },
  { rank: 10, name: "Andre Jackson", initial: "A", username: "andremoves", buzzScore: 5210, rating: 4.4, reviewCount: 37, ordersCompleted: 19 },
];

export const DEMO_BUZZ_BREAKDOWN = {
  ordersCompleted: { label: "Orders Completed", value: 52, max: 60, weight: "30%" },
  reviewScore: { label: "Review Score", value: 4.9, max: 5.0, weight: "25%" },
  responseTime: { label: "Response Time", value: "~2 hrs", weight: "20%" },
  engagement: { label: "Community Engagement", value: "High", weight: "15%" },
  serviceQuality: { label: "Service Quality", value: "Excellent", weight: "10%" },
};

export const LANDING_STATS = {
  services: 847,
  providers: 312,
  universities: 24,
  transactions: 3218,
};

export const LANDING_CATEGORIES = [
  "Coding", "Tutoring", "Design", "Photography", "Fitness",
  "Music", "Writing", "Career", "Language", "Events",
  "Moving", "Cooking", "Pet Care", "Video", "Tech Support",
];
