import { Song, QueueItem, RockolaConfig } from '../types/rockola';

export interface PartyGuest {
  id: string;
  name: string;
  device: string;
  joinedAt: number;
  requestCount: number;
}

export interface GroupSongRequest {
  id: string;
  song: Song;
  requestedBy: string;
  requestedByDevice: string;
  addedAt: number;
  approved: boolean;
}

class PartyModeService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: string, payload: any) => void> = new Set();
  private guests: PartyGuest[] = [];
  private groupRequests: GroupSongRequest[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('rockola-party-room-sync');
        this.channel.onmessage = (e) => {
          this.handleIncomingEvent(e.data?.event, e.data?.payload);
        };
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'rockola_party_group_requests') {
          this.loadRequestsFromStorage();
          this.notifyListeners('requests_updated', this.groupRequests);
        }
      });
    }

    this.loadRequestsFromStorage();
  }

  private loadRequestsFromStorage() {
    try {
      const saved = localStorage.getItem('rockola_party_group_requests');
      if (saved) {
        this.groupRequests = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveRequestsToStorage() {
    try {
      localStorage.setItem('rockola_party_group_requests', JSON.stringify(this.groupRequests));
    } catch (e) {}
  }

  public subscribe(callback: (event: string, payload: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(event: string, payload: any) {
    this.listeners.forEach(cb => cb(event, payload));
  }

  private broadcast(event: string, payload: any) {
    this.notifyListeners(event, payload);
    if (this.channel) {
      try {
        this.channel.postMessage({ event, payload });
      } catch (e) {}
    }
  }

  private handleIncomingEvent(event: string, payload: any) {
    if (event === 'guest_joined') {
      const existing = this.guests.find(g => g.id === payload.id);
      if (!existing) {
        this.guests.push(payload);
      }
      this.notifyListeners('guests_updated', this.guests);
    } else if (event === 'song_requested') {
      this.groupRequests.push(payload);
      this.saveRequestsToStorage();
      this.notifyListeners('requests_updated', this.groupRequests);
    } else if (event === 'request_approved' || event === 'request_rejected') {
      this.groupRequests = this.groupRequests.filter(r => r.id !== payload.id);
      this.saveRequestsToStorage();
      this.notifyListeners('requests_updated', this.groupRequests);
    }
  }

  public getConnectedGuests(): PartyGuest[] {
    return this.guests;
  }

  public getPendingRequests(): GroupSongRequest[] {
    return this.groupRequests;
  }

  public joinPartyRoom(roomCode: string, guestName: string, deviceName: string = 'Mobile Web'): PartyGuest {
    const guest: PartyGuest = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: guestName || 'Party Guest',
      device: deviceName,
      joinedAt: Date.now(),
      requestCount: 0
    };

    this.guests.push(guest);
    this.broadcast('guest_joined', guest);
    return guest;
  }

  public submitGroupRequest(
    song: Song,
    guestName: string,
    guestId: string,
    config: RockolaConfig
  ): { success: boolean; message: string; request?: GroupSongRequest } {
    // Check blocked artists / songs
    if (config.partyBlockedArtists?.includes(song.artist)) {
      return { success: false, message: `🚫 Artist "${song.artist}" is blocked by Party Host.` };
    }

    if (config.partyBlockedSongs?.includes(song.id) || config.partyBlockedSongs?.includes(song.code)) {
      return { success: false, message: `🚫 Song "${song.title}" is on the Party Blocklist.` };
    }

    // Check request limit
    const guest = this.guests.find(g => g.id === guestId);
    const guestRequests = this.groupRequests.filter(r => r.requestedBy === guestName);
    const maxLimit = config.partyMaxRequestsPerGuest || 3;

    if (guestRequests.length >= maxLimit) {
      return {
        success: false,
        message: `⚠️ Request limit reached (${maxLimit} max active songs per guest). Wait for your songs to play!`
      };
    }

    const requiresApproval = config.partyRequireApproval ?? false;

    const request: GroupSongRequest = {
      id: 'req_' + Math.random().toString(36).substring(2, 9),
      song,
      requestedBy: guestName || 'Party Guest',
      requestedByDevice: guest?.device || 'Mobile Web',
      addedAt: Date.now(),
      approved: !requiresApproval
    };

    if (guest) {
      guest.requestCount++;
    }

    this.groupRequests.push(request);
    this.saveRequestsToStorage();
    this.broadcast('song_requested', request);

    return {
      success: true,
      message: requiresApproval 
        ? '🎉 Request sent to Party Host for approval!' 
        : '🎉 Song added directly to Group Queue!',
      request
    };
  }

  public approveRequest(requestId: string): GroupSongRequest | null {
    const req = this.groupRequests.find(r => r.id === requestId);
    if (!req) return null;

    req.approved = true;
    this.saveRequestsToStorage();
    this.broadcast('request_approved', req);
    return req;
  }

  public rejectRequest(requestId: string): boolean {
    const idx = this.groupRequests.findIndex(r => r.id === requestId);
    if (idx === -1) return false;

    const req = this.groupRequests[idx];
    this.groupRequests.splice(idx, 1);
    this.saveRequestsToStorage();
    this.broadcast('request_rejected', req);
    return true;
  }

  public clearAllRequests() {
    this.groupRequests = [];
    this.saveRequestsToStorage();
    this.broadcast('requests_cleared', null);
  }
}

export const partyModeService = new PartyModeService();
