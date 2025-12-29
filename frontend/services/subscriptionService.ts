import api from './api';

export interface Subscription {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired';
  createdAt: string;
}

export const subscriptionService = {
  getMySubscriptions: async (): Promise<Subscription[]> => {
    const response = await api.get('/subscriptions/my');
    return response.data;
  }
};
