import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, Ellipsis, Home, Inbox, Plus, RotateCcw, Search, Users, X, ArrowRight, FileText } from "lucide-react";
import { BriefingCard, HeroCard, ReviewCard } from "./components/Cards";
import { sampleBriefing, type Briefing, type BriefingItem } from "./data/sampleBriefing";
import { loadBriefing, recordActivity, resetBriefing, saveBriefing } from "./storage/db";
import { deferRecommendation, removeRecommendation } from "./storage/briefing";

type Workspace = "mission" | "inbox" | "entities" | "search" | "more";
type CapturedItem = { id: string; title: string; kind: string; notes: string; createdAt: string };

const CAPTURE_KEY = "lifeos-mission-control-capture-v1";
function loadCaptured(): CapturedItem[] {
  try { return JSON.parse(localStorage.getItem(CAPTURE_KEY) || "[]") as CapturedItem[]; } catch { return []; }
}
function saveCaptured(items: CapturedItem[]) {
  try { localStorage.setItem(CAPTURE_KEY, JSON.stringify(items)); } catch { /* keep the current session usable */ }
}

export default function App() {
  const [briefing, setBriefing] = useState<Briefing>(sampleBriefing);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>("mission");
  const [captured, setCaptured] = useState<CapturedItem[]>([]);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureKind, setCaptureKind] = useState("Task");
  const [captureNotes, setCaptureNotes] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadBriefing().then((saved) => {
      setBriefing(saved ?? sampleBriefing);
      setReady(true);
    });
    setCaptured(loadCaptured());
  }, []);

  const persist = async (next: Briefing) => {
    setBriefing(next);
    await saveBriefing(next);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const onAction = async (actionId: string, item: BriefingItem) => {
    if (actionId === "call") {
      await recordActivity({ id: crypto.randomUUID(), recommendationId: item.id, title: item.title, actionId, status: "opened", createdAt: new Date().toISOString() });
      window.location.href = "tel:+18004366555";
      return;
    }
    const defer = actionId === "more" || actionId === "details" || actionId === "review";
    const next = defer ? deferRecommendation(briefing, item.id) : removeRecommendation(briefing, item.id);
    await persist(next);
    await recordActivity({ id: crypto.randomUUID(), recommendationId: item.id, title: item.title, actionId, status: defer ? "deferred" : "completed", createdAt: new Date().toISOString() });
    notify(defer ? `${item.title} moved to Review Queue.` : `${item.title} marked complete.`);
  };

  const restoreDemo = async () => {
    await resetBriefing();
    await saveBriefing(sampleBriefing);
    setBriefing(sampleBriefing);
    notify("Sample briefing restored.");
  };

  const addCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = captureTitle.trim();
    if (!title) return;
    const next = [{ id: crypto.randomUUID(), title, kind: captureKind, notes: captureNotes.trim(), createdAt: new Date().toISOString() }, ...captured];
    setCaptured(next);
    saveCaptured(next);
    setCaptureTitle("");
    setCaptureNotes("");
    setCaptureKind("Task");
    setCaptureOpen(false);
    setWorkspace("inbox");
    notify("Captured to Inbox.");
  };

  const completeCapture = (id: string) => {
    const next = captured.filter(item => item.id !== id);
    setCaptured(next);
    saveCaptured(next);
    notify("Inbox item archived.");
  };

  const allBriefingItems = useMemo(() => [
    briefing.nextBestAction, ...briefing.executeNow, ...briefing.decisionsRequired, ...briefing.atRisk,
    ...briefing.waiting, ...briefing.opportunities, ...briefing.relationshipRepairs, ...briefing.reviewQueue
  ], [briefing]);
  const searchResults = allBriefingItems.filter(item => `${item.title} ${item.entity} ${item.context} ${item.recommendation}`.toLowerCase().includes(query.toLowerCase()));
  const entities = [...new Set(allBriefingItems.map(item => item.entity))].sort((a, b) => a.localeCompare(b));

  if (!ready) return <div className="loading-screen">Preparing your briefing…</div>;

  const nav = [
    { id: "mission" as const, label: "Mission", Icon: Home },
    { id: "inbox" as const, label: "Inbox", Icon: Inbox },
    { id: "entities" as const, label: "Entities", Icon: Users },
    { id: "search" as const, label: "Search", Icon: Search },
    { id: "more" as const, label: "More", Icon: Ellipsis }
  ];

  return <div className="stage"><main className="phone">
    <header className="top"><div><h1>Life<span>OS</span></h1><p>{nav.find(item => item.id === workspace)?.label === "Mission" ? "Mission Control" : nav.find(item => item.id === workspace)?.label}</p></div><div className="top__tools"><button className="reset-button" onClick={restoreDemo} title="Restore sample briefing"><RotateCcw size={19}/></button><button className="reset-button" onClick={() => setWorkspace("search")} title="Search"><Search size={19}/></button></div></header>

    {workspace === "mission" && <>
      <section className="brief"><p>Your executive office has reviewed the full picture.<br/>Here is what deserves attention now.</p><div><span><CalendarDays size={17}/> {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><small>● {briefing.status}</small></div></section>
      <section className="feed">
        <HeroCard item={briefing.nextBestAction} onAction={onAction}/>
        <div className="grid">{briefing.executeNow[0] && <BriefingCard label="EXECUTE NOW" item={briefing.executeNow[0]} onAction={onAction}/>} {briefing.decisionsRequired[0] && <BriefingCard label="DECISIONS REQUIRED" item={briefing.decisionsRequired[0]} onAction={onAction}/>}</div>
        {briefing.atRisk[0] && <BriefingCard label="AT RISK" item={briefing.atRisk[0]} onAction={onAction}/>}
        <div className="grid">{briefing.waiting[0] && <BriefingCard label="WAITING" item={briefing.waiting[0]} onAction={onAction}/>} {briefing.opportunities[0] && <BriefingCard label="OPPORTUNITIES" item={briefing.opportunities[0]} onAction={onAction}/>}</div>
        {briefing.relationshipRepairs[0] && <BriefingCard label="RELATIONSHIP REPAIRS" item={briefing.relationshipRepairs[0]} onAction={onAction}/>}
        <ReviewCard items={briefing.reviewQueue} onAction={onAction}/>
      </section>
    </>}

    {workspace === "inbox" && <section className="workspace"><div className="workspace__intro"><span className="workspace__kicker">CAPTURE & TRIAGE</span><h2>Inbox</h2><p>New thoughts and follow-ups stay here until you decide what to do with them.</p></div>
      {captured.length ? captured.map(item => <article className="card inbox-item" key={item.id}><div className="inbox-item__top"><span className="pill">{item.kind}</span><small>{new Date(item.createdAt).toLocaleDateString()}</small></div><h3>{item.title}</h3>{item.notes && <p>{item.notes}</p>}<button className="text-action" onClick={() => completeCapture(item.id)}><Check size={16}/> Archive item</button></article>) : <div className="empty-state"><Inbox size={30}/><h3>Your inbox is clear</h3><p>Use the + button to capture a task, question, event, or follow-up.</p><button className="action-primary" onClick={() => setCaptureOpen(true)}><Plus size={17}/> Capture something</button></div>}
    </section>}

    {workspace === "entities" && <section className="workspace"><div className="workspace__intro"><span className="workspace__kicker">CONTEXT & RELATIONSHIPS</span><h2>Entities</h2><p>People, accounts, assets, and commitments connected to your current briefing.</p></div>
      {entities.map(entity => <article className="entity-row" key={entity}><div className="entity-avatar">{entity.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()}</div><div><strong>{entity}</strong><small>{allBriefingItems.filter(item => item.entity === entity).length} linked item(s)</small></div><ArrowRight size={17}/></article>)}
    </section>}

    {workspace === "search" && <section className="workspace"><div className="workspace__intro"><span className="workspace__kicker">UNIVERSAL SEARCH</span><h2>Search</h2><p>Find an action or context across the current briefing.</p></div><label className="search-field"><Search size={18}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search actions, people, accounts…" autoFocus/></label>
      <div className="search-results">{searchResults.map(item => <article className="card search-result" key={item.id}><span className="workspace__kicker">{item.entity}</span><h3>{item.title}</h3><p>{item.context}</p><small>{item.recommendation}</small></article>)}{!searchResults.length && <div className="empty-state"><Search size={28}/><p>No matches. Try another name or keyword.</p></div>}</div>
    </section>}

    {workspace === "more" && <section className="workspace"><div className="workspace__intro"><span className="workspace__kicker">TOOLS & PREFERENCES</span><h2>More</h2><p>Manage this local briefing without changing your underlying data.</p></div><article className="card settings-card"><div><h3>Sample briefing</h3><p>Restore the original demonstration recommendations. This replaces the current briefing in this browser.</p></div><button className="action-secondary" onClick={restoreDemo}><RotateCcw size={16}/> Restore</button></article><article className="card settings-card"><div><h3>Local capture</h3><p>{captured.length} inbox item(s) saved in this browser.</p><small>Capture items stay on this device and are separate from the briefing store.</small></div></article></section>}

    <nav aria-label="Main navigation">{nav.map(({ id, label, Icon }) => <button key={id} className={workspace === id ? "active" : ""} onClick={() => setWorkspace(id)} aria-current={workspace === id ? "page" : undefined}><Icon/><span>{label}</span>{id === "inbox" && captured.length > 0 && <i aria-label={`${captured.length} inbox items`}/>}</button>)}</nav>
    <button className="capture-fab" onClick={() => setCaptureOpen(true)} aria-label="Capture"><Plus size={25}/></button>
    {captureOpen && <div className="capture-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCaptureOpen(false); }}><form className="capture-sheet" onSubmit={addCapture}><div className="capture-sheet__head"><div><span className="workspace__kicker">UNIVERSAL CAPTURE</span><h2>Get it out of your head.</h2></div><button type="button" className="icon-button" onClick={() => setCaptureOpen(false)} aria-label="Close capture"><X size={20}/></button></div><label>Entry type<select value={captureKind} onChange={event => setCaptureKind(event.target.value)}><option>Task</option><option>Question</option><option>Event</option><option>Follow-up</option><option>Decision</option><option>Idea</option></select></label><label>Title<input value={captureTitle} onChange={event => setCaptureTitle(event.target.value)} placeholder="What needs to be captured?" required autoFocus/></label><label>Notes or context<textarea value={captureNotes} onChange={event => setCaptureNotes(event.target.value)} placeholder="Add a person, context, or next step (optional)" rows={3}/></label><button className="action-primary capture-submit" type="submit"><Plus size={18}/> Save to Inbox</button></form></div>}
    {toast && <div className="toast"><Check size={18}/>{toast}</div>}
  </main></div>;
}
