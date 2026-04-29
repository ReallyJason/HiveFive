import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { ProfileBadge } from '../components/ProfileBadge';
import { useAuth } from '../lib/auth';
import type { FrameData, BadgeData } from '../lib/auth';
import { apiGet, apiPost, apiPatch, ApiError } from '../lib/api';
import { ShoppingCart, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type ShopTab = 'frames' | 'badges' | 'themes';

interface ShopItemMetadata {
  // Frame
  gradient?: string;
  glow?: string;
  css_animation?: string | null;
  ring_size?: number;
  // Badge
  tag?: string;
  bg_color?: string;
  text_color?: string;
  bg_gradient?: string | null;
  // Theme
  banner_gradient?: string;
  accent_color?: string;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: 'frame' | 'badge' | 'theme';
  metadata: ShopItemMetadata;
  owned?: boolean;
}

interface InventoryItem {
  item_id: number;
  type: string;
  name: string;
  metadata: ShopItemMetadata;
  equipped: boolean;
}

export function HiveShop() {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin' && !user?.impersonating;
  const [activeTab, setActiveTab] = useState<ShopTab>('frames');
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [equipping, setEquipping] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [shopRes, invRes] = await Promise.all([
          apiGet<{ items: ShopItem[] }>('/shop/items.php'),
          apiGet<{ inventory: InventoryItem[] }>('/shop/inventory.php').catch(() => ({ inventory: [] })),
        ]);
        if (cancelled) return;
        setItems(shopRes.items);
        setInventory(invRes.inventory);
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof ApiError ? err.message : 'Failed to load shop');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const balance = user?.hivecoin_balance ?? 0;
  // Admin owns every item by default
  const ownedIds = isAdmin
    ? new Set(items.map((i) => i.id))
    : new Set(inventory.map((i) => i.item_id));

  function isEquipped(itemId: number, type: string): boolean {
    if (!user) return false;
    if (type === 'frame') return user.active_frame_id === itemId;
    if (type === 'badge') return user.active_badge_id === itemId;
    if (type === 'theme') return user.active_theme_id === itemId;
    return false;
  }

  async function handlePurchase(item: ShopItem) {
    setPurchasing(item.id);
    try {
      const res = await apiPost<{ new_balance: number }>('/shop/purchase.php', { item_id: item.id });
      setInventory((prev) => [
        ...prev,
        { item_id: item.id, type: item.type, name: item.name, metadata: item.metadata, equipped: false },
      ]);
      await refreshUser();
      toast.success(`${item.name} purchased! You have ⬡ ${res.new_balance.toLocaleString()} remaining.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleEquip(item: ShopItem) {
    setEquipping(item.id);
    const field = item.type === 'frame' ? 'active_frame_id'
      : item.type === 'badge' ? 'active_badge_id'
      : 'active_theme_id';
    try {
      await apiPatch('/users/update.php', { [field]: item.id });
      await refreshUser();
      toast.success(`${item.name} equipped!`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to equip');
    } finally {
      setEquipping(null);
    }
  }

  async function handleUnequip(item: ShopItem) {
    setEquipping(item.id);
    const field = item.type === 'frame' ? 'active_frame_id'
      : item.type === 'badge' ? 'active_badge_id'
      : 'active_theme_id';
    try {
      await apiPatch('/users/update.php', { [field]: null });
      await refreshUser();
      toast.success(`${item.name} unequipped.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to unequip');
    } finally {
      setEquipping(null);
    }
  }

  const frames = items.filter((i) => i.type === 'frame');
  const badges = items.filter((i) => i.type === 'badge');
  const themes = items.filter((i) => i.type === 'theme');

  const tabs = [
    { id: 'frames' as const, label: 'Frames', count: frames.length },
    { id: 'badges' as const, label: 'Badges', count: badges.length },
    { id: 'themes' as const, label: 'Themes', count: themes.length },
  ];

  const userName = user ? `${user.first_name} ${user.last_name}` : 'User';

  function itemToFrameData(item: ShopItem): FrameData {
    return {
      id: item.id,
      name: item.name,
      gradient: item.metadata.gradient ?? 'conic-gradient(from 0deg, #F5B540, #E8A317, #F5B540)',
      glow: item.metadata.glow ?? '0 0 15px rgba(245,181,64,.35)',
      css_animation: item.metadata.css_animation ?? null,
      ring_size: item.metadata.ring_size ?? 4,
    };
  }

  function itemToBadgeData(item: ShopItem): BadgeData {
    return {
      id: item.id,
      name: item.name,
      tag: item.metadata.tag ?? `#${item.name.replace(/\s/g, '')}`,
      bg_color: item.metadata.bg_color ?? '#E9A020',
      text_color: item.metadata.text_color ?? '#131210',
      bg_gradient: item.metadata.bg_gradient ?? null,
      css_animation: item.metadata.css_animation ?? null,
    };
  }

  function renderActionButton(item: ShopItem) {
    const owned = ownedIds.has(item.id);
    const equipped = isEquipped(item.id, item.type);
    const isBusy = purchasing === item.id || equipping === item.id;

    if (!owned) {
      const canAfford = balance >= item.price;
      return canAfford ? (
        <button
          onClick={() => handlePurchase(item)}
          disabled={isBusy}
          className="h-10 px-5 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-50 flex items-center gap-2"
        >
          {isBusy && <Loader2 className="size-4 animate-spin" />}
          Purchase
        </button>
      ) : (
        <div className="text-xs text-charcoal-400 font-sans">
          Need ⬡ {(item.price - balance).toLocaleString()} more
        </div>
      );
    }

    if (equipped) {
      return (
        <button
          onClick={() => handleUnequip(item)}
          disabled={isBusy}
          className="h-10 px-5 bg-emerald-500 text-white rounded-lg font-sans font-bold text-sm transition-all hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Equipped
        </button>
      );
    }

    return (
      <button
        onClick={() => handleEquip(item)}
        disabled={isBusy}
        className="h-10 px-5 bg-white border-2 border-charcoal-200 text-charcoal-700 rounded-lg font-sans font-bold text-sm transition-all hover:border-honey-400 hover:text-charcoal-900 disabled:opacity-50 flex items-center gap-2"
      >
        {isBusy && <Loader2 className="size-4 animate-spin" />}
        Equip
      </button>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Header */}
          <div className="h-7 w-36 bg-charcoal-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-charcoal-100 rounded animate-pulse mb-8" />

          {/* Balance card */}
          <div className="h-32 rounded-xl bg-charcoal-100 animate-pulse mb-8" />

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-charcoal-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pb-3 px-4">
                <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="h-16 rounded-lg bg-charcoal-100 animate-pulse mb-6" />

          {/* Item grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-charcoal-100 rounded-xl p-6"
              >
                <div className="size-24 rounded-full bg-charcoal-100 animate-pulse mx-auto mb-5" />
                <div className="h-5 w-32 bg-charcoal-100 rounded animate-pulse mx-auto mb-2" />
                <div className="h-4 w-48 bg-charcoal-100 rounded animate-pulse mx-auto mb-4" />
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-charcoal-100 rounded animate-pulse" />
                  <div className="h-10 w-24 rounded-lg bg-charcoal-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
            HiveShop
          </h1>
          <p className="text-charcoal-600">
            Customize your profile with exclusive frames, badges, and themes
          </p>
        </div>

        {/* Balance / Admin Banner */}
        <div className="mb-8">
          {isAdmin ? (
            <div className="bg-charcoal-50 border border-charcoal-200 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="size-5 text-honey-500 flex-shrink-0" />
              <p className="text-sm text-charcoal-600 font-sans">
                <span className="font-bold text-charcoal-900">Admin mode</span> — items can be equipped freely
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-honey-400 to-honey-600 rounded-xl p-6 text-charcoal-900 flex items-center justify-between">
              <div>
                <div className="font-mono text-sm opacity-90 mb-1">Your Balance</div>
                <div className="font-display italic text-4xl">
                  ⬡ {balance.toLocaleString()}
                </div>
              </div>
              <ShoppingCart className="size-12 opacity-20" />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-charcoal-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 font-sans font-bold text-sm transition-colors relative ${
                activeTab === tab.id ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              {tab.label} ({tab.count})
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-honey-500" />
              )}
            </button>
          ))}
        </div>

        {/* Frames Tab */}
        {activeTab === 'frames' && (
          <div>
            <div className="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-6">
              <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-1">
                What are Frames?
              </h3>
              <p className="text-sm text-charcoal-600">
                Decorative borders around your avatar. Visible across HiveFive — messages, leaderboard, profiles, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {frames.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-6 transition-all ${
                    isEquipped(item.id, 'frame')
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : 'border-charcoal-100 hover:border-charcoal-200'
                  }`}
                >
                  <div className="flex justify-center mb-5">
                    <Avatar name={userName} size="xl" frame={itemToFrameData(item)} src={user?.profile_image} />
                  </div>
                  <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-1 text-center">
                    {item.name}
                  </h3>
                  <p className="text-sm text-charcoal-500 mb-4 text-center">{item.description}</p>
                  <div className="flex items-center justify-between">
                    {!isAdmin && <div className="font-mono text-xl text-charcoal-900">⬡ {item.price}</div>}
                    {renderActionButton(item)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div>
            <div className="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-6">
              <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-1">
                What are Badges?
              </h3>
              <p className="text-sm text-charcoal-600">
                Discord-style hashtag tags that appear next to your username. Show off your personality with a colored #Tag.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((item) => {
                const badgeData = itemToBadgeData(item);
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl p-6 transition-all ${
                      isEquipped(item.id, 'badge')
                        ? 'border-emerald-300 ring-2 ring-emerald-100'
                        : 'border-charcoal-100 hover:border-charcoal-200'
                    }`}
                  >
                    <div className="flex flex-col items-center mb-5">
                      <Avatar name={userName} size="xl" src={user?.profile_image} />
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-charcoal-900">{userName}</span>
                        <ProfileBadge badge={badgeData} />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-1 text-center">
                      {item.name}
                    </h3>
                    <p className="text-sm text-charcoal-500 mb-4 text-center">{item.description}</p>
                    <div className="flex items-center justify-between">
                      {!isAdmin && <div className="font-mono text-xl text-charcoal-900">⬡ {item.price}</div>}
                      {renderActionButton(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Themes Tab */}
        {activeTab === 'themes' && (
          <div>
            <div className="bg-honey-50 border border-honey-200 rounded-lg p-4 mb-6">
              <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-1">
                What are Themes?
              </h3>
              <p className="text-sm text-charcoal-600">
                Custom color schemes for your profile page. Change your banner gradient and accent colors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    isEquipped(item.id, 'theme')
                      ? 'border-emerald-300 ring-2 ring-emerald-100'
                      : 'border-charcoal-100 hover:border-charcoal-200'
                  }`}
                >
                  {/* Theme preview banner */}
                  <div
                    className={`h-28 flex items-end p-4 ${item.metadata.css_animation || ''}`}
                    style={{
                      background: item.metadata.banner_gradient || 'linear-gradient(135deg, #E9A020 0%, #F5B540 100%)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={userName} size="md" src={user?.profile_image} />
                      <div>
                        <div
                          className="font-sans font-bold text-sm"
                          style={{ color: item.metadata.text_color || '#FFF' }}
                        >
                          {userName}
                        </div>
                        <div
                          className="text-xs opacity-80"
                          style={{ color: item.metadata.text_color || '#FFF' }}
                        >
                          Preview
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-sans font-bold text-lg text-charcoal-900 mb-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="size-4 rounded-full border border-charcoal-200"
                        style={{ backgroundColor: item.metadata.accent_color }}
                      />
                      <span className="text-xs text-charcoal-400 font-mono">
                        {item.metadata.accent_color}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal-500 mb-4">{item.description}</p>
                    <div className="flex items-center justify-between">
                      {!isAdmin && <div className="font-mono text-xl text-charcoal-900">⬡ {item.price}</div>}
                      {renderActionButton(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-honey-50 border border-honey-200 rounded-xl p-6">
          <h3 className="font-sans font-bold text-charcoal-900 mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-honey-600" />
            How Cosmetics Work
          </h3>
          <ul className="text-sm text-charcoal-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-honey-600 shrink-0">1.</span>
              <span><strong>Purchase</strong> a cosmetic item using your HiveCoins</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-honey-600 shrink-0">2.</span>
              <span><strong>Equip</strong> it to activate — you can only have one frame, badge, and theme active at a time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-honey-600 shrink-0">3.</span>
              <span><strong>Show off</strong> — your cosmetics appear across the entire site: messages, leaderboard, profiles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-honey-600 shrink-0">4.</span>
              <span>Click <strong>Equipped</strong> to unequip, or equip a different item to swap</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
