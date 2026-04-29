export const services = [
  {
    id: '1',
    title: 'Guitar Lessons for Beginners',
    category: 'Music',
    provider: 'Marcus Rivera',
    providerId: 'marcus',
    price: '⬡ 25/hr',
    rating: 4.9,
    reviews: 23,
    description:
      'Learn to play guitar from scratch! I offer beginner-friendly lessons covering basic chords, strumming patterns, and your favorite songs. Whether you want to play around the campfire or start your musical journey, I can help you get there.',
    included: [
      '1-hour personalized lesson',
      'Custom practice materials',
      'Song recommendations based on your taste',
      'Progress tracking and feedback',
    ],
  },
  {
    id: '2',
    title: 'Python Tutoring & Code Review',
    category: 'Coding',
    provider: 'Sarah Kim',
    providerId: 'sarah',
    price: '⬡ 30/hr',
    rating: 5.0,
    reviews: 47,
    description:
      'Get unstuck with Python! I help students with assignments, projects, and interview prep. Topics include data structures, algorithms, web development with Flask/Django, and data analysis with pandas.',
    included: [
      'Code review and debugging',
      'Conceptual explanations',
      'Best practices and clean code tips',
      'Interview preparation',
    ],
  },
  {
    id: '3',
    title: 'Professional Resume Review',
    category: 'Writing',
    provider: 'James Chen',
    providerId: 'james',
    price: '⬡ 15',
    rating: 4.8,
    reviews: 67,
    description:
      'Stand out in your job search! I\'ll review your resume with a recruiter\'s eye, fixing formatting, highlighting achievements, and tailoring it to your target role.',
    included: [
      'Line-by-line feedback',
      'ATS optimization',
      'Industry-specific suggestions',
      '24-hour turnaround',
    ],
  },
  {
    id: '4',
    title: 'Campus Event Photography',
    category: 'Photography',
    provider: 'Emma Thompson',
    providerId: 'emma',
    price: '⬡ 40/session',
    rating: 4.9,
    reviews: 31,
    description:
      'Capture your campus memories! Professional photography for club events, formals, graduations, and more. High-quality edited photos delivered within 48 hours.',
    included: [
      '2-hour photo session',
      'Professional editing',
      '50+ high-res digital photos',
      'Online gallery for easy sharing',
    ],
  },
  {
    id: '5',
    title: 'Calculus I & II Help',
    category: 'Tutoring',
    provider: 'Alex Rodriguez',
    providerId: 'alex',
    price: '⬡ 20/hr',
    rating: 4.7,
    reviews: 19,
    description:
      'Struggling with limits, derivatives, or integrals? I make calculus click with clear explanations, practice problems, and exam strategies.',
    included: [
      'Homework help',
      'Exam preparation',
      'Concept clarification',
      'Practice problem walkthroughs',
    ],
  },
  {
    id: '6',
    title: 'Healthy Meal Prep Service',
    category: 'Errands',
    provider: 'Maya Patel',
    providerId: 'maya',
    price: '⬡ 35/week',
    rating: 4.9,
    reviews: 28,
    description:
      'Eat healthy without the hassle! I prep delicious, balanced meals for the week. Dietary restrictions and preferences accommodated.',
    included: [
      '5 meals (lunch or dinner)',
      'Fresh ingredients',
      'Nutrition info provided',
      'Custom meal planning available',
    ],
  },
  {
    id: '7',
    title: 'Airport Ride Service',
    category: 'Errands',
    provider: 'David Lee',
    providerId: 'david',
    price: '⬡ 25',
    rating: 5.0,
    reviews: 43,
    description:
      'Reliable airport transportation for students. Safe, on-time rides to get you to your flight or back to campus.',
    included: [
      'Door-to-door service',
      'Help with luggage',
      'Flexible scheduling',
      'Text updates',
    ],
  },
  {
    id: '8',
    title: 'Dorm Deep Cleaning',
    category: 'Errands',
    provider: 'Lisa Wang',
    providerId: 'lisa',
    price: '⬡ 20',
    rating: 4.6,
    reviews: 15,
    description:
      'Refresh your space! Thorough cleaning of your dorm room including floors, surfaces, bathroom, and organization help.',
    included: [
      'Full room cleaning',
      'Bathroom sanitization',
      'Trash removal',
      'Eco-friendly products',
    ],
  },
  {
    id: '9',
    title: 'Spanish Conversation Practice',
    category: 'Language',
    provider: 'Carlos Mendez',
    providerId: 'carlos',
    price: '⬡ 15/hr',
    rating: 4.9,
    reviews: 36,
    description:
      'Improve your Spanish fluency through conversation! Native speaker offering relaxed, engaging sessions focused on real-world communication.',
    included: [
      'Conversational practice',
      'Pronunciation help',
      'Cultural insights',
      'Topic flexibility',
    ],
  },
  {
    id: '10',
    title: 'Custom Logo Design',
    category: 'Design',
    provider: 'Nina Foster',
    providerId: 'nina',
    price: '⬡ 50',
    rating: 5.0,
    reviews: 22,
    description:
      'Professional logo design for your club, startup, or personal brand. Includes multiple concepts and revisions until you love it.',
    included: [
      '3 initial concepts',
      '2 rounds of revisions',
      'Vector files (AI, SVG, PNG)',
      'Brand color palette',
    ],
  },
  {
    id: '11',
    title: 'Essay Editing & Proofreading',
    category: 'Writing',
    provider: 'Olivia Brooks',
    providerId: 'olivia',
    price: '⬡ 20',
    rating: 4.8,
    reviews: 54,
    description:
      'Polish your papers to perfection! Detailed editing for grammar, clarity, structure, and style. Perfect for essays, applications, and research papers.',
    included: [
      'Line editing',
      'Grammar and punctuation fixes',
      'Structural feedback',
      'Fast 48-hour turnaround',
    ],
  },
  {
    id: '12',
    title: 'Personal Fitness Coaching',
    category: 'Fitness',
    provider: 'Tyler Johnson',
    providerId: 'tyler',
    price: '⬡ 30/hr',
    rating: 4.7,
    reviews: 18,
    description:
      'Reach your fitness goals with personalized coaching! Custom workout plans, form guidance, and nutrition tips.',
    included: [
      'Personalized workout plan',
      'Form checks and corrections',
      'Nutrition guidance',
      'Progress tracking',
    ],
  },
];

