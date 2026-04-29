import { Link } from 'react-router';
import {
  Search,
  Bell,
  Send,
  Star,
  Plus,
  X,
  Check,
  Mail,
  Eye,
  EyeOff,
  Upload,
  Settings,
  LayoutDashboard,
  ShoppingBag,
  LogOut,
  Wallet,
  CreditCard,
  Landmark,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Clock,
  ChevronDown,
  GraduationCap,
  Trophy,
  Gift,
  TrendingUp,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function DesignSystem() {
  const [activeSection, setActiveSection] = useState('colors');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    // Fallback method for when Clipboard API is blocked
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const sections = [
    { id: 'colors', label: 'Colors' },
    { id: 'typography', label: 'Typography' },
    { id: 'spacing', label: 'Spacing' },
    { id: 'shadows', label: 'Shadows' },
    { id: 'borders', label: 'Borders' },
    { id: 'icons', label: 'Icons' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'avatars', label: 'Avatars' },
  ];

  const honeyColors = [
    { shade: '50', hex: '#FEF9EE' },
    { shade: '100', hex: '#FDF0D5' },
    { shade: '200', hex: '#FBE0AA' },
    { shade: '300', hex: '#F8CB74' },
    { shade: '400', hex: '#F5B540' },
    { shade: '500', hex: '#E9A020' },
    { shade: '600', hex: '#C47F14' },
    { shade: '700', hex: '#9A5F10' },
    { shade: '800', hex: '#6E430E' },
    { shade: '900', hex: '#47290A' },
  ];

  const charcoalColors = [
    { shade: '50', hex: '#F6F6F5' },
    { shade: '100', hex: '#ECEAE8' },
    { shade: '200', hex: '#D6D4D0' },
    { shade: '300', hex: '#BFBCB6' },
    { shade: '400', hex: '#8C887F' },
    { shade: '500', hex: '#5C584F' },
    { shade: '600', hex: '#403D37' },
    { shade: '700', hex: '#2D2B27' },
    { shade: '800', hex: '#1E1D1A' },
    { shade: '900', hex: '#131210' },
  ];

  const creamColors = [
    { shade: '50', hex: '#FEFDFB' },
    { shade: '100', hex: '#FDFBF5' },
    { shade: '200', hex: '#FAF6EA' },
    { shade: '300', hex: '#F6F1DD' },
    { shade: '400', hex: '#F1EBD0' },
    { shade: '500', hex: '#E8E0B8' },
  ];

  const semanticColors = [
    { name: 'Success', hex: '#348B5A' },
    { name: 'Warning', hex: '#D4882A' },
    { name: 'Error', hex: '#C93B3B' },
    { name: 'Info', hex: '#3478B8' },
  ];

  const icons = [
    { name: 'Search', Component: Search },
    { name: 'Bell', Component: Bell },
    { name: 'Send', Component: Send },
    { name: 'Star', Component: Star },
    { name: 'Plus', Component: Plus },
    { name: 'X', Component: X },
    { name: 'Check', Component: Check },
    { name: 'Mail', Component: Mail },
    { name: 'Eye', Component: Eye },
    { name: 'EyeOff', Component: EyeOff },
    { name: 'Upload', Component: Upload },
    { name: 'Settings', Component: Settings },
    { name: 'LayoutDashboard', Component: LayoutDashboard },
    { name: 'ShoppingBag', Component: ShoppingBag },
    { name: 'LogOut', Component: LogOut },
    { name: 'Wallet', Component: Wallet },
    { name: 'CreditCard', Component: CreditCard },
    { name: 'Landmark', Component: Landmark },
    { name: 'MessageSquare', Component: MessageSquare },
    { name: 'Paperclip', Component: Paperclip },
    { name: 'MoreHorizontal', Component: MoreHorizontal },
    { name: 'Clock', Component: Clock },
    { name: 'ChevronDown', Component: ChevronDown },
    { name: 'GraduationCap', Component: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Logged-in NavBar */}
      <nav className="h-16 bg-cream-50/80 backdrop-blur-md border-b border-charcoal-100 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-16 h-full max-w-full">
          <Link to="/discover" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-honey-500 flex items-center justify-center">
              <span className="text-charcoal-900 font-bold text-sm">H</span>
            </div>
            <span className="font-sans font-bold text-base text-charcoal-900 tracking-tight">
              hive<span className="text-[18px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-16 pt-8 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display italic text-4xl text-charcoal-900">Design System</h1>
          <p className="text-sm text-charcoal-400 mt-1">
            HiveFive component and token reference for the development team.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-charcoal-100 text-charcoal-600 text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5">
            v2.0 — February 2026
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Nav */}
          <aside className="w-56 sticky top-24 self-start">
            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'text-honey-600 font-bold bg-honey-50'
                      : 'text-charcoal-400 hover:text-charcoal-600 hover:bg-charcoal-50'
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-12">
            {/* Colors */}
            <section id="colors" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Colors</h2>

              {/* Honey Palette */}
              <div className="mb-8">
                <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-4">Honey</h3>
                <div className="flex gap-2">
                  {honeyColors.map((color) => (
                    <button
                      key={color.shade}
                      onClick={() => copyToClipboard(color.hex)}
                      className="flex-1 group cursor-pointer"
                      title={`Click to copy ${color.hex}`}
                    >
                      <div
                        className="w-full h-16 rounded-md relative overflow-hidden transition-all group-hover:ring-2 group-hover:ring-honey-400"
                        style={{ backgroundColor: color.hex }}
                      >
                        {copiedValue === color.hex ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-mono text-[10px] text-charcoal-600">{color.shade}</div>
                        <div className="font-mono text-[10px] text-charcoal-400 group-hover:text-honey-600 transition-colors">{color.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Charcoal Palette */}
              <div className="mb-8">
                <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-4">Charcoal</h3>
                <div className="flex gap-2">
                  {charcoalColors.map((color) => (
                    <button
                      key={color.shade}
                      onClick={() => copyToClipboard(color.hex)}
                      className="flex-1 group cursor-pointer"
                      title={`Click to copy ${color.hex}`}
                    >
                      <div
                        className="w-full h-16 rounded-md border border-charcoal-200 relative overflow-hidden transition-all group-hover:ring-2 group-hover:ring-charcoal-400"
                        style={{ backgroundColor: color.hex }}
                      >
                        {copiedValue === color.hex ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-mono text-[10px] text-charcoal-600">{color.shade}</div>
                        <div className="font-mono text-[10px] text-charcoal-400 group-hover:text-charcoal-600 transition-colors">{color.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cream Palette */}
              <div className="mb-8">
                <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-4">Cream</h3>
                <div className="flex gap-2">
                  {creamColors.map((color) => (
                    <button
                      key={color.shade}
                      onClick={() => copyToClipboard(color.hex)}
                      className="flex-1 group cursor-pointer"
                      title={`Click to copy ${color.hex}`}
                    >
                      <div
                        className="w-full h-16 rounded-md border border-charcoal-200 relative overflow-hidden transition-all group-hover:ring-2 group-hover:ring-honey-400"
                        style={{ backgroundColor: color.hex }}
                      >
                        {copiedValue === color.hex ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <CheckCircle className="w-5 h-5 text-charcoal-600" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <Copy className="w-4 h-4 text-charcoal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-mono text-[10px] text-charcoal-600">{color.shade}</div>
                        <div className="font-mono text-[10px] text-charcoal-400 group-hover:text-honey-600 transition-colors">{color.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Semantic Colors */}
              <div className="mb-8">
                <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-4">Semantic</h3>
                <div className="flex gap-4">
                  {semanticColors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => copyToClipboard(color.hex)}
                      className="flex-1 group cursor-pointer"
                      title={`Click to copy ${color.hex}`}
                    >
                      <div
                        className="w-full h-16 rounded-md relative overflow-hidden transition-all group-hover:ring-2 group-hover:ring-offset-2"
                        style={{ backgroundColor: color.hex }}
                      >
                        {copiedValue === color.hex ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                            <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-mono text-[10px] text-charcoal-600">{color.name}</div>
                        <div className="font-mono text-[10px] text-charcoal-400 group-hover:text-honey-600 transition-colors">{color.hex}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Usage Note */}
              <div className="bg-charcoal-50 rounded-md p-4 text-sm text-charcoal-600">
                <p className="font-medium mb-1">Usage Guidelines:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Page backgrounds always use cream-50. Never use #FFFFFF.</li>
                  <li>Honey-500 is reserved for primary accents only.</li>
                  <li>Primary button text uses charcoal-900, not white.</li>
                </ul>
              </div>
            </section>

            {/* Typography */}
            <section id="typography" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Typography</h2>

              <div className="space-y-8">
                <div>
                  <div className="font-display italic text-5xl tracking-tight leading-none text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    Fraunces Italic • 400 • 48px • -0.03em • 110%
                  </div>
                </div>

                <div>
                  <div className="font-display italic text-4xl tracking-tight text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    Fraunces Italic • 400 • 36px • -0.02em • 115%
                  </div>
                </div>

                <div>
                  <div className="font-display italic text-3xl tracking-tight text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    Fraunces Italic • 400 • 28px • -0.02em • 120%
                  </div>
                </div>

                <div>
                  <div className="font-sans font-bold text-2xl tracking-tight text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 700 • 28px • -0.02em • 120%
                  </div>
                </div>

                <div>
                  <div className="font-sans font-bold text-xl text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 700 • 22px • -0.01em • 125%
                  </div>
                </div>

                <div>
                  <div className="font-sans font-bold text-lg text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 700 • 18px • -0.01em • 130%
                  </div>
                </div>

                <div>
                  <div className="font-sans text-lg leading-relaxed text-charcoal-900">
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 400 • 18px • 0 • 165%
                  </div>
                </div>

                <div>
                  <div className="font-sans text-base text-charcoal-900">
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 400 • 16px • 0 • 155%
                  </div>
                </div>

                <div>
                  <div className="font-sans font-medium text-xs text-charcoal-900">
                    The quick brown fox
                  </div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    DM Sans • 500 • 12px • 0.01em • 140%
                  </div>
                </div>

                <div>
                  <div className="font-mono text-base text-charcoal-900">⬡ 1,250.00</div>
                  <div className="mt-2 font-mono text-xs text-charcoal-400 text-right">
                    JetBrains Mono • 400 • 16px
                  </div>
                </div>

                {/* Wordmark */}
                <div className="mt-8 pt-8 border-t border-charcoal-100">
                  <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-4">
                    Wordmark Composition
                  </h3>
                  <p className="text-sm text-charcoal-500 mb-6">
                    The wordmark uses inline styles for Fraunces italic to ensure consistent rendering across all browsers.
                  </p>
                  <div className="space-y-6">
                    {/* Visual Examples */}
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-sm text-charcoal-900 tracking-tight">
                        hive<span className="text-[15.5px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
                      </span>
                      <span className="ml-4 text-xs text-charcoal-400">Small (14px/15.5px)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-base text-charcoal-900 tracking-tight">
                        hive<span className="text-[18px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
                      </span>
                      <span className="ml-4 text-xs text-charcoal-400">Medium / Default (16px/18px)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-lg text-charcoal-900 tracking-tight">
                        hive<span className="text-[20.5px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
                      </span>
                      <span className="ml-4 text-xs text-charcoal-400">Large (18px/20.5px)</span>
                    </div>

                    {/* Code Implementation */}
                    <div className="mt-6 pt-6 border-t border-charcoal-100">
                      <h4 className="font-sans font-bold text-sm text-charcoal-700 mb-3">Implementation</h4>
                      <div className="bg-charcoal-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="font-mono text-xs text-cream-100 leading-relaxed">
{`<span className="font-sans font-bold text-base text-charcoal-900 tracking-tight">
  hive<span className="text-[18px] text-honey-600" 
       style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>
    five
  </span>
</span>`}
                        </pre>
                      </div>
                      <p className="text-xs text-charcoal-400 mt-2">
                        Note: "five" is nested inside "hive" span to keep them together. Fraunces uses inline styles to ensure proper italic rendering.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Spacing */}
            <section id="spacing" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Spacing</h2>
              <p className="text-sm text-charcoal-500 mb-6">
                Base unit: 4px. All spacing values from this scale.
              </p>
              <div className="flex items-end gap-2">
                {[0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128].map((value) => (
                  <div key={value} className="flex flex-col items-center">
                    <div
                      className="bg-honey-200 w-8"
                      style={{ height: `${value}px` }}
                    />
                    <div className="mt-2 font-mono text-[10px] text-charcoal-600">{value}px</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Shadows */}
            <section id="shadows" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Shadows</h2>
              <div className="grid grid-cols-5 gap-6">
                <div>
                  <div className="w-32 h-24 bg-cream-50 rounded-lg shadow-sm" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">sm</div>
                </div>
                <div>
                  <div className="w-32 h-24 bg-cream-50 rounded-lg shadow-md" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">md</div>
                </div>
                <div>
                  <div className="w-32 h-24 bg-cream-50 rounded-lg shadow-lg" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">lg</div>
                </div>
                <div>
                  <div className="w-32 h-24 bg-cream-50 rounded-lg shadow-xl" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">xl</div>
                </div>
                <div>
                  <div
                    className="w-32 h-24 bg-cream-50 rounded-lg"
                    style={{
                      boxShadow:
                        '0 0 20px rgba(233,160,32,0.25), 0 0 60px rgba(233,160,32,0.08)',
                    }}
                  />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">glow</div>
                </div>
              </div>
            </section>

            {/* Borders */}
            <section id="borders" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">
                Border Radius
              </h2>
              <div className="flex gap-6">
                <div>
                  <div className="w-24 h-24 bg-honey-100 rounded-sm border border-honey-300" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">
                    sm (6px)
                  </div>
                </div>
                <div>
                  <div className="w-24 h-24 bg-honey-100 rounded-md border border-honey-300" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">
                    md (10px)
                  </div>
                </div>
                <div>
                  <div className="w-24 h-24 bg-honey-100 rounded-lg border border-honey-300" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">
                    lg (14px)
                  </div>
                </div>
                <div>
                  <div className="w-24 h-24 bg-honey-100 rounded-xl border border-honey-300" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">
                    xl (20px)
                  </div>
                </div>
                <div>
                  <div className="w-24 h-24 bg-honey-100 rounded-full border border-honey-300" />
                  <div className="mt-3 text-center font-mono text-xs text-charcoal-600">full</div>
                </div>
              </div>
            </section>

            {/* Icons */}
            <section id="icons" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Icons</h2>
              <p className="text-sm text-charcoal-500 mb-6">Lucide React icons at 24px</p>
              <div className="grid grid-cols-8 gap-6">
                {icons.map(({ name, Component }) => (
                  <div key={name} className="flex flex-col items-center">
                    <Component className="w-6 h-6 text-charcoal-600" />
                    <div className="mt-2 font-mono text-[10px] text-charcoal-400 text-center">
                      {name}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Buttons */}
            <section id="buttons" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Buttons</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-4">Primary</h3>
                  <div className="flex items-center gap-4">
                    <button className="h-[34px] px-[14px] bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-xs transition-all hover:bg-honey-600 hover:scale-[1.02]">
                      Small
                    </button>
                    <button className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 hover:scale-[1.02]">
                      Medium
                    </button>
                    <button className="h-[52px] px-8 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-[15px] transition-all hover:bg-honey-600 hover:scale-[1.02]">
                      Large
                    </button>
                    <button className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm opacity-40 cursor-not-allowed" disabled>
                      Disabled
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-4">Secondary</h3>
                  <div className="flex items-center gap-4">
                    <button className="h-[34px] px-[14px] bg-transparent text-charcoal-800 border border-charcoal-200 rounded-md font-sans font-bold text-xs transition-all hover:bg-charcoal-50">
                      Small
                    </button>
                    <button className="h-11 px-6 bg-transparent text-charcoal-800 border border-charcoal-200 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50">
                      Medium
                    </button>
                    <button className="h-[52px] px-8 bg-transparent text-charcoal-800 border border-charcoal-200 rounded-md font-sans font-bold text-[15px] transition-all hover:bg-charcoal-50">
                      Large
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-4">Ghost</h3>
                  <div className="flex items-center gap-4">
                    <button className="h-[34px] px-[14px] bg-transparent text-charcoal-600 rounded-md font-sans font-bold text-xs transition-all hover:bg-charcoal-50">
                      Small
                    </button>
                    <button className="h-11 px-6 bg-transparent text-charcoal-600 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50">
                      Medium
                    </button>
                    <button className="h-[52px] px-8 bg-transparent text-charcoal-600 rounded-md font-sans font-bold text-[15px] transition-all hover:bg-charcoal-50">
                      Large
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-4">Danger</h3>
                  <div className="flex items-center gap-4">
                    <button className="h-[34px] px-[14px] bg-semantic-error text-white rounded-md font-sans font-bold text-xs transition-all hover:opacity-90">
                      Small
                    </button>
                    <button className="h-11 px-6 bg-semantic-error text-white rounded-md font-sans font-bold text-sm transition-all hover:opacity-90">
                      Medium
                    </button>
                    <button className="h-[52px] px-8 bg-semantic-error text-white rounded-md font-sans font-bold text-[15px] transition-all hover:opacity-90">
                      Large
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section id="inputs" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Inputs</h2>
              
              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                    Default State
                  </label>
                  <input
                    type="text"
                    placeholder="Enter text..."
                    className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all"
                  />
                  <p className="text-xs text-charcoal-400 mt-1">Helper text goes here</p>
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                    Focused State
                  </label>
                  <input
                    type="text"
                    placeholder="Focused..."
                    className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-honey-500 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none ring-[3px] ring-honey-100"
                  />
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-semantic-error mb-1.5">
                    Error State
                  </label>
                  <input
                    type="text"
                    placeholder="Error..."
                    className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-semantic-error bg-red-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none ring-[3px] ring-red-100"
                  />
                  <p className="text-xs text-semantic-error mt-1">This field is required</p>
                </div>

                <div>
                  <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                    Success State
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Success!"
                      readOnly
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 outline-none"
                    />
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-semantic-success" />
                  </div>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section id="cards" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Cards</h2>
              
              <div className="grid grid-cols-3 gap-5">
                {/* Service Card */}
                <div className="bg-cream-50 border border-charcoal-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="h-36 bg-gradient-to-br from-charcoal-100 to-charcoal-50 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-charcoal-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-honey-100 text-honey-800">
                        Tutoring
                      </span>
                      <span className="font-mono text-sm font-medium text-charcoal-900">
                        ⬡ 20/hr
                      </span>
                    </div>
                    <h3 className="font-sans font-bold text-[15px] text-charcoal-900 leading-snug">
                      Calculus I & II Help
                    </h3>
                    <p className="text-xs text-charcoal-400 mt-1">by Alex Rodriguez</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Star className="w-3.5 h-3.5 fill-honey-500 text-honey-500 stroke-0" />
                      <span className="font-mono text-xs text-charcoal-700">4.7</span>
                      <span className="text-xs text-charcoal-400">(19)</span>
                    </div>
                  </div>
                </div>

                {/* Hover State */}
                <div className="bg-cream-50 border border-charcoal-100 rounded-lg overflow-hidden shadow-lg -translate-y-0.5">
                  <div className="h-36 bg-gradient-to-br from-charcoal-100 to-charcoal-50 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-charcoal-300" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700">
                        Coding
                      </span>
                      <span className="font-mono text-sm font-medium text-charcoal-900">
                        ⬡ 30/hr
                      </span>
                    </div>
                    <h3 className="font-sans font-bold text-[15px] text-charcoal-900 leading-snug">
                      Hover State
                    </h3>
                    <p className="text-xs text-charcoal-400 mt-1">Lifted card</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Star className="w-3.5 h-3.5 fill-honey-500 text-honey-500 stroke-0" />
                      <span className="font-mono text-xs text-charcoal-700">5.0</span>
                      <span className="text-xs text-charcoal-400">(47)</span>
                    </div>
                  </div>
                </div>

                {/* Loading Skeleton */}
                <div className="bg-cream-50 border border-charcoal-100 rounded-lg overflow-hidden">
                  <div className="h-36 bg-charcoal-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-charcoal-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-charcoal-100 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-charcoal-100 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </div>
            </section>

            {/* Badges */}
            <section id="badges" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Badges</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-3">
                    Category Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-honey-100 text-honey-800">
                      Music
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700">
                      Coding
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700">
                      Writing
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-violet-50 text-violet-700">
                      Photography
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-amber-50 text-amber-800">
                      Tutoring
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-charcoal-100 text-charcoal-600">
                      Errands
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-rose-50 text-rose-700">
                      Fitness
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-orange-50 text-orange-700">
                      Design
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-cyan-50 text-cyan-700">
                      Language
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-3">
                    Status Badges
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-honey-50 text-honey-800 border border-honey-200">
                      In Progress
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Completed
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-charcoal-50 text-charcoal-600 border border-charcoal-200">
                      Pending
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      Cancelled
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Avatars */}
            <section id="avatars" className="py-12 border-b border-charcoal-100">
              <h2 className="font-sans font-bold text-2xl text-charcoal-900 mb-6">Avatars</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-3">Sizes</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800" style={{ fontSize: '8.64px' }}>J</span>
                      </div>
                      <span className="text-xs text-charcoal-400">24px</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800" style={{ fontSize: '11.52px' }}>J</span>
                      </div>
                      <span className="text-xs text-charcoal-400">32px</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800 text-sm">J</span>
                      </div>
                      <span className="text-xs text-charcoal-400">40px</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800 text-xl">J</span>
                      </div>
                      <span className="text-xs text-charcoal-400">56px</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800 text-3xl">J</span>
                      </div>
                      <span className="text-xs text-charcoal-400">80px</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-700 mb-3">
                    With Online Indicator
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800 text-sm">J</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-cream-50 rounded-full" />
                    </div>
                    <div className="relative w-14 h-14">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-honey-200 to-honey-300 border-2 border-honey-400 flex items-center justify-center">
                        <span className="font-sans font-bold text-honey-800 text-xl">J</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-cream-50 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}