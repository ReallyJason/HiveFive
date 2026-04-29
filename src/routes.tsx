import { createBrowserRouter } from "react-router";
import DesignSystem from "./pages/DesignSystem";
import Landing from "./pages/Landing";
import Sprints from "./pages/Sprints";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import EmailVerification from "./pages/EmailVerification";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import ServiceDetail from "./pages/ServiceDetail";
import { RequestDetail } from "./pages/RequestDetail";
import { MyProfile } from "./pages/MyProfile";
import { UserProfile } from "./pages/UserProfile";
import { PostService } from "./pages/PostService";
import { EditService } from "./pages/EditService";
import { PostRequest } from "./pages/PostRequest";
import { Dashboard } from "./pages/Dashboard";
import { Messages } from "./pages/Messages";
import { OrderBooking } from "./pages/OrderBooking";
import { OrderTracking } from "./pages/OrderTracking";
import { HiveShop } from "./pages/HiveShop";
import { Settings } from "./pages/Settings";
import { SearchResults } from "./pages/SearchResults";
import { Notifications } from "./pages/Notifications";
import { Leaderboard } from "./pages/Leaderboard";
import { BuzzScoreInfo } from "./pages/BuzzScoreInfo";
import ServicePublished from "./pages/ServicePublished";
import RequestPublished from "./pages/RequestPublished";
import ForgotPassword from "./pages/ForgotPassword";
import Safety from "./pages/Safety";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import TeamAgreement from "./pages/TeamAgreement";
import Admin from "./pages/Admin";
import Docs from "./pages/Docs";
import Wrapped from "./pages/Wrapped";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FeatureRoute } from "./components/FeatureRoute";

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter([
  // ── Public routes (accessible without authentication) ──
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/sprints",
    Component: Sprints,
  },
  {
    path: "/sprints/:slug",
    Component: Sprints,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/safety",
    Component: Safety,
  },
  {
    path: "/terms",
    Component: Terms,
  },
  {
    path: "/privacy",
    Component: Privacy,
  },
  {
    path: "/docs/:slug?",
    Component: Docs,
  },

  // ── Protected routes ──
  // All routes below require authentication.
  // Unauthenticated visitors see a 404 page with the logged-out NavBar.
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/design-system",
        Component: DesignSystem,
      },
      {
        path: "/admin",
        Component: Admin,
      },
      {
        path: "/team",
        Component: TeamAgreement,
      },
      {
        path: "/verify",
        Component: EmailVerification,
      },
      {
        path: "/onboarding",
        Component: Onboarding,
      },
      {
        path: "/discover",
        Component: Discover,
      },
      {
        path: "/service/:id",
        Component: ServiceDetail,
      },
      {
        path: "/request/:id",
        element: (
          <FeatureRoute feature="requests">
            <RequestDetail />
          </FeatureRoute>
        ),
      },
      {
        path: "/profile",
        Component: MyProfile,
      },
      {
        path: "/post-service",
        Component: PostService,
      },
      {
        path: "/edit-service/:id",
        Component: EditService,
      },
      {
        path: "/post-request",
        element: (
          <FeatureRoute feature="requests">
            <PostRequest />
          </FeatureRoute>
        ),
      },
      {
        path: "/dashboard",
        Component: Dashboard,
      },
      {
        path: "/messages",
        element: (
          <FeatureRoute feature="messaging">
            <Messages />
          </FeatureRoute>
        ),
      },
      {
        path: "/notifications",
        Component: Notifications,
      },
      {
        path: "/book",
        Component: OrderBooking,
      },
      {
        path: "/orders",
        Component: OrderTracking,
      },
      {
        path: "/orders/:orderId",
        Component: OrderTracking,
      },
      {
        path: "/shop",
        element: (
          <FeatureRoute feature="shop">
            <HiveShop />
          </FeatureRoute>
        ),
      },
      {
        path: "/settings",
        Component: Settings,
      },
      {
        path: "/search",
        Component: SearchResults,
      },
      {
        path: "/leaderboard",
        element: (
          <FeatureRoute feature="leaderboard">
            <Leaderboard />
          </FeatureRoute>
        ),
      },
      {
        path: "/buzz-score",
        Component: BuzzScoreInfo,
      },
      {
        path: "/service-published",
        Component: ServicePublished,
      },
      {
        path: "/request-published",
        Component: RequestPublished,
      },
      {
        path: "/wrapped",
        Component: Wrapped,
      },
      {
        path: "/:username",
        Component: UserProfile,
      },
    ],
  },

  // ── Catch-all 404 ──
  {
    path: "*",
    Component: NotFound,
  },
], { basename });
