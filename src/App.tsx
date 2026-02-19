import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Layout } from "@/components/Layout";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RecommendationPage } from "@/pages/RecommendationPage";
import { HistoryPage } from "@/pages/HistoryPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <Layout>
                  <Routes>
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/recommendation" element={<RecommendationPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/" element={<Navigate to="/onboarding" replace />} />
                  </Routes>
                </Layout>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
