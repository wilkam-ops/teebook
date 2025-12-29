import api from './api';

export interface Competition {
  id: string;
  name: string;
  description?: string;
  date: string;
  maxParticipants: number;
  participants: string[];
  entryFee: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export const competitionService = {
  getCompetitions: async (): Promise<Competition[]> => {
    const response = await api.get('/competitions');
    return response.data;
  },

  registerForCompetition: async (competitionId: string): Promise<void> => {
    await api.post(`/competitions/${competitionId}/register`);
  },

  unregisterFromCompetition: async (competitionId: string): Promise<void> => {
    await api.delete(`/competitions/${competitionId}/unregister`);
  }
};
