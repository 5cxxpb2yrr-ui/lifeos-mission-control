import { useEffect, useState } from "react";
import { CalendarDays, Check, Ellipsis, Home, Inbox, RotateCcw, Search, Users } from "lucide-react";
import { BriefingCard, HeroCard, ReviewCard } from "./components/Cards";
import { sampleBriefing, type Briefing, type BriefingItem } from "./data/sampleBriefing";
import { loadBriefing, recordActivity, resetBriefing, saveBriefing } from "./storage/db";
import { deferRecommendation, removeRecommendation } from "./storage/briefing";

export default function App() {
  const [briefing, setBriefing] = useState<Briefing>(sampleBriefing);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    void loadBriefing().then((saved) => {
      setBriefing(saved ?? sampleBriefing);
      setReady(true);
    });
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

    const defer = actionId === "more" || actionId === "details";
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

  if (!ready) return <div className="loading-screen">Preparing your briefing…</div>;

  return <div className="stage"><main className="phone">
    <header className="top"><div><h1>Life<span>OS</span></h1><p>Mission Control</p></div><div className="top__tools"><button className="reset-button" onClick={restoreDemo} title="Restore sample briefing"><RotateCcw size={19}/></button><Search/><button>L</button></div></header>
    <section className="brief"><p>Your executive office has reviewed the full picture.<br/>Here is what deserves attention now.</p><div><span><CalendarDays size={17}/> {new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span><small>● {briefing.status}</small></div></section>
    <section className="feed">
      <HeroCard item={briefing.nextBestAction} onAction={onAction}/>
      <div className="grid">{briefing.executeNow[0] && <BriefingCard label="EXECUTE NOW" item={briefing.executeNow[0]} onAction={onAction}/>} {briefing.decisionsRequired[0] && <BriefingCard label="DECISIONS REQUIRED" item={briefing.decisionsRequired[0]} onAction={onAction}/>}</div>
      {briefing.atRisk[0] && <BriefingCard label="AT RISK" item={briefing.atRisk[0]} onAction={onAction}/>} 
      <div className="grid">{briefing.waiting[0] && <BriefingCard label="WAITING" item={briefing.waiting[0]} onAction={onAction}/>} {briefing.opportunities[0] && <BriefingCard label="OPPORTUNITIES" item={briefing.opportunities[0]} onAction={onAction}/>}</div>
      {briefing.relationshipRepairs[0] && <BriefingCard label="RELATIONSHIP REPAIRS" item={briefing.relationshipRepairs[0]} onAction={onAction}/>} 
      <ReviewCard items={briefing.reviewQueue} onAction={onAction}/>
    </section>
    <nav><button className="active"><Home/><span>Mission</span></button><button><Inbox/><i/><span>Inbox</span></button><button><Users/><span>Entities</span></button><button><Search/><span>Search</span></button><button><Ellipsis/><span>More</span></button></nav>
    {toast && <div className="toast"><Check size={18}/>{toast}</div>}
  </main></div>;
}
