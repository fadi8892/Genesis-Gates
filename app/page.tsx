"use client";

import { useEffect, useMemo, useState } from "react";

const defaultTasks = [
  { id: "t1", label: "Prepare Q3 governance review", state: "Awaiting notes" },
  { id: "t2", label: "QA billing anomaly alerts", state: "Scheduled" },
  { id: "t3", label: "Approve rollout playbook", state: "Due today" },
];

type Task = (typeof defaultTasks)[number];

type Session = {
  email: string;
};

function safeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(16).slice(2)}`;
}

function initialsFromEmail(email: string) {
  return (
    email
      ?.split("@")[0]
      .split(/[\._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase())
      .join("") || "GG"
  );
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [formState, setFormState] = useState({ email: "", password: "", remember: false });

  useEffect(() => {
    const stored = localStorage.getItem("gg-session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Session;
        if (parsed?.email) setSession(parsed);
      } catch (error) {
        console.error("Unable to read session", error);
      }
    }
  }, []);

  useEffect(() => {
    if (session?.email) {
      localStorage.setItem("gg-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("gg-session");
    }
  }, [session]);

  const avatarText = useMemo(() => (session ? initialsFromEmail(session.email) : "GG"), [session]);
  const welcomeText = session ? `Welcome back, ${session.email.split("@")[0]}` : "Welcome back";

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState.email.trim()) return;
    setSession({ email: formState.email.trim() });
  }

  function handleLogout() {
    setSession(null);
    setFormState({ email: "", password: "", remember: false });
  }

  function handleAddTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (data.get("task") || "").toString().trim();
    if (!value) return;
    setTasks((current) => [{ id: safeId("task"), label: value, state: "New" }, ...current]);
    form.reset();
  }

  function handleRemoveTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div className="app-shell">
      <section className="auth-panel" aria-label="Authentication" hidden={!!session}>
        <div className="brand">
          <div className="brand-mark">GG</div>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Genesis Gates Console</h1>
            <p className="muted">Sign in to access your control center.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formState.password}
              onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          <div className="form-footer">
            <label className="remember">
              <input
                type="checkbox"
                name="remember"
                checked={formState.remember}
                onChange={(event) => setFormState((prev) => ({ ...prev, remember: event.target.checked }))}
              />
              <span>Remember me</span>
            </label>
            <a className="link" href="#">
              Forgot password?
            </a>
          </div>
          <button type="submit" className="primary">
            Sign in
          </button>
          <p className="muted small">By continuing you agree to the acceptable use policy.</p>
        </form>
      </section>

      <main className="dashboard" hidden={!session} aria-live="polite">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>{welcomeText}</h2>
          </div>
          <div className="actions">
            <button className="ghost" type="button">
              Refresh
            </button>
            <div className="divider" role="presentation" />
            <div className="user-chip" aria-label="Current user">
              <div className="avatar" aria-hidden>
                {avatarText}
              </div>
              <div>
                <p className="chip-name">{session?.email}</p>
                <p className="chip-role">Operations</p>
              </div>
            </div>
            <button className="ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="grid">
          <article className="card highlight">
            <div className="card-head">
              <p className="eyebrow">Revenue</p>
              <span className="pill positive">+12.4%</span>
            </div>
            <h3>$482,400</h3>
            <p className="muted">Month-to-date performance across all business lines.</p>
            <svg viewBox="0 0 320 80" className="sparkline" aria-hidden="true">
              <polyline points="0,70 40,55 80,60 120,45 160,50 200,35 240,40 280,30 320,35" />
            </svg>
          </article>

          <article className="card">
            <div className="card-head">
              <p className="eyebrow">Active users</p>
              <span className="pill neutral">+4.1%</span>
            </div>
            <h3>12,840</h3>
            <p className="muted">Past 24 hours</p>
            <div className="progress" aria-hidden="true">
              <div className="progress-bar" style={{ width: "68%" }} />
            </div>
          </article>

          <article className="card">
            <div className="card-head">
              <p className="eyebrow">Net promoter</p>
              <span className="pill positive">+2.8%</span>
            </div>
            <h3>68</h3>
            <p className="muted">Sustained promoter score over the last quarter.</p>
          </article>

          <article className="card">
            <div className="card-head">
              <p className="eyebrow">Conversion</p>
              <span className="pill warning">-1.2%</span>
            </div>
            <h3>7.4%</h3>
            <p className="muted">Checkout funnel completion rate week over week.</p>
            <div className="meter">
              <span style={{ width: "74%" }} />
            </div>
          </article>
        </section>

        <section className="grid two-column">
          <article className="card">
            <div className="card-head">
              <p className="eyebrow">Pipeline</p>
              <a className="link" href="#">
                View all
              </a>
            </div>
            <ul className="list">
              <li>
                <div>
                  <p className="title">Enterprise rollout</p>
                  <p className="muted small">Deployment across three regions</p>
                </div>
                <span className="pill soft">In review</span>
              </li>
              <li>
                <div>
                  <p className="title">Data lake migration</p>
                  <p className="muted small">Modernizing ingestion flows</p>
                </div>
                <span className="pill positive">On track</span>
              </li>
              <li>
                <div>
                  <p className="title">Customer success desk</p>
                  <p className="muted small">New automation playbooks</p>
                </div>
                <span className="pill neutral">Planned</span>
              </li>
            </ul>
          </article>

          <article className="card">
            <div className="card-head">
              <p className="eyebrow">Tasks</p>
              <a className="link" href="#">
                Organize
              </a>
            </div>
            <div className="tasks">
              {tasks.map((task) => (
                <div key={task.id} className="task">
                  <div className="left">
                    <span className="badge" />
                    <div>
                      <p className="title">{task.label}</p>
                      <p className="muted small">{task.state}</p>
                    </div>
                  </div>
                  <button type="button" aria-label="Remove task" onClick={() => handleRemoveTask(task.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <form className="task-form" onSubmit={handleAddTask}>
              <input type="text" name="task" placeholder="Add a follow-up item" required />
              <button type="submit" className="primary">
                Add
              </button>
            </form>
          </article>
        </section>

        <section className="grid three-column">
          <article className="card compact">
            <div className="card-head">
              <p className="eyebrow">Service uptime</p>
              <span className="pill positive">99.98%</span>
            </div>
            <p className="muted">Rolling 30-day availability.</p>
          </article>
          <article className="card compact">
            <div className="card-head">
              <p className="eyebrow">Support SLA</p>
              <span className="pill neutral">1h 12m</span>
            </div>
            <p className="muted">Median first response time.</p>
          </article>
          <article className="card compact">
            <div className="card-head">
              <p className="eyebrow">Churn risk</p>
              <span className="pill warning">3 accounts</span>
            </div>
            <p className="muted">Flagged for proactive outreach.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