export const currentUser = {
  name: 'Jordan Park',
  initial: 'J',
  university: 'State University',
  balance: 1250.0,
  memberSince: 'September 2025',
  email: 'jordan@state.edu',
};

export const conversations = [
  {
    id: '1',
    name: 'Sarah Kim',
    initial: 'S',
    lastMessage: 'Sounds good! See you then.',
    timestamp: '2m ago',
    online: true,
    unread: true,
  },
  {
    id: '2',
    name: 'Marcus Rivera',
    initial: 'M',
    lastMessage: 'Thanks for the lesson!',
    timestamp: '1h ago',
    online: false,
    unread: false,
  },
  {
    id: '3',
    name: 'Emma Thompson',
    initial: 'E',
    lastMessage: 'Photos are ready!',
    timestamp: '3h ago',
    online: false,
    unread: false,
  },
  {
    id: '4',
    name: 'David Lee',
    initial: 'D',
    lastMessage: 'Pickup at 8am tomorrow',
    timestamp: 'yesterday',
    online: false,
    unread: false,
  },
];

export const activeOrders = [
  {
    id: 'ord-1',
    serviceTitle: 'Python Tutoring & Code Review',
    provider: 'Sarah Kim',
    client: 'Jordan Park',
    status: 'in-progress',
    scheduledDate: 'Feb 5, 2026',
    scheduledTime: '3:00 PM',
    price: 30,
    type: 'buyer',
  },
  {
    id: 'ord-2',
    serviceTitle: 'Guitar Lessons for Beginners',
    provider: 'Jordan Park',
    client: 'Alex Martinez',
    status: 'pending',
    scheduledDate: 'Feb 6, 2026',
    scheduledTime: '5:00 PM',
    price: 25,
    type: 'seller',
  },
  {
    id: 'ord-3',
    serviceTitle: 'Campus Event Photography',
    provider: 'Emma Thompson',
    client: 'Jordan Park',
    status: 'completed',
    scheduledDate: 'Feb 2, 2026',
    scheduledTime: '2:00 PM',
    price: 40,
    type: 'buyer',
  },
];

export const userStats = {
  totalEarnings: 345,
  totalSpent: 125,
  servicesOffered: 3,
  completedOrders: 14,
  averageRating: 4.8,
  responseTime: '< 2 hours',
};

