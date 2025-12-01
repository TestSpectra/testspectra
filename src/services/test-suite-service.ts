import { authService } from './auth-service';
import { getApiUrl } from '../lib/config';

export interface TestSuite {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    createdBy: string;
    testCaseCount: number;
    automatedCount: number;
    lastRun: string;
    passRate: number;
}

export interface CreateTestSuitePayload {
    name: string;
    description?: string;
}

export interface UpdateTestSuitePayload {
    name: string;
    description?: string;
}

class TestSuiteService {
    private getHeaders() {
        const token = authService.getAccessToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    async getAllTestSuites(): Promise<TestSuite[]> {
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/test-suites`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch test suites');
        }

        const data = await response.json();
        return data.suites;
    }

    async createTestSuite(payload: CreateTestSuitePayload): Promise<TestSuite> {
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/test-suites`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create test suite');
        }

        return response.json();
    }

    async updateTestSuite(id: string, payload: UpdateTestSuitePayload): Promise<TestSuite> {
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/test-suites/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update test suite');
        }

        return response.json();
    }

    async deleteTestSuite(id: string): Promise<void> {
        const apiUrl = await getApiUrl();
        const response = await fetch(`${apiUrl}/test-suites/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete test suite');
        }
    }
}

export const testSuiteService = new TestSuiteService();
