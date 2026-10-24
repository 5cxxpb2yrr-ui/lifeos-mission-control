import { openDB, type DBSchema } from "idb";
import type { Briefing } from "../data/sampleBriefing";

export type EntryType = "task" | "event" | "person" | "asset" | "question" | "follow-up" | "note";
export interface LifeEntry {
  id: string;
  type: EntryType;
  title: string;
  details: string;
  dueAt?: string;
  status: "open" | "completed";
  createdAt: string;
}
interface LifeOSDB extends DBSchema {
  briefing: { key: "current"; value: Briefing };
  activity: { key: string; value: ActivityRecord; indexes: { "by-createdAt": string } };
  entries: { key: string; value: LifeEntry; indexes: { "by-createdAt": string; "by-status": string; "by-type": string } };
}
export interface ActivityRecord {
  id: string; recommendationId: string; title: string; actionId: string;
  status: "completed" | "deferred" | "dismissed" | "opened"; createdAt: string;
}
const databasePromise = openDB<LifeOSDB>("lifeos", 2, {
  upgrade(database, oldVersion) {
    if (!database.objectStoreNames.contains("briefing")) database.createObjectStore("briefing");
    if (!database.objectStoreNames.contains("activity")) {
      const store = database.createObjectStore("activity", { keyPath: "id" });
      store.createIndex("by-createdAt", "createdAt");
    }
    if (oldVersion < 2 && !database.objectStoreNames.contains("entries")) {
      const store = database.createObjectStore("entries", { keyPath: "id" });
      store.createIndex("by-createdAt", "createdAt");
      store.createIndex("by-status", "status");
      store.createIndex("by-type", "type");
    }
  },
});
export async function loadBriefing(): Promise<Briefing | undefined> {
  return (await databasePromise).get("briefing", "current");
}
export async function saveBriefing(briefing: Briefing): Promise<void> {
  await (await databasePromise).put("briefing", briefing, "current");
}
export async function resetBriefing(): Promise<void> {
  await (await databasePromise).delete("briefing", "current");
  await (await databasePromise).clear("activity");
}
export async function recordActivity(record: ActivityRecord): Promise<void> {
  await (await databasePromise).put("activity", record);
}
export async function loadActivity(): Promise<ActivityRecord[]> {
  return (await databasePromise).getAllFromIndex("activity", "by-createdAt");
}
export async function loadEntries(): Promise<LifeEntry[]> {
  return (await databasePromise).getAllFromIndex("entries", "by-createdAt");
}
export async function saveEntry(entry: LifeEntry): Promise<void> {
  await (await databasePromise).add("entries", entry);
}
export async function updateEntry(entry: LifeEntry): Promise<void> {
  await (await databasePromise).put("entries", entry);
}
