// === IndexedDB Wrapper ===
const DB = {
  _db: null,
  DB_NAME: 'ftc-scout',
  DB_VERSION: 2,

  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Delete old stores if upgrading
        if (db.objectStoreNames.contains('photos')) {
          db.deleteObjectStore('photos');
        }

        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'uuid' });
          store.createIndex('teamNumber', 'teamNumber', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('teams')) {
          if (db.objectStoreNames.contains('teams')) db.deleteObjectStore('teams');
          db.createObjectStore('teams', { keyPath: 'teamNumber' });
        }
      };

      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };

      req.onerror = (e) => reject(e.target.error);
    });
  },

  async _tx(storeName, mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = fn(store);

      if (result && result.onsuccess !== undefined) {
        result.onsuccess = () => resolve(result.result);
        result.onerror = () => reject(result.error);
      } else {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
      }
    });
  },

  // === Entries ===

  async saveEntry(entry) {
    return this._tx('entries', 'readwrite', store => store.put(entry));
  },

  async getEntry(uuid) {
    return this._tx('entries', 'readonly', store => store.get(uuid));
  },

  async getAllEntries() {
    return this._tx('entries', 'readonly', store => store.getAll());
  },

  async getUnsyncedEntries() {
    const all = await this.getAllEntries();
    return all.filter(e => !e.synced);
  },

  async getEntriesByTeam(teamNumber) {
    const all = await this.getAllEntries();
    return all.filter(e => e.teamNumber === teamNumber);
  },

  async markSynced(uuid) {
    const entry = await this.getEntry(uuid);
    if (entry) {
      entry.synced = true;
      return this.saveEntry(entry);
    }
  },

  async deleteEntry(uuid) {
    return this._tx('entries', 'readwrite', store => store.delete(uuid));
  },

  async getUnsyncedCount() {
    const unsynced = await this.getUnsyncedEntries();
    return unsynced.length;
  },

  // === Teams ===

  async saveTeams(teams) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('teams', 'readwrite');
      const store = tx.objectStore('teams');
      store.clear();
      for (const team of teams) {
        store.put(team);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllTeams() {
    return this._tx('teams', 'readonly', store => store.getAll());
  },

  async getTeam(teamNumber) {
    return this._tx('teams', 'readonly', store => store.get(teamNumber));
  },

  // === Utility ===

  async clearAll() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['entries', 'teams'], 'readwrite');
      tx.objectStore('entries').clear();
      tx.objectStore('teams').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
