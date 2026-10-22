import { AlertTriangle, ArrowRight, Car, FileClock, FileText, Heart, Lightbulb, Phone, ShieldCheck, Sparkles, Target } from "lucide-react";
import type { BriefingItem } from "../data/sampleBriefing";
import { Score } from "./Score";

export type ActionHandler = (actionId: string, item: BriefingItem) => void;
const toneIcon = { neutral: Car, blue: ShieldCheck, amber: AlertTriangle, green: Lightbulb, rose: Heart };

function Actions({ item, onAction, overflow = false }: { item: BriefingItem; onAction: ActionHandler; overflow?: boolean }) {
  return <div className={overflow ? "actions actions--hero" : "actions"}>{item.actions.map(a => <button key={a.id} className={a.primary ? "primary" : ""} onClick={() => onAction(a.id, item)}>{a.id === "call" && <Phone size={16} />}{a.label}</button>)}{overflow && <button className="actions__overflow" aria-label={`More actions for ${item.title}`} onClick={() => onAction("more", item)}><Ellipsis size={19}/></button>}</div>;
}

export function HeroCard({ item, onAction }: { item: BriefingItem; onAction: ActionHandler }) {
  return <article className="hero">
    <div className="eyebrow"><span><Sparkles size={17}/> NEXT BEST ACTION</span><b>{item.badge}</b></div>
    <div className="hero__main"><div className="hero__mark"><span>L</span></div><div><h2>{item.title}</h2><p>{item.entity} · {item.recommendation}</p><div className="scores"><Score label="Impact" value={item.impactScore} accent="#f2b742"/><Score label="Confidence" value={item.confidenceScore}/></div></div></div>
    <div className="detail"><Target size={20}/><div><small>Expected Outcome</small><p>{item.expectedOutcome}</p></div></div>
    <div className="detail"><FileText size={20}/><div><small>Why This Matters Now</small><p>{item.context} {item.whyNow}</p></div></div>
    <Actions item={item} onAction={onAction} hero/>
  </article>;
}

export function BriefingCard({ label, item, onAction }: { label: string; item: BriefingItem; onAction: ActionHandler }) {
  const tone = item.tone ?? "neutral";
  const Icon = toneIcon[tone];
  return <article className={`card card--${tone}`}>
    <header><span><Icon size={17}/>{label}</span>{item.badge ? <b>{item.badge}</b> : <ArrowRight size={17}/>}</header>
    <div className="card__body"><div className="icon"><Icon size={27}/></div><div><h3>{item.title}</h3><p>{item.context}</p>{item.value && <strong className="value">{item.value}</strong>}</div></div>
    <p className="recommendation">{item.recommendation}</p>
    <div className="scores"><Score label="Impact" value={item.impactScore} accent={tone === "green" ? "#34d399" : tone === "amber" ? "#fb7185" : "#76a8ff"}/><Score label="Confidence" value={item.confidenceScore}/></div>
    <Actions item={item} onAction={onAction}/>
  </article>;
}

export function ReviewCard({ items, onAction }: { items: BriefingItem[]; onAction: ActionHandler }) {
  return <article className="card review"><header><span><FileClock size={17}/>REVIEW QUEUE</span><b>{items.length} items</b></header>{items.map(item => <button className="review__item" key={item.id} onClick={() => onAction("review", item)}><FileText size={17}/><span><strong>{item.title}</strong><small>{item.context}</small></span><ArrowRight size={16}/></button>)}</article>;
}