export const userServices = [
  {
    id: 'my-1',
    title: 'Guitar Lessons for Beginners',
    category: 'Music',
    price: '⬡ 25/hr',
    rating: 4.8,
    reviews: 12,
    isActive: true,
  },
  {
    id: 'my-2',
    title: 'Music Production Basics',
    category: 'Music',
    price: '⬡ 35/hr',
    rating: 4.9,
    reviews: 8,
    isActive: true,
  },
  {
    id: 'my-3',
    title: 'Audio Mixing & Mastering',
    category: 'Music',
    price: '⬡ 50',
    rating: 5.0,
    reviews: 5,
    isActive: false,
  },
];

export const userReviews = [
  {
    id: 'rev-1',
    reviewer: 'Alex Martinez',
    reviewerInitial: 'A',
    rating: 5,
    comment: 'Amazing teacher! Really patient and explains concepts clearly. Highly recommend!',
    service: 'Guitar Lessons for Beginners',
    date: 'Jan 28, 2026',
  },
  {
    id: 'rev-2',
    reviewer: 'Sophie Chen',
    reviewerInitial: 'S',
    rating: 5,
    comment: 'Jordan helped me learn my favorite songs in just a few sessions. Great experience!',
    service: 'Guitar Lessons for Beginners',
    date: 'Jan 15, 2026',
  },
  {
    id: 'rev-3',
    reviewer: 'Mike Johnson',
    reviewerInitial: 'M',
    rating: 4,
    comment: 'Good lessons, very knowledgeable. Would book again!',
    service: 'Music Production Basics',
    date: 'Jan 10, 2026',
  },
];

export const leaderboardData = [
  {
    rank: 1,
    name: 'Sarah Kim',
    initial: 'S',
    category: 'Coding',
    earnings: 2840,
    completedOrders: 89,
    rating: 5.0,
  },
  {
    rank: 2,
    name: 'Marcus Rivera',
    initial: 'M',
    category: 'Music',
    earnings: 2115,
    completedOrders: 78,
    rating: 4.9,
  },
  {
    rank: 3,
    name: 'Emma Thompson',
    initial: 'E',
    category: 'Photography',
    earnings: 1920,
    completedOrders: 45,
    rating: 4.9,
  },
  {
    rank: 4,
    name: 'James Chen',
    initial: 'J',
    category: 'Writing',
    earnings: 1680,
    completedOrders: 112,
    rating: 4.8,
  },
  {
    rank: 5,
    name: 'Olivia Brooks',
    initial: 'O',
    category: 'Writing',
    earnings: 1540,
    completedOrders: 77,
    rating: 4.8,
  },
  {
    rank: 6,
    name: 'David Lee',
    initial: 'D',
    category: 'Errands',
    earnings: 1290,
    completedOrders: 51,
    rating: 5.0,
  },
  {
    rank: 7,
    name: 'Carlos Mendez',
    initial: 'C',
    category: 'Language',
    earnings: 1185,
    completedOrders: 79,
    rating: 4.9,
  },
  {
    rank: 8,
    name: 'Nina Foster',
    initial: 'N',
    category: 'Design',
    earnings: 1100,
    completedOrdes: 22,
    rating: 5.0,
  },
  {
    rank: 9,
    name: 'Maya Patel',
    initial: 'M',
    category: 'Errands',
    earnings: 980,
    completedOrders: 28,
    rating: 4.9,
  },
  {
    rank: 10,
    name: 'Jordan Park',
    initial: 'J',
    category: 'Music',
    earnings: 875,
    completedOrders: 35,
    rating: 4.8,
  },
];

export const hiveShopItems = [
  {
    id: 'shop-1',
    name: 'HiveFive Hoodie',
    description: 'Premium cotton hoodie with embroidered HiveFive logo',
    price: 150,
    category: 'Apparel',
    inStock: true,
    image: 'hoodie',
  },
  {
    id: 'shop-2',
    name: 'HiveFive Tote Bag',
    description: 'Eco-friendly canvas tote with honey comb pattern',
    price: 50,
    category: 'Accessories',
    inStock: true,
    image: 'tote',
  },
  {
    id: 'shop-3',
    name: 'Sticker Pack',
    description: 'Set of 10 HiveFive themed vinyl stickers',
    price: 20,
    category: 'Accessories',
    inStock: true,
    image: 'stickers',
  },
  {
    id: 'shop-4',
    name: 'Water Bottle',
    description: 'Insulated stainless steel bottle with HiveFive branding',
    price: 75,
    category: 'Accessories',
    inStock: true,
    image: 'bottle',
  },
  {
    id: 'shop-5',
    name: 'T-Shirt',
    description: 'Soft cotton tee with minimalist HiveFive logo',
    price: 80,
    category: 'Apparel',
    inStock: false,
    image: 'tshirt',
  },
  {
    id: 'shop-6',
    name: 'Laptop Sticker',
    description: 'Premium die-cut laptop sticker',
    price: 15,
    category: 'Accessories',
    inStock: true,
    image: 'laptop-sticker',
  },
];

