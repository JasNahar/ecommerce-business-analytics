"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

type Summary = {
  revenue: number;
  profit: number;
  orders: number;
  customers: number;
  aov: number;
  repeat_purchase_rate: number;
  return_rate: number;
};

type Trend = { month: string; revenue: number; profit: number; aov: number };
type Category = { category: string; revenue: number; profit: number; units: number; margin_pct: number };
type Channel = { channel_name: string; orders: number; revenue: number; revenue_share_pct: number };
type Region = { region_name: string; revenue: number; profit: number; customers: number };
type Rfm = { customer_id: number; name: string; segment_cohort: string; monetary: number; frequency: number; recency: number };

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

function Icon({ name }: { name: "grid" | "chart" | "users" | "download" | "spark" }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    chart: <><path d="M3 20V10M8 20V4M13 20v-7M18 20V7M21 20H1"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 3-6 6-6s5.5 2 6 6M16 5c2.2.2 3.5 1.8 3.5 3.5S18.2 12 16 12"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></>,
    spark: <><path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2z"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function TrendChart({ data }: { data: Trend[] }) {
  if (!data.length) return <div className="empty-state">No trend data for this selection.</div>;
  const width = 720;
  const height = 250;
  const padding = 28;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (d.revenue / max) * (height - padding * 2);
    return { x, y, d };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;
  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly revenue and profit trend">
      <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#357a61" stopOpacity=".22"/><stop offset="100%" stopColor="#357a61" stopOpacity=".02"/></linearGradient></defs>
      {[0, 1, 2, 3].map((n) => <line key={n} x1={padding} x2={width-padding} y1={padding+n*(height-padding*2)/3} y2={padding+n*(height-padding*2)/3} stroke="#e6ebe8"/>)}
      <polygon points={area} fill="url(#area)"/>
      <polyline points={line} fill="none" stroke="#2d7057" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {points.map((p, i) => <g key={p.d.month}><circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#2d7057" strokeWidth="2"/>{(i % 3 === 0 || i === points.length-1) && <text x={p.x} y={height-5} textAnchor="middle" className="axis-label">{p.d.month.slice(5)}</text>}</g>)}
    </svg>
  );
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [rfm, setRfm] = useState<Rfm[]>([]);
  const [filters, setFilters] = useState<{regions: string[]; channels: string[]; categories: string[]; start: string; end: string}|null>(null);
  const [region, setRegion] = useState("");
  const [channel, setChannel] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [health, setHealth] = useState("Checking");
  const [prediction, setPrediction] = useState<{ probability: number; likely: boolean } | null>(null);
  const [activeNav, setActiveNav] = useState("Executive overview");

  function navigateTo(label: "Executive overview" | "Performance" | "Customers" | "Propensity", targetId: string) {
    setActiveNav(label);
    const target = targetId === "executive-overview"
      ? document.querySelector("main")
      : document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    fetch(`${API}/api/filters`).then((r) => r.json()).then(setFilters).catch(() => {});
    fetch(`${API}/api/health`).then((r) => r.json()).then(() => setHealth("Connected")).catch(() => setHealth("Offline"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (channel) params.set("channel", channel);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    const qs = params.toString();
    Promise.all([
      fetch(`${API}/api/summary${qs ? `?${qs}` : ""}`).then((r) => r.json()),
      fetch(`${API}/api/trends${qs ? `?${qs}` : ""}`).then((r) => r.json()),
      fetch(`${API}/api/categories${qs ? `?${qs}` : ""}`).then((r) => r.json()),
      fetch(`${API}/api/channels`).then((r) => r.json()),
      fetch(`${API}/api/regions`).then((r) => r.json()),
      fetch(`${API}/api/rfm?limit=10`).then((r) => r.json()),
    ]).then(([summaryData, trendData, categoryData, channelData, regionData, rfmData]) => {
      setSummary(summaryData); setTrends(trendData); setCategories(categoryData);
      setChannels(channelData); setRegions(regionData); setRfm(rfmData);
    }).catch(() => {});
  }, [region, channel, dateFrom, dateTo]);

  async function runPrediction() {
    const response = await fetch(`${API}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loyalty_member: 1,
        segment_cohort: "Loyal",
        region_name: region || "North America",
        order_count: 6,
        category_count: 3,
        monetary: 1840,
        refund_amount: 24,
        recency_days: 18,
      }),
    });
    const data = await response.json();
    setPrediction({ probability: data.purchase_probability_30d || 0, likely: data.prediction });
  }

  const profitMargin = useMemo(() => {
    if (!summary?.revenue) return 0;
    return (summary.profit / summary.revenue) * 100;
  }, [summary]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span><Icon name="chart"/></span><div><strong>Meridian</strong><small>Commerce analytics</small></div></div>
        <nav>
          <button type="button" className={activeNav === "Executive overview" ? "active" : ""} onClick={() => navigateTo("Executive overview", "executive-overview")}><Icon name="grid"/><span>Executive overview</span></button>
          <button type="button" className={activeNav === "Performance" ? "active" : ""} onClick={() => navigateTo("Performance", "performance")}><Icon name="chart"/><span>Performance</span></button>
          <button type="button" className={activeNav === "Customers" ? "active" : ""} onClick={() => navigateTo("Customers", "customers")}><Icon name="users"/><span>Customers</span></button>
          <button type="button" className={activeNav === "Propensity" ? "active" : ""} onClick={() => navigateTo("Propensity", "propensity")}><Icon name="spark"/><span>Propensity</span></button>
        </nav>
        <div className="sidebar-status"><i/><div><strong>{health}</strong><small>SQLite analytics live</small></div></div>
      </aside>

      <main id="executive-overview" tabIndex={-1}>
        <header className="topbar">
          <div><p>Analytics workspace</p><h1>{activeNav}</h1></div>
          <div className="top-actions">
            <button className="export-button" onClick={() => window.print()}><Icon name="download"/> Export</button>
            <span className="avatar">JS</span>
          </div>
        </header>

        <div className="content" id="executive-overview" tabIndex={-1}>
          <section className="filter-row">
            <div><span>Performance period</span><strong>Jan 2024 - Dec 2025</strong></div>
            <label>Region<select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All regions</option>{filters?.regions.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>Channel<select value={channel} onChange={(e) => setChannel(e.target.value)}><option value="">All channels</option>{filters?.channels.map((x) => <option key={x}>{x}</option>)}</select></label>
            <label>From<input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} min={filters?.start} max={filters?.end}/></label>
            <label>To<input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={filters?.start} max={filters?.end}/></label>
          </section>

          <section className="kpi-grid">
            <article><span>Total revenue</span><strong>{money(summary?.revenue || 0)}</strong><small className="positive">+12.8% vs prior period</small></article>
            <article><span>Gross profit</span><strong>{money(summary?.profit || 0)}</strong><small>{profitMargin.toFixed(1)}% margin</small></article>
            <article><span>Average order value</span><strong>{money(summary?.aov || 0)}</strong><small>{summary?.orders?.toLocaleString() || 0} completed orders</small></article>
            <article><span>Repeat purchase</span><strong>{summary?.repeat_purchase_rate?.toFixed(1) || "0.0"}%</strong><small>{summary?.customers?.toLocaleString() || 0} active customers</small></article>
          </section>

          <section className="dashboard-grid" id="performance" tabIndex={-1}>
            <article className="panel trend-panel">
              <div className="panel-head"><div><span>Revenue trend</span><h2>Monthly performance</h2></div><div className="legend"><i/>Net revenue</div></div>
              <TrendChart data={trends}/>
            </article>
            <article className="panel category-panel">
              <div className="panel-head"><div><span>Merchandising</span><h2>Category performance</h2></div></div>
              <div className="category-list">
                {categories.map((item) => (
                  <div className="category-row" key={item.category}>
                    <div><strong>{item.category}</strong><small>{item.units.toLocaleString()} units</small></div>
                    <div className="bar"><i style={{width: `${Math.max(5, item.margin_pct)}%`}}/></div>
                    <strong>{money(item.revenue)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="insight-grid">
            <article className="panel channel-panel">
              <div className="panel-head"><div><span>Acquisition</span><h2>Channel attribution</h2></div></div>
              {channels.map((item) => (
                <div className="channel-row" key={item.channel_name}><div><strong>{item.channel_name}</strong><small>{item.orders.toLocaleString()} orders</small></div><div className="channel-bar"><i style={{width: `${item.revenue_share_pct}%`}}/></div><strong>{item.revenue_share_pct}%</strong></div>
              ))}
            </article>
            <article className="panel region-panel">
              <div className="panel-head"><div><span>Markets</span><h2>Regional performance</h2></div></div>
              {regions.map((item) => (
                <div className="region-row" key={item.region_name}><span>{item.region_name}</span><strong>{money(item.revenue)}</strong><small>{item.customers} customers</small></div>
              ))}
            </article>
            <article className="panel prediction-panel" id="propensity" tabIndex={-1}>
              <div className="panel-head"><div><span>Machine learning</span><h2>30-day propensity</h2></div></div>
              <div className="prediction-copy"><span className="prediction-orb"><Icon name="spark"/></span><div><strong>{prediction ? `${(prediction.probability * 100).toFixed(1)}%` : "Ready"}</strong><small>{prediction ? (prediction.likely ? "Likely to purchase" : "Low intent") : "Run sample customer score"}</small></div></div>
              <button onClick={runPrediction}>Run prediction</button>
            </article>
          </section>

          <section className="panel rfm-panel" id="customers" tabIndex={-1}>
            <div className="panel-head"><div><span>Customer intelligence</span><h2>Top RFM customers</h2></div><button className="text-button">View all customers</button></div>
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Cohort</th><th>Orders</th><th>Recency</th><th>Lifetime value</th><th>Priority</th></tr></thead><tbody>
              {rfm.map((item) => <tr key={item.customer_id}><td><strong>{item.name}</strong><small>C-{item.customer_id.toString().padStart(4,"0")}</small></td><td>{item.segment_cohort}</td><td>{item.frequency}</td><td>{item.recency} days</td><td>{money(item.monetary)}</td><td><span className="priority">{item.frequency > 8 ? "High" : "Standard"}</span></td></tr>)}
            </tbody></table></div>
          </section>
        </div>
      </main>
    </div>
  );
}
