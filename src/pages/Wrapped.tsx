import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { apiGet } from '../lib/api';
import { toPng } from 'html-to-image';
import {
  Sparkles, Download, Share2, X,
  Trophy, Star, Quote, Hexagon, ChevronDown,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface WrappedData {
  semester_label: string;
  has_activity: boolean;
  total_earned: number;
  total_spent: number;
  orders_completed_as_provider: number;
  orders_completed_as_client: number;
  five_star_reviews: number;
  average_rating: number;
  top_category: string | null;
  category_count: number;
  best_review: { quote: string; reviewer_name: string; rating: number } | null;
  unique_clients: number;
  buzz_score: number;
  buzz_percentile: number;
  campus_rank: number;
  total_users_at_campus: number;
  services_posted: number;
}
interface UserData { first_name: string; university: string | null; profile_image: string | null; username: string; }
interface WrappedResponse { wrapped: WrappedData; user: UserData; }

const AMBER = '#f59e0b';
const GRAIN_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const BG: Record<string, string> = {
  intro: '#07060b', headline: '#0c0906', review: '#0a071a',
  category: '#070c0a', rank: '#060810', empty: '#07060b', summary: '#07060b',
};

function SplitChars({ text, className }: { text: string; className: string }) {
  return (
    <span aria-label={text}>
      {text.split('').map((ch, i) => (
        <span key={i} className={className} style={{ display: 'inline-block' }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}

export default function Wrapped() {
  const nav = useNavigate();
  const [data, setData] = useState<WrappedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [panels, setPanels] = useState<string[]>([]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const sumCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiGet<WrappedResponse>('/wrapped.php')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const w = data.wrapped;
    const p = ['intro'];
    if (!w.has_activity) { p.push('empty'); setPanels(p); return; }
    p.push('headline');
    if (w.best_review) p.push('review');
    if (w.top_category) p.push('category');
    p.push('rank', 'summary');
    setPanels(p);
  }, [data]);

  // ═══════════════ SCROLLTRIGGER ═══════════════
  useEffect(() => {
    if (!panels.length || !wrapRef.current || !data) return;

    let ctx: gsap.Context;
    const raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const w = data.wrapped;
        const wrap = wrapRef.current!;

        // ── progress bar ──
        ScrollTrigger.create({
          trigger: wrap, start: 'top top', end: 'bottom bottom',
          onUpdate: s => { if (progRef.current) progRef.current.style.width = `${s.progress * 100}%`; },
        });

        // ── background color morph ──
        gsap.utils.toArray<HTMLElement>('.ws').forEach(el => {
          const id = el.dataset.s;
          if (!id || !bgRef.current) return;
          ScrollTrigger.create({
            trigger: el, start: 'top 60%',
            onEnter: () => gsap.to(bgRef.current!, { backgroundColor: BG[id] || BG.intro, duration: 1.4, ease: 'power1.inOut', overwrite: true }),
            onEnterBack: () => gsap.to(bgRef.current!, { backgroundColor: BG[id] || BG.intro, duration: 1.4, ease: 'power1.inOut', overwrite: true }),
          });
        });

        // ── hexagon parallax ──
        gsap.utils.toArray<HTMLElement>('.hx').forEach(el => {
          gsap.to(el, {
            y: () => -window.innerHeight * (0.15 + Math.random() * 0.45),
            ease: 'none',
            scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: true },
          });
        });

        // ════════════ INTRO ════════════
        const intro = wrap.querySelector('.s-intro');
        if (intro) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: intro, start: 'top top', end: '+=90%', pin: true, scrub: 0.5 },
          });
          tl.to('.scroll-cue', { autoAlpha: 0, y: -12, duration: 0.04 }, 0);
          tl.fromTo('.i-spark',
            { scale: 0, rotation: -20 },
            { scale: 1, rotation: 0, duration: 0.12, ease: 'back.out(2.5)' }, 0.02);
          tl.fromTo('.i-ch',
            { autoAlpha: 0, y: 18, rotateY: -90 },
            { autoAlpha: 1, y: 0, rotateY: 0, stagger: 0.006, duration: 0.04 }, 0.1);
          tl.fromTo('.i-t1',
            { clipPath: 'inset(100% 0 0 0)', y: 30 },
            { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 0.18, ease: 'power4.out' }, 0.2);
          tl.fromTo('.i-t2',
            { clipPath: 'inset(100% 0 0 0)', y: 35, scale: 0.92 },
            { clipPath: 'inset(0% 0 0 0)', y: 0, scale: 1, duration: 0.18, ease: 'power4.out' }, 0.3);
          tl.fromTo('.i-line',
            { scaleX: 0 },
            { scaleX: 1, duration: 0.14, ease: 'power3.out' }, 0.42);
          tl.fromTo('.i-name',
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.5);
          tl.to('.intro-inner', { autoAlpha: 0, y: -25, scale: 0.93, filter: 'blur(8px)', duration: 0.14 }, 0.78);
        }

        // ════════════ HEADLINE ════════════
        const headline = wrap.querySelector('.s-headline');
        if (headline) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: headline, start: 'top top', end: '+=75%', pin: true, scrub: 0.5 },
          });
          tl.fromTo('.hl-ctx',
            { autoAlpha: 0, x: -50, clipPath: 'inset(0 100% 0 0)' },
            { autoAlpha: 1, x: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.18, ease: 'power3.out' }, 0);
          tl.fromTo('.hl-num',
            { scale: 6, autoAlpha: 0, filter: 'blur(40px)' },
            { scale: 1, autoAlpha: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, 0.06);
          tl.fromTo('.hl-lbl',
            { autoAlpha: 0, x: 50, clipPath: 'inset(0 0 0 100%)' },
            { autoAlpha: 1, x: 0, clipPath: 'inset(0 0 0 0%)', duration: 0.18, ease: 'power3.out' }, 0.28);
          tl.fromTo('.hl-extra',
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.1 }, 0.42);
          tl.to('.hl-inner', { autoAlpha: 0, y: -25, scale: 0.93, filter: 'blur(8px)', duration: 0.14 }, 0.78);
        }

        // ════════════ REVIEW ════════════
        const review = wrap.querySelector('.s-review');
        if (review && w.best_review) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: review, start: 'top top', end: '+=65%', pin: true, scrub: 0.5 },
          });
          tl.fromTo('.rv-q',
            { scale: 0, rotation: -25, autoAlpha: 0 },
            { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.14, ease: 'back.out(3)' }, 0);
          tl.fromTo('.rv-txt',
            { autoAlpha: 0, y: 30, clipPath: 'inset(30% 0 30% 0)' },
            { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0% 0)', duration: 0.25, ease: 'power3.out' }, 0.08);
          tl.fromTo('.rv-star',
            { scale: 0, rotation: -30 },
            { scale: 1, rotation: 0, stagger: 0.02, duration: 0.06, ease: 'back.out(4)' }, 0.3);
          tl.fromTo('.rv-auth',
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.08 }, 0.44);
          tl.to('.rv-inner', { autoAlpha: 0, y: -25, scale: 0.93, filter: 'blur(8px)', duration: 0.14 }, 0.78);
        }

        // ════════════ CATEGORY ════════════
        const cat = wrap.querySelector('.s-category');
        if (cat && w.top_category) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: cat, start: 'top top', end: '+=65%', pin: true, scrub: 0.5 },
          });
          tl.fromTo('.ct-icon',
            { scale: 0, rotation: -20, autoAlpha: 0 },
            { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.15, ease: 'back.out(2.5)' }, 0);
          tl.fromTo('.ct-title',
            { autoAlpha: 0, y: 30, clipPath: 'inset(100% 0 0 0)' },
            { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.2, ease: 'power3.out' }, 0.1);
          tl.fromTo('.ct-sub',
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.12 }, 0.28);
          tl.to('.ct-inner', { autoAlpha: 0, y: -25, scale: 0.93, filter: 'blur(8px)', duration: 0.14 }, 0.78);
        }

        // ════════════ RANK (climax) ════════════
        const rank = wrap.querySelector('.s-rank');
        if (rank) {
          const circ = 2 * Math.PI * 42;
          const pct = Math.min(w.buzz_percentile, 100) / 100;
          gsap.set('.rk-ring', { strokeDasharray: circ, strokeDashoffset: circ });

          const tl = gsap.timeline({
            scrollTrigger: { trigger: rank, start: 'top top', end: '+=110%', pin: true, scrub: 0.7 },
          });
          tl.fromTo('.rk-ctx',
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.1 }, 0);
          tl.to('.rk-ring',
            { strokeDashoffset: circ * (1 - pct), duration: 0.4, ease: 'power2.out' }, 0.05);
          const pctObj = { val: 0 };
          tl.to(pctObj, {
            val: w.buzz_percentile, duration: 0.4, ease: 'power2.out',
            onUpdate: () => {
              const el = wrap.querySelector('.rk-pct') as HTMLElement;
              if (el) el.textContent = Math.round(pctObj.val) + '%';
            },
          }, 0.05);
          tl.fromTo('.rk-pct-lbl', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.35);
          tl.fromTo('.rk-title',
            { autoAlpha: 0, y: 25, clipPath: 'inset(100% 0 0 0)' },
            { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.18, ease: 'power3.out' }, 0.4);
          tl.fromTo('.rk-stat',
            { autoAlpha: 0, y: 15 },
            { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.08 }, 0.52);
          tl.fromTo('.rk-div',
            { scaleY: 0 },
            { scaleY: 1, duration: 0.06 }, 0.55);
        }

        // ════════════ EMPTY ════════════
        const empty = wrap.querySelector('.s-empty');
        if (empty) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: empty, start: 'top top', end: '+=50%', pin: true, scrub: 0.5 },
          });
          tl.fromTo('.emp-icon', { scale: 0, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.14, ease: 'back.out(2.5)' }, 0);
          tl.fromTo('.emp-title', { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.1);
          tl.fromTo('.emp-desc', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.25);
          tl.fromTo('.emp-btn', { autoAlpha: 0, y: 14, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.12, ease: 'back.out(1.6)' }, 0.38);
        }

        // ════════════ SUMMARY (not pinned) ════════════
        const sum = wrap.querySelector('.s-summary');
        if (sum) {
          gsap.fromTo('.sm-card',
            { y: 60, autoAlpha: 0, scale: 0.92 },
            { y: 0, autoAlpha: 1, scale: 1, duration: 1, ease: 'power3.out',
              scrollTrigger: { trigger: sum, start: 'top 60%' } });
          gsap.fromTo('.sm-tile',
            { autoAlpha: 0, y: 20, scale: 0.88 },
            { autoAlpha: 1, y: 0, scale: 1, stagger: 0.08, duration: 0.5, ease: 'back.out(1.4)',
              scrollTrigger: { trigger: '.sm-grid', start: 'top 75%' } });
          gsap.fromTo('.sm-actions',
            { autoAlpha: 0, y: 15 },
            { autoAlpha: 1, y: 0, duration: 0.6,
              scrollTrigger: { trigger: '.sm-actions', start: 'top 90%' } });
        }
      }, wrapRef);
    });

    return () => { cancelAnimationFrame(raf); ctx?.revert(); };
  }, [panels, data]);

  const handleShare = async () => {
    if (!sumCardRef.current) return;
    setSharing(true);
    try {
      const url = await toPng(sumCardRef.current, { pixelRatio: 2, backgroundColor: '#07060b' });
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], 'hivefive-wrapped.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `My HiveFive Wrapped – ${data?.wrapped.semester_label}`, files: [file] });
      } else {
        const a = document.createElement('a'); a.href = url; a.download = 'hivefive-wrapped.png'; a.click();
      }
    } catch { /* user cancelled */ } finally { setSharing(false); }
  };

  // ── LOADING / ERROR ──
  if (loading || (!error && !panels.length)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: BG.intro }}>
        <Sparkles className="size-12 animate-pulse" style={{ color: AMBER }} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: BG.intro }}>
        <div className="text-center">
          <h2 className="font-display italic text-2xl mb-3" style={{ color: '#faf9f7' }}>Something went wrong</h2>
          <p className="mb-6" style={{ color: 'rgba(250,249,247,0.4)' }}>{error}</p>
          <button onClick={() => nav('/dashboard')} className="h-11 px-6 rounded-full font-sans font-bold text-sm" style={{ color: '#faf9f7', background: 'rgba(255,255,255,0.06)' }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const { wrapped: w, user: u } = data;
  const uniShort = u.university?.replace(/\s*\(.*\)/, '') || 'campus';
  const totalOrders = w.orders_completed_as_provider + w.orders_completed_as_client;

  const hl = (() => {
    if (w.total_earned > 0) return {
      ctx: 'This semester you earned',
      num: `⬡ ${w.total_earned.toLocaleString()}`,
      label: 'HiveCoins from your services',
      detail: w.orders_completed_as_provider > 1 ? `across ${w.orders_completed_as_provider} completed orders` : undefined,
    };
    if (w.orders_completed_as_client > 0) return {
      ctx: 'This semester you booked',
      num: String(w.orders_completed_as_client),
      label: w.orders_completed_as_client === 1 ? 'service from a fellow student' : 'services from fellow students',
    };
    if (w.services_posted > 0) return {
      ctx: 'You launched',
      num: String(w.services_posted),
      label: w.services_posted === 1 ? 'service for students to discover' : 'services for students to discover',
    };
    return { ctx: 'You joined', num: '1', label: 'the HiveFive community this semester' };
  })();

  // hex particle positions: deterministic but varied
  const hexes = [
    { left: '8%', top: '18%', size: 10, op: 0.025 },
    { left: '85%', top: '12%', size: 16, op: 0.03 },
    { left: '14%', top: '52%', size: 8, op: 0.02 },
    { left: '78%', top: '65%', size: 14, op: 0.035 },
    { left: '45%', top: '85%', size: 11, op: 0.02 },
    { left: '92%', top: '42%', size: 7, op: 0.025 },
  ];

  return (
    <div ref={wrapRef} className="relative" style={{ background: BG.intro }}>

      {/* ── fixed layers ── */}
      <div ref={bgRef} className="fixed inset-0" style={{ backgroundColor: BG.intro, zIndex: 0 }} />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.03, backgroundImage: GRAIN_URL, backgroundRepeat: 'repeat' }} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {hexes.map((h, i) => (
          <div key={i} className="hx absolute" style={{ left: h.left, top: h.top, opacity: h.op, color: AMBER }}>
            <Hexagon style={{ width: h.size, height: h.size }} />
          </div>
        ))}
      </div>

      {/* ── fixed header ── */}
      <header className="fixed top-0 left-0 right-0 flex items-center px-5 h-12" style={{ zIndex: 50, background: 'linear-gradient(to bottom, rgba(7,6,11,0.7) 0%, transparent 100%)' }}>
        <div className="flex-1 h-[2px] rounded-full mr-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div ref={progRef} className="h-full rounded-full transition-none" style={{ background: AMBER, width: '0%', opacity: 0.7 }} />
        </div>
        <button onClick={() => nav('/dashboard')} className="size-7 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X className="size-3.5" style={{ color: 'rgba(250,249,247,0.25)' }} />
        </button>
      </header>

      {/* ═══════════════════════════════════════════
          S E C T I O N S
          ═══════════════════════════════════════════ */}

      {/* ── INTRO ── */}
      {panels.includes('intro') && (
        <section className="ws s-intro relative h-screen overflow-hidden" data-s="intro">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 45% 35% at 50% 48%, ${AMBER}06 0%, transparent 70%)` }} />
          <div className="intro-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center" style={{ perspective: '800px' }}>
            <div className="i-spark mb-8" style={{ willChange: 'transform' }}>
              {u.profile_image ? (
                <img src={u.profile_image} alt="" className="size-20 rounded-full object-cover" style={{ border: `2px solid ${AMBER}30`, boxShadow: `0 0 50px ${AMBER}10` }} />
              ) : (
                <div className="size-20 rounded-full flex items-center justify-center" style={{ background: `${AMBER}08`, border: `1.5px solid ${AMBER}15` }}>
                  <Sparkles className="size-9" style={{ color: AMBER }} />
                </div>
              )}
            </div>
            <p className="mb-6 font-sans text-[11px] tracking-[0.4em] uppercase" style={{ color: AMBER }}>
              <SplitChars text={w.semester_label.toUpperCase()} className="i-ch" />
            </p>
            <h1 className="i-t1 font-display italic leading-[1.05]" style={{ color: '#faf9f7', fontSize: 'clamp(2.2rem, 8vw, 4.5rem)', willChange: 'transform, clip-path' }}>
              Your HiveFive
            </h1>
            <h1 className="i-t2 font-display italic leading-[0.95] mt-1" style={{ color: '#faf9f7', fontSize: 'clamp(3rem, 11vw, 6rem)', willChange: 'transform, clip-path' }}>
              Wrapped
            </h1>
            <div className="i-line h-px w-16 mx-auto mt-8 mb-5" style={{ background: `${AMBER}30`, transformOrigin: 'left center' }} />
            <p className="i-name font-sans text-sm" style={{ color: 'rgba(250,249,247,0.3)' }}>
              {u.first_name}{u.university ? ` · ${u.university}` : ''}
            </p>
          </div>
          <div className="scroll-cue absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(250,249,247,0.15)' }}>Scroll</span>
            <ChevronDown className="size-4 animate-bounce" style={{ color: 'rgba(250,249,247,0.12)' }} />
          </div>
        </section>
      )}

      {/* ── HEADLINE ── */}
      {panels.includes('headline') && (
        <section className="ws s-headline relative h-screen overflow-hidden" data-s="headline">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 40% 35% at 50% 50%, ${AMBER}05 0%, transparent 70%)` }} />
          <div className="hl-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
            <p className="hl-ctx font-sans text-base mb-3" style={{ color: 'rgba(250,249,247,0.45)' }}>{hl.ctx}</p>
            <h2 className="hl-num font-display italic leading-none" style={{ color: '#faf9f7', fontSize: 'clamp(4.5rem, 18vw, 9rem)', willChange: 'transform, filter' }}>
              {hl.num}
            </h2>
            <p className="hl-lbl font-sans text-sm mt-3" style={{ color: 'rgba(250,249,247,0.35)' }}>{hl.label}</p>
            {hl.detail && (
              <p className="hl-extra font-sans text-sm mt-4 flex items-center gap-1.5" style={{ color: `${AMBER}90` }}>
                <span className="inline-block size-1 rounded-full" style={{ background: AMBER }} />
                {hl.detail}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── REVIEW ── */}
      {panels.includes('review') && w.best_review && (
        <section className="ws s-review relative h-screen overflow-hidden" data-s="review">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 40% 30% at 50% 45%, #a78bfa06 0%, transparent 70%)` }} />
          <div className="rv-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center max-w-lg mx-auto">
            <Quote className="rv-q size-8 mb-6" style={{ color: '#a78bfa40' }} />
            <blockquote className="rv-txt font-display italic text-[1.6rem] md:text-[2rem] leading-snug" style={{ color: '#faf9f7' }}>
              &ldquo;{w.best_review.quote}&rdquo;
            </blockquote>
            <div className="flex justify-center gap-1.5 mt-7 mb-2">
              {Array.from({ length: w.best_review.rating }).map((_, i) => (
                <Star key={i} className="rv-star size-5 fill-current" style={{ color: AMBER }} />
              ))}
            </div>
            <p className="rv-auth font-sans text-sm" style={{ color: 'rgba(250,249,247,0.3)' }}>— {w.best_review.reviewer_name}</p>
          </div>
        </section>
      )}

      {/* ── CATEGORY ── */}
      {panels.includes('category') && w.top_category && (
        <section className="ws s-category relative h-screen overflow-hidden" data-s="category">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 40% 30% at 50% 45%, #34d39906 0%, transparent 70%)` }} />
          <div className="ct-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
            <div className="ct-icon size-16 rounded-2xl flex items-center justify-center mb-7" style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}12`, boxShadow: `0 0 60px ${AMBER}06` }}>
              <Trophy className="size-8" style={{ color: AMBER }} />
            </div>
            <h2 className="ct-title font-display italic text-[1.8rem] md:text-[2.2rem] leading-snug" style={{ color: '#faf9f7' }}>
              {w.category_count > 1 ? (
                <>You explored <span style={{ color: AMBER }}>{w.category_count}</span> categories</>
              ) : (
                <>You became a<br /><span style={{ color: AMBER }}>{w.top_category}</span> specialist</>
              )}
            </h2>
            {w.top_category && w.category_count > 1 && (
              <p className="ct-sub font-sans text-sm mt-5" style={{ color: 'rgba(250,249,247,0.35)' }}>
                Favorite: {w.top_category}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── RANK ── */}
      {panels.includes('rank') && (
        <section className="ws s-rank relative h-screen overflow-hidden" data-s="rank">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 50% 40% at 50% 40%, ${AMBER}05 0%, transparent 70%)` }} />
          <div className="rk-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
            <p className="rk-ctx font-sans text-sm mb-4" style={{ color: 'rgba(250,249,247,0.35)' }}>
              Among {w.total_users_at_campus} students at {uniShort}
            </p>
            <div className="relative mx-auto mb-4" style={{ width: 'min(220px, 55vw)', height: 'min(220px, 55vw)' }}>
              <svg viewBox="0 0 100 100" className="size-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4.5" />
                <circle className="rk-ring" cx="50" cy="50" r="42" fill="none" stroke="url(#rk-grad)" strokeWidth="4.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="rk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={AMBER} />
                    <stop offset="100%" stopColor="#f472b6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="rk-pct font-display italic text-white" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>0%</span>
                <span className="rk-pct-lbl font-sans text-[11px] mt-0.5" style={{ color: 'rgba(250,249,247,0.3)' }}>percentile</span>
              </div>
            </div>
            <h2 className="rk-title font-display italic text-[1.6rem] md:text-[2rem] mt-2" style={{ color: '#faf9f7' }}>
              {w.buzz_percentile >= 50 ? `Top ${100 - w.buzz_percentile}%` : 'Rising'} at {uniShort}
            </h2>
            <div className="flex items-center justify-center gap-7 mt-6">
              <div className="rk-stat text-center">
                <span className="font-display italic text-xl" style={{ color: '#faf9f7' }}>#{w.campus_rank}</span>
                <span className="block font-sans text-[10px] mt-0.5" style={{ color: 'rgba(250,249,247,0.3)' }}>campus rank</span>
              </div>
              <div className="rk-div w-px h-8" style={{ background: 'rgba(255,255,255,0.08)', transformOrigin: 'center' }} />
              <div className="rk-stat text-center">
                <span className="font-display italic text-xl" style={{ color: '#faf9f7' }}>{w.buzz_score}</span>
                <span className="block font-sans text-[10px] mt-0.5" style={{ color: 'rgba(250,249,247,0.3)' }}>Buzz Score</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── EMPTY ── */}
      {panels.includes('empty') && (
        <section className="ws s-empty relative h-screen overflow-hidden" data-s="empty">
          <div className="emp-inner relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
            <div className="emp-icon size-16 rounded-2xl flex items-center justify-center mb-7" style={{ background: `${AMBER}08`, border: `1px solid ${AMBER}12` }}>
              <Sparkles className="size-8" style={{ color: AMBER }} />
            </div>
            <h2 className="emp-title font-display italic text-[1.8rem] leading-snug" style={{ color: '#faf9f7' }}>
              Your story hasn't<br />started yet
            </h2>
            <p className="emp-desc font-sans text-sm leading-relaxed max-w-[280px] mt-5" style={{ color: 'rgba(250,249,247,0.35)' }}>
              Post a service, book from a classmate, or explore what's out there. Next semester, this will be all about you.
            </p>
            <button onClick={() => nav('/discover')} className="emp-btn h-11 px-7 mt-8 rounded-full font-sans font-bold text-sm" style={{ background: AMBER, color: '#1a1a1a' }}>
              Explore HiveFive
            </button>
          </div>
        </section>
      )}

      {/* ── SUMMARY ── */}
      {panels.includes('summary') && (
        <section className="ws s-summary relative min-h-screen overflow-hidden" data-s="summary">
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-16 px-6">
            <div ref={sumCardRef} className="sm-card w-full max-w-[360px] rounded-2xl p-7 text-left space-y-5" style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: `0 8px 60px ${AMBER}05` }}>
              <div className="flex items-center gap-3">
                {u.profile_image ? (
                  <img src={u.profile_image} alt="" className="size-11 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <div className="size-11 rounded-full flex items-center justify-center" style={{ background: `${AMBER}10` }}>
                    <Sparkles className="size-4" style={{ color: AMBER }} />
                  </div>
                )}
                <div>
                  <p className="font-sans font-bold text-sm" style={{ color: '#faf9f7' }}>{u.first_name}</p>
                  <p className="font-sans text-[11px]" style={{ color: 'rgba(250,249,247,0.3)' }}>{u.university || 'HiveFive'} · {w.semester_label}</p>
                </div>
              </div>

              <div className="sm-grid grid grid-cols-2 gap-2.5">
                {w.total_earned > 0 && (
                  <div className="sm-tile rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="font-sans text-[10px] mb-1" style={{ color: 'rgba(250,249,247,0.3)' }}>Earned</p>
                    <p className="font-display italic text-xl" style={{ color: '#faf9f7' }}>⬡ {w.total_earned.toLocaleString()}</p>
                  </div>
                )}
                {totalOrders > 0 && (
                  <div className="sm-tile rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="font-sans text-[10px] mb-1" style={{ color: 'rgba(250,249,247,0.3)' }}>Orders</p>
                    <p className="font-display italic text-xl" style={{ color: '#faf9f7' }}>{totalOrders}</p>
                  </div>
                )}
                {w.average_rating > 0 && (
                  <div className="sm-tile rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="font-sans text-[10px] mb-1" style={{ color: 'rgba(250,249,247,0.3)' }}>Rating</p>
                    <p className="font-display italic text-xl flex items-center gap-1.5" style={{ color: '#faf9f7' }}>
                      <Star className="size-3.5 fill-current" style={{ color: AMBER }} />{w.average_rating.toFixed(1)}
                    </p>
                  </div>
                )}
                <div className="sm-tile rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="font-sans text-[10px] mb-1" style={{ color: 'rgba(250,249,247,0.3)' }}>Campus Rank</p>
                  <p className="font-display italic text-xl" style={{ color: '#faf9f7' }}>
                    #{w.campus_rank} <span className="font-sans text-[10px] not-italic" style={{ color: 'rgba(250,249,247,0.2)' }}>/ {w.total_users_at_campus}</span>
                  </p>
                </div>
              </div>

              {w.top_category && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <Trophy className="size-3" style={{ color: AMBER }} />
                  <span className="font-sans text-[11px]" style={{ color: 'rgba(250,249,247,0.4)' }}>{w.top_category} specialist</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="font-sans text-[8px] tracking-[0.3em] uppercase" style={{ color: 'rgba(250,249,247,0.1)' }}>HiveFive Wrapped</p>
                <Hexagon className="size-3" style={{ color: 'rgba(250,249,247,0.06)' }} />
              </div>
            </div>

            <div className="sm-actions flex items-center justify-center gap-3 mt-6">
              <button onClick={handleShare} disabled={sharing} className="h-11 px-7 rounded-full font-sans font-bold text-sm flex items-center gap-2 disabled:opacity-50" style={{ background: AMBER, color: '#1a1a1a' }}>
                {sharing ? <Sparkles className="size-4 animate-spin" /> : navigator.share ? <Share2 className="size-4" /> : <Download className="size-4" />}
                {sharing ? 'Generating...' : navigator.share ? 'Share' : 'Download'}
              </button>
              <button onClick={() => nav('/dashboard')} className="h-11 px-7 rounded-full font-sans font-bold text-sm" style={{ color: 'rgba(250,249,247,0.6)', background: 'rgba(255,255,255,0.05)' }}>
                Done
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
