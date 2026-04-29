import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { NavBar } from '../components/NavBar';
import { CheckCircle, ExternalLink, Copy, Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { apiGet } from '../lib/api';

interface ServiceData {
  title: string;
  category: string;
  description: string;
  price: string;
  pricingType: 'hourly' | 'flat' | 'custom';
  customUnit?: string;
  included: string[];
}

export default function ServicePublished() {
  const navigate = useNavigate();
  const location = useLocation();

  const serviceId = location.state?.serviceId as number | undefined;
  const serviceData = location.state?.serviceData as ServiceData | undefined;

  const [showContent, setShowContent] = useState(false);
  const [providerCount, setProviderCount] = useState<number | null>(null);
  const [matchingRequests, setMatchingRequests] = useState<{ total: number; requests: { id: number; title: string; budget: string }[] }>({ total: 0, requests: [] });

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);

    apiGet<{ total_providers: number }>('/landing.php')
      .then((data) => setProviderCount(data.total_providers))
      .catch(() => {});

    if (serviceData?.category) {
      apiGet<{ requests: { id: number; title: string; budget: string }[]; pagination: { total: number } }>('/requests/list.php', {
        category: serviceData.category,
        status: 'open',
        limit: 3,
      })
        .then((data) => setMatchingRequests({ total: data.pagination.total, requests: data.requests }))
        .catch(() => {});
    }
  }, [serviceData?.category]);

  const handleCopyLink = async () => {
    const serviceUrl = serviceId
      ? `${window.location.origin}/service/${serviceId}`
      : `${window.location.origin}/discover`;

    try {
      await navigator.clipboard.writeText(serviceUrl);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  // Confetti particles - honey-themed gentle particles
  const confettiParticles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    type: ['hexagon', 'circle', 'sparkle'][i % 3],
    color: ['#E9A020', '#F5B540', '#FDFBF5', '#D6D4D0'][i % 4],
    delay: Math.random() * 0.5,
    duration: 3 + Math.random() * 1,
    startX: Math.random() * 100,
    endX: (Math.random() - 0.5) * 30,
  }));

  return (
    <div className="min-h-screen bg-cream-50 relative overflow-hidden">
      <NavBar variant="logged-in" />

      {/* Honey-themed Confetti */}
      {showContent && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              initial={{ 
                x: `${particle.startX}vw`, 
                y: '-10%',
                opacity: 0,
                rotate: 0,
              }}
              animate={{ 
                x: `${particle.startX + particle.endX}vw`,
                y: '110vh',
                opacity: [0, 1, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeIn',
              }}
            >
              {particle.type === 'hexagon' && (
                <svg width="12" height="14" viewBox="0 0 12 14" fill={particle.color}>
                  <path d="M6 0L11.196 3.5V10.5L6 14L0.804 10.5V3.5L6 0Z" />
                </svg>
              )}
              {particle.type === 'circle' && (
                <div 
                  className="rounded-full"
                  style={{ 
                    width: '8px', 
                    height: '8px', 
                    backgroundColor: particle.color 
                  }} 
                />
              )}
              {particle.type === 'sparkle' && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill={particle.color}>
                  <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4L5 0Z" />
                </svg>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-8 py-12">
        {/* Success Icon - First to animate */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={showContent ? { scale: 1, opacity: 1 } : {}}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 15,
            delay: 0.2 
          }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-honey-400 rounded-full blur-2xl opacity-30 scale-110" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-honey-400 to-honey-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </motion.div>

        {/* Headline - Second to animate */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mb-3"
        >
          <h1 className="font-display italic text-5xl text-charcoal-900 mb-3">
            Your service is now live!
          </h1>
          <p className="text-lg text-charcoal-600">
            You're now part of the HiveFive marketplace
          </p>
        </motion.div>

        {/* Stats - Third to animate */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-charcoal-500">
            Join <span className="font-bold text-honey-600">{providerCount ?? '...'} students</span> earning HiveCoins through their skills
          </p>
        </motion.div>

        {/* Service Preview Card - Fourth to animate */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-sm font-bold text-charcoal-700 mb-4 text-center">
            Your service listing
          </p>
          
          <div className="bg-white border-2 border-honey-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-honey-50 via-transparent to-transparent opacity-50" />
            
            <div className="relative space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display italic text-3xl text-charcoal-900">
                  {serviceData?.title || 'Your Service Title'}
                </h2>
                <span className="inline-block px-4 py-1.5 bg-honey-100 text-honey-700 text-sm font-medium rounded-full shrink-0">
                  {serviceData?.category || 'Category'}
                </span>
              </div>
              
              <div className="space-y-2 text-charcoal-600 leading-relaxed">
                {(serviceData?.description || 'Your service description will appear here...').split(/\n\s*\n/).map((paragraph, i) => {
                  const trimmed = paragraph.trim();
                  return trimmed ? <p key={i}>{trimmed}</p> : null;
                })}
              </div>
              
              {/* What's Included Section */}
              {serviceData?.included && serviceData.included.length > 0 && (
                <div>
                  <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-3">
                    What's Included:
                  </h3>
                  <ul className="space-y-2">
                    {serviceData.included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700">
                        <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="pt-6 border-t border-charcoal-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-charcoal-500 mb-1">
                    {serviceData?.pricingType === 'hourly' && 'Hourly Rate'}
                    {serviceData?.pricingType === 'flat' && 'Total Price'}
                    {serviceData?.pricingType === 'custom' && (serviceData.customUnit ? `Per ${serviceData.customUnit}` : 'Starting at')}
                  </div>
                  <div className="font-mono text-3xl text-charcoal-900">
                    ⬡ {serviceData?.price || '0'}
                  </div>
                </div>
                <button className="h-12 px-8 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold transition-all hover:bg-honey-600">
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Matching Requests */}
        {matchingRequests.total > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={showContent ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-honey-50 border border-honey-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans font-bold text-sm text-charcoal-900">
                  {matchingRequests.total === 1
                    ? '1 student is looking for'
                    : `${matchingRequests.total} students are looking for`}{' '}
                  {serviceData?.category} services
                </h3>
                <button
                  onClick={() => navigate(`/discover?tab=requests&category=${encodeURIComponent(serviceData?.category ?? '')}`)}
                  className="text-xs font-bold text-honey-700 hover:text-honey-800 flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="size-3" />
                </button>
              </div>
              <div className="space-y-2">
                {matchingRequests.requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => navigate(`/request/${req.id}`)}
                    className="w-full text-left bg-white rounded-xl px-4 py-3 border border-honey-100 hover:border-honey-300 transition-all flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-charcoal-800 font-medium truncate">{req.title}</span>
                    <span className="text-xs text-charcoal-500 shrink-0">{req.budget}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: matchingRequests.total > 0 ? 1.2 : 1.0, duration: 0.5 }}
          className="space-y-4"
        >
          {/* Primary Action */}
          <button
            onClick={() => navigate(serviceId ? `/service/${serviceId}` : '/discover')}
            className="w-full h-14 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-base transition-all hover:bg-honey-600 hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            View My Service
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCopyLink}
              className="h-12 bg-transparent text-charcoal-800 border-2 border-charcoal-200 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => navigate('/discover')}
              className="h-12 bg-transparent text-charcoal-800 border-2 border-charcoal-200 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
            >
              Browse Marketplace
            </button>
          </div>

          {/* Tertiary Action */}
          <div className="text-center pt-2">
            <button
              onClick={() => navigate('/post-service')}
              className="text-sm text-charcoal-500 hover:text-charcoal-700 font-medium transition-colors"
            >
              Post Another Service
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}