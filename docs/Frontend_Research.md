# Frontend Research

*Everything you need to go from zero to shipping frontend code. No fluff, no filler.*

---

## Wait, What Are We Building?

HiveFive is a campus marketplace where university students offer and hire services from each other. Think Fiverr, but restricted to `.edu` emails and powered by a fake currency called **HiveCoins** (symbol: ⬡, pegged 1:1 to USD). Users can browse services, post their own, message providers, book orders, and flex cosmetic profile items from the HiveShop.

The vibe we're going for? **Linear meets Airbnb.** Warm, confident, spacious. Not a student project — a startup product.

---

## The Stack (Read This First)

| Layer | Tech | Why |
|-------|------|-----|
| **Framework** | React 19 + Vite | Fast builds, hot module replacement, no server-side rendering complexity |
| **Routing** | React Router v7 | Client-side routing with the Data Router pattern |
| **Styling** | Tailwind CSS v4 | Utility-first CSS with our custom design tokens |
| **Animations** | Motion (`motion/react`) | Smooth transitions and micro-interactions |
| **Icons** | Lucide React | Clean, consistent icon library. **No other icon library. No emoji as icons.** |
| **Fonts** | Fraunces (display), DM Sans (body), JetBrains Mono (code/numbers) | Custom brand typography |
| **Backend** | PHP + MySQL | Required by the course. Hosted on UB's aptitude/cattle servers |

**What we are NOT using:** Next.js, ShadCN (everything is custom-built), any third-party auth (no Google Auth, no SSO), any real payment processor (no Stripe/PayPal).

---

## Setting Up Your Machine

### Prerequisites

You need these installed before anything else:

