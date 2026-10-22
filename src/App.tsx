import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CircleCheck, ClipboardList, Home, Inbox, Plus, Search, Users, X, Ellipsis, FileClock } from "lucide-react";
import { BriefingCard, HeroCard, ReviewCard } from "./components/Cards";
import { sampleBriefing, type Briefing, type BriefingItem } from "./data/sampleBriefing";
import { loadBriefing, recordActivity, saveBriefing, loadEntries, saveEntry, updateEntry, loadActivity, type LifeEntry, type EntryType, type ActivityRecord } from "./storage/db";
import { deferRecommendation, removeRecommendation } from "./storage/briefing";

type Screen = "mission" | "inbox" | "entities" | "search" | "more";
const entryTypes: { value: EntryType; label: string }[] = [
  { value: "task", label: "Task / open loop" }, { value: "event", label: "Event" },
  { value: "person", label: "Person" }, { value: "asset", label: "Asset" },
  { value: "question", label: "Question" }, { value: "follow-up", label: "Follow-up" },
  { value: "note", label: "Note" },
];
function firstConfident<T extends { confidenceScore: number }>(items: T[]): T | undefined {
  return items.find((item) => item.confidenceScore >= 50);
}

const screenLabels: Record<Screen, string> = { mission: "Mission", inbox: "Inbox", entities: "Entities", search: "Search", more: "More" };
const captureCopy: Record<EntryType, { title: string; detailsLabel: string; detailsPlaceholder: string; hint: string }> = {
  task: { title: "What needs to get done?", detailsLabel: "Details", detailsPlaceholder: "Optional context or next step", hint: "A task or open loop to keep visible until it is resolved." },
  event: { title: "What is happening?", detailsLabel: "Event details", detailsPlaceholder: "When, where, or other event context", hint: "This prototype stores a title and notes only; it does not create a canonical event record." },
  person: { title: "Who do you want to remember?", detailsLabel: "Relationship / context", detailsPlaceholder: "How you know them or what to remember", hint: "Local contact note only—not a complete canonical person record." },
  asset: { title: "What asset do you want to track?", detailsLabel: "Asset details", detailsPlaceholder: "Type, location, or other context", hint: "Local asset note only—not a complete canonical asset record." },
  question: { title: "What question is unresolved?", detailsLabel: "Question context", detailsPlaceholder: "What you need to find out", hint: "Keep the unresolved question and any context together." },
  "follow-up": { title: "Who or what needs a follow-up?", detailsLabel: "Follow-up details", detailsPlaceholder: "Next step or context for following up", hint: "A reminder to follow up; linking to a canonical person is not supported here." },
  note: { title: "What do you want to remember?", detailsLabel: "Note", detailsPlaceholder: "Write a short note", hint: "A simple note saved locally in this browser." },
};

