/**
 * Test Case Service
 * Manages test case CRUD operations via backend API
 */

import { authService } from "./auth-service";
import { getApiUrl } from "../lib/config";

export type ActionType =
  | "navigate"
  | "click"
  | "type"
  | "clear"
  | "select"
  | "scroll"
  | "swipe"
  | "wait"
  | "waitForElement"
  | "pressKey"
  | "longPress"
  | "doubleClick"
  | "hover"
  | "dragDrop"
  | "back"
  | "refresh";

export type AssertionType =
  | "elementDisplayed"
  | "elementNotDisplayed"
  | "elementExists"
  | "elementClickable"
  | "elementInViewport"
  | "textEquals"
  | "textContains"
  | "valueEquals"
  | "valueContains"
  | "urlEquals"
  | "urlContains"
  | "titleEquals"
  | "titleContains"
  | "hasClass"
  | "hasAttribute"
  | "isEnabled"
  | "isDisabled"
  | "isSelected";

export interface ActionParams {
  selector?: string;
  value?: string;
  text?: string;
  url?: string;
  timeout?: string;
  direction?: "up" | "down" | "left" | "right";
  targetSelector?: string;
  key?: string;
  duration?: string;
}

export interface Assertion {
  id?: string;
  assertionType: AssertionType;
  selector?: string;
  expectedValue?: string;
  attributeName?: string;
  attributeValue?: string;
}

interface BaseTestStep {
  id: string;
  stepOrder: number;
}

export interface RegularTestStep extends BaseTestStep {
  stepType: "regular";
  actionType: ActionType;
  actionParams: ActionParams;
  assertions: Assertion[];
  customExpectedResult?: string | null;
}

export interface SharedTestStep extends BaseTestStep {
  stepType: "shared_reference";
  sharedStepId: string;
  sharedStepName: string;
  sharedStepDescription?: string;
  steps: TestStep[]; // Currently Shared step only support regular steps in BE implementation
}

export type TestStep = SharedTestStep | RegularTestStep;

// Metadata for test steps (actions/assertions/options) provided by backend
export interface ActionDefinition {
  value: string;
  label: string;
  platform: string; // "both" | "web" | "mobile"
  icon?: string;
}

export interface AssertionDefinition {
  value: string;
  label: string;
  needsSelector: boolean;
  needsValue: boolean;
  needsAttribute: boolean;
}

export interface KeyOption {
  value: string;
  label: string;
}

export interface TestStepMetadataResponse {
  actions: ActionDefinition[];
  assertions: AssertionDefinition[];
  assertionsByAction: Record<string, string[]>;
  keyOptions: KeyOption[];
  sharedSteps: Array<{
    id: string;
    name: string;
  }>;
}

export type ReviewStatus =
  | "pending"
  | "pending_revision"
  | "approved"
  | "needs_revision";

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: "passed" | "failed" | "pending";
  pageLoadAvg?: string;
  lastRun?: string;
  preCondition: string | null;
  postCondition: string | null;
  tags?: string[];
  steps?: TestStep[];
  executionOrder: number;
  createdById?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewStatus: ReviewStatus;
}

export interface TestCaseSummary {
  id: string;
  title: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  lastStatus: "passed" | "failed" | "pending";
  pageLoadAvg?: string;
  lastRun?: string;
  executionOrder: number;
  updatedAt: string;
  createdByName?: string;
  reviewStatus: ReviewStatus;
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
  reviewStatusFilter?: string;
  page?: number;
  pageSize?: number;
}

/**
 * The teststep id for Edit action currently not needed to send in payload since BE will remove the old steps and creates new
 */
export type TestStepPayload =
  | (Omit<RegularTestStep, "id"> & { id?: string })
  | {
      stepType: "shared_reference";
      stepOrder: number;
      sharedStepId: string;
    };

export interface CreateTestCasePayload {
  title: string;
  description?: string;
  suite: string;
  priority: string;
  caseType: string;
  automation: string;
  preCondition?: string;
  postCondition?: string;
  tags?: string[];
  steps?: TestStepPayload[];
}

export interface UpdateTestCasePayload extends CreateTestCasePayload {}

export interface ReorderPayload {
  movedIds: string[];
  prevId?: string | null;
  nextId?: string | null;
}

