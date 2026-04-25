import { Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/Sonner";

// Booking pages (public, no sidebar)
import { BookingHubPage } from "./pages/book/page";
import { KennismakingPage } from "./pages/book/kennismaking/page";
import { ReschedulePage } from "./pages/book/kennismaking/reschedule/page";
import { CancelPage } from "./pages/book/kennismaking/cancel/page";
import { TrainingPage } from "./pages/book/training/page";
import { AgreementPage } from "./pages/book/agreement/page";
import { InstallPage } from "./pages/book/install/page";
import { TrainingCheckInPage } from "./pages/training/check-in/page";

// Admin page
import { AdminPage } from "./pages/admin/page";

import { Brand } from "@/components/shared/Brand/Brand";

const queryClient = new QueryClient();

/**
 * Booking layout: clean, no sidebar, partner-facing.
 */
function BookingLayout({ children }: { children: React.ReactNode }) {
  // Booking pages are always light-mode branded -- partners should never see
  // a dark UI even if their system is in dark mode. Force the layout light.
  return (
    <div className="min-h-screen bg-[#F7F5F0] [color-scheme:light]">
      <header className="bg-white border-b border-[#E8E4DD]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a href="/book" className="inline-flex items-center gap-3">
            <Brand
              type="text"
              className="h-6 w-auto text-[#1A1A1A] dark:text-[#1A1A1A]"
            />
            <span className="text-xs font-semibold text-[#8A8580] uppercase tracking-[0.12em] border-l border-[#E8E4DD] pl-3">
              Installatiepartners
            </span>
          </a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

function App() {
  const [location] = useLocation();

  // Booking + training check-in routes get the clean public layout
  const isBookingRoute = location.startsWith("/book");
  const isTrainingRoute = location.startsWith("/training");

  if (isBookingRoute || isTrainingRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <BookingLayout>
          <Switch>
            <Route path="/book" component={BookingHubPage} />
            <Route path="/book/kennismaking" component={KennismakingPage} />
            <Route path="/book/kennismaking/reschedule" component={ReschedulePage} />
            <Route path="/book/kennismaking/cancel" component={CancelPage} />
            <Route path="/book/training" component={TrainingPage} />
            <Route path="/book/agreement" component={AgreementPage} />
            <Route path="/book/install" component={InstallPage} />
            <Route path="/training/check-in" component={TrainingCheckInPage} />
          </Switch>
        </BookingLayout>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Admin route
  if (location.startsWith("/admin")) {
    return (
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/admin" component={AdminPage} />
        </Switch>
        <Toaster />
      </QueryClientProvider>
    );
  }

  // Default: redirect to booking hub
  return (
    <QueryClientProvider client={queryClient}>
      <BookingLayout>
        <BookingHubPage />
      </BookingLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