- **Node.js 18+** → [nodejs.org](https://nodejs.org) (grab the LTS version)
- **npm** (comes with Node.js)
- **Git** → [git-scm.com](https://git-scm.com)
- **VS Code** → [code.visualstudio.com](https://code.visualstudio.com) (strongly recommended)

To verify everything's installed, open your terminal and run:

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
git --version     # Should show git version 2.x.x
```

If any of these fail, install the missing tool before continuing.

### VS Code Extensions (Install These)

Open VS Code → Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) → search and install:

1. **Tailwind CSS IntelliSense** — autocomplete for Tailwind classes (you NEED this)
2. **ES7+ React/Redux/React-Native Snippets** — type `rfce` to scaffold a component instantly
3. **Prettier - Code Formatter** — consistent formatting across the team
4. **ESLint** — catches bugs before they happen

### Cloning and Running the Project

```bash
# 1. Clone the repo
git clone git@github.com:cse442-software-engineering-ub/s26-hivefive.git

# 2. Move into the project folder
cd s26-hivefive

# 3. Install all dependencies
npm install

# 4. Start the development server
npm run dev
```

After `npm run dev`, you'll see something like:

```
  VITE v6.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open `http://localhost:5173/` in your browser. You're in.

**Hot Module Replacement (HMR)** is enabled — every time you save a file, the browser updates instantly without a full page reload. No more manual refreshing.

### Building for Production

When it's time to deploy to the UB servers:

```bash
npm run build
```

This creates a `/dist` folder with optimized static files (HTML, CSS, JS). These are the files you upload to the server. More on deployment later.

---

## Project Structure

Here's how the codebase is organized. Learn this and you'll never be lost:

```
hivefive/
├── public/                    # Static assets (favicon, images that don't need processing)
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── NavBar.tsx         # Top navigation bar (logged-in + logged-out variants)
│   │   ├── Avatar.tsx         # User avatar with initials and online indicator
│   │   ├── ServiceCard.tsx    # Service listing card (used on Discover, Dashboard, Profile)
│   │   ├── RequestCard.tsx    # Request listing card
│   │   ├── Button.tsx         # Button component (primary, secondary, ghost variants)
│   │   ├── Input.tsx          # Form input with validation states
│   │   ├── Toast.tsx          # Success/error/info notification popups
│   │   ├── Modal.tsx          # Overlay dialogs
│   │   ├── CategoryBadge.tsx  # Category label pills
│   │   ├── StatusBadge.tsx    # Order status indicators
│   │   └── ...                # More components as needed
│   ├── pages/                 # Full page components (one per route)
│   │   ├── Landing.tsx        # / (logged-out homepage)
│   │   ├── Discover.tsx       # /discover (browse services)
│   │   ├── ServiceDetail.tsx  # /service/:id
│   │   ├── PostService.tsx    # /post/service
│   │   ├── PostRequest.tsx    # /post/request
│   │   ├── Dashboard.tsx      # /dashboard
│   │   ├── Messages.tsx       # /messages
│   │   ├── Settings.tsx       # /settings
│   │   ├── Profile.tsx        # /profile (your own)
│   │   ├── ProviderProfile.tsx# /profile/:id (someone else's)
│   │   ├── Signup.tsx         # /signup
│   │   ├── Login.tsx          # /login
│   │   ├── Leaderboard.tsx    # /leaderboard
│   │   ├── Shop.tsx           # /shop
│   │   ├── DesignSystem.tsx   # /design-system (dev reference)
│   │   └── NotFound.tsx       # 404 page
│   ├── lib/
│   │   ├── data.ts            # Mock data (services, users, messages — used until backend is ready)
│   │   └── utils.ts           # Helper functions
│   ├── styles/
│   │   └── globals.css        # Global styles, Tailwind imports, font loading, custom tokens
│   ├── App.tsx                # Root component with route definitions
│   └── main.tsx               # Entry point (renders App into the DOM)
├── index.html                 # HTML shell
├── tailwind.config.ts         # Tailwind configuration with our custom tokens
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── README.md
```

**The rule of thumb:** if it's reusable across multiple pages, it goes in `components/`. If it's a full page tied to a route, it goes in `pages/`. If it's data or utility logic, it goes in `lib/`.

---

## The Design System (Your New Best Friend)

This is the most important section. Every pixel of HiveFive follows these tokens. If you hard-code a hex color or use a random font, your PR will get rejected.

### Colors

We use three palettes — **honey** (accent), **charcoal** (text/dark), and **cream** (backgrounds) — plus semantic colors for feedback states.

```
HONEY (accent — buttons, links, active states)
50: #FEF9EE  100: #FDF0D5  200: #FBE0AA  300: #F8CB74  400: #F5B540
500: #E9A020  600: #C47F14  700: #9A5F10  800: #6E430E  900: #47290A

CHARCOAL (text, dark surfaces)
50: #F6F6F5  100: #ECEAE8  200: #D6D4D0  300: #BFBCB6  400: #8C887F
500: #5C584F  600: #403D37  700: #2D2B27  800: #1E1D1A  900: #131210

CREAM (backgrounds — NEVER use white)
50: #FEFDFB  100: #FDFBF5  200: #FAF6EA  300: #F6F1DD  400: #F1EBD0  500: #E8E0B8

SEMANTIC
Success: #348B5A    Warning: #D4882A    Error: #C93B3B    Info: #3478B8
```

**Critical rules:**

- Page backgrounds are ALWAYS `bg-cream-50`. Never `bg-white`. Never `#FFFFFF`. Ever.
- Primary text (headings): `text-charcoal-900`
- Body text: `text-charcoal-600`
- Secondary/meta text: `text-charcoal-400`
- Borders and dividers: `border-charcoal-100` or `border-charcoal-200`
- Primary accent (buttons, active indicators, links): `bg-honey-500`
- Button text on honey: `text-charcoal-900` (dark on honey — never white on honey)
- Honey-500 is ONLY for: primary buttons, active nav indicators, links, badge accents, star fills, logo mark. Never use it on large surface areas.

### Typography

Three fonts, three purposes. No exceptions:

| Font | CSS Variable | Use For |
|------|-------------|---------|
| **Fraunces** (italic) | `font-display` | Page headlines, hero text, section titles — always italic |
| **DM Sans** | `font-sans` | Everything else — body text, buttons, nav, labels |
| **JetBrains Mono** | `font-mono` | Numbers, prices, code, timestamps, stats |

Fonts are loaded via CSS `@import` in `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,400&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

**In your components**, use Tailwind classes:

```jsx
{/* Page headline */}
<h1 className="font-display italic text-4xl text-charcoal-900">Discover</h1>

{/* Body text */}
<p className="font-sans text-sm text-charcoal-600">Browse services from your campus.</p>

{/* Price display */}
<span className="font-mono text-lg text-charcoal-900">⬡ 25/hr</span>
```

### Spacing, Shadows, and Borders

```
BORDER RADIUS
sm: 6px    md: 10px    lg: 14px    xl: 20px

SHADOWS
sm:  0 1px 3px rgba(19,18,16,0.05)     — subtle lift for cards
md:  0 4px 12px rgba(19,18,16,0.07)    — hover state elevation
lg:  0 12px 32px rgba(19,18,16,0.09)   — modals, popovers
glow: 0 0 20px rgba(233,160,32,0.25)   — honey glow effect for special elements

COMMON LAYOUT
Page container: max-w-6xl mx-auto px-4 sm:px-8 lg:px-16
Card styling:   bg-cream-50 border border-charcoal-100 rounded-xl shadow-sm
```

---

## How Routing Works

We use **React Router v7** with the Data Router pattern. All routes are defined in `App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/',              element: <Landing /> },
  { path: '/signup',        element: <Signup /> },
  { path: '/login',         element: <Login /> },
  { path: '/discover',      element: <Discover /> },
  { path: '/service/:id',   element: <ServiceDetail /> },
  { path: '/post/service',  element: <PostService /> },
  { path: '/post/request',  element: <PostRequest /> },
  { path: '/dashboard',     element: <Dashboard /> },
  { path: '/messages',      element: <Messages /> },
  { path: '/settings',      element: <Settings /> },
  { path: '/profile',       element: <Profile /> },
  { path: '/profile/:id',   element: <ProviderProfile /> },
  { path: '/leaderboard',   element: <Leaderboard /> },
  { path: '/shop',          element: <Shop /> },
  { path: '/design-system', element: <DesignSystem /> },
  { path: '*',              element: <NotFound /> },
]);
```

**Navigation between pages** — always use `Link` or `useNavigate`, never `<a>` tags:

```tsx
import { Link, useNavigate } from 'react-router-dom';

// As a clickable link
<Link to="/discover" className="text-honey-600 hover:text-honey-700">
  Browse Services
</Link>

// Programmatic navigation (after form submit, button click, etc.)
const navigate = useNavigate();
navigate('/dashboard');
```

---

## Building a Component (Step by Step)

Let's say you need to build the `ServiceCard` component. Here's the exact process:

### 1. Create the file

```bash
# Create src/components/ServiceCard.tsx
```

### 2. Write the component

```tsx
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface ServiceCardProps {
  id: number;
  title: string;
  provider: string;
  category: string;
  price: string;
  rating: number;
  reviews: number;
  imageUrl?: string;
}

export default function ServiceCard({ 
  id, title, provider, category, price, rating, reviews, imageUrl 
}: ServiceCardProps) {
  return (
    <Link
      to={`/service/${id}`}
      className="block bg-cream-50 border border-charcoal-100 rounded-xl 
                 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 
                 transition-all duration-200 cursor-pointer"
    >
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-honey-100 via-cream-100 to-charcoal-50 
                       flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-charcoal-300 text-4xl">🎵</span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-mono text-charcoal-400 uppercase tracking-wide">
          {category}
        </span>
        <h3 className="font-sans font-bold text-sm text-charcoal-900 mt-1 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-charcoal-400 mt-1">by {provider}</p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-sm font-bold text-charcoal-900">
            ⬡ {price}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-honey-500 text-honey-500" />
            <span className="font-mono text-xs text-charcoal-600">{rating}</span>
            <span className="text-xs text-charcoal-400">({reviews})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### 3. Use it in a page

```tsx
import ServiceCard from '../components/ServiceCard';

// In your page component's return:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {services.map((service) => (
    <ServiceCard key={service.id} {...service} />
  ))}
</div>
```

**Pattern to follow every time:** define TypeScript props → build the JSX with Tailwind classes using our design tokens → export as default → import where needed.

---

## Form Handling (Every Form Works Like This)

Forms are everywhere in HiveFive — signup, login, post a service, post a request, settings. They all follow the same validation pattern:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PostService() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate on blur (when user leaves the field)
  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    if (name === 'title' && value.length === 0) {
      newErrors.title = 'Service title is required';
    } else if (name === 'title' && value.length > 80) {
      newErrors.title = 'Title must be 80 characters or less';
    } else {
      delete newErrors.title;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // When backend is ready, this becomes a real API call:
    // const response = await fetch('/api/services', { method: 'POST', body: ... });
    
    // For now, simulate success:
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1000);
  };

  const isValid = title.length > 0 && Object.keys(errors).length === 0;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => validateField('title', title)}
        placeholder="e.g. Guitar Lessons for Beginners"
        className={`w-full px-4 py-2.5 rounded-md border 
          ${errors.title ? 'border-semantic-error' : 'border-charcoal-200'}
          focus:outline-none focus:ring-2 focus:ring-honey-500`}
      />
      {errors.title && (
        <p className="text-xs text-semantic-error mt-1">{errors.title}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className={`mt-6 w-full py-2.5 rounded-md font-bold text-sm transition-colors
          ${isValid && !isSubmitting 
            ? 'bg-honey-500 text-charcoal-900 hover:bg-honey-600 cursor-pointer' 
            : 'bg-honey-500 opacity-40 cursor-not-allowed text-charcoal-900'}`}
      >
        {isSubmitting ? 'Publishing...' : 'Publish Service'}
      </button>
    </div>
  );
}
```

**The form pattern:**
1. Validate each field on blur (when the user leaves the field)
2. Validate all fields on submit
3. Show error state immediately on failure
4. Show success checkmark inside the input when a field passes
5. Disable submit button (`opacity-40 cursor-not-allowed`) until all required fields pass
6. On submit: button shows loading spinner, all fields disable
7. On success: show a Toast notification + redirect

---

## Mock Data (Use Until Backend Is Ready)

All mock data lives in `src/lib/data.ts`. This is the exact data from the PRD — use it consistently everywhere:

```ts
// src/lib/data.ts

export const currentUser = {
  name: 'Jordan Park',
  initial: 'J',
  university: 'State University',
  balance: 1250.00,
  memberSince: 'September 2025',
};

export const services = [
  { id: 1,  title: 'Guitar Lessons for Beginners',   category: 'Music',        provider: 'Marcus Rivera',   price: '25/hr',      rating: 4.9, reviews: 23  },
  { id: 2,  title: 'Python Tutoring & Code Review',   category: 'Coding',       provider: 'Sarah Kim',       price: '30/hr',      rating: 5.0, reviews: 47  },
  { id: 3,  title: 'Professional Resume Review',      category: 'Writing',      provider: 'James Chen',      price: '15',         rating: 4.8, reviews: 67  },
  { id: 4,  title: 'Campus Event Photography',        category: 'Photography',  provider: 'Emma Thompson',   price: '40/session', rating: 4.9, reviews: 31  },
  { id: 5,  title: 'Calculus I & II Help',            category: 'Tutoring',     provider: 'Alex Rodriguez',  price: '20/hr',      rating: 4.7, reviews: 19  },
  { id: 6,  title: 'Healthy Meal Prep Service',       category: 'Errands',      provider: 'Maya Patel',      price: '35/week',    rating: 4.9, reviews: 28  },
  { id: 7,  title: 'Airport Ride Service',            category: 'Errands',      provider: 'David Lee',       price: '25',         rating: 5.0, reviews: 43  },
  { id: 8,  title: 'Dorm Deep Cleaning',              category: 'Errands',      provider: 'Lisa Wang',       price: '20',         rating: 4.6, reviews: 15  },
  { id: 9,  title: 'Spanish Conversation Practice',   category: 'Language',     provider: 'Carlos Mendez',   price: '15/hr',      rating: 4.9, reviews: 36  },
  { id: 10, title: 'Custom Logo Design',              category: 'Design',       provider: 'Nina Foster',     price: '50',         rating: 5.0, reviews: 22  },
  { id: 11, title: 'Essay Editing & Proofreading',    category: 'Writing',      provider: 'Olivia Brooks',   price: '20',         rating: 4.8, reviews: 54  },
  { id: 12, title: 'Personal Fitness Coaching',       category: 'Fitness',      provider: 'Tyler Johnson',   price: '30/hr',      rating: 4.7, reviews: 18  },
];

export const messageContacts = [
  { name: 'Sarah Kim',      online: true,  lastMessage: '2m ago'    },
  { name: 'Marcus Rivera',  online: false, lastMessage: '1h ago'    },
  { name: 'Emma Thompson',  online: false, lastMessage: '3h ago'    },
  { name: 'David Lee',      online: false, lastMessage: 'yesterday' },
];
```

**Names, ratings, and prices must match everywhere a service or person appears.** If Marcus Rivera shows 4.9 stars on the Discover page, he shows 4.9 stars on his profile page too.

---

## Responsive Design (Not Optional)

Every page must work on three breakpoints:

| Breakpoint | Width | Tailwind Prefix |
|-----------|-------|----------------|
| Mobile | 0–639px | (no prefix — mobile-first) |
| Tablet | 640px–1023px | `sm:` and `md:` |
| Desktop | 1024px+ | `lg:` and `xl:` |

**The golden rule:** build mobile-first, then add larger breakpoints. In Tailwind, unprefixed classes apply to mobile, and you progressively add `sm:`, `md:`, `lg:` for larger screens.

```tsx
{/* This grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* cards */}
</div>

{/* This container: tight padding on mobile, wider on desktop */}
<div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
  {/* page content */}
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
  {/* sidebar content */}
</div>

{/* Show on mobile only */}
<div className="block lg:hidden">
  {/* mobile hamburger menu */}
</div>
```

**Key responsive patterns:**
- Sidebar panels → hide on mobile, show in slide-out drawer
- NavBar → hamburger menu on mobile, full nav links on `md:` and up
- Two-column layouts → stack vertically on mobile
- Cards → full-width on mobile with `mx-4` margin
- Touch targets → minimum 44×44px on mobile (use `min-h-[44px] min-w-[44px]`)

---

## Connecting to the PHP Backend (Sprint 2+)

Right now everything uses mock data from `src/lib/data.ts`. When the backend team has PHP endpoints ready, here's how you swap in real API calls:

```ts
// src/lib/api.ts

const API_BASE = 'https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/api';

export async function fetchServices() {
  const response = await fetch(`${API_BASE}/services`);
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
}

export async function createService(data: ServiceFormData) {
  const response = await fetch(`${API_BASE}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create service');
  return response.json();
}
```

Then in your component, replace the mock import:

```tsx
// BEFORE (mock data)
import { services } from '../lib/data';

// AFTER (real API)
import { fetchServices } from '../lib/api';
import { useState, useEffect } from 'react';

const [services, setServices] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchServices()
    .then(setServices)
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

**Expected API endpoints** (coordinate with the backend team):

```
POST   /api/auth/login           — User authentication
POST   /api/auth/register        — User registration
GET    /api/services              — List all services
GET    /api/services/:id          — Get service details
POST   /api/services              — Create new service
GET    /api/requests              — List all requests
POST   /api/bookings              — Create booking
GET    /api/messages              — Get conversations
GET    /api/messages/:id          — Get messages in a conversation
GET    /api/users/:id             — Get user profile
GET    /api/wallet/balance        — Get HiveCoin balance
GET    /api/wallet/transactions   — Get transaction history
```

---

## Deployment to UB Servers

Our team's servers are behind UB's firewall — you must be **on campus or using the UB VPN** to access them.

| Server | Purpose | URL |
|--------|---------|-----|
| **aptitude** (test) | Updated within a sprint. Task tests run here. | `https://aptitude.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/` |
| **cattle** (prod) | Updated at end of sprint only. Acceptance tests run here. | `https://cattle.cse.buffalo.edu/CSE442/2026-Spring/cse-442j/` |

**To deploy the frontend:**

```bash
# 1. Build the production bundle
npm run build

# 2. Upload the /dist contents to the server
# Use SCP, SFTP, or your preferred file transfer method
scp -r dist/* YOUR_UBIT@aptitude.cse.buffalo.edu:/data/web/CSE442/2026-Spring/cse-442j/
```

**Important:** Since this is a Single Page Application (SPA), you need an `.htaccess` file in the server directory so that all routes redirect to `index.html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /CSE442/2026-Spring/cse-442j/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . index.html [L]
</IfModule>
```

Without this, refreshing on any page other than the home page will show a 404.

---

## Git Workflow (Don't Skip This)

The course is strict about Git practices. Follow these rules or lose points.

### Branch Naming

Every task gets its own branch off of `dev`. The branch name must include the task number and describe the work:

```bash
# Format: task-{number}-{short-description}
git checkout dev
git pull origin dev
git checkout -b task-61-figma-provide-service
```

### The Workflow

```bash
# 1. Start from dev (always pull latest first)
git checkout dev
git pull origin dev

# 2. Create your task branch
git checkout -b task-XX-your-task-name

# 3. Do your work, commit with meaningful messages
git add .
git commit -m "Add ServiceCard component with hover states and responsive grid"

# 4. Push your branch
git push origin task-XX-your-task-name

# 5. Create a Pull Request on GitHub to merge into dev
# NEVER merge directly into main. NEVER commit directly to dev.
```

### Commit Messages

Every commit message must describe **what** was changed and **why** it matters:

```bash
# GOOD
git commit -m "Add form validation to PostService page with blur-triggered errors"
git commit -m "Fix NavBar active state not highlighting on /discover route"
git commit -m "Implement responsive grid layout for ServiceCard on mobile"

# BAD
git commit -m "Add files via upload"
git commit -m "fix stuff"
git commit -m "update"
```

**Never commit with "Add files via upload"** — the rubric specifically docks points for this.

---

## Quick Reference Card

Keep this open while you code:

```
BACKGROUNDS          bg-cream-50 (pages), bg-cream-50 border border-charcoal-100 (cards)
TEXT                  text-charcoal-900 (headings), text-charcoal-600 (body), text-charcoal-400 (meta)
ACCENT               bg-honey-500 (buttons), text-honey-600 (links), bg-honey-50 (selected states)
BUTTON PRIMARY       bg-honey-500 text-charcoal-900 hover:bg-honey-600 font-bold text-sm px-5 py-2.5 rounded-md
BUTTON SECONDARY     bg-cream-50 border border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50
BUTTON DISABLED      opacity-40 cursor-not-allowed
INPUT                border border-charcoal-200 rounded-md px-4 py-2.5 focus:ring-2 focus:ring-honey-500
INPUT ERROR          border-semantic-error + red error message below
CARD                 bg-cream-50 border border-charcoal-100 rounded-xl shadow-sm p-5
CARD HOVER           hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
FONTS                font-display italic (headlines), font-sans (everything), font-mono (numbers)
CONTAINER            max-w-6xl mx-auto px-4 sm:px-8 lg:px-16
GRID                 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6
```

---

## Common Mistakes (Read Before Your First PR)

1. **Using `bg-white` or `#FFFFFF`** → Use `bg-cream-50`. Always.
2. **Using `<a href>` for internal links** → Use React Router's `<Link to>`.
3. **Hard-coding colors** → Use Tailwind tokens: `text-charcoal-600`, not `text-gray-500`.
4. **Forgetting mobile** → Every layout needs `grid-cols-1` (mobile) before `lg:grid-cols-3`.
5. **Committing to `main` or `dev` directly** → Always branch off `dev`, always use a PR.
6. **Inconsistent mock data** → If Marcus Rivera is 4.9 stars in the data file, he's 4.9 everywhere.
7. **Using emoji as icons** → Use Lucide React components: `<Star />`, `<Bell />`, `<Search />`.
8. **Forgetting `aria-label` on icon-only buttons** → Accessibility is graded.
9. **Using a different icon library** → Lucide React only. No Font Awesome, no Heroicons.
10. **Skipping the loading state** → Every data fetch needs a skeleton shimmer or loading indicator.

---

## Need Help?

- **Tailwind docs:** [tailwindcss.com/docs](https://tailwindcss.com/docs) — search any class name
- **React Router docs:** [reactrouter.com](https://reactrouter.com) — routing patterns
- **Lucide icons:** [lucide.dev/icons](https://lucide.dev/icons) — browse all available icons
- **Vite docs:** [vite.dev](https://vite.dev) — build tool configuration

If something's broken and you can't figure it out, document your debugging efforts in the scrum board card comments (Wei checks these). Then ask the team.

---

*Last updated: February 10, 2026 — Intesar*
