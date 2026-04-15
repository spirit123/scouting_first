// === IndexedDB Wrapper ===
const DB = {
  _db: null,
  DB_NAME: 'ftc-scout',
  DB_VERSION: 1,

  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'uuid' });
          photoStore.createIndex('teamNumber', 'teamNumber', { unique: false });
          photoStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('teams')) {
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

  // Generic transaction helper
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

  // === Photos ===

  async savePhoto(photo) {
    return this._tx('photos', 'readwrite', store => store.put(photo));
  },

  async getPhoto(uuid) {
    return this._tx('photos', 'readonly', store => store.get(uuid));
  },

  async getAllPhotos() {
    return this._tx('photos', 'readonly', store => store.getAll());
  },

  async getUnsyncedPhotos() {
    const all = await this.getAllPhotos();
    return all.filter(p => !p.synced);
  },

  async getPhotosByTeam(teamNumber) {
    const all = await this.getAllPhotos();
    return all.filter(p => p.teamNumber === teamNumber);
  },

  async markSynced(uuid) {
    const photo = await this.getPhoto(uuid);
    if (photo) {
      photo.synced = true;
      // Keep a small thumbnail but free the full image blob to save space
      return this.savePhoto(photo);
    }
  },

  async deletePhoto(uuid) {
    return this._tx('photos', 'readwrite', store => store.delete(uuid));
  },

  async getUnsyncedCount() {
    const unsynced = await this.getUnsyncedPhotos();
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
      const tx = db.transaction(['photos', 'teams'], 'readwrite');
      tx.objectStore('photos').clear();
      tx.objectStore('teams').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
