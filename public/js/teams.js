// === Teams Module ===
const Teams = {
  _teams: [],
  _loaded: false,

  // Load teams from server API, fall back to IndexedDB cache
  async load() {
    if (this._loaded && this._teams.length > 0) return this._teams;

    try {
      const res = await fetch('/api/teams');
      if (res.ok) {
        const data = await res.json();
        this._teams = data.map(t => ({
          teamNumber: t.team_number,
          teamName: t.team_name,
          school: t.school,
          city: t.city,
          state: t.state,
          country: t.country,
          robotImageUrl: t.robot_image_url || null,
          photoCount: t.photo_count || 0,
          entryCount: t.entry_count || 0,
          latestPhotoUuid: t.latest_photo_uuid || null,
          thumbnailSource: t.thumbnail_source || null,
          opr: t.opr,
          winRate: t.win_rate,
          composite: t.composite,
          tier: t.tier,
          record: t.record,
          sourceEvent: t.source_event,
          rankAtEvent: t.rank_at_event,
          rookieYear: t.rookie_year,
          scoutingNotes: t.scouting_notes,
          favorite: !!t.favorite,
        }));
        // Cache in IndexedDB for offline use
        await DB.saveTeams(this._teams);
        this._loaded = true;
        return this._teams;
      }
    } catch (e) {
      // Network unavailable, load from cache
    }

    // Fallback to IndexedDB
    this._teams = await DB.getAllTeams();
    this._loaded = this._teams.length > 0;
    return this._teams;
  },

  // Search teams by number or name
  search(query) {
    if (!query) return this._teams;
    const q = String(query).toLowerCase();
    return this._teams.filter(t =>
      String(t.teamNumber).includes(q) ||
      (t.teamName && t.teamName.toLowerCase().includes(q))
    );
  },

  // Get a single team
  get(teamNumber) {
    return this._teams.find(t => t.teamNumber === teamNumber);
  },

  // Toggle favorite flag on the server and update local cache
  async setFavorite(teamNumber, favorite) {
    const res = await fetch(`/api/teams/${teamNumber}/favorite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite: !!favorite }),
    });
    if (!res.ok) throw new Error('Failed to update favorite');
    const team = this.get(teamNumber);
    if (team) team.favorite = !!favorite;
    try { await DB.saveTeams(this._teams); } catch (e) {}
    return !!favorite;
  },
};
