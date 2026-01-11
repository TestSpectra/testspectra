/**
 * Shared Step Service
 * Manages shared step CRUD operations via backend API
 */

import { getApiUrl } from "../lib/config";
import { authService } from "./auth-service";
import { TestStep, TestStepPayload } from "./test-case-service";

export interface SharedStep {
    id: string;
    name: string;
    description?: string;
    stepCount: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface SharedStepDetail extends SharedStep {
    steps: TestStep[];
}

export interface SharedStepRequest {
    name: string;
    description?: string;
    steps: TestStepPayload[];
}

export interface SharedStepsListResponse {
    pagination: {
        limit: number;
        page: number;
        total: number;
        totalPages: number;
    };
    sharedSteps: SharedStep[];
}

export interface SharedStepsQuery {
    page?: number;
    limit?: number;
    search?: string;
}

class SharedStepService {
    private async getHeaders() {
        const token = authService.getAccessToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }

    async getSharedSteps(query: SharedStepsQuery = {}): Promise<SharedStepsListResponse> {
        const params = new URLSearchParams();
        if (query.page) params.append('page', query.page.toString());
        if (query.limit) params.append('limit', query.limit.toString());
        if (query.search) params.append('search', query.search);

        const response = await fetch(
            `${await getApiUrl()}/shared-steps?${params.toString()}`,
            {
                headers: await this.getHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch shared steps: ${response.statusText}`);
        }

        return response.json();
    }

    async getSharedStep(id: string): Promise<SharedStepDetail> {
        const response = await fetch(`${await getApiUrl()}/shared-steps/${id}`, {
            headers: await this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch shared step: ${response.statusText}`);
        }

        return response.json();
    }

    async createSharedStep(data: SharedStepRequest): Promise<SharedStepDetail> {
        const response = await fetch(`${await getApiUrl()}/shared-steps`, {
            method: 'POST',
            headers: await this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const body = await response.json();
            const errorMessage = body.error || 'Failed to create shared step';
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async updateSharedStep(id: string, data: SharedStepRequest): Promise<SharedStepDetail> {
        const response = await fetch(`${await getApiUrl()}/shared-steps/${id}`, {
            method: 'PUT',
            headers: await this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const body = await response.json();
            const errorMessage = body.error || 'Failed to update shared step';
            throw new Error(errorMessage);
        }

        return response.json();
    }

    async deleteSharedStep(id: string): Promise<void> {
        const response = await fetch(`${await getApiUrl()}/shared-steps/${id}`, {
            method: 'DELETE',
            headers: await this.getHeaders(),
        });

        if (!response.ok) {
            const body = await response.json();
            const errorMessage = body.error || 'Failed to delete shared step';
            throw new Error(errorMessage);
        }
    }

    async getSharedStepsMetadata(): Promise<{ id: string; name: string }[]> {
        const response = await fetch(`${await getApiUrl()}/test-steps/metadata`, {
            headers: await this.getHeaders(),
        });

        if (!response.ok) {
            const body = await response.json();
            const errorMessage = body.error || 'Failed to fetch shared steps metadata';
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.sharedSteps || [];
    }
}

export const sharedStepService = new SharedStepService();
