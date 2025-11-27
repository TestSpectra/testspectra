/**
 * Service for fetching action and assertion definitions from the backend.
 * Falls back to hardcoded defaults if API is unavailable.
 */

import { authService } from './auth-service';
import { getApiUrl } from '../lib/config';

export interface ActionDefinition {
  id: string;
  actionKey: string;
  label: string;
  category: string;
  platform: 'web' | 'mobile' | 'both';
  description?: string;
  paramSchema: Record<string, any>;
  isSystem: boolean;
  displayOrder: number;
}

export interface AssertionDefinition {
  id: string;
  assertionKey: string;
  label: string;
  category: string;
  description?: string;
  paramSchema: Record<string, any>;
  validForActions: string[];
  isSystem: boolean;
  displayOrder: number;
}

export interface DefinitionsResponse {
  actions: ActionDefinition[];
  assertions: AssertionDefinition[];
}

// Cache for definitions
let definitionsCache: DefinitionsResponse | null = null;

/**
 * Fetch all action and assertion definitions from the backend
 */
export async function fetchDefinitions(): Promise<DefinitionsResponse> {
  // Return cached if available
  if (definitionsCache) {
    return definitionsCache;
  }

  try {
    const apiUrl = await getApiUrl();
    const token = authService.getAccessToken();
    const response = await fetch(`${apiUrl}/definitions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      definitionsCache = data;
      return data;
    }
  } catch (error) {
    console.warn('Failed to fetch definitions from API, using defaults:', error);
  }

  // Return default definitions if API fails
  return getDefaultDefinitions();
}

/**
 * Clear the definitions cache (useful when user logs out or definitions are updated)
 */
export function clearDefinitionsCache(): void {
  definitionsCache = null;
}

/**
 * Get assertions that are valid for a specific action type
 */
export function getAssertionsForAction(
  assertions: AssertionDefinition[],
  actionKey: string
): AssertionDefinition[] {
  return assertions.filter(assertion => {
    // If validForActions is empty, assertion is valid for all actions
    if (assertion.validForActions.length === 0) {
      return true;
    }
    return assertion.validForActions.includes(actionKey);
  });
}

/**
 * Default definitions (fallback when API is unavailable)
 */
function getDefaultDefinitions(): DefinitionsResponse {
  return {
    actions: [
      { id: '1', actionKey: 'navigate', label: 'Navigate to URL', category: 'navigation', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 1 },
      { id: '2', actionKey: 'click', label: 'Click / Tap', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 10 },
      { id: '3', actionKey: 'type', label: 'Type Text', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 11 },
      { id: '4', actionKey: 'clear', label: 'Clear Input', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 12 },
      { id: '5', actionKey: 'select', label: 'Select Option', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 13 },
      { id: '6', actionKey: 'scroll', label: 'Scroll', category: 'scroll', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 20 },
      { id: '7', actionKey: 'swipe', label: 'Swipe', category: 'scroll', platform: 'mobile', paramSchema: {}, isSystem: true, displayOrder: 21 },
      { id: '8', actionKey: 'wait', label: 'Wait (Duration)', category: 'wait', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 30 },
      { id: '9', actionKey: 'waitForElement', label: 'Wait for Element', category: 'wait', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 31 },
      { id: '10', actionKey: 'pressKey', label: 'Press Key', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 18 },
      { id: '11', actionKey: 'longPress', label: 'Long Press / Hold', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 16 },
      { id: '12', actionKey: 'doubleClick', label: 'Double Click / Tap', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 15 },
      { id: '13', actionKey: 'hover', label: 'Hover', category: 'interaction', platform: 'web', paramSchema: {}, isSystem: true, displayOrder: 14 },
      { id: '14', actionKey: 'dragDrop', label: 'Drag and Drop', category: 'interaction', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 17 },
      { id: '15', actionKey: 'back', label: 'Go Back', category: 'navigation', platform: 'both', paramSchema: {}, isSystem: true, displayOrder: 2 },
      { id: '16', actionKey: 'refresh', label: 'Refresh Page', category: 'navigation', platform: 'web', paramSchema: {}, isSystem: true, displayOrder: 3 },
    ],
    assertions: [
      { id: '1', assertionKey: 'elementVisible', label: 'Element Visible', category: 'element', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 1 },
      { id: '2', assertionKey: 'elementNotVisible', label: 'Element Not Visible', category: 'element', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 2 },
      { id: '3', assertionKey: 'elementExists', label: 'Element Exists', category: 'element', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 3 },
      { id: '4', assertionKey: 'elementEnabled', label: 'Element Enabled', category: 'element', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 4 },
      { id: '5', assertionKey: 'elementDisabled', label: 'Element Disabled', category: 'element', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 5 },
      { id: '6', assertionKey: 'textContains', label: 'Text Contains', category: 'text', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 10 },
      { id: '7', assertionKey: 'textEquals', label: 'Text Equals', category: 'text', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 11 },
      { id: '8', assertionKey: 'urlContains', label: 'URL Contains', category: 'url', paramSchema: {}, validForActions: ['navigate', 'click', 'back'], isSystem: true, displayOrder: 20 },
      { id: '9', assertionKey: 'urlEquals', label: 'URL Equals', category: 'url', paramSchema: {}, validForActions: ['navigate', 'click', 'back'], isSystem: true, displayOrder: 21 },
      { id: '10', assertionKey: 'valueEquals', label: 'Value Equals', category: 'value', paramSchema: {}, validForActions: ['type', 'clear', 'select'], isSystem: true, displayOrder: 30 },
      { id: '11', assertionKey: 'valueContains', label: 'Value Contains', category: 'value', paramSchema: {}, validForActions: ['type', 'clear', 'select'], isSystem: true, displayOrder: 31 },
      { id: '12', assertionKey: 'attributeEquals', label: 'Attribute Equals', category: 'attribute', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 40 },
      { id: '13', assertionKey: 'attributeContains', label: 'Attribute Contains', category: 'attribute', paramSchema: {}, validForActions: [], isSystem: true, displayOrder: 41 },
      { id: '14', assertionKey: 'pageLoaded', label: 'Page Loaded', category: 'state', paramSchema: {}, validForActions: ['navigate', 'click', 'back', 'refresh'], isSystem: true, displayOrder: 60 },
    ],
  };
}

/**
 * Convert action definitions to the format used by TestCaseForm
 * This provides backward compatibility with the existing hardcoded format
 */
export function convertToLegacyActionFormat(actions: ActionDefinition[]): { value: string; label: string; platform: 'both' | 'web' | 'mobile' }[] {
  return actions.map(action => ({
    value: action.actionKey,
    label: action.label,
    platform: action.platform,
  }));
}

/**
 * Convert assertion definitions to the format used by TestCaseForm
 */
export function convertToLegacyAssertionFormat(assertions: AssertionDefinition[]): { 
  value: string; 
  label: string; 
  needsSelector: boolean; 
  needsValue: boolean; 
  needsAttribute: boolean;
}[] {
  return assertions.map(assertion => {
    // Determine what fields are needed based on paramSchema or category
    const needsSelector = ['element', 'text', 'value', 'attribute'].includes(assertion.category);
    const needsValue = ['text', 'url', 'value'].includes(assertion.category);
    const needsAttribute = assertion.category === 'attribute';
    
    return {
      value: assertion.assertionKey,
      label: assertion.label,
      needsSelector,
      needsValue,
      needsAttribute,
    };
  });
}

/**
 * Build assertions by action map from assertion definitions
 */
export function buildAssertionsByAction(
  actions: ActionDefinition[],
  assertions: AssertionDefinition[]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  for (const action of actions) {
    const validAssertions = assertions.filter(assertion => {
      if (assertion.validForActions.length === 0) {
        return true; // Valid for all actions
      }
      return assertion.validForActions.includes(action.actionKey);
    });
    
    result[action.actionKey] = validAssertions.map(a => a.assertionKey);
  }
  
  return result;
}
