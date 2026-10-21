// §15-17/§65 Draft画像の永続化。
// localStorageはBinaryを保存できないため、ChartImageの下書きはIndexedDBへ保存する。
// これにより「ページReload」でもEntry/After画像が失われない（§92 Launch Blocker対策）。

const DB_NAME = "fxpm-drafts";
const DB_VERSION = 1;
const STORE = "addCaseImages";
const RECORD_KEY = "current";

export type DraftImageRole = "ENTRY" | "AFTER";
export type DraftImageRecord = { role: DraftImageRole; name: string; type: string; blob: Blob };

function isSupported() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraftImages(images: { file: File; role: DraftImageRole }[]): Promise<void> {
  if (!isSupported()) return;
  try {
    const db = await openDb();
    const records: DraftImageRecord[] = images.map((img) => ({
      role: img.role,
      name: img.file.name,
      type: img.file.type,
      blob: img.file,
    }));
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(records, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // IndexedDBが使えない環境（プライベートブラウズ等）では諦める。テキストDraftは別途localStorageで保護される。
  }
}

export async function loadDraftImages(): Promise<{ file: File; role: DraftImageRole }[]> {
  if (!isSupported()) return [];
  try {
    const db = await openDb();
    const records = await new Promise<DraftImageRecord[] | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(RECORD_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!records || records.length === 0) return [];
    return records.map((r) => ({ file: new File([r.blob], r.name, { type: r.type }), role: r.role }));
  } catch {
    return [];
  }
}

export async function clearDraftImages(): Promise<void> {
  if (!isSupported()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // noop
  }
}
