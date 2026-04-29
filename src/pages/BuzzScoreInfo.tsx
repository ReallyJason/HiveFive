import { NavBar } from '../components/NavBar';
import { useNavigate } from 'react-router';
import { ArrowLeft, Zap } from 'lucide-react';

export function BuzzScoreInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-3xl mx-auto px-5 sm:px-6 md:px-8 pt-8 pb-16">
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-700 mb-6 font-sans"
        >
          <ArrowLeft className="size-4" />
          Back to Leaderboard
        </button>

        <div className="flex items-center gap-3 mb-2">
          <Zap className="size-8 text-honey-500" />
          <h1 className="font-display italic text-3xl md:text-4xl text-charcoal-900">
            Buzz Score
          </h1>
        </div>
        <p className="text-charcoal-600 mb-10">
          Your universal reputation on HiveFive. Every action you take earns or loses
          points, and your Buzz Score reflects how valuable you are to the community.
        </p>

        {/* How it works */}
        <section className="mb-10">
          <h2 className="font-display italic text-xl text-charcoal-900 mb-4">How it works</h2>
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 text-sm text-charcoal-700 space-y-3">
            <p>
              Every meaningful action on HiveFive earns or loses Buzz points. Your raw point
              total is converted to a <strong>0&ndash;1000 display score</strong> using a
              logarithmic curve &mdash; early gains feel fast, but cracking the top of the
              leaderboard requires sustained excellence.
            </p>
            <p>
              The leaderboard defaults to <strong>global Buzz rankings</strong> showing
              everyone&rsquo;s overall reputation. Filter by category to see the best providers
              in a specific skill &mdash; only provider-side actions in that category count.
            </p>
            <p>
              One person can be <strong>#3 in Tutoring, #12 in Design, and #47 globally</strong> &mdash; all
              at the same time. Niche providers have something to compete for even if they&rsquo;re
              not the most active user on campus.
            </p>
          </div>
        </section>

        {/* Point values */}
        <section className="mb-10">
          <h2 className="font-display italic text-xl text-charcoal-900 mb-4">Actions that build Buzz</h2>
          <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 bg-cream-50">
                  <th className="text-left px-5 py-3 font-sans font-bold text-charcoal-700">Action</th>
                  <th className="text-right px-5 py-3 font-sans font-bold text-charcoal-700">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50">
                <tr><td className="px-5 py-3 text-charcoal-800">Complete an order (as provider)</td><td className="px-5 py-3 text-right font-mono text-green-700">+15</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Complete an order (as client)</td><td className="px-5 py-3 text-right font-mono text-green-700">+5</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Receive a 5-star review</td><td className="px-5 py-3 text-right font-mono text-green-700">+10</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Receive a 4-star review</td><td className="px-5 py-3 text-right font-mono text-green-700">+6</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Receive a 3-star review</td><td className="px-5 py-3 text-right font-mono text-green-700">+2</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Leave a review (service or client)</td><td className="px-5 py-3 text-right font-mono text-green-700">+4</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Get a repeat client or provider</td><td className="px-5 py-3 text-right font-mono text-green-700">+8</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Complete your profile</td><td className="px-5 py-3 text-right font-mono text-green-700">+10</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display italic text-xl text-charcoal-900 mb-4">Actions that hurt Buzz</h2>
          <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 bg-cream-50">
                  <th className="text-left px-5 py-3 font-sans font-bold text-charcoal-700">Action</th>
                  <th className="text-right px-5 py-3 font-sans font-bold text-charcoal-700">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-50">
                <tr><td className="px-5 py-3 text-charcoal-800">Cancel an order</td><td className="px-5 py-3 text-right font-mono text-red-700">-10</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Receive a 1-star review</td><td className="px-5 py-3 text-right font-mono text-red-700">-8</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Receive a 2-star review</td><td className="px-5 py-3 text-right font-mono text-red-700">-3</td></tr>
                <tr><td className="px-5 py-3 text-charcoal-800">Go inactive for 14+ days</td><td className="px-5 py-3 text-right font-mono text-red-700">-1/day <span className="text-charcoal-400">(cap -20)</span></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Category rankings */}
        <section className="mb-10">
          <h2 className="font-display italic text-xl text-charcoal-900 mb-4">Category rankings</h2>
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 text-sm text-charcoal-700 space-y-3">
            <p>
              When you filter the leaderboard by a category like <strong>Tutoring</strong> or <strong>Photography</strong>,
              only provider-side actions for services in that category are counted: orders completed, reviews
              received, repeat clients, and cancellations.
            </p>
            <p>
              Client-side actions (hiring someone, leaving reviews) and general activity
              only count towards your <strong>global</strong> Buzz Score.
            </p>
          </div>
        </section>

        {/* Bidirectional reviews */}
        <section>
          <h2 className="font-display italic text-xl text-charcoal-900 mb-4">Bidirectional reviews</h2>
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 text-sm text-charcoal-700 space-y-3">
            <p>
              Reviews go both ways on HiveFive. After an order is completed, the <strong>client
              rates the provider</strong> (service review) and the <strong>provider rates the
              client</strong> (client review). Both types of reviews affect the Buzz Score of the
              person being reviewed.
            </p>
            <p>
              Being a great client matters too &mdash; communicating clearly, paying on time,
              and being respectful all contribute to your reputation.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
