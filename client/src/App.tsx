import { useEffect, useState } from 'react';
import { Deal, fetchDeals, login, register, runScrape } from './api/client';

type Mode = 'login' | 'register';

export default function App() {
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [mode, setMode] = useState<Mode>('login');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [sourceFilter, setSourceFilter] = useState('');
  const [scrapeSource, setScrapeSource] = useState<'all' | 'books' | 'local'>('local');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function loadDeals(filter = sourceFilter) {
    try {
      const data = await fetchDeals(filter || undefined);
      setDeals(data.deals);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load deals');
    }
  }

  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveSession(t: string, e: string) {
    localStorage.setItem('token', t);
    localStorage.setItem('email', e);
    setToken(t);
    setEmail(e);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken('');
    setEmail('');
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(formEmail, formPassword);
      saveSession(data.token, data.email);
      setFormPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Auth failed');
    }
  }

  async function handleScrape() {
    setLoading(true);
    setMsg('');
    setErr('');
    try {
      const result = await runScrape(scrapeSource);
      if (result.skipped) {
        setErr(result.errors.join('; ') || `Skipped: ${result.skipped}`);
      } else {
        const parts = [`Saved ${result.saved} deals from ${result.sourcesRun.join(', ') || 'nowhere'}`];
        if (result.errors.length) parts.push('Warnings: ' + result.errors.join('; '));
        setMsg(parts.join('. '));
      }
      await loadDeals();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Scrape failed');
    } finally {
      setLoading(false);
    }
  }

  async function onFilterChange(value: string) {
    setSourceFilter(value);
    await loadDeals(value);
  }

  const lastScraped = deals[0]?.scrapedAt
    ? new Date(deals[0].scrapedAt).toLocaleString()
    : 'never';

  if (!token) {
    return (
      <div className="wrap">
        <header className="app-header">
          <h1>Deal Scout</h1>
        </header>
        <div className="card" style={{ maxWidth: 400 }}>
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>
          <form className="auth-form" onSubmit={handleAuth}>
            <label>
              Email
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            {authError && <p className="error">{authError}</p>}
            <button type="submit">{mode === 'login' ? 'Login' : 'Create account'}</button>
          </form>
          <p className="muted" style={{ marginTop: '1rem' }}>
            Practice project — register any email to try the scrape button.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <header className="app-header">
        <h1>Deal Scout</h1>
        <div>
          <span className="muted" style={{ marginRight: '0.75rem' }}>{email}</span>
          <button type="button" className="secondary" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Scrape</h2>
        <div className="row">
          <select
            value={scrapeSource}
            onChange={(e) => setScrapeSource(e.target.value as 'all' | 'books' | 'local')}
          >
            <option value="local">Local sample store</option>
            <option value="books">books.toscrape.com</option>
            <option value="all">Both</option>
          </select>
          <button type="button" onClick={handleScrape} disabled={loading}>
            {loading ? 'Scraping…' : 'Run scrape'}
          </button>
        </div>
        <p className="muted">Last deal scraped at: {lastScraped}</p>
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="error">{err}</p>}
      </div>

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0, fontSize: '1.1rem', flex: 1 }}>Deals ({deals.length})</h2>
          <select value={sourceFilter} onChange={(e) => onFilterChange(e.target.value)}>
            <option value="">All sources</option>
            <option value="local-sample-store">local-sample-store</option>
            <option value="books.toscrape.com">books.toscrape.com</option>
          </select>
          <button type="button" className="secondary" onClick={() => loadDeals()}>
            Refresh
          </button>
        </div>

        {deals.length === 0 ? (
          <p className="muted">No deals yet. Run a scrape to fill this list.</p>
        ) : (
          <table className="deals">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Source</th>
                <th>Scraped</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d._id}>
                  <td>
                    <a href={d.link} target="_blank" rel="noreferrer">
                      {d.title}
                    </a>
                  </td>
                  <td>{d.priceDisplay}</td>
                  <td>{d.source}</td>
                  <td className="muted">{new Date(d.scrapedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
