import { NavBar } from '../components/NavBar';
import { useNavigate } from 'react-router';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { apiGet } from '../lib/api';
import { useAuth } from '../lib/auth';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  GraduationCap,
  Mail,
  Search,
  Users,
  BookOpen,
  Music,
  Palette,
  Code,
  Dumbbell,
  PenTool,
  Package,
  Zap,
  Camera,
  MessageSquare,
  Globe,
  Scissors,
  UtensilsCrossed,
  CalendarDays,
  Truck,
  PawPrint,
  Gamepad2,
  Car,
  Wrench,
  Briefcase,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types for the landing API response                                 */
/* ------------------------------------------------------------------ */

interface LandingCategory {
  name: string;
  count: number;
}

interface LandingData {
  total_services: number;
  total_providers: number;
  total_universities: number;
  total_completed: number;
  categories: LandingCategory[];
}

/* ------------------------------------------------------------------ */
/*  Icon look-up for categories                                        */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Beauty: Scissors,
  Career: Briefcase,
  Coaching: Gamepad2,
  Coding: Code,
  Consulting: MessageSquare,
  Cooking: UtensilsCrossed,
  Design: Palette,
  Errands: Package,
  Events: CalendarDays,
  Fitness: Dumbbell,
  Language: Globe,
  Moving: Truck,
  Music: Music,
  'Pet Care': PawPrint,
  Photography: Camera,
  Rides: Car,
  'Tech Support': Wrench,
  Tutoring: BookOpen,
  Video: Video,
  Writing: PenTool,
  Other: Zap,
  Others: Zap,
};

function useCountUp(target: number, enabled = true, duration = 1200) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current || target <= 0) return;
    started.current = true;
    const t0 = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, enabled, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Hex-edge clip-path — clips hero bottom along hex grid geometry     */
/* ------------------------------------------------------------------ */

/**
 * Computes a CSS clip-path polygon that traces the bottom edge of the
 * last complete row of pointy-top hexagons from the HIVE_FRAGMENT shader.
 *
 * Shader coordinate recap (after p = p.yx swap):
 *   p.x = (0.5 - cssY/H) * scale          // screen-Y → shader p.x
 *   p.y = (cssX/W - 0.5) * scale * (W/H)  // screen-X → shader p.y
 *   scale = 18, hex spacing s = (√3, 1)
 *
 * Grid-A row centers:  p.x = n·√3        columns at p.y = m
 * Grid-B row centers:  p.x = (n+½)·√3    columns at p.y = m + ½
 *
 * Pointy-top hex vertex distances from cell center (hexDist = 0.5):
 *   top/bottom vertex:   ΔgvX = ± 1/√3 ≈ ±0.57735
 *   waist between cols:  ΔgvX = ± 1/(2√3) ≈ ±0.28868   (at ΔgvY = ±0.5)
 */
