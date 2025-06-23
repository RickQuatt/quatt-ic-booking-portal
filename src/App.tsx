import { useState, useEffect } from "react";
import { auth, signinWithGoogle } from "./firebase";
import { User } from "firebase/auth";
import { Redirect, Route } from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

import classes from "./App.module.css";
import quattSvg from "./assets/quatt.svg";
import { CICList } from "./cic-list/CICList";
import { CICDetail } from "./cic-detail/CICDetail";
import { ApiClientProvider, useApiClient } from "./api-client/context";
import { Button } from "./ui-components/button/Button";
import { InstallerList } from "./installer-list/InstallerList";
import { Loader } from "./ui-components/loader/Loader";
import { CicDashboard } from "./cic-dashboard/CicDashboard";
import { Sidebar } from "./sidebar/Sidebar";
import { InstallationList } from "./installation-list/InstallationList";
import { InstallationDetail } from "./installation-detail/InstallationDetail";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ErrorText from "./ui-components/error-text/ErrorText";
import { CICDebugPage } from "./cic-debug/CICDebugPage";

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  return !user || !isAuthenticated ? (
    <SignIn />
  ) : (
    <div className={classes["main-container"]}>
      <Sidebar />
      <div className={classes["main-content"]}>
        <QueryClientProvider client={queryClient}>
          <ApiClientProvider>
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
              <InstallationList />
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
            <Route path="/installations/:installationUuid">
              {(params) => (
                <InstallationDetail
                  installationUuid={params.installationUuid}
                />
              )}
            </Route>
          </ApiClientProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </div>
    </div>
  );
}

const SignIn = () => {
  return (
    <div className={classes.signin}>
      <img src={quattSvg} alt="Quatt" className={classes["main-logo"]} />
      <Button onClick={signinWithGoogle}>Authenticate</Button>
    </div>
  );
};

const CicDashboardRenderer = () => {
  const apiClient = useApiClient();
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["cicDashboard"],
    queryFn: () => apiClient.adminDashboardCics(),
    refetchOnWindowFocus: false,
  });

  if (isError) {
    return (
      <ErrorText
        text="Failed to fetch CIC data for the dashboard."
        retry={refetch}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  return isSuccess ? (
    <CicDashboard data={data.result} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const CICDetailRenderer = ({ cicId }: { cicId: string }) => {
  const apiClient = useApiClient();
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["cicDetail", cicId],
    queryFn: () => apiClient.adminGetCic({ cicId }),
  });

  if (isError) {
    return (
      <ErrorText
        text={`Failed to fetch CIC details for CIC id ${cicId}.`}
        retry={refetch}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  return isSuccess ? (
    <CICDetail data={data?.result} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const CICDebugPageWrapper = ({ cicId }: { cicId: string }) => {
  const apiClient = useApiClient();
  const { data, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: ["cicDetail", cicId],
    queryFn: () => apiClient.adminGetCic({ cicId }),
  });

  if (isError) {
    return (
      <ErrorText
        text={`Failed to fetch CIC details for CIC id ${cicId}.`}
        retry={refetch}
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  return isSuccess ? (
    <CICDebugPage data={data?.result} />
  ) : (
    <ErrorText text="No CIC data found" />
  );
};

const InstallerListRenderer = () => {
  const apiClient = useApiClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["installerList"],
    queryFn: () => apiClient.adminListInstallers(),
    refetchOnWindowFocus: false,
  });

  if (isError) {
    return <ErrorText text="Failed to fetch installers." retry={refetch} />;
  }

  return isLoading ? (
    <Loader />
  ) : (
    <InstallerList data={data?.result || []} refetch={refetch} />
  );
};

const CICListRenderer = () => {
  return <CICList />;
};

export default App;
