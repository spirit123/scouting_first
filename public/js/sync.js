// === Sync Engine ===
const Sync = {
  BATCH_SIZE: 5,
  _syncing: false,

  getServerURL() {
    const ip = localStorage.getItem('serverIP') || window.location.hostname;
    const port = localStorage.getItem('serverPort') || window.location.port || '3000';
    return `http://${ip}:${port}`;
  },

  async checkConnection() {
    try {
      const res = await fetch(`${this.getServerURL()}/api/status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
    } catch (e) {}
    return { online: false };
  },

  async syncAll(onProgress) {
    if (this._syncing) throw new Error('Sync already in progress');
    this._syncing = true;

    const results = { synced: 0, duplicates: 0, errors: 0, total: 0 };

    try {
      const unsynced = await DB.getUnsyncedEntries();
      results.total = unsynced.length;

      if (unsynced.length === 0) {
        this._syncing = false;
        return results;
      }

      for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
        const batch = unsynced.slice(i, i + this.BATCH_SIZE);
        const batchResult = await this._syncBatch(batch);

        results.synced += batchResult.synced.length;
        results.duplicates += batchResult.duplicates.length;
        results.errors += batchResult.errors.length;

        for (const uuid of [...batchResult.synced, ...batchResult.duplicates]) {
          await DB.markSynced(uuid);
        }

        if (onProgress) {
          onProgress({
            done: Math.min(i + this.BATCH_SIZE, unsynced.length),
            total: unsynced.length,
            ...results,
          });
        }
      }
    } finally {
      this._syncing = false;
    }

    return results;
  },

  async _syncBatch(entries) {
    const formData = new FormData();

    const metadata = entries.map(e => ({
      uuid: e.uuid,
      teamNumber: e.teamNumber,
      role: e.role,
      scoutName: e.scoutName,
      notes: e.notes,
      createdAt: e.createdAt,
      passesBumps: e.passesBumps || null,
      underTrenches: e.underTrenches || null,
    }));

    formData.append('metadata', JSON.stringify(metadata));

    // Append photo files only for entries that have one
    for (const e of entries) {
      if (e.imageBlob) {
        formData.append(`photo_${e.uuid}`, e.imageBlob, `${e.uuid}.jpg`);
      }
    }

    const res = await fetch(`${this.getServerURL()}/api/sync`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Sync failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  },

  get isSyncing() {
    return this._syncing;
  },
};
