import { useState, useEffect } from 'react'
import { auth, signinWithGoogle } from './firebase';
import { User } from 'firebase/auth';
import { Route } from 'wouter'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'

import classes from './App.module.css'
import quattSvg from './assets/quatt.svg'
import { CICList } from './CICList/CICList';
import { CICDetail } from './CICDetail/CICDetail';

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
        <button onClick={signinWithGoogle}>Authenticate</button>
      ) : (
        <div>
          {/* <img
            src={quattSvg}
            alt="Quatt"
            className={classes['main-logo']}
          /> */}
          <Route path="/">
            <CICListRenderer
              token={token}
            />
          </Route>
          <Route path="/:cicId">
            {(params) => {
              return (
                <CICDetailRenderer
                  token={token}
                  cicId={params.cicId}
                />
              )
            }}
          </Route>
        </div>
      )}
    </QueryClientProvider>
  )
}


const CICDetailRenderer = ({
  token,
  cicId
}: {
  token: string
  cicId: string
}) => {
  const { data, status, error } = useQuery(["cicDetail", cicId, token], () => {
    return getCicDetail(token, cicId)
  });

  console.log(data, status, error)

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== 'success') return null

  return (
    <div>
      <CICDetail data={data} />
    </div>
  )
}

const getCicDetail = async (token: string, cicId: string) => {
  // const response = await fetch("https://mobile-api-develop.quatt.io/api/v1/admin/cic/list", {
  const response = await fetch(`http://localhost:3500/api/v1/admin/cic/${cicId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  const jsonData = await response.json()
  return jsonData.result
}


const CICListRenderer = ({
  token
}: {
  token: string
}) => {
  const { data, status, error } = useQuery(["cicList", token], () => {
    return getCiCList(token)
  });

  console.log(data, status, error)

  // TODO: Render a spinner and handle errors - 2023-06-19
  if (status !== 'success') return null

  return (
    <div>
      <CICList data={data} />
    </div>
  )
}

const getCiCList = async (token: string) => {
  // const response = await fetch("https://mobile-api-develop.quatt.io/api/v1/admin/cic/list", {
  const response = await fetch("http://localhost:3500/api/v1/admin/cic/list", {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })

  const jsonData = await response.json()
  return jsonData.result
}

export default App
