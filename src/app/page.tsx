"use client";

import { FormEvent, useEffect, useState } from "react";

type View = "Command center" | "Agent workspace" | "Machines" | "Repair memory" | "Spare parts";

type Machine = {
  id: number;
  name: string;
  location: string;
  status: "Stable" | "Needs review" | "Offline";
};

type RunResult = {
  run_id: string;
  machine: { name: string; confidence: number };
  diagnosis: { hypotheses: { cause: string; confidence: number }[]; assessment: string };
  parts: { original: string; substitute: string; confidence: number }[];
  safety: { risk: string; required_controls: string[]; assessment: string };
  traces: { agent: string; status: "completed" | "attention" | "blocked"; summary: string }[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const initialMachines: Machine[] = [
  { id: 1, name: "Sulzer G6300 loom", location: "Weaving · Line 4", status: "Stable" },
  { id: 2, name: "Lakshmi Rieter card", location: "Carding · Line 1", status: "Needs review" },
  { id: 3, name: "ABB ACS355 drive", location: "Dyeing · Bay 3", status: "Stable" },
];

const nav: { label: View; icon: string }[] = [
  { label: "Command center", icon: "grid" },
  { label: "Agent workspace", icon: "spark" },
  { label: "Machines", icon: "machine" },
  { label: "Repair memory", icon: "memory" },
  { label: "Spare parts", icon: "parts" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    spark: <><path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></>,
    machine: <><rect x="3" y="7" width="18" height="13" rx="3" /><path d="M8 7V4h8v3M7 12h10M7 16h10" /></>,
    memory: <><path d="M4 5h16v14H4z" /><path d="M8 9h8M8 13h5M8 17h7" /></>,
    parts: <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M19.1 4.9l-2.8 2.8M7.7 16.3l-2.8 2.8" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></>,
    bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [view, setView] = useState<View>("Command center");
  const [machines, setMachines] = useState(initialMachines);
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((response) => response.json())
      .then((data) => setHealth(data.status === "ok" ? "connected" : "offline"))
      .catch(() => setHealth("offline"));
    fetch(`${API}/api/machines`)
      .then((response) => response.json())
      .then((data) => Array.isArray(data) && setMachines(data))
      .catch(() => {});
  }, []);

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("Command center")} aria-label="Open command center">
          <span className="brand-mark"><Icon name="spark" /></span>
          <span>
            <strong>MachineMemory</strong>
            <small>Industrial intelligence</small>
          </span>
        </button>

        <nav className="side-nav" aria-label="Primary navigation">
          {nav.map((item) => (
            <button key={item.label} className={view === item.label ? "nav-item active" : "nav-item"} onClick={() => setView(item.label)}>
              <span className="nav-icon"><Icon name={item.icon} /></span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="side-status">
          <div className="status-heading">
            <span className={health === "connected" ? "status-dot online" : "status-dot"} />
            <span>Local AI status</span>
          </div>
          <strong>{health === "connected" ? "Ollama connected" : health === "checking" ? "Checking services" : "Backend offline"}</strong>
          <small>SQLite · Local inference</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Wednesday, 19 November</p>
            <h1>{view}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search"><Icon name="search" /></button>
            <button className="icon-button notification" aria-label="Notifications"><Icon name="bell" /><span /></button>
            <button className="profile" aria-label="Open profile"><span>MA</span><div><strong>Meena Agarwal</strong><small>Maintenance lead</small></div></button>
          </div>
        </header>

        <div className="content">
          {view === "Command center" && <CommandCenter machines={machines} openWorkspace={() => setView("Agent workspace")} openMachines={() => setView("Machines")} />}
          {view === "Agent workspace" && <AgentWorkspace />}
          {view === "Machines" && <MachinesView machines={machines} setMachines={setMachines} />}
          {view === "Repair memory" && <RepairMemory />}
          {view === "Spare parts" && <SpareParts />}
        </div>
      </main>
    </div>
  );
}

function CommandCenter({ machines, openWorkspace, openMachines }: { machines: Machine[]; openWorkspace: () => void; openMachines: () => void }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <span className="kicker">Factory command center</span>
          <h2>Keep the line moving.</h2>
          <p>One operational view for technician knowledge, machine health, and spare-part decisions.</p>
        </div>
        <button className="primary-button" onClick={openWorkspace}><Icon name="spark" /> Start diagnosis</button>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <div className="metric-icon green"><Icon name="machine" /></div>
          <div><strong>{machines.length}</strong><span>Machines tracked</span><small><b>2</b> need attention</small></div>
        </article>
        <article className="metric-card">
          <div className="metric-icon blue"><Icon name="memory" /></div>
          <div><strong>126</strong><span>Repair memories</span><small><b>+8</b> this month</small></div>
        </article>
        <article className="metric-card">
          <div className="metric-icon amber"><Icon name="parts" /></div>
          <div><strong>34</strong><span>Parts identified</span><small><b>91%</b> average match</small></div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel machine-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Fleet health</span><h3>Machine overview</h3></div>
            <button className="text-button" onClick={openMachines}>View all <Icon name="arrow" /></button>
          </div>
          <div className="machine-list">
            {machines.map((machine) => (
              <div className="machine-row" key={machine.id}>
                <div className="machine-avatar"><Icon name="machine" /></div>
                <div className="machine-name"><strong>{machine.name}</strong><span>{machine.location}</span></div>
                <span className={`health-pill ${machine.status === "Stable" ? "stable" : "review"}`}><i />{machine.status}</span>
                <button className="row-action" aria-label={`Open ${machine.name}`}>•••</button>
              </div>
            ))}
          </div>
        </article>

        <article className="ask-card">
          <div className="ask-orb"><Icon name="spark" /></div>
          <span>Ask the memory</span>
          <h3>What do you need to fix?</h3>
          <p>Describe a symptom, upload a machine note, or search your team&apos;s repair history.</p>
          <button onClick={openWorkspace}>Open diagnosis workspace <Icon name="arrow" /></button>
        </article>
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div><span className="panel-kicker">Recent activity</span><h3>Knowledge timeline</h3></div>
          <button className="text-button">View history <Icon name="arrow" /></button>
        </div>
        <div className="activity-grid">
          <Activity initials="RK" title="Bearing replacement procedure" meta="Ramesh Kumar · 18 min ago" tone="orange" />
          <Activity initials="AI" title="SKF 6205 substitute candidates" meta="Parts agent · 42 min ago" tone="blue" />
          <Activity initials="MA" title="Maintenance memory approved" meta="Meena Agarwal · Yesterday" tone="violet" />
        </div>
      </section>
    </>
  );
}

function Activity({ initials, title, meta, tone }: { initials: string; title: string; meta: string; tone: string }) {
  return <div className="activity-item"><span className={`activity-avatar ${tone}`}>{initials}</span><div><strong>{title}</strong><small>{meta}</small></div></div>;
}

function AgentWorkspace() {
  const [text, setText] = useState("The Sulzer loom bearing is noisy and hot after 30 minutes of operation.");
  const [machineName, setMachineName] = useState("Sulzer G6300 loom");
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [approved, setApproved] = useState(false);

  async function runAgents(event: FormEvent) {
    event.preventDefault();
    setRunning(true);
    setApproved(false);
    try {
      const response = await fetch(`${API}/api/agent-runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, machine_name: machineName }),
      });
      if (!response.ok) throw new Error("Agent run failed");
      setRun(await response.json());
    } catch {
      setRun({
        run_id: "offline-preview",
        machine: { name: machineName, confidence: 72 },
        diagnosis: { hypotheses: [{ cause: "Backend unavailable", confidence: 20 }], assessment: "Start Ollama and the FastAPI backend to run the specialist agents." },
        parts: [{ original: "Not identified", substitute: "Start backend for analysis", confidence: 20 }],
        safety: { risk: "High", required_controls: ["Lockout/tagout", "Verify isolation", "Follow OEM procedure"], assessment: "Human safety review required." },
        traces: [{ agent: "Manager / Orchestrator", status: "blocked", summary: "FastAPI backend is unreachable" }],
      });
    } finally {
      setRunning(false);
    }
  }

  async function approve() {
    if (!run) return;
    const response = await fetch(`${API}/api/agent-runs/${run.run_id}/approve`, { method: "POST" });
    setApproved(response.ok);
  }

  return (
    <div className="workspace-layout">
      <form className="panel intake-panel" onSubmit={runAgents}>
        <div className="panel-heading">
          <div><span className="panel-kicker">New investigation</span><h3>Describe the problem</h3></div>
          <span className="local-badge"><i /> Local Ollama</span>
        </div>
        <label>Machine
          <input value={machineName} onChange={(event) => setMachineName(event.target.value)} placeholder="Machine name or model" />
        </label>
        <label>Symptoms or technician notes
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} placeholder="Describe the fault, observations, and tests…" />
        </label>
        <label className="upload-zone">
          <span className="upload-icon"><Icon name="plus" /></span>
          <strong>Attach evidence</strong>
          <small>Manual text, photo note, or operating log</small>
          <input type="file" accept=".txt,.md,.csv,.log,text/*" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setText((current) => `${current}\n\nUploaded ${file.name}: ${String(reader.result).slice(0, 3000)}`);
            reader.readAsText(file);
          }} />
        </label>
        <button className="run-button" disabled={running || !text.trim()}>
          <Icon name="spark" /> {running ? "Agents analyzing…" : "Run agent team"}
        </button>
      </form>

      <div className="analysis-column">
        {!run ? (
          <div className="panel empty-analysis">
            <div className="empty-orb"><Icon name="spark" /></div>
            <h3>Ready for an investigation</h3>
            <p>The manager will route evidence to seven specialist agents.</p>
            <div className="agent-pipeline">
              {["Identify", "Memory", "Diagnose", "Parts", "Check", "Safety", "Curate"].map((agent) => <span key={agent}>{agent}</span>)}
            </div>
          </div>
        ) : (
          <>
            <div className="analysis-stats">
              <article className="stat-card"><span>IDENTIFIED MACHINE</span><strong>{run.machine.name}</strong><small>{run.machine.confidence}% confidence</small></article>
              <article className={`stat-card ${run.safety.risk === "High" ? "danger" : ""}`}><span>SAFETY REVIEW</span><strong>{run.safety.risk} risk</strong><small>Human review required</small></article>
            </div>
            <article className="panel result-panel">
              <div className="panel-heading"><div><span className="panel-kicker">Manager trace</span><h3>Agent execution</h3></div><span className="run-id">RUN {run.run_id.slice(0, 8).toUpperCase()}</span></div>
              <div className="trace-list">
                {run.traces.map((trace) => (
                  <div className="trace-row" key={trace.agent}>
                    <span className={`trace-dot ${trace.status}`} />
                    <div><strong>{trace.agent}</strong><small>{trace.summary}</small></div>
                    <span className={`trace-status ${trace.status}`}>{trace.status}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel result-panel">
              <div className="panel-heading"><div><span className="panel-kicker">Diagnosis</span><h3>Likely root causes</h3></div></div>
              <div className="hypothesis-list">
                {run.diagnosis.hypotheses.map((item) => (
                  <div className="hypothesis" key={item.cause}>
                    <div><strong>{item.cause}</strong><span>{item.confidence}%</span></div>
                    <div className="confidence-bar"><i style={{ width: `${item.confidence}%` }} /></div>
                  </div>
                ))}
              </div>
            </article>
            <article className={`approval-card ${approved ? "approved" : ""}`}>
              <div className="approval-icon">{approved ? "✓" : "!"}</div>
              <div><strong>{approved ? "Recommendation approved" : "Approval required"}</strong><p>{approved ? "This run is approved for operational review." : "A qualified person must explicitly approve before this recommendation is treated as approved."}</p></div>
              {!approved && <button onClick={approve}>Approve for this run</button>}
            </article>
          </>
        )}
      </div>
    </div>
  );
}

function MachinesView({ machines, setMachines }: { machines: Machine[]; setMachines: (machines: Machine[]) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  async function addMachine(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const payload: Machine = { id: 0, name: name.trim(), location: location.trim() || "Unassigned", status: "Stable" };
    try {
      const response = await fetch(`${API}/api/machines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (response.ok) setMachines([await response.json(), ...machines]);
    } catch {
      setMachines([{ ...payload, id: Date.now() }, ...machines]);
    }
    setName("");
    setLocation("");
  }

  return (
    <>
      <section className="page-heading"><div><span className="kicker">Asset register</span><h2>Machines</h2><p>Track critical equipment, locations, and maintenance state.</p></div></section>
      <form className="panel add-machine-form" onSubmit={addMachine}>
        <label>Machine name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Sulzer G6300 loom" /></label>
        <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Line 4 · Floor 2" /></label>
        <button className="primary-button"><Icon name="plus" /> Add machine</button>
      </form>
      <section className="machine-card-grid">
        {machines.map((machine) => (
          <article className="machine-card" key={machine.id}>
            <div className="machine-card-top"><span className="machine-card-icon"><Icon name="machine" /></span><span className={`health-pill ${machine.status === "Stable" ? "stable" : "review"}`}><i />{machine.status}</span></div>
            <h3>{machine.name}</h3><p>{machine.location}</p>
            <button>Open machine <Icon name="arrow" /></button>
          </article>
        ))}
      </section>
    </>
  );
}

function RepairMemory() {
  const [technician, setTechnician] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");

  async function saveMemory(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    try {
      await fetch(`${API}/api/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technician, text: note, source: "technician" }),
      });
      setSaved("Memory draft saved for human review.");
    } catch {
      setSaved("Memory draft saved in this local session.");
    }
    setNote("");
  }

  return (
    <>
      <section className="page-heading"><div><span className="kicker">Technician knowledge</span><h2>Repair memory</h2><p>Capture what experienced technicians know before it leaves the floor.</p></div></section>
      <div className="memory-layout">
        <form className="panel capture-panel" onSubmit={saveMemory}>
          <div className="panel-heading"><div><span className="panel-kicker">Knowledge capture</span><h3>Add a repair memory</h3></div></div>
          <label>Technician name<input value={technician} onChange={(event) => setTechnician(event.target.value)} placeholder="Full name" /></label>
          <label>Procedure or observation<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={9} placeholder="What failed? What did you test? What repair worked? What should others watch for?" /></label>
          <button className="run-button"><Icon name="memory" /> Save memory draft</button>
          {saved && <p className="saved-message">{saved}</p>}
        </form>
        <article className="panel curation-panel">
          <div className="panel-heading"><div><span className="panel-kicker">Curation queue</span><h3>Needs review</h3></div><span className="count-badge">2</span></div>
          <div className="curation-list">
            <div className="curation-row"><span className="activity-avatar orange">RK</span><div><strong>Bearing replacement procedure</strong><small>Ramesh Kumar · Awaiting review</small></div><button>Review</button></div>
            <div className="curation-row"><span className="activity-avatar violet">MA</span><div><strong>Feed chute vibration isolation</strong><small>Meena Agarwal · Approved</small></div><button>View</button></div>
          </div>
        </article>
      </div>
    </>
  );
}

function SpareParts() {
  const parts = [
    { original: "SKF 6205", substitute: "NSK 6205-2Z", confidence: 91, status: "Likely compatible" },
    { original: "SKF 6205", substitute: "FAG 6205-2RS", confidence: 88, status: "Likely compatible" },
  ];
  return (
    <>
      <section className="page-heading"><div><span className="kicker">Compatibility catalog</span><h2>Spare parts</h2><p>Candidate substitutes with human verification requirements.</p></div></section>
      <section className="panel parts-table">
        <div className="parts-head"><span>Original part</span><span>Candidate substitute</span><span>Match</span><span>Status</span></div>
        {parts.map((part) => (
          <div className="parts-row" key={part.substitute}>
            <strong>{part.original}</strong><strong>{part.substitute}</strong>
            <div className="match-score"><span>{part.confidence}%</span><div><i style={{ width: `${part.confidence}%` }} /></div></div>
            <span className="health-pill stable"><i />{part.status}</span>
          </div>
        ))}
      </section>
      <div className="warning-card"><span>!</span><div><strong>Verify before fitting</strong><p>Check bore, width, seal, clearance, speed, load, lubrication, and OEM fit.</p></div></div>
    </>
  );
}