export const requests = [
  {
    id: 'req-1',
    title: 'Need help moving furniture this weekend',
    category: 'Errands',
    requester: 'Alex Martinez',
    requesterId: 'alex',
    budget: '⬡50',
    budgetRange: 'under-50',
    deadline: 'Feb 8, 2026',
    description: 'Moving to a new apartment this Saturday and need help carrying furniture from a 2nd floor walkup. Mostly couches, bed frame, and boxes. Should take 2-3 hours. Truck available, just need help with heavy lifting.',
    postedDate: '2 hours ago',
  },
  {
    id: 'req-2',
    title: 'Looking for Spanish tutor for conversational practice',
    category: 'Tutoring',
    requester: 'Emma Wilson',
    requesterId: 'emma',
    budget: '⬡20/hr',
    budgetRange: '50-100',
    deadline: 'Ongoing',
    description: 'I want to improve my conversational Spanish before studying abroad next semester. Looking for a native or fluent speaker for 1-2 sessions per week. Focus on everyday conversation, pronunciation, and cultural context.',
    postedDate: '5 hours ago',
  },
  {
    id: 'req-3',
    title: 'Need logo design for campus startup',
    category: 'Design',
    requester: 'Mike Johnson',
    requesterId: 'mike',
    budget: '⬡100-200',
    budgetRange: '100-200',
    deadline: 'Feb 15, 2026',
    description: 'Starting a campus food delivery service and need a modern, clean logo. Looking for someone who can create a professional design with multiple concepts and revisions. Brand should feel friendly, fast, and student-focused.',
    postedDate: '1 day ago',
  },
  {
    id: 'req-4',
    title: 'Photography for graduation portraits',
    category: 'Photography',
    requester: 'Sophie Chen',
    requesterId: 'sophie',
    budget: '⬡75',
    budgetRange: '50-100',
    deadline: 'Feb 20, 2026',
    description: 'Graduating in May and want professional portraits around campus. Looking for 1-hour session with edited photos. Prefer natural light photography with campus landmarks in background.',
    postedDate: '1 day ago',
  },
  {
    id: 'req-5',
    title: 'Guitar instructor for intermediate player',
    category: 'Music',
    requester: 'David Lee',
    requesterId: 'david',
    budget: '⬡30/hr',
    budgetRange: '50-100',
    deadline: 'Ongoing',
    description: 'Been playing guitar for 2 years and want to level up my skills. Interested in learning fingerstyle techniques, music theory, and song composition. Looking for weekly lessons.',
    postedDate: '2 days ago',
  },
  {
    id: 'req-6',
    title: 'Need coding help for CS102 final project',
    category: 'Coding',
    requester: 'Rachel Kim',
    requesterId: 'rachel',
    budget: '⬡60',
    budgetRange: '50-100',
    deadline: 'Feb 12, 2026',
    description: 'Working on a Java final project (task management app) and stuck on implementing file I/O and data persistence. Need someone to help debug and explain concepts. Project is 70% done.',
    postedDate: '3 days ago',
  },
];

/* ─── Mock data for Discover page (toggleable via Admin > Settings > Mock Data) ─── */

interface CosmeticsPayload {
  frame: { gradient: string; glow: string; css_animation: string | null; ring_size: number } | null;
  badge: { tag: string; bg_color: string; text_color: string; bg_gradient: string | null; css_animation: string | null } | null;
}

interface DiscoverService {
  id: number;
  title: string;
  category: string;
  first_name: string;
  last_name: string;
  provider_id: number;
  provider_username: string;
  price: number;
  price_unit: string;
  rating: number;
  review_count: number;
  description: string;
  thumbnail: string | null;
  provider_university?: string;
  cosmetics?: CosmeticsPayload;
}

