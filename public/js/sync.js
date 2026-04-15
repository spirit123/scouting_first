// === Sync Engine ===
const Sync = {
  BATCH_SIZE: 5,
  _syncing: false,
  _onProgress: null,

  getServerURL() {
    const ip = localStorage.getItem('serverIP') || window.location.hostname;
    const port = localStorage.getItem('serverPort') || window.location.port || '3000';
    return `http://${ip}:${port}`;
  },

  // Check if server is reachable
  async checkConnection() {
    try {
      const res = await fetch(`${this.getServerURL()}/api/status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        return { online: true, ...data };
      }
    } catch (e) {
      // Offline
    }
    return { online: false };
  },

  // Sync all unsynced photos to server
  async syncAll(onProgress) {
    if (this._syncing) throw new Error('Sync already in progress');
    this._syncing = true;
    this._onProgress = onProgress;

    const results = { synced: 0, duplicates: 0, errors: 0, total: 0 };

    try {
      const unsynced = await DB.getUnsyncedPhotos();
      results.total = unsynced.length;

      if (unsynced.length === 0) {
        this._syncing = false;
        return results;
      }

      // Process in batches
      for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
        const batch = unsynced.slice(i, i + this.BATCH_SIZE);
        const batchResult = await this._syncBatch(batch);

        results.synced += batchResult.synced.length;
        results.duplicates += batchResult.duplicates.length;
        results.errors += batchResult.errors.length;

        // Mark synced/duplicate photos
        for (const uuid of [...batchResult.synced, ...batchResult.duplicates]) {
          await DB.markSynced(uuid);
        }

        // Report progress
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
      this._onProgress = null;
    }

    return results;
  },

  // Sync a single batch of photos
  async _syncBatch(photos) {
    const formData = new FormData();

    // Build metadata array
    const metadata = photos.map(p => ({
      uuid: p.uuid,
      teamNumber: p.teamNumber,
      scoutName: p.scoutName,
      notes: p.notes,
      takenAt: p.takenAt,
    }));

    formData.append('metadata', JSON.stringify(metadata));

    // Append photo files
    for (const p of photos) {
      if (p.imageBlob) {
        formData.append(`photo_${p.uuid}`, p.imageBlob, `${p.uuid}.jpg`);
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
