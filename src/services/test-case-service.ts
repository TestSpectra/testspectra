/**
 * Test Case Service
 * Manages test case CRUD operations via backend API
 */

import { authService } from './auth-service';

export interface TestStep {
  stepOrder: number;
  action: string;
  target?: string;
  value?: string;
  description?: string;
}

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: 'passed' | 'failed' | 'pending';
  pageLoadAvg?: string;
  lastRun?: string;
  expectedOutcome?: string;
  tags?: string[];
  steps?: TestStep[];
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestCaseSummary {
  id: string;
  title: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: 'passed' | 'failed' | 'pending';
  pageLoadAvg?: string;
  lastRun?: string;
  updatedAt: string;
  createdByName?: string;
}

export interface ListTestCasesResponse {
  testCases: TestCaseSummary[];
  total: number;
  page: number;
  pageSize: number;
  availableSuites: string[];
}

export interface ListTestCasesParams {
  searchQuery?: string;
  suiteFilter?: string;
  priorityFilter?: string;
  automationFilter?: string;
  statusFilter?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTestCasePayload {
  title: string;
  description?: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  expectedOutcome?: string;
  tags?: string[];
  steps?: TestStep[];
}

export interface UpdateTestCasePayload {
  title?: string;
  description?: string;
  suite?: string;
  priority?: string;
  caseType?: string;
  automation?: string;
  expectedOutcome?: string;
  tags?: string[];
}

class TestCaseService {
  private static instance: TestCaseService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  static getInstance(): TestCaseService {
    if (!TestCaseService.instance) {
      TestCaseService.instance = new TestCaseService();
    }
    return TestCaseService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = authService.getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * List test cases with filters and pagination
   */
  async listTestCases(params: ListTestCasesParams = {}): Promise<ListTestCasesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.searchQuery) queryParams.append('searchQuery', params.searchQuery);
    if (params.suiteFilter) queryParams.append('suiteFilter', params.suiteFilter);
    if (params.priorityFilter) queryParams.append('priorityFilter', params.priorityFilter);
    if (params.automationFilter) queryParams.append('automationFilter', params.automationFilter);
    if (params.statusFilter) queryParams.append('statusFilter', params.statusFilter);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const url = `${this.apiUrl}/test-cases${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch test cases' }));
      throw new Error(error.error || 'Failed to fetch test cases');
    }

    return response.json();
  }

  /**
   * Get a single test case by ID
   */
  async getTestCase(testCaseId: string): Promise<TestCase> {
    const response = await fetch(`${this.apiUrl}/test-cases/${testCaseId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch test case' }));
      throw new Error(error.error || 'Failed to fetch test case');
    }

    return response.json();
  }

  /**
   * Create a new test case
   */
  async createTestCase(payload: CreateTestCasePayload): Promise<TestCase> {
    const response = await fetch(`${this.apiUrl}/test-cases`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create test case' }));
      throw new Error(error.error || 'Failed to create test case');
    }

    return response.json();
  }

  /**
   * Update an existing test case
   */
  async updateTestCase(testCaseId: string, payload: UpdateTestCasePayload): Promise<TestCase> {
    const response = await fetch(`${this.apiUrl}/test-cases/${testCaseId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update test case' }));
      throw new Error(error.error || 'Failed to update test case');
    }

    return response.json();
  }

  /**
   * Update test case steps
   */
  async updateTestSteps(testCaseId: string, steps: TestStep[]): Promise<TestCase> {
    const response = await fetch(`${this.apiUrl}/test-cases/${testCaseId}/steps`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ steps }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update test steps' }));
      throw new Error(error.error || 'Failed to update test steps');
    }

    return response.json();
  }

  /**
   * Delete a test case
   */
  async deleteTestCase(testCaseId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.apiUrl}/test-cases/${testCaseId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete test case' }));
      throw new Error(error.error || 'Failed to delete test case');
    }

    return response.json();
  }

  /**
   * Bulk delete test cases
   */
  async bulkDeleteTestCases(testCaseIds: string[]): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const response = await fetch(`${this.apiUrl}/test-cases/bulk-delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ testCaseIds }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete test cases' }));
      throw new Error(error.error || 'Failed to delete test cases');
    }

    return response.json();
  }
}

export const testCaseService = TestCaseService.getInstance();
