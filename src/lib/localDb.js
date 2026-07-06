import { getSeedData, createInitialStoreForUser } from './seedData';
import { generateStudyContent } from './aiGenerator';
import { callLLM } from './llm';
import { syncCurriculumToStore } from './curriculumSync';
import { scheduleSaveUserGameData } from './userDataService';

let activeUid = null;
let activeProfile = null;

export function setActiveDbUser(uid, profile) {
  activeUid = uid;
  activeProfile = profile;
}

export function getActiveDbUser() {
  return { uid: activeUid, profile: activeProfile };
}

function storageKey(uid) {
  return uid ? `studified_db_${uid}` : 'studified_local_db_guest';
}

function loadStore(uid, initialStore) {
  // FIRST: Check localStorage for existing data (highest priority - user's real data)
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (raw) {
      const store = syncCurriculumToStore(JSON.parse(raw));
      localStorage.setItem(storageKey(uid), JSON.stringify(store));
      return store;
    }
  } catch {
    /* ignore */
  }

  // SECOND: If no localStorage data, use the initialStore (from Firestore or fresh)
  if (initialStore) {
    const synced = syncCurriculumToStore(initialStore);
    try {
      localStorage.setItem(storageKey(uid), JSON.stringify(synced));
    } catch {
      /* ignore */
    }
    return synced;
  }

  // LAST RESORT: Create fresh seed data
  const seed = uid && activeProfile
    ? createInitialStoreForUser(activeProfile)
    : getSeedData();
  const store = syncCurriculumToStore(seed);
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(store));
  } catch {
    /* ignore */
  }
  return store;
}

function persistStore(store) {
  if (!activeUid) return;
  try {
    localStorage.setItem(storageKey(activeUid), JSON.stringify(store));
  } catch {
    /* ignore */
  }
  if (activeProfile) {
    scheduleSaveUserGameData(activeUid, store, activeProfile);
  }
}

function parseSort(sort) {
  if (!sort) return { field: 'created_date', desc: true };
  const desc = sort.startsWith('-');
  return { field: desc ? sort.slice(1) : sort, desc };
}

function sortItems(items, sort) {
  const { field, desc } = parseSort(sort);
  return [...items].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function matchesQuery(item, query) {
  return Object.entries(query).every(([key, value]) => {
    if (Array.isArray(value)) return value.includes(item[key]);
    return item[key] === value;
  });
}

function createEntityApi(entityName, getStore, setStore) {
  return {
    async list(sort, limit) {
      const store = getStore();
      let items = store[entityName] || [];
      items = sortItems(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    async filter(query, sort, limit) {
      const store = getStore();
      let items = (store[entityName] || []).filter((item) => matchesQuery(item, query));
      items = sortItems(items, sort);
      if (limit) items = items.slice(0, limit);
      return items;
    },

    async get(id) {
      const store = getStore();
      return (store[entityName] || []).find((item) => item.id === id) ?? null;
    },

    async create(data) {
      const store = getStore();
      const now = new Date().toISOString();
      const item = {
        id: `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...data,
        created_date: now,
        updated_date: now,
      };
      store[entityName] = [...(store[entityName] || []), item];
      setStore(store);
      return item;
    },

    async update(id, data) {
      const store = getStore();
      const items = store[entityName] || [];
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error(`${entityName} not found`);
      const updated = {
        ...items[idx],
        ...data,
        updated_date: new Date().toISOString(),
      };
      items[idx] = updated;
      store[entityName] = [...items];
      setStore(store);
      return updated;
    },

    async delete(id) {
      const store = getStore();
      store[entityName] = (store[entityName] || []).filter((item) => item.id !== id);
      setStore(store);
    },
  };
}

export function createLocalDb(uid, profile, initialStore = null) {
  setActiveDbUser(uid, profile);
  let store = loadStore(uid, initialStore);

  const getStore = () => store;
  const setStore = (next) => {
    store = next;
    persistStore(store);
  };

  const entityNames = ['Quest', 'Raid', 'Guild', 'GuildMessage', 'User', 'FocusSession'];

  const entities = new Proxy(
    {},
    {
      get(_, entityName) {
        if (typeof entityName !== 'string') return undefined;
        return createEntityApi(entityName, getStore, setStore);
      },
    }
  );

  return {
    auth: {
      async isAuthenticated() {
        return Boolean(activeUid);
      },
      async me() {
        return { ...getStore().currentUser };
      },
      async updateMe(data) {
        const s = getStore();
        s.currentUser = { ...s.currentUser, ...data };
        activeProfile = s.currentUser;
        const userIdx = (s.User || []).findIndex((u) => u.email === s.currentUser.email);
        if (userIdx >= 0) {
          s.User[userIdx] = { ...s.User[userIdx], ...data };
        } else {
          s.User = [...(s.User || []), { ...s.currentUser }];
        }
        setStore(s);
        return { ...s.currentUser };
      },
      logout() {
        /* handled by AuthContext */
      },
      redirectToLogin() {
        window.location.href = '/';
      },
    },
    entities,
    integrations: {
      Core: {
        async InvokeLLM({ prompt }) {
          try {
            const { text } = await callLLM(prompt || '');
            return text;
          } catch {
            return generateStudyContent(prompt || '');
          }
        },
        async UploadFile() {
          return { file_url: '' };
        },
      },
    },
    getStore,
    setStore,
  };
}

export function initLocalDb(uid, profile, initialStore) {
  const db = createLocalDb(uid, profile, initialStore);
  globalThis.__B44_DB__ = db;
  return db;
}