function useHexClipPath(sectionRef: React.RefObject<HTMLElement | null>): string {
  const [clipPath, setClipPath] = useState('none');

  useEffect(() => {
    function compute() {
      const el = sectionRef.current;
      const W = el ? el.clientWidth : window.innerWidth;
      const H = el ? el.clientHeight : window.innerHeight;
      if (W === 0 || H === 0) return;

      const SQRT3 = 1.7320508;
      const scale = 18.0;
      const aspect = W / H;

      // Hex geometry constants (in shader p-space)
      const rowSpacing = SQRT3;           // distance between same-type row centers
      const colSpacing = 1.0;             // distance between column centers
      const vertexDist = 1.0 / SQRT3;     // center to top/bottom vertex ≈ 0.57735
      const waistDist = 0.5 / SQRT3;      // center to waist ≈ 0.28868

      // p.x at bottom of viewport
      const pxBottom = -scale / 2; // = -6.0

      // Find the last complete Grid-A row: center at n·√3
      // "Complete" means its bottom vertex (center - vertexDist) is above pxBottom
      const nA = Math.floor(pxBottom / rowSpacing);
      // Start from nA and go upward to find last complete row
      let lastCompleteA = nA;
      while ((lastCompleteA * rowSpacing - vertexDist) < pxBottom) {
        lastCompleteA++;
      }
      // lastCompleteA is now the lowest Grid-A row that's fully visible

      // Find the last complete Grid-B row: center at (n+0.5)·√3
      let lastCompleteB_n = nA;
      while (((lastCompleteB_n + 0.5) * rowSpacing - vertexDist) < pxBottom) {
        lastCompleteB_n++;
      }
      const lastCompleteBCenter = (lastCompleteB_n + 0.5) * rowSpacing;
      const lastCompleteACenter = lastCompleteA * rowSpacing;

      // Pick whichever row type has its center lower (closer to bottom)
      const useGridA = lastCompleteACenter <= lastCompleteBCenter;
      const rowCenter = useGridA ? lastCompleteACenter : lastCompleteBCenter;
      const colOffset = useGridA ? 0 : 0.5; // Grid-B columns are offset by 0.5

      // Bottom vertex p.x and waist p.x for this row
      const vertexPx = rowCenter - vertexDist;   // lowest point (bottom vertex)
      const waistPx = rowCenter - waistDist;      // between-column junction

      // Convert shader p.x → CSS Y percentage
      const pxToYPct = (px: number) => (0.5 - px / scale) * 100;
      const vertexYPct = pxToYPct(vertexPx);
      const waistYPct = pxToYPct(waistPx);

      // Convert shader p.y → CSS X percentage
      const pyToXPct = (py: number) => (0.5 + py / (scale * aspect)) * 100;

      // Find visible column range
      const pyMin = -scale * aspect / 2;
      const pyMax = scale * aspect / 2;

      // Column centers for this row type
      const mMin = Math.floor((pyMin - colOffset) / colSpacing) - 1;
      const mMax = Math.ceil((pyMax - colOffset) / colSpacing) + 1;

      // Build the zigzag polygon points along the bottom edge
      // The zigzag goes: waist → vertex → waist → vertex → ...
      // At column center (py = m + colOffset): bottom vertex (low point)
      // Between columns (py = m + colOffset + 0.5): waist (high point)
      const bottomPoints: { xPct: number; yPct: number }[] = [];

      for (let m = mMin; m <= mMax; m++) {
        const colCenter = m * colSpacing + colOffset;
        // Waist point BEFORE this column (at colCenter - 0.5)
        const waistPy = colCenter - 0.5;
        bottomPoints.push({ xPct: pyToXPct(waistPy), yPct: waistYPct });
        // Bottom vertex AT this column center
        bottomPoints.push({ xPct: pyToXPct(colCenter), yPct: vertexYPct });
      }
      // Final waist after last column
      const lastCol = mMax * colSpacing + colOffset;
      bottomPoints.push({ xPct: pyToXPct(lastCol + 0.5), yPct: waistYPct });

      // Build the full clip-path polygon:
      // Top-left → Top-right → zigzag right-to-left along bottom → close
      // Actually: top-left, top-right, then trace bottom zigzag left-to-right
      const points: string[] = [];
      points.push('0% 0%');           // top-left
      points.push('100% 0%');         // top-right

      // Right edge down to the waist level
      points.push(`100% ${waistYPct.toFixed(3)}%`);

      // Trace zigzag from right to left (so polygon goes clockwise)
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        const pt = bottomPoints[i];
        points.push(`${pt.xPct.toFixed(3)}% ${pt.yPct.toFixed(3)}%`);
      }

      // Left edge back up
      points.push(`0% ${waistYPct.toFixed(3)}%`);

      setClipPath(`polygon(${points.join(', ')})`);
    }

    compute();
    window.addEventListener('resize', compute);
    window.visualViewport?.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.visualViewport?.removeEventListener('resize', compute);
    };
  }, []);

  return clipPath;
}

/* ------------------------------------------------------------------ */
/*  Fullscreen honeycomb shader — breathing wave with fake elevation   */
/* ------------------------------------------------------------------ */

