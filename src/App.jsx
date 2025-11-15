import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Bookmark, User, Star } from 'lucide-react'
import Spline from '@splinetool/react-spline'

const colors = {
  bg: '#FFFFFF',
  mint: '#CFFFF3',
  mintAlt: '#A8F0C6',
  gray: '#EDEFF2',
  text: '#0F172A'
}

const apiBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const save = (t) => { setToken(t); localStorage.setItem('token', t || '') }
  const clear = () => { save('') }
  return { token, save, clear }
}

function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <header className="relative h-[320px] overflow-hidden">
        <Spline scene="https://prod.spline.design/fN2AgePov5Uh0jfA/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white pointer-events-none" />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold" style={{ color: colors.text }}>MintComics</h1>
          <Link to="/login" className="text-sm px-3 py-1 rounded-full" style={{ background: colors.mintAlt, color: colors.text }}>Sign In</Link>
        </div>
      </header>
      <main className="px-4 -mt-24 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const location = useLocation()
  const nav = [
    { to: '/', label: 'Home', icon: <Home size={20} /> },
    { to: '/search', label: 'Search', icon: <Search size={20} /> },
    { to: '/bookmarks', label: 'Bookmark', icon: <Bookmark size={20} /> },
    { to: '/profile', label: 'Profile', icon: <User size={20} /> },
  ]
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-xl flex justify-between rounded-2xl px-6 py-3 shadow-xl"
      style={{ background: colors.mint }}>
      {nav.map(n => (
        <Link key={n.to} to={n.to} className="flex flex-col items-center text-xs" style={{ color: location.pathname===n.to? colors.text : '#334155' }}>
          {n.icon}
          <span className="mt-1">{n.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function Section({ title, children, action }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold" style={{ color: colors.text }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ComicCard({ item }) {
  return (
    <Link to={`/comics/${item.id}`} className="rounded-2xl p-3 shadow-sm hover:shadow-md transition bg-white" style={{ border: `1px solid ${colors.gray}` }}>
      <div className="aspect-[3/4] rounded-xl bg-gray-100 mb-2 overflow-hidden">
        {item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover"/> : null}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm line-clamp-1" style={{ color: colors.text }}>{item.title}</p>
        <div className="flex items-center gap-1 text-amber-500 text-xs"><Star size={14}/> {item.rating?.toFixed?.(1) || '0.0'}</div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-1">{item.author}</p>
    </Link>
  )
}

function Grid({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(x => <ComicCard key={x.id} item={x} />)}
    </div>
  )
}

function useFetch(url, opts={}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let mounted = true
    setLoading(true); setError('')
    fetch(url, opts).then(r => r.json()).then(d => {
      if(mounted){ setData(d); setLoading(false) }
    }).catch(e => { if(mounted){ setError(e.message); setLoading(false) }})
    return () => { mounted = false }
  }, [url])
  return { data, loading, error }
}

function HomePage() {
  const { data: comics = [], loading } = useFetch(`${apiBase}/comics`)
  return (
    <Layout>
      <div className="space-y-8">
        <Section title="Latest Comics" action={<Link to="/list" className="text-sm" style={{ color: colors.mintAlt }}>See all</Link>}>
          {loading ? <SkeletonGrid/> : <Grid items={comics}/>}        
        </Section>
      </div>
    </Layout>
  )
}

function ListPage() {
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState('')
  const { data: items = [], loading } = useFetch(`${apiBase}/comics${q?`?q=${encodeURIComponent(q)}`:''}${!q && genre?`?genre=${genre}`:''}`)
  const genres = ['Action','Fantasy','Comedy','Romance','Sci-Fi','Horror']
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex gap-3">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search comics" className="flex-1 px-4 py-2 rounded-xl border focus:outline-none" style={{ borderColor: colors.gray }} />
          <select value={genre} onChange={e=>setGenre(e.target.value)} className="px-4 py-2 rounded-xl border" style={{ borderColor: colors.gray }}>
            <option value="">All genres</option>
            {genres.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        {loading ? <SkeletonGrid/> : <Grid items={items}/>}        
      </div>
    </Layout>
  )
}

function ComicDetail() {
  const id = window.location.pathname.split('/').pop()
  const { data: comic, loading } = useFetch(`${apiBase}/comics/${id}`)
  const { data: chapters = [] } = useFetch(`${apiBase}/comics/${id}/chapters`)
  if (loading || !comic) return <Layout><PageLoader/></Layout>
  return (
    <Layout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl p-4 bg-white" style={{ border: `1px solid ${colors.gray}` }}>
            <div className="flex gap-4">
              <div className="w-28 h-40 rounded-xl bg-gray-100 overflow-hidden">
                {comic.cover_url ? <img src={comic.cover_url} alt="cover" className="w-full h-full object-cover"/> : null}
              </div>
              <div>
                <h2 className="text-2xl font-semibold" style={{ color: colors.text }}>{comic.title}</h2>
                <p className="text-slate-600">{comic.author}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {comic.genres?.map(g => <span key={g} className="text-xs px-2 py-1 rounded-full" style={{ background: colors.mint }}>{g}</span>)}
                </div>
              </div>
            </div>
            <p className="mt-4 text-slate-700 leading-relaxed">{comic.synopsis}</p>
          </div>

          <div className="rounded-2xl p-4 bg-white" style={{ border: `1px solid ${colors.gray}` }}>
            <h3 className="font-medium mb-3" style={{ color: colors.text }}>Chapters</h3>
            <div className="space-y-2">
              {chapters.map(ch => (
                <Link key={ch.id} to={`/reader/${comic.id}/${ch.number}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50" style={{ border: `1px solid ${colors.gray}` }}>
                  <span>Chapter {ch.number} {ch.title?`- ${ch.title}`:''}</span>
                  <span className="text-slate-500 text-sm">Read</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-2xl p-4 bg-white sticky top-6" style={{ border: `1px solid ${colors.gray}` }}>
            <button className="w-full py-3 rounded-xl font-medium" style={{ background: colors.mintAlt, color: colors.text }}>Bookmark</button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function ReaderPage() {
  const parts = window.location.pathname.split('/')
  const comicId = parts[2]; const number = parts[3]
  const { data: chapters = [], loading } = useFetch(`${apiBase}/comics/${comicId}/chapters`)
  const chapter = chapters.find(c => String(c.number) === String(number))
  if (loading) return <Layout><PageLoader/></Layout>
  if (!chapter) return <Layout><div className="text-center text-slate-600">Chapter not found.</div></Layout>
  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-2">
          {chapter.images?.map((src, i) => (
            <img key={i} src={src} className="w-full rounded-xl shadow-sm" alt={`p${i+1}`} />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function LoginPage() {
  const nav = useNavigate()
  const { save } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const form = new URLSearchParams(); form.append('username', email); form.append('password', password)
      const r = await fetch(`${apiBase}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
      if(!r.ok) throw new Error('Login failed')
      const data = await r.json(); save(data.access_token); nav('/')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={submit} className="space-y-4">
        <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full py-3 rounded-xl font-medium" style={{ background: colors.mintAlt, color: colors.text }}>{loading? 'Signing in...' : 'Sign in'}</button>
        <Link to="/register" className="block text-center text-sm" style={{ color: colors.mintAlt }}>Create account</Link>
      </form>
    </AuthLayout>
  )
}

function RegisterPage() {
  const nav = useNavigate()
  const [display_name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const r = await fetch(`${apiBase}/auth/register`, { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ display_name, email, password }) })
      if(!r.ok) throw new Error('Registration failed')
      const data = await r.json(); localStorage.setItem('token', data.access_token); nav('/')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  return (
    <AuthLayout title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        <Input value={display_name} onChange={e=>setName(e.target.value)} placeholder="Display name" />
        <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full py-3 rounded-xl font-medium" style={{ background: colors.mintAlt, color: colors.text }}>{loading? 'Creating...' : 'Sign up'}</button>
        <Link to="/login" className="block text-center text-sm" style={{ color: colors.mintAlt }}>I already have an account</Link>
      </form>
    </AuthLayout>
  )
}

function ProfilePage() {
  return (
    <Layout>
      <div className="rounded-2xl p-6 bg-white" style={{ border: `1px solid ${colors.gray}` }}>
        <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>Profile</h2>
        <p className="text-slate-600">Sign in to sync bookmarks and history across devices.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/login" className="px-4 py-2 rounded-xl" style={{ background: colors.mintAlt, color: colors.text }}>Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-xl border" style={{ borderColor: colors.gray }}>Create account</Link>
        </div>
      </div>
    </Layout>
  )
}

function BookmarksPage() {
  const token = localStorage.getItem('token')
  const headers = token? { Authorization: `Bearer ${token}` } : {}
  const { data = [], loading, error } = useFetch(`${apiBase}/me/bookmarks`, { headers })
  return (
    <Layout>
      <Section title="Bookmarks">
        {loading ? <SkeletonList/> : (
          data.length? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{data.map(b => <div key={b.id} className="rounded-xl p-3 bg-white" style={{ border:`1px solid ${colors.gray}` }}>#{b.chapter_number || '-'} • {b.comic_id}</div>)}</div>
          ) : <Empty label="No bookmarks yet" />
        )}
      </Section>
    </Layout>
  )
}

function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: colors.bg }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-lg bg-white" style={{ border: `1px solid ${colors.gray}` }}>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: colors.text }}>{title}</h1>
        {children}
      </div>
    </div>
  )
}

function Input(props) {
  return <input {...props} className={`w-full px-4 py-3 rounded-xl border focus:outline-none ${props.className||''}`} style={{ borderColor: colors.gray }} />
}

function PageLoader() {
  return <div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_,i)=>(
        <div key={i} className="rounded-2xl p-3 bg-white animate-pulse" style={{ border:`1px solid ${colors.gray}` }}>
          <div className="aspect-[3/4] rounded-xl bg-slate-100" />
          <div className="h-3 rounded w-2/3 mt-2 bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function SkeletonList(){
  return (
    <div className="space-y-3">
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} className="h-12 rounded-xl bg-white animate-pulse" style={{ border:`1px solid ${colors.gray}` }} />
      ))}
    </div>
  )
}

function Empty({ label }) { return <div className="text-center text-slate-500 py-10">{label}</div> }

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/list" element={<ListPage/>} />
        <Route path="/comics/:id" element={<ComicDetail/>} />
        <Route path="/reader/:comicId/:number" element={<ReaderPage/>} />
        <Route path="/bookmarks" element={<BookmarksPage/>} />
        <Route path="/profile" element={<ProfilePage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/register" element={<RegisterPage/>} />
      </Routes>
    </Router>
  )
}

export default App
