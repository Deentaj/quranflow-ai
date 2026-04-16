import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import DailyAyahPage from "./pages/DailyAyahPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import ReflectionsPage from "./pages/ReflectionsPage";
import ProgressPage from "./pages/ProgressPage";
import GoalsPage from "./pages/GoalsPage";
import BookmarksPage from "./pages/BookmarksPage";
import WeeklyReportPage from "./pages/WeeklyReportPage";
import CommunityFeedPage from "./pages/CommunityFeedPage";
import ReconnectPage from "./pages/ReconnectPage";
import ProfilePage from "./pages/ProfilePage";
import ChallengesPage from "./pages/ChallengesPage";
import ReadingTrackerPage from "./pages/ReadingTrackerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/daily-ayah" element={<ProtectedRoute><DailyAyahPage /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
            <Route path="/reflections" element={<ProtectedRoute><ReflectionsPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><CommunityFeedPage /></ProtectedRoute>} />
            <Route path="/weekly-report" element={<ProtectedRoute><WeeklyReportPage /></ProtectedRoute>} />
            <Route path="/reconnect" element={<ProtectedRoute><ReconnectPage /></ProtectedRoute>} />
            <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
            <Route path="/reading-tracker" element={<ProtectedRoute><ReadingTrackerPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
