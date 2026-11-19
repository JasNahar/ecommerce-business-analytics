"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Trace = { agent: string; status: "completed" | "attention" | "blocked"; summary: string };
type RunResult = {
  run_id: string;
  machine: { name: string; type?: string; confidence: number };
  diagnosis: { hypotheses: { cause: string; confidence: number }[]; assessment: string };
  parts: { original: string; substitute: string; confidence: number }[];
  safety: { risk: string; required_controls: string[]; assessment: string };
  curation: { draft_title: string; draft_note: string; requires_human_review: boolean };
  traces: Trace[];
  approved: boolean;
};

const seedMachines = [
  { id: 1, name: "Sulzer G6300 loom", location: "Line 4 · Floor 2", status: "Stable" },
  { id: 2, name: "Lakshmi Rieter card", location: "Line 1 · Floor 1", status: "Needs review" },
  { id: 3, name: "ABB drive cabinet", location: "Dyeing · Bay 3", status: "Stable" },
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const nav = ["Overview", "Agent workspace", "Machines", "Repair memory", "Spare parts"];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [machines, setMachines] = useState(seedMachines);
  const [text, setText] = useState("The Sulzer loom has a loud bearing noise and stopped after a high-temperature alarm.");
  const [machineName, setMachineName] = useState("Sulzer G6300 loom");
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<RunResult | null>(null);
  const [approved, setApproved] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [technician, setTechnician] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    fetch(`${API}/api/health`).then((r) => r.json()).then((d) => setHealth(d.status)).catch(() => setHealth("offline"));
    fetch(`${API}/api/machines`).then((r) => r.json()).then(setMachines).catch(() => {});
  }, []);

  async function runAgents(e: FormEvent) {
    e.preventDefault();
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
        machine: { name: machineName || "Sulzer G6300 loom", confidence: 72 },
        diagnosis: { hypotheses: [{ cause: "Backend unavailable or Ollama not connected", confidence: 20 }], assessment: "Start the FastAPI backend and Ollama to run the local agents." },
        parts: [{ original: "SKF 6205", substitute: "NSK 6205-2Z", confidence: 91 }],
        safety: { risk: "High", required_controls: ["Lockout/tagout", "Verify isolation", "Follow OEM procedure"], assessment: "Human safety review required." },
        curation: { draft_title: "Maintenance observation draft", draft_note: text, requires_human_review: true },
        traces: [{ agent: "Manager / Orchestrator", status: "blocked", summary: "FastAPI backend is unreachable" }],
        approved: false,
      });
    } finally {
      setRunning(false);
    }
  }

  async function approveRun() {
    if (!run) return;
    const response = await fetch(`${API}/api/agent-runs/${run.run_id}/approve`, { method: "POST" });
    setApproved(response.ok);
  }

  async function saveMemory(e: FormEvent) {
    e.preventDefault();
    if (!memoryText.trim()) return;
    try {
      await fetch(`${API}/api/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ machine_name: machineName, technician, text: memoryText, source: "technician" }),
      });
      setSavedNotice("Memory draft saved for human review");
      setMemoryText("");
    } catch {
      setSavedNotice("Memory draft saved locally in this session");
      setMemoryText("");
    }
  }

  function readUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(`${text}\n\nUploaded ${file.name}: ${String(reader.result).slice(0, 3000)}`);
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
        <button onClick={() => setActive("Overview")} className="mb-10 flex items-center gap-3 text-left">
          <div className="grid size-9 place-items-center rounded-xl bg-[#1f5141] text-lg text-white">✦</div>
          <div><p className="font-semibold tracking-tight">MachineMemory</p><p className="text-xs text-slate-400">Industrial intelligence</p></div>
        </button>
        <nav className="space-y-1 text-sm">
          {nav.map((item, index) => (
            <button key={item} onClick={() => setActive(item)} className={`w-full rounded-xl px-3 py-3 text-left ${active === item ? "bg-[#e9f2ee] font-medium text-[#1f5141]" : "text-slate-500 hover:bg-slate-50"}`}>
              <span className="mr-3 inline-block w-4 text-center">{["⌂", "✣", "▦", "◉", "◇"][index]}</span>{item}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f1f5f2] p-4">
          <p className="text-xs font-semibold text-[#1f5141]">Local AI status</p>
          <p className="mt-2 text-xs leading-5 text-slate-500"><span className={`mr-2 inline-block size-2 rounded-full ${health === "ok" ? "bg-emerald-500" : "bg-amber-500"}`} />{health === "ok" ? "Ollama backend connected" : "Waiting for local services"}</p>
        </div>
      </aside>

      <section className="lg:ml-64">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
          <div><p className="text-sm text-slate-400">Wednesday, 19 November 2026</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{active}</h1></div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-500 sm:block">Local mode</span><div className="grid size-9 place-items-center rounded-full bg-[#d9e8df] text-sm font-semibold text-[#1f5141]">MA</div></div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          {active === "Overview" && <Overview setActive={setActive} machines={machines} />}
          {active === "Agent workspace" && (
            <AgentWorkspace text={text} setText={setText} machineName={machineName} setMachineName={setMachineName} running={running} run={run} approved={approved} runAgents={runAgents} approveRun={approveRun} readUpload={readUpload} />
          )}
          {active === "Machines" && <Machines machines={machines} setMachines={setMachines} />}
          {active === "Repair memory" && (
            <MemoryPanel technician={technician} setTechnician={setTechnician} memoryText={memoryText} setMemoryText={setMemoryText} saveMemory={saveMemory} savedNotice={savedNotice} />
          )}
          {active === "Spare parts" && <PartsPanel run={run} />}
        </div>
      </section>
    </main>
  );
}

function Overview({ setActive, machines }: { setActive: (value: string) => void; machines: typeof seedMachines }) {
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-sm font-medium text-[#1f5141]">Factory command center</p><h2 className="mt-1 text-3xl font-semibold tracking-tight">Keep the line moving.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Knowledge, machines, and parts in one local-first maintenance workspace.</p></div>
      <button onClick={() => setActive("Agent workspace")} className="rounded-xl bg-[#1f5141] px-4 py-3 text-sm font-medium text-white">Open diagnosis workspace →</button>
    </div>
    <div className="grid gap-4 md:grid-cols-3">{[["18", "Machines tracked"], ["126", "Repair memories"], ["34", "Parts identified"]].map(([value, label]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-3xl font-semibold text-[#1f5141]">{value}</p><p className="mt-2 text-sm font-medium">{label}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-semibold">Machine health</h3><div className="mt-5 space-y-3">{machines.map((machine) => <div key={machine.id} className="flex items-center justify-between rounded-xl bg-[#fafbfa] px-4 py-3"><div><p className="text-sm font-medium">{machine.name}</p><p className="mt-1 text-xs text-slate-400">{machine.location}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${machine.status === "Stable" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{machine.status}</span></div>)}</div></section>
      <section className="rounded-2xl bg-[#1f5141] p-6 text-white"><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">Ask the memory</p><h3 className="mt-3 text-xl font-semibold">What do you need to fix?</h3><p className="mt-2 text-sm leading-6 text-emerald-100">Describe symptoms, paste machine notes, or upload text evidence.</p><button onClick={() => setActive("Agent workspace")} className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#1f5141]">Start an agent run →</button></section>
    </div>
  </div>;
}

function AgentWorkspace({
  text, setText, machineName, setMachineName, running, run, approved, runAgents, approveRun, readUpload,
}: {
  text: string; setText: (value: string) => void; machineName: string; setMachineName: (value: string) => void;
  running: boolean; run: RunResult | null; approved: boolean; runAgents: (e: FormEvent) => void;
  approveRun: () => void; readUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
    <form onSubmit={runAgents} className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-[#1f5141]">Manager orchestrated</p><h2 className="mt-2 text-xl font-semibold">Run diagnosis agents</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Local Ollama</span></div>
      <label className="mt-5 block text-xs font-medium text-slate-600">Machine</label>
      <input value={machineName} onChange={(e) => setMachineName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#1f5141]" placeholder="Machine name or model" />
      <label className="mt-4 block text-xs font-medium text-slate-600">Symptom or technician note</label>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-[#1f5141]" />
      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-[#1f5141]">
        ↑ Upload a text, manual extract, or photo note
        <input type="file" accept=".txt,.md,.csv,.log,text/*" onChange={readUpload} className="hidden" />
      </label>
      <button disabled={running || !text.trim()} className="mt-4 w-full rounded-xl bg-[#1f5141] px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{running ? "Agents are analyzing…" : "Run agent team"}</button>
    </form>

    <div className="space-y-4">
      {!run ? <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><div><div className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf4f0] text-xl text-[#1f5141]">✣</div><p className="mt-4 font-medium">No agent run yet</p><p className="mt-1 text-sm text-slate-400">The manager will route work to seven specialists.</p></div></div> :
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium text-slate-400">IDENTIFIED MACHINE</p><p className="mt-2 font-semibold">{run.machine.name}</p><p className="mt-1 text-xs text-slate-500">{run.machine.confidence}% identification confidence</p></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-medium text-slate-400">SAFETY REVIEW</p><p className={`mt-2 font-semibold ${run.safety.risk === "High" ? "text-red-700" : "text-amber-700"}`}>{run.safety.risk} risk</p><p className="mt-1 text-xs text-slate-500">Human approval required</p></section>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Diagnosis hypotheses</h3>{run.diagnosis.hypotheses.map((item) => <div key={item.cause} className="mt-3 rounded-xl bg-[#fafbfa] p-3"><div className="flex justify-between gap-3 text-sm"><span>{item.cause}</span><span className="text-slate-400">{item.confidence}%</span></div></div>)}</section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">Agent trace</h3><div className="mt-3 space-y-2">{run.traces.map((trace) => <div key={trace.agent} className="flex items-start gap-3 rounded-xl bg-[#fafbfa] px-3 py-2.5"><span className={`mt-1 size-2 rounded-full ${trace.status === "blocked" ? "bg-red-500" : trace.status === "attention" ? "bg-amber-500" : "bg-emerald-500"}`} /><div><p className="text-sm font-medium">{trace.agent}</p><p className="mt-0.5 text-xs text-slate-400">{trace.summary}</p></div></div>)}</div></section>
          <section className={`rounded-2xl border p-5 ${approved ? "border-emerald-300 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <p className="font-semibold">{approved ? "Recommendation approved" : "Human approval required"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{approved ? "The repair recommendation is now approved for this run." : "No repair recommendation becomes approved until a qualified person explicitly approves it."}</p>
            {!approved && <button onClick={approveRun} className="mt-3 rounded-lg bg-[#1f5141] px-4 py-2 text-xs font-medium text-white">Approve for this run</button>}
          </section>
        </>
      }
    </div>
  </div>;
}

function Machines({ machines, setMachines }: { machines: typeof seedMachines; setMachines: (value: typeof seedMachines) => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  async function addMachine(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const response = await fetch(`${API}/api/machines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, location: location || "Unassigned", status: "Stable" }) });
      if (response.ok) setMachines([await response.json(), ...machines]);
    } catch {
      setMachines([{ id: Date.now(), name, location: location || "Unassigned", status: "Stable" }, ...machines]);
    }
    setName(""); setLocation("");
  }
  return <div className="space-y-6"><div className="flex items-end justify-between"><div><p className="text-sm font-medium text-[#1f5141]">Asset register</p><h2 className="mt-1 text-3xl font-semibold">Machines</h2></div></div><form onSubmit={addMachine} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_auto]"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Machine name" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" /><button className="rounded-xl bg-[#1f5141] px-4 text-sm font-medium text-white">Add machine</button></form><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{machines.map((machine) => <article key={machine.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-[#edf4f0] text-[#1f5141]">▦</div><span className={`rounded-full px-2 py-1 text-xs ${machine.status === "Stable" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{machine.status}</span></div><h3 className="mt-4 font-semibold">{machine.name}</h3><p className="mt-1 text-xs text-slate-400">{machine.location}</p></article>)}</div></div>;
}

function MemoryPanel({ technician, setTechnician, memoryText, setMemoryText, saveMemory, savedNotice }: { technician: string; setTechnician: (value: string) => void; memoryText: string; setMemoryText: (value: string) => void; saveMemory: (e: FormEvent) => void; savedNotice: string }) {
  return <div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><form onSubmit={saveMemory} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-[#1f5141]">Technician knowledge capture</p><h2 className="mt-2 text-xl font-semibold">Add repair memory</h2><input value={technician} onChange={(e) => setTechnician(e.target.value)} placeholder="Technician name" className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /><textarea value={memoryText} onChange={(e) => setMemoryText(e.target.value)} rows={7} placeholder="Describe the symptom, test, repair, and result…" className="mt-3 w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6" /><button className="mt-3 rounded-xl bg-[#1f5141] px-4 py-3 text-sm font-medium text-white">Save draft</button>{savedNotice && <p className="mt-3 text-xs font-medium text-emerald-700">{savedNotice}</p>}</form><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Knowledge curation queue</h2><div className="mt-5 space-y-3"><MemoryCard initials="RK" title="Bearing replacement procedure" detail="Ramesh Kumar · awaiting review" /><MemoryCard initials="MA" title="Feed chute vibration isolate" detail="Meena Agarwal · approved" /></div></section></div>;
}

function MemoryCard({ initials, title, detail }: { initials: string; title: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl bg-[#fafbfa] p-3"><div className="grid size-9 place-items-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">{initials}</div><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div></div>;
}

function PartsPanel({ run }: { run: RunResult | null }) {
  const parts = run?.parts || [{ original: "SKF 6205", substitute: "NSK 6205-2Z", confidence: 91 }, { original: "SKF 6205", substitute: "FAG 6205-2RS", confidence: 88 }];
  return <div className="space-y-6"><div><p className="text-sm font-medium text-[#1f5141]">Compatibility catalog</p><h2 className="mt-1 text-3xl font-semibold">Spare parts</h2></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="grid grid-cols-[1fr_1fr_120px] border-b border-slate-200 px-5 py-3 text-xs font-medium text-slate-400"><span>Original</span><span>Candidate substitute</span><span>Match</span></div>{parts.map((part) => <div key={part.substitute} className="grid grid-cols-[1fr_1fr_120px] items-center border-b border-slate-100 px-5 py-4 text-sm last:border-0"><span>{part.original}</span><span className="font-medium">{part.substitute}</span><span className="text-[#1f5141]">{part.confidence}%</span></div>)}</section><p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Compatibility suggestions require verification against bore, width, seal, speed, load, lubrication, and OEM fit.</p></div>;
}
