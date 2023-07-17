import { useState, useEffect } from 'react'
import { auth, signinWithGoogle } from './firebase';
import { User } from 'firebase/auth';
import { Link, Route } from 'wouter'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

import classes from './App.module.css'
import quattSvg from './assets/quatt.svg'
import { CICList } from './cic-list/CICList';
import { CICDetail } from './cic-detail/CICDetail';
import { ApiClientProvider, useApiClient } from './api-client/context';
import { Button, ButtonLink } from './ui-components/button/Button';
import { InstallerList } from './installer-list/InstallerList';
import { Loader } from './ui-components/loader/Loader';

const queryClient = new QueryClient()

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    auth.onAuthStateChanged(async user => {
      if (user) {
        const token = await user.getIdToken()
        setUser(user);
        setToken(token)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return null

  return (
    <QueryClientProvider client={queryClient}>
      {(!user || !token) ? (
        <SignIn />
      ) : (
        <ApiClientProvider token={token}>
          <Route path="/">
            <Home />
          </Route>
          <Route path="/installers">
            <InstallerListRenderer />
          </Route>
          <Route path="/cics">
            <CICListRenderer />
          </Route>
          <Route path="/cics/:cicId">
            {(params) => {
              return (
                <CICDetailRenderer cicId={params.cicId} />
              )
            }}
          </Route>
        </ApiClientProvider>
      )}
    </QueryClientProvider>
  )
}

const SignIn = () => {
  return (
    <div className={classes.signin}>
        <img
          src={quattSvg}
          alt="Quatt"
          className={classes['main-logo']}
        />
      <Button onClick={signinWithGoogle}>Authenticate</Button>
    </div>
  )
}

const Home = () => {
  return (
    <div className={classes.signin}>
      <Link href={`/cics`}>
        <ButtonLink>CICs</ButtonLink>
      </Link>
      <Link href={`/installers`}>
        <ButtonLink>Installers</ButtonLink>
      </Link>
    </div>
  )
}

const CICDetailRenderer = ({
  cicId
}: {
  cicId: string
}) => {
  const apiClient = useApiClient()
  const { data, status, error } = useQuery(["cicDetail", cicId], () => {
    return apiClient.adminGetCic({ cicId })
  });


  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== 'success') return (
    <Loader />
  )

  return (
    <CICDetail data={data.result} />
  )
}

const InstallerListRenderer = () => {
  const apiClient = useApiClient()
  const { data, status, error, refetch } = useQuery("installerList", () => {
    return apiClient.adminListInstallers()
  });

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== 'success') return (
    <Loader />
  )

  return <InstallerList data={data.result} refetch={refetch} />;
}

const CICListRenderer = () => {
  const apiClient = useApiClient()
  const { data, status, error } = useQuery("cicList", () => {
    return apiClient.adminListCics()
  });

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== 'success') return (
    <Loader />
  )

  return (
    <CICList data={data.result} />
  )
}

export default App