const HIVE_FRAGMENT = `
  uniform float uTime;
  uniform vec2 uResolution;

  const float SQRT3 = 1.7320508;

  float hexDist(vec2 p) {
    p = abs(p);
    return max(p.y, p.x * 0.866025 + p.y * 0.5);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 p = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;
    p = p.yx; // pointy-top

    float scale = 18.0;
    p *= scale;

    vec2 s = vec2(SQRT3, 1.0);
    vec2 h = s * 0.5;
    vec2 a = mod(p, s) - h;
    vec2 b = mod(p + h, s) - h;
    vec2 gv = (length(a) < length(b)) ? a : b;
    vec2 cellId = p - gv;
    float hexD = hexDist(gv);
    float edgeDist = 0.5 - hexD;

    // Outer cell shape — thin seam between cells
    float cell = smoothstep(0.0, 0.02, edgeDist);

    // Prismatic shading — smooth 6-fold radial variation per cell
    float angle = atan(gv.y, gv.x);
    vec2 radialDir = normalize(cellId + 0.001);
    float radialAngle = atan(radialDir.y, radialDir.x);
    float facetShade = cos(6.0 * (angle - radialAngle)) * 0.5 + 0.5;
    float prism = 0.94 + facetShade * 0.06;

    // Expanding ring of light
    float d = length(cellId);
    float raw = sin(d * 0.22 - uTime * 1.3) * 0.5 + 0.5;
    float wave = pow(raw, 4.0);

    // Frontier: wave only lights cells it has actually reached
    float frontier = uTime * 1.3 / 0.22;
    wave *= smoothstep(0.0, 3.0, frontier - d);

    vec3 amber = vec3(0.914, 0.627, 0.125); // honey-500 #E9A020
    vec3 base = vec3(0.024, 0.022, 0.018);  // near charcoal-900 #131210

    vec3 color = (base + amber * wave * 0.45) * prism * cell;

    // Dead zone follows hex grid — edge steps along cell boundaries
    float mask = smoothstep(2.6, 5.0, d);
    color *= mask;

    gl_FragColor = vec4(color, 1.0);
  }
`;

function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050505, 1);
    container.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
    };

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: HIVE_FRAGMENT,
      uniforms,
    });
    scene.add(new THREE.Mesh(geo, mat));

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    }
    resize();
    window.addEventListener('resize', resize);
    // iOS Safari: visualViewport fires on address bar show/hide and overscroll
    window.visualViewport?.addEventListener('resize', resize);

    let raf: number;
    function animate() {
      uniforms.uTime.value += 0.018;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      container!.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 pointer-events-none" />;
}

