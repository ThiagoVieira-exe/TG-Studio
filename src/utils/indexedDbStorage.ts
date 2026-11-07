import type { ProjectData } from '../types';

const DB_NAME = 'tg_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const AUTOSAVE_KEY = 'autosave_project';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não suportado no ambiente'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Saves project to IndexedDB, overcoming localStorage 5MB quota for high-resolution images */
export async function saveProjectToDb(project: ProjectData): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(project, AUTOSAVE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Falha ao salvar no IndexedDB:', err);
  }
}

/** Loads autosaved project from IndexedDB */
export async function loadProjectFromDb(): Promise<ProjectData | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(AUTOSAVE_KEY);
      request.onsuccess = () => resolve((request.result as ProjectData) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Falha ao carregar do IndexedDB:', err);
    return null;
  }
}
