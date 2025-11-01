/**
 * API Client for WhatsApp Sender Backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

export interface Profile {
  name: string;
  messages_sent: number;
  phone: string;
}

export interface AnalyticsData {
  sent: number;
  delivered: number;
  failed: number;
  success_rate: number;
  avg_delay: number;
  recent_messages: RecentMessage[];
}

export interface RecentMessage {
  profile: string;
  phone: string;
  status: string;
  timestamp: string;
}

export const api = {
  // Get all profiles
  async getProfiles(): Promise<Profile[]> {
    const response = await fetch(`${API_BASE_URL}/profiles`);
    const data = await response.json();
    return data.profiles;
  },

  // Create new profile
  async createProfile(name: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/profiles/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },

  // Send single message
  async sendMessage(
    profile: string,
    phone: string,
    message: string,
    image?: File | null,
    audio?: File | null
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('profile', profile);
    formData.append('phone', phone);
    formData.append('message', message);
    if (image) formData.append('image', image);
    if (audio) formData.append('audio', audio);

    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // Mass send messages
  async massSend(
    phoneNumbers: string[],
    profilesConfig: Record<string, string>,
    delayConfig: { random: boolean; delay: number },
    profileImages?: { [key: string]: File | null },
    profileAudios?: { [key: string]: File | null }
  ): Promise<{ success: boolean; results: any[]; total: number; sent: number }> {
    const formData = new FormData();
    formData.append('phone_numbers', JSON.stringify(phoneNumbers));
    formData.append('profiles_config', JSON.stringify(profilesConfig));
    formData.append('delay_config', JSON.stringify(delayConfig));

    if (profileImages) {
      Object.entries(profileImages).forEach(([profile, file]) => {
        if (file) formData.append(`image_${profile}`, file);
      });
    }

    if (profileAudios) {
      Object.entries(profileAudios).forEach(([profile, file]) => {
        if (file) formData.append(`audio_${profile}`, file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/mass-send`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // Get analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const response = await fetch(`${API_BASE_URL}/analytics`);
    return response.json();
  },

  // Get profile stats
  async getProfileStats(profileName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/profile/${profileName}/stats`);
    return response.json();
  },

  // Get profile detailed info
  async getProfileInfo(profileName: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/profile/${profileName}/info`);
    return response.json();
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Key management
  async validateKey(key: string): Promise<{ valid: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/keys/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    return response.json();
  },

  async generateKeys(count: number): Promise<{ keys: string[] }> {
    const response = await fetch(`${API_BASE_URL}/keys/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    return response.json();
  },

  async listKeys(): Promise<{ active: string[]; used: string[] }> {
    const response = await fetch(`${API_BASE_URL}/keys/list`);
    return response.json();
  },

  // Check WhatsApp numbers
  async checkNumbers(profileName: string, phoneNumbers: string[]): Promise<{ 
    success: boolean; 
    registered: string[]; 
    unregistered: string[];
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/check-numbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        profile_name: profileName,
        phone_numbers: phoneNumbers 
      }),
    });
    return response.json();
  },
};
