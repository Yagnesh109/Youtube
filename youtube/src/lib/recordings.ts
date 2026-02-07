export type RecordingEntry = {
  id: string;
  name: string;
  createdAt: number;
  size: number;
  mimeType: string;
  blob: Blob;
};

const DB_NAME = "yt-recordings";
const STORE_NAME = "recordings";
const DB_VERSION = 1;

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    fn(store)
      .then((result) => {
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
      })
      .catch((error) => {
        tx.abort();
        db.close();
        reject(error);
      });
  });
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const saveRecording = async (blob: Blob, name?: string) => {
  const entry: RecordingEntry = {
    id: createId(),
    name: name || `call-recording-${new Date().toISOString()}.webm`,
    createdAt: Date.now(),
    size: blob.size,
    mimeType: blob.type || "video/webm",
    blob,
  };

  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  return entry;
};

export const listRecordings = async () => {
  return withStore("readonly", (store) => {
    return new Promise<RecordingEntry[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = (request.result || []) as RecordingEntry[];
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  });
};

export const deleteRecording = async (id: string) => {
  return withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
};

export const getRecording = async (id: string) => {
  return withStore("readonly", (store) => {
    return new Promise<RecordingEntry | null>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as RecordingEntry) || null);
      request.onerror = () => reject(request.error);
    });
  });
};
