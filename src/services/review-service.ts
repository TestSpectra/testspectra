/**
 * Review Service
 * Manages test case review operations via backend API
 */

import { authService } from "./auth-service";
import { getApiUrl } from "../lib/config";

// Review types
export type ReviewAction = 'approved' | 'needs_revision';
export type ReviewStatus = 'pending' | 'approved' | 'needs_revision';

export interface Review {
  id: string;
  testCaseId: string;
  reviewerId: string;
  reviewerName: string;
  action: ReviewAction;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  action: ReviewAction;
  comment?: string;
}

class ReviewService {
  private static instance: ReviewService;
  private constructor() {}

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = authService.getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Create a new review for a test case
   */
  async createReview(
    testCaseId: string,
    request: CreateReviewRequest
  ): Promise<Review> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}/reviews`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to create review" }));
      throw new Error(error.error || "Failed to create review");
    }

    return response.json();
  }

  /**
   * Get review history for a test case
   */
  async getReviewHistory(testCaseId: string): Promise<Review[]> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}/reviews`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch review history" }));
      throw new Error(error.error || "Failed to fetch review history");
    }

    const data = await response.json();
    return data.reviews || [];
  }

  /**
   * Get last review for a test case (for lazy loading)
   */
  async getLastReview(testCaseId: string): Promise<Review | null> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}/last-review`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch last review" }));
      throw new Error(error.error || "Failed to fetch last review");
    }

    return response.json();
  }

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<ReviewStats> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/reviews/stats`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch review stats" }));
      throw new Error(error.error || "Failed to fetch review stats");
    }

    return response.json();
  }
}

export interface ReviewStats {
  pending: number;
  approved: number;
  needs_revision: number;
}

export const reviewService = ReviewService.getInstance();
