import { openDB, type DBSchema } from "idb";
import type { Briefing } from "../data/sampleBriefing";

interface LifeOSDB extends DBSchema {
  briefing: {
    key: "current";
    value: Briefing;
  };
  activity: {
    key: string;
    value: ActivityRecord;
    indexes: { "by-createdAt": string };
  };
}

export interface ActivityRecord {
  id: string;
  recommendationId: string;
  title: string;
  actionId: string;
  status: "completed" | "deferred" | "dismissed" | "opened";
  createdAt: string;
}

const databasePromise = openDB<LifeOSDB>("lifeos", 1, {
  upgrade(database) {
    if (!database.objectStoreNames.contains("briefing")) {
      database.createObjectStore("briefing");
    }
    if (!database.objectStoreNames.contains("activity")) {
      const store = database.createObjectStore("activity", { keyPath: "id" });
      store.createIndex("by-createdAt", "createdAt");
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
