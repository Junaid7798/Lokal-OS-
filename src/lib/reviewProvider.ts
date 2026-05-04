import { GoogleReview } from '../types';

export interface ReviewProvider {
  fetchReviews: (businessId: string) => Promise<GoogleReview[]>;
  postReply: (
    reviewId: string,
    replyText: string
  ) => Promise<{ success: boolean; error?: string }>;
}

// Placeholder implementation
export class GoogleBusinessProfileProvider implements ReviewProvider {
  async fetchReviews(businessId: string): Promise<GoogleReview[]> {
    console.log('Fetching reviews for', businessId);
    return [];
  }

  async postReply(
    reviewId: string,
    replyText: string
  ): Promise<{ success: boolean; error?: string }> {
    console.log('Posting reply for', reviewId, replyText);
    return { success: true };
  }
}
