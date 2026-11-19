const machines = [
  { name: "Sulzer G6300 loom", location: "Line 4 · Floor 2", health: "Stable", color: "emerald" },
  { name: "Lakshmi Rieter card", location: "Line 1 · Floor 1", health: "Needs review", color: "amber" },
  { name: "ABB drive cabinet", location: "Dyeing · Bay 3", health: "Stable", color: "emerald" },
];

const activities = [
  { initials: "RK", title: "Bearing replacement procedure captured", detail: "Ramesh Kumar · 18 minutes ago", color: "bg-orange-100 text-orange-700" },
  { initials: "AI", title: "Possible substitute found for SKF 6205", detail: "Parts Discovery Agent · 42 minutes ago", color: "bg-blue-100 text-blue-700" },
  { initials: "MA", title: "Maintenance memory approved", detail: "Meena Agarwal · Yesterday", color: "bg-violet-100 text-violet-700" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="mb-12 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-[#1f5141] text-lg text-white">✦</div>
          <div>
            <p className="font-semibold tracking-tight">MachineMemory</p>
            <p className="text-xs text-slate-400">Industrial intelligence</p>
          </div>
        </div>
        <nav className="space-y-1 text-sm">
          {["Overview", "Machines", "Repair memory", "Spare parts", "Technicians"].map((item, index) => (
            <div key={item} className={`rounded-xl px-3 py-2.5 ${index === 0 ? "bg-[#e9f2ee] font-medium text-[#1f5141]" : "text-slate-500"}`}>
              <span className="mr-3 inline-block w-4 text-center">{["⌂", "◫", "◉", "◇", "♙"][index]}</span>{item}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-7 left-5 right-5 rounded-2xl bg-[#f1f5f2] p-4">
          <p className="text-xs font-semibold text-[#1f5141]">Knowledge capture</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Record a senior technician before critical knowledge walks out the door.</p>
          <button className="mt-3 w-full rounded-lg bg-[#1f5141] px-3 py-2 text-xs font-medium text-white">Start recording</button>
        </div>
      </aside>

      <section className="lg:ml-64">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-10">
          <div>
            <p className="text-sm text-slate-400">Monday, 19 November 2026</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Good morning, Meena</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-500">⌕ <span className="hidden sm:inline">Search memory</span></button>
            <div className="grid size-9 place-items-center rounded-full bg-[#d9e8df] text-sm font-semibold text-[#1f5141]">MA</div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#1f5141]">Factory command center</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">Keep the line moving.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">One place for the knowledge, machines, and parts your team needs to keep old equipment productive.</p>
            </div>
            <button className="rounded-xl bg-[#1f5141] px-4 py-3 text-sm font-medium text-white shadow-sm">+ Add machine</button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["18", "Machines tracked", "2 need attention", "text-[#1f5141]"],
              ["126", "Repair memories", "8 captured this month", "text-blue-700"],
              ["34", "Parts identified", "91% match confidence", "text-orange-700"],
            ].map(([value, label, detail, color]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className={`text-3xl font-semibold ${color}`}>{value}</p>
                <p className="mt-2 text-sm font-medium">{label}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div><h3 className="font-semibold">Machine health</h3><p className="mt-1 text-xs text-slate-400">Your production floor at a glance</p></div>
                <button className="text-xs font-medium text-[#1f5141]">View all →</button>
              </div>
              <div className="mt-5 space-y-3">
                {machines.map((machine) => (
                  <div key={machine.name} className="flex items-center justify-between rounded-xl bg-[#fafbfa] px-4 py-3">
                    <div><p className="text-sm font-medium">{machine.name}</p><p className="mt-1 text-xs text-slate-400">{machine.location}</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-xs ${machine.color === "emerald" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{machine.health}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-[#1f5141] p-6 text-white">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">Ask the memory</p>
              <h3 className="mt-3 text-xl font-semibold">What do you need to fix?</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-100">Describe a symptom, upload a part photo, or search a machine&apos;s repair history.</p>
              <button className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#1f5141]">Open diagnosis workspace →</button>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between"><div><h3 className="font-semibold">Recent knowledge activity</h3><p className="mt-1 text-xs text-slate-400">What your team and AI agents have learned</p></div><button className="text-xs font-medium text-[#1f5141]">Open repair memory →</button></div>
            <div className="mt-5 divide-y divide-slate-100">
              {activities.map((activity) => <div key={activity.title} className="flex items-center gap-3 py-3"><div className={`grid size-9 place-items-center rounded-full text-xs font-semibold ${activity.color}`}>{activity.initials}</div><div><p className="text-sm font-medium">{activity.title}</p><p className="mt-1 text-xs text-slate-400">{activity.detail}</p></div></div>)}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