class TestCaseService {
  private static instance: TestCaseService;
  private constructor() {}

  static getInstance(): TestCaseService {
    if (!TestCaseService.instance) {
      TestCaseService.instance = new TestCaseService();
    }
    return TestCaseService.instance;
  }

  private getAuthHeaders(): HeadersInit {
    const token = authService.getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * List test cases with filters and pagination
   */
  async listTestCases(
    params: ListTestCasesParams = {}
  ): Promise<ListTestCasesResponse> {
    const apiUrl = await getApiUrl();
    const queryParams = new URLSearchParams();

    if (params.searchQuery)
      queryParams.append("searchQuery", params.searchQuery);
    if (params.suiteFilter)
      queryParams.append("suiteFilter", params.suiteFilter);
    if (params.priorityFilter)
      queryParams.append("priorityFilter", params.priorityFilter);
    if (params.automationFilter)
      queryParams.append("automationFilter", params.automationFilter);
    if (params.statusFilter)
      queryParams.append("statusFilter", params.statusFilter);
    if (params.reviewStatusFilter)
      queryParams.append("reviewStatusFilter", params.reviewStatusFilter);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.pageSize)
      queryParams.append("pageSize", params.pageSize.toString());

    const url = `${apiUrl}/test-cases${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch test cases" }));
      throw new Error(error.error || "Failed to fetch test cases");
    }

    return response.json();
  }

  /**
   * Fetch canonical metadata for test steps (actions, assertions, key options).
   * This allows the frontend to avoid hardcoding these values.
   */
  async getTestStepMetadata(): Promise<TestStepMetadataResponse> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-steps/metadata`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch test step metadata" }));
      throw new Error(error.error || "Failed to fetch test step metadata");
    }

    return response.json();
  }

  /**
   * Get a single test case by ID
   */
  async getTestCase(testCaseId: string): Promise<TestCase> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch test case" }));
      throw new Error(error.error || "Failed to fetch test case");
    }

    return response.json();
  }

  /**
   * Create a new test case
   */
  async createTestCase(payload: CreateTestCasePayload): Promise<TestCase> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to create test case" }));
      throw new Error(error.error || "Failed to create test case");
    }

    return response.json();
  }

  /**
   * Update an existing test case
   */
  async updateTestCase(
    testCaseId: string,
    payload: UpdateTestCasePayload
  ): Promise<TestCase> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to update test case" }));
      throw new Error(error.error || "Failed to update test case");
    }

    return response.json();
  }

  /**
   * Update test case steps
   */
  async updateTestSteps(
    testCaseId: string,
    steps: TestStepPayload[]
  ): Promise<TestCase> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-steps/${testCaseId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ steps }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to update test steps" }));
      throw new Error(error.error || "Failed to update test steps");
    }

    return response.json();
  }

  /**
   * Delete a test case
   */
  async deleteTestCase(
    testCaseId: string
  ): Promise<{ success: boolean; message: string }> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/${testCaseId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to delete test case" }));
      throw new Error(error.error || "Failed to delete test case");
    }

    return response.json();
  }

  /**
   * Bulk delete test cases
   */
  async bulkDeleteTestCases(
    testCaseIds: string[]
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/bulk-delete`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ testCaseIds }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to delete test cases" }));
      throw new Error(error.error || "Failed to delete test cases");
    }

    return response.json();
  }

  /**
   * Duplicate a test case
   */
  async duplicateTestCase(testCaseId: string): Promise<TestCase> {
    const apiUrl = await getApiUrl();
    const response = await fetch(
      `${apiUrl}/test-cases/${testCaseId}/duplicate`,
      {
        method: "POST",
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to duplicate test case" }));
      throw new Error(error.error || "Failed to duplicate test case");
    }

    return response.json();
  }

  /**
   * Reorder one or more test cases as a block using global execution order.
   * Backend computes the exact executionOrder values based on prev/next.
   */
  async reorderTestCases(
    payload: ReorderPayload
  ): Promise<{ success: boolean }> {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/test-cases/reorder`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to reorder test cases" }));
      throw new Error(error.error || "Failed to reorder test cases");
    }

    return response.json();
  }
}

export const testCaseService = TestCaseService.getInstance();