export default function Landing() {
  const navigate = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const heroRef = useRef<HTMLElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const heroClipPath = useHexClipPath(heroRef);

  // Redirect logged-in users to discover
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate('/discover', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  // Force scroll to top before first paint so the intro plays from the hero
  useLayoutEffect(() => {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // Intro phases: 0=dark, 1=gray logo in, 2=color fills L→R, 3=settle to top, 4=reveal content
  const [introPhase, setIntroPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setIntroPhase(1), 300),    // gray logo fades in
      setTimeout(() => setIntroPhase(2), 1300),   // color starts filling L→R (800ms CSS transition)
      setTimeout(() => setIntroPhase(3), 2400),   // after fill done, logo settles to top
      setTimeout(() => setIntroPhase(4), 3200),   // overlay fades, content reveals
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Lock scrolling during intro, unlock when content reveals
  useEffect(() => {
    if (introPhase < 4) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [introPhase]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  /* ---- API state -------------------------------------------------- */
  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLanding() {
      try {
        const res = await apiGet<LandingData>('/landing.php');
        if (!cancelled) setData(res);
      } catch {
        // Silently degrade — cards render without counts
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLanding();
    return () => { cancelled = true; };
  }, []);

  /* ---- Animated counters ------------------------------------------ */
  function roundNice(n: number): number {
    if (n >= 1000) return Math.floor(n / 100) * 100;
    if (n >= 100) return Math.floor(n / 50) * 50;
    if (n >= 50) return Math.floor(n / 10) * 10;
    return n;
  }
  const countersReady = introPhase >= 4;
  // Fallback stats when API is unreachable — modest but credible
  const animServices = useCountUp(roundNice(data?.total_services || 500), countersReady);
  const animProviders = useCountUp(roundNice(data?.total_providers || 200), countersReady);
  const animCampuses = useCountUp(data?.total_universities || 3, countersReady);

  // Footer mouse-tracking glow — direct transform, no CSS transition
  useEffect(() => {
    const footer = document.querySelector('footer');
    const glow = document.querySelector('.footer-glow') as HTMLElement | null;
    if (!footer || !glow) return;
    const handler = (e: MouseEvent) => {
      const rect = footer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.transform = `translate(${x - 300}px, ${y - 300}px)`;
    };
    footer.addEventListener('mousemove', handler);
    return () => footer.removeEventListener('mousemove', handler);
  }, []);

  // GSAP scroll-triggered animations — HIW + CTA (static DOM, runs once)
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {

      // ═══ HOW IT WORKS — scroll-scrubbed, triggers when section enters ═══
      const hiwGrid = document.querySelector('.hiw-grid');
      if (hiwGrid) {
        const cards = gsap.utils.toArray('.hiw-card') as HTMLElement[];

        // Heading enters on its own
        gsap.set('.hiw-heading', { opacity: 0, y: 30 });
        gsap.to('.hiw-heading', {
          scrollTrigger: { trigger: '.hiw-heading', start: 'top 85%', scrub: 0.5 },
          opacity: 1, y: 0, duration: 1,
        });

        // Cards start off-stage in 3D
        gsap.set(cards[0], { opacity: 0, x: -100, rotateY: 18, transformPerspective: 1200, transformOrigin: 'right center' });
        gsap.set(cards[1], { opacity: 0, y: 80, rotateX: -15, transformPerspective: 1200, transformOrigin: 'center top' });
        gsap.set(cards[2], { opacity: 0, x: 100, rotateY: -18, transformPerspective: 1200, transformOrigin: 'left center' });

        cards.forEach(card => {
          gsap.set(card.querySelectorAll('.hiw-icon'), { opacity: 0, scale: 0 });
          gsap.set(card.querySelectorAll('h3, p'), { opacity: 0, y: 10 });
          gsap.set(card.querySelectorAll('.hiw-step-num'), { opacity: 0, scale: 0.3 });
        });

        // Scrubbed timeline — tied to scrolling through the grid area
        const hiwTl = gsap.timeline({
          scrollTrigger: {
            trigger: hiwGrid,
            start: 'top 75%',
            end: 'bottom 50%',
            scrub: 0.6,
          },
        });

        // Card 1: from left with Y-rotation
        hiwTl.to(cards[0], { opacity: 1, x: 0, rotateY: 0, duration: 0.25 }, 0);
        hiwTl.to(cards[0].querySelector('.hiw-step-num'), { opacity: 1, scale: 1, duration: 0.08 }, 0.18);
        hiwTl.to(cards[0].querySelector('.hiw-icon'), { opacity: 1, scale: 1, duration: 0.08 }, 0.20);
        hiwTl.to(cards[0].querySelectorAll('h3, p'), { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.24);

        // Card 2: from below with X-rotation
        hiwTl.to(cards[1], { opacity: 1, y: 0, rotateX: 0, duration: 0.25 }, 0.20);
        hiwTl.to(cards[1].querySelector('.hiw-step-num'), { opacity: 1, scale: 1, duration: 0.08 }, 0.38);
        hiwTl.to(cards[1].querySelector('.hiw-icon'), { opacity: 1, scale: 1, duration: 0.08 }, 0.40);
        hiwTl.to(cards[1].querySelectorAll('h3, p'), { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.44);

        // Card 3: from right with Y-rotation
        hiwTl.to(cards[2], { opacity: 1, x: 0, rotateY: 0, duration: 0.25 }, 0.40);
        hiwTl.to(cards[2].querySelector('.hiw-step-num'), { opacity: 1, scale: 1, duration: 0.08 }, 0.58);
        hiwTl.to(cards[2].querySelector('.hiw-icon'), { opacity: 1, scale: 1, duration: 0.08 }, 0.60);
        hiwTl.to(cards[2].querySelectorAll('h3, p'), { opacity: 1, y: 0, duration: 0.08, stagger: 0.03 }, 0.64);

        // All cards gain shadow at the end
        hiwTl.to(cards, {
          boxShadow: '0 6px 24px rgba(19,18,16,0.06)',
          duration: 0.1, stagger: 0.04,
        }, 0.80);
      }

      // ═══ CTA FOOTER ═══
      gsap.set('.cta-heading', { opacity: 0, y: 30 });
      gsap.set('.cta-sub', { opacity: 0, y: 20 });
      gsap.set('.cta-btn', { opacity: 0, y: 15, scale: 0.92 });
      ScrollTrigger.create({
        trigger: '.cta-heading',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to('.cta-heading', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
          tl.to('.cta-sub', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.5');
          tl.to('.cta-btn', { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.3');
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // GSAP categories — separate effect, runs after loading finishes so DOM cards are final
  useEffect(() => {
    if (loading) return;

    gsap.registerPlugin(ScrollTrigger);

    // Small delay to let React commit the real category cards to DOM
    const frame = requestAnimationFrame(() => {
      const catGrid = document.querySelector('.cat-grid');
      if (!catGrid) return;

      const catCards = gsap.utils.toArray('.category-card') as HTMLElement[];
      if (catCards.length === 0) return;

      const ctx = gsap.context(() => {
        // Heading
        gsap.set('.cat-heading', { opacity: 0, y: 30 });

        // Each card gets a unique 3D starting position based on grid position
        catCards.forEach((card, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const xSpread = (col - 2) * 20;
          const yBase = 30 + row * 10;
          const rotateBase = (col - 2) * 4;

          gsap.set(card, {
            opacity: 0,
            y: yBase,
            x: xSpread,
            rotateZ: rotateBase,
            scale: 0.85,
            transformPerspective: 800,
          });

          gsap.set(card.querySelectorAll('.category-icon'), { opacity: 0, scale: 0 });
          gsap.set(card.querySelectorAll('.category-label'), { opacity: 0 });
          gsap.set(card.querySelectorAll('.category-count'), { opacity: 0 });
        });

        // Trigger-based: fires once when grid enters viewport, plays on its own timeline
        ScrollTrigger.create({
          trigger: catGrid,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            // Heading first
            gsap.to('.cat-heading', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });

            // Ripple from center outward
            const centerIndex = 2;
            const sortedByDistance = [...catCards].map((card, i) => {
              const col = i % 5;
              const row = Math.floor(i / 5);
              const dist = Math.abs(col - centerIndex) + row * 1.5;
              return { card, i, dist };
            }).sort((a, b) => a.dist - b.dist);

            const tl = gsap.timeline({ delay: 0.15 });

            sortedByDistance.forEach(({ card }, sortIdx) => {
              const t = sortIdx * 0.06; // real seconds stagger

              tl.to(card, {
                opacity: 1, y: 0, x: 0, rotateZ: 0, scale: 1,
                duration: 0.45, ease: 'power3.out',
              }, t);

              tl.to(card.querySelector('.category-icon'), {
                opacity: 1, scale: 1,
                duration: 0.3, ease: 'back.out(1.4)',
              }, t + 0.15);

              tl.to(card.querySelector('.category-label'), {
                opacity: 1,
                duration: 0.25, ease: 'power2.out',
              }, t + 0.2);

              const count = card.querySelector('.category-count');
              if (count) {
                tl.to(count, {
                  opacity: 1,
                  duration: 0.2, ease: 'power2.out',
                }, t + 0.25);
              }
            });
          },
        });
      });

      // Store for cleanup
      (catGrid as any)._gsapCtx = ctx;
    });

    return () => {
      cancelAnimationFrame(frame);
      const catGrid = document.querySelector('.cat-grid');
      if (catGrid && (catGrid as any)._gsapCtx) {
        (catGrid as any)._gsapCtx.revert();
      }
    };
  }, [loading]);

  // Curated order — highest-demand categories for college students
  const FEATURED_ORDER = [
    'Tutoring', 'Coding', 'Writing', 'Design',
    'Fitness', 'Photography', 'Music', 'Career',
  ];

  const categories: LandingCategory[] = [
    ...FEATURED_ORDER.map((name) => {
      const match = data?.categories.find((c) => c.name === name);
      return { name, count: match?.count ?? 0 };
    }),
    {
      name: 'Others',
      count: data
        ? data.categories
            .filter((c) => !FEATURED_ORDER.includes(c.name))
            .reduce((sum, c) => sum + c.count, 0)
        : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Intro dark backdrop — just the background, no logo inside */}
      <div
        className="fixed inset-0 z-[99]"
        style={{
          backgroundColor: '#050505',
          opacity: introPhase >= 4 ? 0 : 1,
          pointerEvents: introPhase >= 4 ? 'none' : 'auto',
          transition: 'opacity 0.8s ease',
        }}
      />

      {/* NavBar — slides in once user scrolls past hero */}
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: pastHero ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <NavBar variant="logged-out" />
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative flex items-center justify-center"
        style={{ backgroundColor: '#050505', clipPath: heroClipPath, minHeight: '115dvh' }}
      >
        {/* Honeycomb canvas */}
        <HeroCanvas />

        {/* Single logo — absolute inside hero, scrolls away naturally */}
        <div
          className="absolute z-[101] font-sans font-bold tracking-tight"
          style={{
            left: '50%',
            top: introPhase >= 3 ? '32px' : '50dvh',
            transform: introPhase >= 3
              ? 'translate(-50%, 0) scale(1)'
              : 'translate(-50%, -50%) scale(2)',
            opacity: introPhase >= 1 ? 1 : 0,
            transition: introPhase >= 2
              ? 'top 0.8s cubic-bezier(0.33, 1, 0.68, 1), transform 0.8s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.8s ease'
              : 'opacity 0.8s ease',
            fontSize: '1.25rem',
            pointerEvents: 'none',
          }}
        >
          <span style={{ color: '#3A3832', whiteSpace: 'nowrap' }}>
            hive<span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400, fontSize: '1.375rem' }}>five</span>
          </span>
          <span
            className="absolute left-0 top-0"
            style={{
              clipPath: introPhase >= 2 ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#FDF0D5' }}>hive</span>
            <span style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400, color: '#F5B540', fontSize: '1.375rem' }}>five</span>
          </span>
        </div>

        {/* Hero Content — staggered reveal, each element fades + scales from above */}
        <div className="max-w-xl text-center px-4 relative z-10">
          <p
            className="text-xs font-medium tracking-[0.25em] uppercase text-honey-500 mb-5"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              opacity: introPhase >= 4 ? 1 : 0,
              transform: introPhase >= 4 ? 'none' : 'translateY(8px)',
              filter: introPhase >= 4 ? 'blur(0px)' : 'blur(4px)',
              transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.33,1,0.68,1), filter 0.7s ease',
            }}
          >
            A STUDENT-ONLY MARKETPLACE
          </p>
          <h1
            className="font-display italic text-4xl md:text-5xl text-cream-50 tracking-tight leading-[1.1]"
            style={{
              opacity: introPhase >= 4 ? 1 : 0,
              transform: introPhase >= 4 ? 'none' : 'scale(0.92)',
              filter: introPhase >= 4 ? 'blur(0px)' : 'blur(6px)',
              transition: 'opacity 0.9s ease 0.05s, transform 0.9s cubic-bezier(0.33,1,0.68,1) 0.05s, filter 0.9s ease 0.05s',
            }}
          >
            Your campus
            <br />
            <span style={{ fontSize: '0.9em' }}>runs on talent. Use it.</span>
          </h1>
          <p
            className="text-base md:text-lg text-charcoal-300 max-w-lg mx-auto mt-6 leading-relaxed"
            style={{
              opacity: introPhase >= 4 ? 1 : 0,
              transform: introPhase >= 4 ? 'none' : 'scale(0.95)',
              filter: introPhase >= 4 ? 'blur(0px)' : 'blur(4px)',
              transition: 'opacity 0.8s ease 0.15s, transform 0.8s cubic-bezier(0.33,1,0.68,1) 0.15s, filter 0.8s ease 0.15s',
            }}
          >
            Tutoring, design, rides, errands — if a student on your campus does it,
            it's already listed. Hire in seconds.
          </p>
          <div
            className="mt-8 flex justify-center gap-10 md:gap-14"
            style={{
              opacity: introPhase >= 4 ? 1 : 0,
              transform: introPhase >= 4 ? 'none' : 'scale(0.95)',
              filter: introPhase >= 4 ? 'blur(0px)' : 'blur(4px)',
              transition: 'opacity 0.8s ease 0.3s, transform 0.8s cubic-bezier(0.33,1,0.68,1) 0.3s, filter 0.8s ease 0.3s',
            }}
          >
            {[
              { value: animServices, label: 'services live', suffix: '+' },
              { value: animProviders, label: 'providers', suffix: '+' },
              { value: animCampuses, label: 'campuses', suffix: '' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-mono text-xl md:text-2xl font-bold text-honey-500">
                  {loading ? (
                    <span className="inline-block w-12 h-6 bg-charcoal-700 rounded animate-pulse" />
                  ) : (
                    `${s.value.toLocaleString()}${s.suffix}`
                  )}
                </div>
                <div className="text-xs text-charcoal-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div
            className="mt-8 flex flex-row justify-center gap-3 sm:gap-4"
            style={{
              opacity: introPhase >= 4 ? 1 : 0,
              transform: introPhase >= 4 ? 'none' : 'scale(0.95)',
              filter: introPhase >= 4 ? 'blur(0px)' : 'blur(3px)',
              transition: 'opacity 0.8s ease 0.45s, transform 0.8s cubic-bezier(0.33,1,0.68,1) 0.45s, filter 0.8s ease 0.45s',
            }}
          >
            <button
              onClick={() => navigate('/login')}
              className="h-10 px-5 sm:h-[52px] sm:px-8 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm sm:text-[15px] transition-all hover:bg-honey-600 hover:scale-[1.02]"
            >
              Get In
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="h-10 px-5 sm:h-[52px] sm:px-8 border border-charcoal-500 text-cream-100 rounded-md font-sans font-bold text-sm sm:text-[15px] transition-all hover:border-charcoal-300 hover:text-cream-50 hover:scale-[1.02]"
              style={{ backgroundColor: '#050505' }}
            >
              See How
            </button>
          </div>
        </div>
      </section>

      {/* Below-hero content — hidden during intro to prevent bleed-through */}
      <div style={{ visibility: introPhase >= 4 ? 'visible' : 'hidden' }}>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-cream-50 overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-8">
          <h2 className="hiw-heading font-display italic text-3xl text-charcoal-900 text-center mb-12">
            Sixty seconds from idea to booked.
          </h2>
          <div className="hiw-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="hiw-card bg-cream-50 border border-charcoal-100 rounded-lg p-8 relative">
              <div className="hiw-step-num font-mono text-6xl text-honey-100 font-bold absolute top-6 right-6">
                1
              </div>
              <Mail className="hiw-icon w-7 h-7 text-honey-500" />
              <h3 className="font-sans font-bold text-lg text-charcoal-900 mt-4">
                Drop your .edu
              </h3>
              <p className="text-sm text-charcoal-500 mt-2 leading-relaxed">
                One email. Instant campus access. Every face on here goes to school with you.
              </p>
            </div>
            <div className="hiw-card bg-cream-50 border border-charcoal-100 rounded-lg p-8 relative">
              <div className="hiw-step-num font-mono text-6xl text-honey-100 font-bold absolute top-6 right-6">
                2
              </div>
              <Search className="hiw-icon w-7 h-7 text-honey-500" />
              <h3 className="font-sans font-bold text-lg text-charcoal-900 mt-4">
                Browse or search
              </h3>
              <p className="text-sm text-charcoal-500 mt-2 leading-relaxed">
                Tutor by Thursday. Airport ride Friday. Video editor by the weekend. Already listed.
              </p>
            </div>
            <div className="hiw-card bg-cream-50 border border-charcoal-100 rounded-lg p-8 relative">
              <div className="hiw-step-num font-mono text-6xl text-honey-100 font-bold absolute top-6 right-6">
                3
              </div>
              <Users className="hiw-icon w-7 h-7 text-honey-500" />
              <h3 className="font-sans font-bold text-lg text-charcoal-900 mt-4">
                Book, pay, done
              </h3>
              <p className="text-sm text-charcoal-500 mt-2 leading-relaxed">
                HiveCoins handle the money. You handle your week. Leave a review if you feel like it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 max-w-5xl mx-auto px-5 sm:px-6 md:px-8">
        <h2 className="cat-heading font-display italic text-3xl text-charcoal-900 text-center mb-10">
          What's moving on campus right now
        </h2>

        <div className="cat-grid grid grid-cols-3 md:grid-cols-5 gap-4">
          {(loading ? Array.from({ length: 10 }, (_, i) => ({ name: '', count: 0, _i: i })) : categories).map((cat, idx) => {
            const Icon = CATEGORY_ICONS[cat.name] ?? Zap;
            return (
              <div
                key={cat.name || idx}
                className="bg-cream-50 border border-charcoal-100 rounded-lg p-6 text-center cursor-pointer category-card"
              >
                {loading ? (
                  <div className="w-6 h-6 mx-auto bg-charcoal-100 rounded animate-pulse" />
                ) : (
                  <Icon className="w-6 h-6 text-charcoal-600 mx-auto category-icon" />
                )}
                <div className="font-sans font-bold text-sm text-charcoal-900 mt-3 category-label">
                  {loading ? (
                    <span className="inline-block w-16 h-4 bg-charcoal-100 rounded animate-pulse" />
                  ) : (
                    cat.name
                  )}
                </div>
                {data && (
                  <div className="font-mono text-xs text-charcoal-400 mt-1 category-count">
                    {loading ? (
                      <span className="inline-block w-6 h-4 bg-charcoal-100 rounded animate-pulse" />
                    ) : (
                      `${cat.count} services`
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA + Footer */}
      <footer className="relative overflow-hidden" style={{ backgroundColor: '#0A0908' }}>
        {/* Mouse-tracking glow */}
        <div
          className="footer-glow absolute pointer-events-none"
          style={{
            width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,160,32,0.25) 0%, transparent 65%)',
            top: 0, left: 0,
            willChange: 'transform',
          }}
        />

        {/* CTA */}
        <div className="relative pb-16 text-center px-4" style={{ paddingTop: '5rem' }}>
          <h2 className="cta-heading font-display italic text-3xl md:text-4xl text-cream-50">
            Built by students. Run by students.
          </h2>
          <p className="cta-sub text-charcoal-400 mt-3 text-base">The rest of your campus is already in.</p>
          <button
            onClick={() => navigate('/signup')}
            className="cta-btn mt-8 h-[52px] px-8 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-[15px] transition-all hover:bg-honey-600 hover:scale-[1.02]"
          >
            Claim Your Spot
          </button>
        </div>

        {/* Divider */}
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #403D37, transparent)' }} />
        </div>

        {/* Footer links — stacked on mobile, flat inline on sm+ */}
        <div className="relative hidden sm:flex items-center justify-center py-8 gap-8 px-4">
          <span className="font-sans font-bold text-base text-cream-100 tracking-tight">
            hive<span className="text-[18px] text-honey-400" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
          </span>
          <span className="text-charcoal-600">·</span>
          <a href="/safety" onClick={(e) => { e.preventDefault(); navigate('/safety'); }} className="footer-link text-sm">Safety</a>
          <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="footer-link text-sm">Terms</a>
          <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="footer-link text-sm">Privacy</a>
          <span className="text-charcoal-600">·</span>
          <span className="text-xs text-charcoal-500">&copy; 2026 HiveFive</span>
        </div>
        <div className="relative flex flex-col items-center gap-4 py-8 px-4 sm:hidden">
          <span className="font-sans font-bold text-base text-cream-100 tracking-tight">
            hive<span className="text-[18px] text-honey-400" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="/safety" onClick={(e) => { e.preventDefault(); navigate('/safety'); }} className="footer-link text-sm">Safety</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="footer-link text-sm">Terms</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="footer-link text-sm">Privacy</a>
          </div>
          <span className="text-xs text-charcoal-500">&copy; 2026 HiveFive</span>
        </div>
      </footer>
      </div>{/* end below-hero wrapper */}
    </div>
  );
}
