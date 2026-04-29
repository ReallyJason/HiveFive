import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { NavBar } from '../components/NavBar';
import { CheckCircle, ExternalLink, Bell } from 'lucide-react';
import { motion } from 'motion/react';

interface RequestData {
  title: string;
  category: string;
  description: string;
  budgetRange: string;
  deadline: string;
}

export default function RequestPublished() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Try to get data from location.state first, then fall back to sessionStorage
  const [requestData, setRequestData] = useState<RequestData | undefined>(() => {
    const stateData = location.state?.requestData as RequestData | undefined;
    if (stateData) return stateData;
    
    const stored = sessionStorage.getItem('publishedRequestData');
    if (stored) {
      try {
        return JSON.parse(stored) as RequestData;
      } catch (e) {
        console.error('Failed to parse stored data:', e);
        return undefined;
      }
    }
    return undefined;
  });
  
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Clear sessionStorage after reading
    sessionStorage.removeItem('publishedRequestData');
    
    // Trigger content animation after component mounts
    setTimeout(() => setShowContent(true), 100);
  }, []);

  // Get budget display label
  const getBudgetLabel = (value: string) => {
    const budgetMap: Record<string, string> = {
      'under-50': 'Under ⬡50',
      '50-100': '⬡50-100',
      '100-200': '⬡100-200',
      '200-500': '⬡200-500',
      'over-500': 'Over ⬡500',
      'flexible': 'Flexible',
    };
    return budgetMap[value] || value;
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

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
            Your request is live!
          </h1>
          <p className="text-lg text-charcoal-600">
            Providers will start sending you proposals soon
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
            On average, requests receive <span className="font-bold text-honey-600">5-8 proposals</span> within 24 hours
          </p>
        </motion.div>

        {/* Request Preview Card - Fourth to animate */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mb-12"
        >
          <p className="text-sm font-bold text-charcoal-700 mb-4 text-center">
            Your request listing
          </p>
          
          <div className="bg-white border-2 border-honey-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-honey-50 via-transparent to-transparent opacity-50" />
            
            <div className="relative space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display italic text-3xl text-charcoal-900">
                  {requestData?.title || 'Your Request Title'}
                </h2>
                <span className="inline-block px-4 py-1.5 bg-honey-100 text-honey-700 text-sm font-medium rounded-full shrink-0">
                  {requestData?.category || 'Category'}
                </span>
              </div>
              
              <p className="text-charcoal-600 leading-relaxed">
                {requestData?.description || 'Your request description will appear here...'}
              </p>
              
              <div className="pt-6 border-t border-charcoal-100 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-charcoal-500 mb-1">Budget</div>
                  <div className="font-mono text-xl text-charcoal-900">
                    {requestData?.budgetRange ? getBudgetLabel(requestData.budgetRange) : 'Not specified'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-charcoal-500 mb-1">Deadline</div>
                  <div className="font-mono text-xl text-charcoal-900">
                    {requestData?.deadline || 'Flexible'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What Happens Next - Fifth to animate */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-honey-50 border border-honey-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 bg-honey-500 rounded-lg flex items-center justify-center shrink-0">
                <Bell className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-charcoal-900 mb-2">
                  What happens next?
                </h3>
                <ul className="space-y-2 text-sm text-charcoal-600">
                  <li className="flex items-start gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Providers will review your request and send proposals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-honey-600">•</span>
                    <span>You'll receive notifications when new proposals arrive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-honey-600">•</span>
                    <span>Review proposals and hire the best provider for your needs</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - Last to animate */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={showContent ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="space-y-4"
        >
          {/* Primary Action */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-honey-500 text-charcoal-900 rounded-xl font-sans font-bold text-base transition-all hover:bg-honey-600 hover:scale-[1.01] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            View My Dashboard
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/discover')}
              className="h-12 bg-transparent text-charcoal-800 border-2 border-charcoal-200 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
            >
              Browse Services
            </button>
            <button
              onClick={() => navigate('/post-request')}
              className="h-12 bg-transparent text-charcoal-800 border-2 border-charcoal-200 rounded-xl font-sans font-bold text-sm transition-all hover:bg-charcoal-50"
            >
              Post Another
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