interface DiscoverRequest {
  id: number;
  title: string;
  category: string;
  description: string;
  budget: string;
  budget_range: string;
  deadline: string | null;
  status: string;
  requester_first_name: string;
  requester_last_name: string;
  requester_id: number;
  requester_username: string;
  requester_university?: string;
  requester_profile_image?: string | null;
  proposal_count: number;
  cosmetics?: CosmeticsPayload;
  created_at: string;
}

interface DiscoverSidebarCategory { name: string; count: number; }
interface DiscoverSidebarProvider { rank: number; id: number; name: string; username: string; rating: number; profile_image?: string | null; cosmetics?: CosmeticsPayload; }
interface Pagination { page: number; limit: number; total: number; total_pages: number; }

function normalizeUniversity(university?: string | null): string {
  return (university ?? '').trim().toLowerCase();
}

const MOCK_DISCOVER_SERVICES: DiscoverService[] = [
  { id: 1, title: 'Calculus I & II Tutoring', category: 'Tutoring', first_name: 'Emily', last_name: 'Chen', provider_id: 2, provider_username: 'emilyc', price: 30, price_unit: 'hour', rating: 4.9, review_count: 47, description: 'Patient and thorough calculus tutoring with practice problems.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 2, title: 'React & TypeScript Projects', category: 'Coding', first_name: 'Marcus', last_name: 'Williams', provider_id: 3, provider_username: 'marcusw', price: 45, price_unit: 'hour', rating: 4.8, review_count: 32, description: 'Full-stack web development help with modern frameworks.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 3, title: 'Essay Editing & Proofreading', category: 'Writing', first_name: 'Sarah', last_name: 'Kim', provider_id: 4, provider_username: 'sarahk', price: 20, price_unit: 'page', rating: 4.7, review_count: 61, description: 'Detailed editing for academic essays, cover letters, and more.', thumbnail: null, provider_university: 'UCLA' },
  { id: 4, title: 'Resume & LinkedIn Makeover', category: 'Career', first_name: 'James', last_name: 'Patel', provider_id: 5, provider_username: 'jamesp', price: 55, price_unit: 'session', rating: 4.9, review_count: 28, description: 'Professional resume rewrite and LinkedIn optimization.', thumbnail: null, provider_university: 'NYU' },
  { id: 5, title: 'UI/UX Design Consultation', category: 'Design', first_name: 'Olivia', last_name: 'Rodriguez', provider_id: 6, provider_username: 'oliviar', price: 40, price_unit: 'hour', rating: 4.6, review_count: 19, description: 'Design reviews, wireframes, and Figma prototyping.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 6, title: 'Personal Training Sessions', category: 'Fitness', first_name: 'Derek', last_name: 'Johnson', provider_id: 7, provider_username: 'derekj', price: 35, price_unit: 'session', rating: 4.8, review_count: 44, description: 'Customized workout plans and in-person training.', thumbnail: null, provider_university: 'USC' },
  { id: 7, title: 'Guitar Lessons for Beginners', category: 'Music', first_name: 'Mia', last_name: 'Thompson', provider_id: 8, provider_username: 'miat', price: 25, price_unit: 'hour', rating: 4.7, review_count: 36, description: 'Acoustic and electric guitar lessons for all levels.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 8, title: 'Portrait & Headshot Photography', category: 'Photography', first_name: 'Alex', last_name: 'Nguyen', provider_id: 9, provider_username: 'alexn', price: 75, price_unit: 'session', rating: 4.9, review_count: 22, description: 'Professional headshots and portrait sessions on campus.', thumbnail: null, provider_university: 'Purdue University' },
  { id: 9, title: 'Spanish Conversation Practice', category: 'Language', first_name: 'Sofia', last_name: 'Martinez', provider_id: 10, provider_username: 'sofiam', price: 20, price_unit: 'hour', rating: 4.5, review_count: 18, description: 'Native speaker conversation sessions for all levels.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 10, title: 'Life Coaching for Students', category: 'Coaching', first_name: 'Ryan', last_name: 'Davis', provider_id: 11, provider_username: 'ryand', price: 50, price_unit: 'session', rating: 4.6, review_count: 14, description: 'Goal setting, time management, and academic planning.', thumbnail: null, provider_university: 'Rutgers University' },
  { id: 11, title: 'Haircuts & Styling', category: 'Beauty', first_name: 'Taylor', last_name: 'Lee', provider_id: 12, provider_username: 'taylorl', price: 25, price_unit: 'session', rating: 4.8, review_count: 53, description: 'Professional haircuts and styling on campus.', thumbnail: null, provider_university: 'University at Buffalo' },
  { id: 12, title: 'Video Editing for YouTube', category: 'Video', first_name: 'Jordan', last_name: 'Brown', provider_id: 13, provider_username: 'jordanb', price: 60, price_unit: 'video', rating: 4.7, review_count: 27, description: 'Polished video editing with transitions, audio mixing, and color grading.', thumbnail: null, provider_university: 'Cornell University' },
];

const MOCK_DISCOVER_REQUESTS: DiscoverRequest[] = [
  { id: 1, title: 'Need help with calculus homework', category: 'Tutoring', description: 'Struggling with integration by parts and need someone to walk me through it.', budget: '⬡ 25-50', budget_range: '50-100', deadline: '2026-03-15', status: 'open', requester_first_name: 'Jake', requester_last_name: 'Miller', requester_id: 100, requester_username: 'jakem', requester_university: 'University at Buffalo', proposal_count: 3, created_at: '2026-02-19 14:30:00' },
  { id: 2, title: 'Looking for a React developer', category: 'Coding', description: 'Need help debugging a React component that keeps crashing on state update.', budget: '⬡ 50-100', budget_range: '50-100', deadline: '2026-03-01', status: 'open', requester_first_name: 'Ava', requester_last_name: 'Singh', requester_id: 101, requester_username: 'avas', requester_university: 'University at Buffalo', proposal_count: 5, created_at: '2026-02-20 09:15:00' },
  { id: 3, title: 'Urgent: resume review before career fair', category: 'Career', description: 'Career fair is next week and my resume needs a serious overhaul.', budget: '⬡ 25-50', budget_range: 'under-50', deadline: '2026-02-28', status: 'open', requester_first_name: 'Leo', requester_last_name: 'Tran', requester_id: 102, requester_username: 'leot', requester_university: 'NYU', proposal_count: 7, created_at: '2026-02-18 16:45:00' },
  { id: 4, title: 'Professional headshot photos needed', category: 'Photography', description: 'Need quality headshots for LinkedIn and grad school applications.', budget: '⬡ 50-100', budget_range: '50-100', deadline: '2026-03-10', status: 'open', requester_first_name: 'Grace', requester_last_name: 'Kim', requester_id: 103, requester_username: 'gracek', requester_university: 'UCLA', proposal_count: 2, created_at: '2026-02-20 11:00:00' },
  { id: 5, title: 'Spanish conversation partner wanted', category: 'Language', description: 'Preparing for a study abroad program and need to practice conversational Spanish.', budget: '⬡ Under 25', budget_range: 'under-50', deadline: null, status: 'open', requester_first_name: 'Sam', requester_last_name: 'Patel', requester_id: 104, requester_username: 'samp', requester_university: 'University at Buffalo', proposal_count: 1, created_at: '2026-02-21 08:30:00' },
  { id: 6, title: 'Help moving to new apartment', category: 'Moving', description: 'Moving this weekend and need an extra pair of hands for heavy furniture.', budget: '⬡ 50-100', budget_range: '50-100', deadline: '2026-02-23', status: 'open', requester_first_name: 'Zoe', requester_last_name: 'Chen', requester_id: 105, requester_username: 'zoec', requester_university: 'Purdue University', proposal_count: 4, created_at: '2026-02-19 20:00:00' },
];

const MOCK_SIDEBAR_CATEGORIES: DiscoverSidebarCategory[] = [
  { name: 'Tutoring', count: 187 },
  { name: 'Coding', count: 156 },
  { name: 'Writing', count: 134 },
  { name: 'Career', count: 121 },
  { name: 'Design', count: 108 },
  { name: 'Fitness', count: 95 },
  { name: 'Photography', count: 82 },
  { name: 'Music', count: 89 },
];

const MOCK_SIDEBAR_REQUEST_CATEGORIES: DiscoverSidebarCategory[] = [
  { name: 'Coding', count: 42 },
  { name: 'Tutoring', count: 35 },
  { name: 'Career', count: 27 },
  { name: 'Design', count: 22 },
  { name: 'Photography', count: 18 },
  { name: 'Language', count: 15 },
  { name: 'Moving', count: 12 },
  { name: 'Writing', count: 10 },
];

const MOCK_SIDEBAR_PROVIDERS: DiscoverSidebarProvider[] = [
  { rank: 1, id: 2, name: 'Emily Chen', username: 'emilyc', rating: 4.9 },
  { rank: 2, id: 9, name: 'Alex Nguyen', username: 'alexn', rating: 4.9 },
  { rank: 3, id: 3, name: 'Marcus Williams', username: 'marcusw', rating: 4.8 },
  { rank: 4, id: 7, name: 'Derek Johnson', username: 'derekj', rating: 4.8 },
  { rank: 5, id: 12, name: 'Taylor Lee', username: 'taylorl', rating: 4.8 },
];

export async function fetchMockServices(params: {
  category?: string; search?: string; sort?: string;
  school_scope?: string;
  viewer_university?: string;
  min_price?: number; max_price?: number; min_rating?: number;
  page?: number; limit?: number;
}): Promise<{ services: DiscoverService[]; pagination: Pagination }> {
  await new Promise(r => setTimeout(r, 150));
  let filtered = [...MOCK_DISCOVER_SERVICES];
  if (params.category && params.category !== 'All Categories')
    filtered = filtered.filter(s => s.category === params.category);
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.provider_username.toLowerCase().includes(q) ||
      (s.provider_university ?? '').toLowerCase().includes(q)
    );
  }
  if (params.school_scope === 'my_school') {
    const viewerUniversity = normalizeUniversity(params.viewer_university);
    if (viewerUniversity) {
      filtered = filtered.filter(s => normalizeUniversity(s.provider_university) === viewerUniversity);
    }
  }
  if (params.min_price !== undefined) filtered = filtered.filter(s => s.price >= params.min_price!);
  if (params.max_price !== undefined) filtered = filtered.filter(s => s.price <= params.max_price!);
  if (params.min_rating !== undefined) filtered = filtered.filter(s => s.rating >= params.min_rating!);
  if (params.sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  else if (params.sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  else if (params.sort === 'rating_desc') filtered.sort((a, b) => b.rating - a.rating);
  else if (params.sort === 'reviews') filtered.sort((a, b) => b.review_count - a.review_count);
  const page = params.page ?? 1;
  const limit = params.limit ?? 12;
  const total = filtered.length;
  const total_pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { services: filtered.slice(start, start + limit), pagination: { page, limit, total, total_pages } };
}

export async function fetchMockRequests(params: {
  category?: string; search?: string; sort?: string;
  status?: string; budget_range?: string; school_scope?: string; viewer_university?: string; page?: number; limit?: number;
}): Promise<{ requests: DiscoverRequest[]; pagination: Pagination }> {
  await new Promise(r => setTimeout(r, 100));
  let filtered = [...MOCK_DISCOVER_REQUESTS];
  if (params.category && params.category !== 'All Categories')
    filtered = filtered.filter(r => r.category === params.category);
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      `${r.requester_first_name} ${r.requester_last_name}`.toLowerCase().includes(q) ||
      r.requester_username.toLowerCase().includes(q) ||
      (r.requester_university ?? '').toLowerCase().includes(q)
    );
  }
  if (params.status) filtered = filtered.filter(r => r.status === params.status);
  if (params.budget_range) filtered = filtered.filter(r => r.budget_range === params.budget_range);
  if (params.school_scope === 'my_school') {
    const viewerUniversity = normalizeUniversity(params.viewer_university);
    if (viewerUniversity) {
      filtered = filtered.filter(r => normalizeUniversity(r.requester_university) === viewerUniversity);
    }
  }
  if (params.sort === 'oldest') {
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  const page = params.page ?? 1;
  const limit = params.limit ?? 6;
  const total = filtered.length;
  const total_pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return { requests: filtered.slice(start, start + limit), pagination: { page, limit, total, total_pages } };
}

export async function fetchMockSidebar(): Promise<{
  categories: DiscoverSidebarCategory[];
  request_categories: DiscoverSidebarCategory[];
  top_providers: DiscoverSidebarProvider[];
}> {
  await new Promise(r => setTimeout(r, 50));
  return {
    categories: MOCK_SIDEBAR_CATEGORIES,
    request_categories: MOCK_SIDEBAR_REQUEST_CATEGORIES,
    top_providers: MOCK_SIDEBAR_PROVIDERS,
  };
}
