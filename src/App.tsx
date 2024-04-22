import { useState, useEffect } from "react";
import { auth, signinWithGoogle } from "./firebase";
import { User } from "firebase/auth";
import { Redirect, Route } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";

import classes from "./App.module.css";
import quattSvg from "./assets/quatt.svg";
import { CICList } from "./cic-list/CICList";
import { CICDetail } from "./cic-detail/CICDetail";
import { ApiClientProvider, useApiClient } from "./api-client/context";
import { Button } from "./ui-components/button/Button";
import { InstallerList } from "./installer-list/InstallerList";
import { Loader } from "./ui-components/loader/Loader";
import { CicDashboard } from "./cic-dashboard/CicDashboard";
import { CICHealthList } from "./cic-health-list/CICHealthList";
import { Sidebar } from "./sidebar/Sidebar";
import { InstallationList } from "./installation-list/InstallationList";
import { InstallationDetail } from "./installation-detail/InstallationDetail";

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
            <Route path="/dashboard">
              <CicDashboardRenderer />
            </Route>
            <Route path="/installers">
              <InstallerListRenderer />
            </Route>
            <Route path="/cics">
              <CICListRenderer />
            </Route>
            <Route path="/installations">
              <InstallationListRenderer />
            </Route>
            <Route path="/cicHealth">
              <CICHealthListRenderer />
            </Route>
            <Route path="/cics/:cicId">
              {(params) => {
                return <CICDetailRenderer cicId={params.cicId} />;
              }}
            </Route>
            <Route path="/installations/:installationId">
              {(params) => {
                return (
                  <InstallationDetailRenderer
                    installationId={params.installationId}
                  />
                );
              }}
            </Route>
          </ApiClientProvider>
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
  const { data, status, error } = useQuery(
    ["cicDashboard"],
    () => {
      return apiClient.adminDashboardCics();
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== "success") return <Loader />;

  return <CicDashboard data={data.result} />;
};

const CICDetailRenderer = ({ cicId }: { cicId: string }) => {
  const apiClient = useApiClient();
  const { data, status, error } = useQuery(["cicDetail", cicId], () => {
    return apiClient.adminGetCic({ cicId });
  });

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== "success") return <Loader />;

  return <CICDetail data={data.result} />;
};

const InstallationDetailRenderer = ({
  installationId,
}: {
  installationId: string;
}) => {
  const apiClient = useApiClient();

  const {
    data: installationData,
    status: installationStatus,
    error,
  } = useQuery(["installationDetail", installationId], () => {
    return apiClient.adminGetInstallation({ installationId });
  });

  const { data: hubspotData, status: hubspotStatus } = useQuery(
    ["installationHubspotTickets", installationId],
    () => {
      return apiClient.adminGetInstallationTickets({ installationId });
    },
  );

  const { data: zuperData, status: zuperStatus } = useQuery(
    ["installationZuperJobs", installationId],
    () => {
      return apiClient.adminGetInstallationTicketsZuper({ installationId });
    },
  );

  const { data: tariffData, status: tariffStatus } = useQuery(
    ["installationTariffs", installationId],
    () => {
      return apiClient.adminGetInstallationTariff({ installationId });
    },
  );

  if (installationStatus !== "success") return <Loader />;
  if (hubspotStatus !== "success") return <Loader />;
  if (zuperStatus !== "success") return <Loader />;
  if (tariffStatus !== "success") return <Loader />;

  return (
    <InstallationDetail
      data={installationData.result}
      hubspotTickets={hubspotData.result}
      zuperJobs={zuperData.result}
      tariff={tariffData.result}
    />
  );
};

const InstallerListRenderer = () => {
  const apiClient = useApiClient();
  const { data, status, error, refetch } = useQuery(
    "installerList",
    () => {
      return apiClient.adminListInstallers();
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== "success") return <Loader />;

  return <InstallerList data={data.result} refetch={refetch} />;
};

const CICListRenderer = () => {
  const apiClient = useApiClient();
  const { data, status, error } = useQuery(
    "cicList",
    () => {
      return apiClient.adminListCics();
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== "success") return <Loader />;

  return <CICList data={data.result} />;
};

const InstallationListRenderer = () => {
  const apiClient = useApiClient();
  const { data, status, error } = useQuery(
    "installationList",
    () => {
      return apiClient.adminInstallationsList();
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  if (status !== "success") return <Loader />;

  return <InstallationList data={data.result} />;
};

const CICHealthListRenderer = () => {
  const apiClient = useApiClient();
  const { data, status, error } = useQuery(
    "cicList",
    () => {
      return apiClient.adminListCics();
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== "success") return <Loader />;

  return <CICHealthList data={data.result} />;
};

export default App;
