const DATABASE = 'djpad-library';
const STORE = 'samples';

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSample(id: number, file: Blob | null) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      if (file) store.put(file, id);
      else store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

export async function readSamples(): Promise<Map<number, Blob>> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const samples = new Map<number, Blob>();
      const transaction = database.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (typeof cursor.key === 'number' && cursor.key >= 0 && cursor.key < 25 && cursor.value instanceof Blob) {
          samples.set(cursor.key, cursor.value);
        }
        cursor.continue();
      };
      transaction.oncomplete = () => resolve(samples);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}
