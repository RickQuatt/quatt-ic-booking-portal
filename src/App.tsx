import { useState, useEffect } from "react";
import { auth, signinWithGoogle, createSessionCookie } from "./firebase";
import { User } from "firebase/auth";
import { Redirect, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import quattSvg from "./assets/quatt.svg";
import { CICListPage } from "./pages/cics/page";
import { CICDetailPage } from "./pages/cics/[cicId]/page";
import { Button } from "@/components/ui/Button";
import { InstallerListPage } from "./pages/installers/page";
import { Loader } from "@/components/shared/Loader";
import { DashboardPage } from "./pages/dashboard/page";
import { Sidebar } from "@/components/layout/Sidebar";
import { InstallationListPage } from "./pages/installations/page";
import { InstallationDetailWrapper } from "./pages/installations/[installationUuid]";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorText } from "@/components/shared/ErrorText";
import { CICDebugPage } from "./pages/cics/[cicId]/debug/page";
import { MQTTDebuggerPage } from "./pages/cics/[cicId]/mqtt-debugger/page";
import { DynamicPricingPage } from "./pages/dynamic-pricing/page";
import { DeviceListPage } from "./pages/devices/page";
import { VisitJobsPage } from "./pages/installations/[installationUuid]/visit-jobs/page";
import { BulkJobPage } from "./pages/bulkJob/page";
import { UtilitiesPage } from "./pages/utilities/page";
import { $api } from "@/openapi-client/context";
import { Toaster } from "@/components/ui/Sonner";

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const checkAuth = async () => {
      // Check if middleware already handled authentication (session cookie exists)
      // This happens when running with wrangler (npm run dev:with-auth)
      const hasSessionCookie = document.cookie.includes("session=");

      if (hasSessionCookie) {
        // Middleware authenticated - skip Firebase auth, just mark as authenticated
        if (mounted) {
          console.log("Session cookie detected - authenticated via middleware");
          setIsAuthenticated(true);
          setLoading(false);
        }
        return;
      }

      // Pure Vite mode (npm run dev) - use Firebase auth as usual
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!mounted) return;

        if (user) {
          // Get the ID token and create session cookie
          try {
            const idToken = await user.getIdToken();
            await createSessionCookie(idToken);
            setUser(user);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Failed to create session cookie:", error);
            // Still set the user as authenticated since Firebase auth succeeded
            setUser(user);
            setIsAuthenticated(true);
          }
        }
        setLoading(false);
      });
    };

    checkAuth();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) return null;

  return !user || !isAuthenticated ? (
    <SignIn />
  ) : (
    <div className="w-screen h-screen flex">
      <Sidebar />
      <div className="relative flex-1 overflow-y-auto pt-14 md:pt-0">
        <QueryClientProvider client={queryClient}>
          <Route path="/">
            <Redirect to="/dashboard" replace />
          </Route>
          <Route path="/cics">
            <CICListRenderer />
          </Route>
          <Route path="/dashboard">
            <CicDashboardRenderer />
          </Route>
          <Route path="/installers">
            <InstallerListRenderer />
          </Route>
          <Route path="/installations">
            <InstallationListPage />
          </Route>
          <Route path="/dynamic-pricing">
            <DynamicPricingPage />
          </Route>
          <Route path="/devices">
            <DeviceListPage />
          </Route>
          <Route path="/bulkJob">
            <BulkJobPage />
          </Route>
          <Route path="/utilities">
            <UtilitiesPage />
          </Route>
          <Route path="/cics/:cicId">
            {(params) => {
              return <CICDetailRenderer cicId={params.cicId} />;
            }}
          </Route>
          <Route path="/cics/:cicId/debug">
            {(params) => {
              return <CICDebugPageWrapper cicId={params.cicId} />;
            }}
          </Route>
          <Route path="/cics/:cicId/MQTTDebug">
            {(params) => {
              return <CICMqttDebugPageWrapper cicId={params.cicId} />;
            }}
          </Route>
          <Route path="/installations/:installationUuid/visit-jobs">
            {(params) => (
              <VisitJobsPage installationUuid={params.installationUuid} />
            )}
          </Route>
          <Route path="/installations/:installationUuid">
            {(params) => (
              <InstallationDetailWrapper
                installationUuid={params.installationUuid}
              />
            )}
          </Route>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <Toaster position="top-right" />
      </div>
    </div>
  );
}

const SignIn = () => {
  return (
    <div className="h-screen w-full flex flex-col gap-9 items-center justify-center">
      <img src={quattSvg} alt="Quatt" className="w-[200px] h-[50px]" />
      <Button onClick={signinWithGoogle}>Authenticate</Button>
    </div>
  );
};

const CicDashboardRenderer = () => {
  return <DashboardPage />;
};

const CICDetailRenderer = ({ cicId }: { cicId: string }) => {
  const { data, isLoading, error, refetch } = $api.useQuery(
    "get",
    "/admin/cic/{cicId}",
    {
      params: {
        path: { cicId },
      },
    },
  );

  if (error) {
    return (
      <ErrorText
        text={`Failed to fetch CIC details for CIC id ${cicId}.`}
        retry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  const cicData = data?.result;

  return cicData ? (
    <CICDetailPage cicData={cicData} isLoading={isLoading} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const CICDebugPageWrapper = ({ cicId }: { cicId: string }) => {
  const { data, isLoading, error, refetch } = $api.useQuery(
    "get",
    "/admin/cic/{cicId}",
    {
      params: {
        path: { cicId },
      },
    },
  );

  if (error) {
    return (
      <ErrorText
        text={`Failed to fetch CIC details for CIC id ${cicId}.`}
        retry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  const cicData = data?.result;

  return cicData ? (
    <CICDebugPage data={cicData} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const CICMqttDebugPageWrapper = ({ cicId }: { cicId: string }) => {
  const { data, isLoading, error, refetch } = $api.useQuery(
    "get",
    "/admin/cic/{cicId}",
    {
      params: {
        path: { cicId },
      },
    },
  );

  if (error) {
    return (
      <ErrorText
        text={`Failed to fetch CIC details for CIC id ${cicId}.`}
        retry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  const cicData = data?.result;

  return cicData ? (
    <MQTTDebuggerPage data={cicData} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const InstallerListRenderer = () => {
  return <InstallerListPage />;
};

const CICListRenderer = () => {
  return <CICListPage />;
};

export default App;