export default function App() {
  const [briefing, setBriefing] = useState<Briefing>(sampleBriefing);
  const [entries, setEntries] = useState<LifeEntry[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("mission");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<EntryType>("task");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void Promise.all([loadBriefing(), loadEntries(), loadActivity()]).then(([saved, savedEntries, savedActivity]) => {
      setBriefing(saved ?? sampleBriefing);
      setEntries(savedEntries);
      setActivity(savedActivity);
      setReady(true);
    });
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };
  const persist = async (next: Briefing) => { setBriefing(next); await saveBriefing(next); };

  const onAction = async (actionId: string, item: BriefingItem) => {
    if (actionId === "call") {
      await recordActivity({ id: crypto.randomUUID(), recommendationId: item.id, title: item.title, actionId, status: "opened", createdAt: new Date().toISOString() });
      setActivity(await loadActivity());
      notify("No verified phone number is attached to this illustrative sample. Verify the contact details before calling.");
      return;
    }
    const defer = actionId === "more" || actionId === "details";
    await persist(defer ? deferRecommendation(briefing, item.id) : removeRecommendation(briefing, item.id));
    await recordActivity({ id: crypto.randomUUID(), recommendationId: item.id, title: item.title, actionId, status: defer ? "deferred" : "completed", createdAt: new Date().toISOString() });
    setActivity(await loadActivity());
    notify(defer ? `${item.title} moved to Review Queue.` : `${item.title} marked complete.`);
  };

  const openCapture = (entry?: LifeEntry) => {
    setEditingEntryId(entry?.id ?? null);
    setEntryType(entry?.type ?? "task");
    setTitle(entry?.title ?? "");
    setDetails(entry?.details ?? "");
    setDueAt(entry?.dueAt ?? "");
    setCaptureOpen(true);
  };

  const closeCapture = () => {
    setCaptureOpen(false); setEditingEntryId(null);
    setTitle(""); setDetails(""); setDueAt(""); setEntryType("task");
  };

  const createEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const existing = editingEntryId ? entries.find((entry) => entry.id === editingEntryId) : undefined;
    const entry: LifeEntry = {
      id: existing?.id ?? crypto.randomUUID(), type: entryType, title: cleanTitle,
      details: details.trim(), dueAt: dueAt || undefined,
      status: existing?.status ?? "open", createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) await updateEntry(entry); else await saveEntry(entry);
    setEntries(await loadEntries());
    closeCapture();
    setScreen(entry.type === "person" || entry.type === "asset" ? "entities" : "inbox");
    notify(existing ? "Changes saved on this device." : "Saved on this device.");
  };

  const toggleEntry = async (entry: LifeEntry) => {
    const next: LifeEntry = { ...entry, status: entry.status === "open" ? "completed" : "open" };
    await updateEntry(next);
    setEntries(await loadEntries());
    notify(next.status === "completed" ? "Marked complete." : "Reopened.");
  };

  const visibleNextBestAction = briefing.nextBestAction.confidenceScore >= 50 ? briefing.nextBestAction : undefined;
  const visibleExecuteNow = firstConfident(briefing.executeNow);
  const visibleDecisionsRequired = firstConfident(briefing.decisionsRequired);
  const visibleAtRisk = firstConfident(briefing.atRisk);
  const visibleWaiting = firstConfident(briefing.waiting);
  const visibleOpportunities = firstConfident(briefing.opportunities);
  const visibleRelationshipRepair = firstConfident(briefing.relationshipRepairs);
  const visibleReviewQueue = briefing.reviewQueue.filter((item) => item.confidenceScore >= 50);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesQuery = !normalized || [entry.title, entry.details, entry.type].some((value) => value?.toLowerCase().includes(normalized));
      if (!matchesQuery) return false;
      if (screen === "entities") return entry.type === "person" || entry.type === "asset";
      if (screen === "inbox") return entry.status === "open" && entry.type !== "person" && entry.type !== "asset";
      if (screen === "search") return true;
      return entry.status === "open";
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, query, screen]);

  if (!ready) return <div className="loading-screen">Preparing your briefing…</div>;

  return <div className="stage"><main className="phone">
    <header className="top"><div><h1>Life<span>OS</span></h1><p>Mission Control</p></div><div className="top__tools">
      <button className="tool-button" aria-label="Search" onClick={() => { setScreen("search"); setQuery(""); }}><Search size={19}/></button>
      <button className="capture-button" onClick={() => openCapture()}><Plus size={18}/> Capture</button>
    </div></header>

    {screen === "mission" && <>
      <section className="brief"><p>Your executive office has reviewed the full picture.<br/>Here is what deserves attention now.</p><div><span><CalendarDays size={17}/> {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><small>● Illustrative sample</small></div></section>
      <p className="workspace__hint">Illustrative briefing only: these scenarios are sample content, not verified records from your LifeOS data.</p>
      <section className="feed">
        {visibleNextBestAction ? <HeroCard item={visibleNextBestAction} onAction={onAction}/> : <p className="workspace__hint">No recommendation currently meets the 50% confidence threshold. Review the underlying evidence before acting.</p>}
        <div className="grid">{visibleExecuteNow && <BriefingCard label="EXECUTE NOW" item={visibleExecuteNow} onAction={onAction}/>} {visibleDecisionsRequired && <BriefingCard label="DECISIONS REQUIRED" item={visibleDecisionsRequired} onAction={onAction}/>}</div>
        {visibleAtRisk && <BriefingCard label="AT RISK" item={visibleAtRisk} onAction={onAction}/>}
        <div className="grid">{visibleWaiting && <BriefingCard label="WAITING" item={visibleWaiting} onAction={onAction}/>} {visibleOpportunities && <BriefingCard label="OPPORTUNITIES" item={visibleOpportunities} onAction={onAction}/>}</div>
        {visibleRelationshipRepair && <BriefingCard label="RELATIONSHIP REPAIRS" item={visibleRelationshipRepair} onAction={onAction}/>}
        {visibleReviewQueue.length > 0 && <ReviewCard items={visibleReviewQueue} onAction={onAction}/>}
      </section>
    </>}

    {(screen === "inbox" || screen === "entities" || screen === "search") && <section className="workspace">
      <div className="workspace__heading"><div><p className="workspace__eyebrow">{screen === "entities" ? "PEOPLE & ASSETS" : screen === "search" ? "LOCAL SEARCH" : "OPEN LOOPS"}</p><h2>{screen === "entities" ? "Entities" : screen === "search" ? "Search captured entries" : "Inbox"}</h2></div><span className="count-pill">{filteredEntries.length}</span></div>
      {screen === "search" && <label className="search-field"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved titles, details, types…" autoFocus /></label>}
      {screen !== "search" && <p className="workspace__hint">{screen === "entities" ? "People and assets you capture are listed here." : "Capture a task, question, event, or follow-up. Your entries stay on this device."}</p>}
      {filteredEntries.length === 0 ? <div className="empty-state"><ClipboardList size={28}/><strong>{screen === "search" && query ? "No matches found" : screen === "entities" ? "No entities yet" : "Inbox is clear"}</strong><p>{screen === "search" && query ? "Try another search term." : "Use Capture to add your first item. Nothing will be added automatically."}</p>{screen !== "search" && <button className="capture-button" onClick={() => openCapture()}><Plus size={17}/> Capture an item</button>}</div> : <div className="entry-list">{filteredEntries.map(entry => <article className={`entry-card ${entry.status === "completed" ? "entry-card--done" : ""}`} key={entry.id}>
        <button className="entry-check" onClick={() => void toggleEntry(entry)} aria-label={entry.status === "open" ? "Mark complete" : "Reopen"}>{entry.status === "completed" ? <CircleCheck size={22}/> : <span/>}</button>
        <div className="entry-card__content"><div className="entry-meta"><span>{entry.type}</span>{entry.dueAt && <time>{new Date(entry.dueAt + (entry.dueAt.length === 10 ? "T12:00:00" : "")).toLocaleDateString()}</time>}</div><h3>{entry.title}</h3>{entry.details && <p>{entry.details}</p>}<button className="entry-edit" onClick={() => openCapture(entry)}>Edit entry</button></div>
      </article>)}</div>}
    </section>}

    {screen === "more" && <section className="workspace">
      <div className="workspace__heading"><div><p className="workspace__eyebrow">YOUR DEVICE</p><h2>More</h2></div></div>
      <div className="stats-grid"><div><strong>{entries.filter(item => item.status === "open").length}</strong><span>Open entries</span></div><div><strong>{entries.filter(item => item.status === "completed").length}</strong><span>Completed</span></div><div><strong>{activity.length}</strong><span>Briefing actions</span></div></div>
      <p className="workspace__hint">Captured entries are stored locally in this browser using IndexedDB. They are not synced to the main LifeOS event graph or to another device.</p>
      <article className="card activity-card"><header><span><FileClock size={17}/>RECENT BRIEFING ACTIVITY</span></header>
        {activity.length === 0 ? <p className="workspace__hint">No briefing actions recorded yet.</p> : activity.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,12).map(item => <div className="activity-row" key={item.id}><span>{item.title}</span><small>{item.status} · {new Date(item.createdAt).toLocaleDateString()}</small></div>)}
      </article>
    </section>}

    <nav aria-label="Main navigation">{(Object.keys(screenLabels) as Screen[]).map((item) => {
      const Icon = item === "mission" ? Home : item === "inbox" ? Inbox : item === "entities" ? Users : item === "search" ? Search : Ellipsis;
      return <button key={item} className={screen === item ? "active" : ""} aria-current={screen === item ? "page" : undefined} onClick={() => { setScreen(item); if (item !== "search") setQuery(""); }}><Icon/><span>{screenLabels[item]}</span></button>;
    })}</nav>

    {captureOpen && <div className="modal-backdrop" onClick={closeCapture}><section className="capture-modal" role="dialog" aria-modal="true" aria-labelledby="capture-title" onClick={(event) => event.stopPropagation()}>
      <header><div><p className="workspace__eyebrow">{editingEntryId ? "EDIT ENTRY · THIS DEVICE" : "QUICK CAPTURE · THIS DEVICE"}</p><h2 id="capture-title">{editingEntryId ? "Edit entry" : "Add to LifeOS"}</h2></div><button className="close-button" aria-label="Close capture" onClick={closeCapture}><X size={20}/></button></header>
      <form onSubmit={(event) => void createEntry(event)}>
        <label>Entry type<select value={entryType} onChange={(event) => setEntryType(event.target.value as EntryType)}>{entryTypes.map(type => <option value={type.value} key={type.value}>{type.label}</option>)}</select></label>
        <p className="capture-type-hint" aria-live="polite">{captureCopy[entryType].hint}</p>
        <label>Title<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={captureCopy[entryType].title}/></label>
        <label>{captureCopy[entryType].detailsLabel}<textarea maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={captureCopy[entryType].detailsPlaceholder} rows={3}/></label>
        <details className="capture-advanced"><summary>More details <span>{dueAt ? "Due date set" : "Optional due date"}</span></summary><label>Due date<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)}/></label></details>
        <p className="local-note">Saved only in this browser on this device. No sample or test entry will be created automatically.</p>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={closeCapture}>Cancel</button><button type="submit" className="capture-button">{editingEntryId ? "Save changes" : <><Plus size={17}/> Save entry</>}</button></div>
      </form>
    </section></div>}
    {toast && <div className="toast"><Check size={18}/>{toast}</div>}
  </main></div>;
}
