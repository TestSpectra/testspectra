/**
 * Script untuk membuat test case lengkap dengan semua jenis step dan assertion
 * Run: node create-full-test-case.js
 */

const API_URL = "http://localhost:50051/api";

// Login untuk mendapatkan token
async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@testspectra.com",
      password: "admin123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.accessToken;
}

// Create test case dengan full steps
async function createFullTestCase(token) {
  const testCase = {
    title: "Complete E2E Test - All Step Types & Assertions",
    suite: "E2E Testing",
    priority: "High",
    caseType: "Positive",
    automation: "Automated",
    preCondition: "<p>User is logged out</p><p>Browser is in clean state</p>",
    postCondition: "<p>User is logged in</p><p>Dashboard is displayed</p>",
    steps: [
      // Step 1: Navigate - ALL assertions for navigate
      {
        stepOrder: 1,
        actionType: "navigate",
        actionParams: {
          url: "https://example.com/login",
        },
        assertions: [
          {
            assertionType: "urlContains",
            expectedValue: "/login",
          },
          {
            assertionType: "urlEquals",
            expectedValue: "https://example.com/login",
          },
          {
            assertionType: "titleContains",
            expectedValue: "Login",
          },
          {
            assertionType: "titleEquals",
            expectedValue: "Login - Example App",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#login-form",
          },
          {
            assertionType: "elementExists",
            selector: "#login-form",
          },
        ],
        customExpectedResult: "<p>Login page should be displayed with correct URL and title</p>",
      },
      // Step 2: Type email - ALL assertions for type
      {
        stepOrder: 2,
        actionType: "type",
        actionParams: {
          selector: "#email",
          value: "user@example.com",
        },
        assertions: [
          {
            assertionType: "valueEquals",
            selector: "#email",
            expectedValue: "user@example.com",
          },
          {
            assertionType: "valueContains",
            selector: "#email",
            expectedValue: "@example.com",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#email",
          },
          {
            assertionType: "hasClass",
            selector: "#email",
            expectedValue: "form-control",
          },
          {
            assertionType: "isEnabled",
            selector: "#email",
          },
          {
            assertionType: "textContains",
            selector: "label[for='email']",
            expectedValue: "Email",
          },
        ],
        customExpectedResult: null,
      },
      // Step 3: Type password
      {
        stepOrder: 3,
        actionType: "type",
        actionParams: {
          selector: "#password",
          value: "SecurePass123!",
        },
        assertions: [
          {
            assertionType: "valueEquals",
            selector: "#password",
            expectedValue: "SecurePass123!",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#password",
          },
        ],
        customExpectedResult: null,
      },
      // Step 4: Click submit button - ALL assertions for click
      {
        stepOrder: 4,
        actionType: "click",
        actionParams: {
          selector: "#submit-btn",
          text: "Login",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#submit-btn",
          },
          {
            assertionType: "elementExists",
            selector: "#submit-btn",
          },
          {
            assertionType: "textContains",
            selector: "#submit-btn",
            expectedValue: "Login",
          },
          {
            assertionType: "textEquals",
            selector: "#submit-btn",
            expectedValue: "Login",
          },
          {
            assertionType: "hasClass",
            selector: "#submit-btn",
            expectedValue: "btn-primary",
          },
          {
            assertionType: "isEnabled",
            selector: "#submit-btn",
          },
        ],
        customExpectedResult: "<p>Login button should be clickable and enabled</p>",
      },
      // Step 5: Wait for dashboard - ALL assertions for waitForElement
      {
        stepOrder: 5,
        actionType: "waitForElement",
        actionParams: {
          selector: "#dashboard",
          timeout: "5000",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#dashboard",
          },
          {
            assertionType: "elementExists",
            selector: "#dashboard",
          },
          {
            assertionType: "elementClickable",
            selector: "#dashboard .welcome-card",
          },
        ],
        customExpectedResult: null,
      },
      // Step 6: Wait - ALL assertions for wait
      {
        stepOrder: 6,
        actionType: "wait",
        actionParams: {
          timeout: "1000",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#user-profile",
          },
          {
            assertionType: "elementExists",
            selector: "#user-profile",
          },
          {
            assertionType: "elementClickable",
            selector: "#user-profile",
          },
        ],
        customExpectedResult: null,
      },
      // Step 7: Hover over profile menu - ALL assertions for hover
      {
        stepOrder: 7,
        actionType: "hover",
        actionParams: {
          selector: "#profile-menu",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#profile-menu",
          },
          {
            assertionType: "hasClass",
            selector: "#profile-menu",
            expectedValue: "active",
          },
          {
            assertionType: "hasAttribute",
            selector: "#profile-menu",
            attributeName: "aria-expanded",
            attributeValue: "true",
          },
          {
            assertionType: "textContains",
            selector: "#profile-menu",
            expectedValue: "Profile",
          },
        ],
        customExpectedResult: "<p>Profile menu should expand on hover with aria-expanded attribute</p>",
      },
      // Step 8: Select dropdown option - ALL assertions for select
      {
        stepOrder: 8,
        actionType: "select",
        actionParams: {
          selector: "#language-select",
          value: "en",
        },
        assertions: [
          {
            assertionType: "valueEquals",
            selector: "#language-select",
            expectedValue: "en",
          },
          {
            assertionType: "isSelected",
            selector: "#language-select option[value='en']",
          },
          {
            assertionType: "textEquals",
            selector: "#language-select option:selected",
            expectedValue: "English",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#language-select",
          },
        ],
        customExpectedResult: null,
      },
      // Step 9: Scroll to footer - ALL assertions for scroll
      {
        stepOrder: 9,
        actionType: "scroll",
        actionParams: {
          direction: "down",
          selector: "#footer",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#footer",
          },
          {
            assertionType: "elementInViewport",
            selector: "#footer",
          },
          {
            assertionType: "elementExists",
            selector: "#footer",
          },
        ],
        customExpectedResult: null,
      },
      // Step 10: Double click on item - ALL assertions for doubleClick
      {
        stepOrder: 10,
        actionType: "doubleClick",
        actionParams: {
          selector: ".item-card:first-child",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: ".item-detail-modal",
          },
          {
            assertionType: "textContains",
            selector: ".item-detail-modal .title",
            expectedValue: "Item Details",
          },
          {
            assertionType: "hasClass",
            selector: ".item-detail-modal",
            expectedValue: "open",
          },
          {
            assertionType: "elementExists",
            selector: ".item-detail-modal",
          },
        ],
        customExpectedResult: "<p>Item detail modal should open</p>",
      },
      // Step 11: Long press on element - ALL assertions for longPress
      {
        stepOrder: 11,
        actionType: "longPress",
        actionParams: {
          selector: ".context-menu-trigger",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: ".context-menu",
          },
          {
            assertionType: "textContains",
            selector: ".context-menu",
            expectedValue: "Copy",
          },
          {
            assertionType: "hasClass",
            selector: ".context-menu",
            expectedValue: "visible",
          },
          {
            assertionType: "elementExists",
            selector: ".context-menu",
          },
        ],
        customExpectedResult: null,
      },
      // Step 12: Drag and drop - ALL assertions for dragDrop
      {
        stepOrder: 12,
        actionType: "dragDrop",
        actionParams: {
          selector: ".draggable-item",
          targetSelector: ".drop-zone",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: ".drop-zone .draggable-item",
          },
          {
            assertionType: "hasClass",
            selector: ".drop-zone",
            expectedValue: "has-item",
          },
          {
            assertionType: "elementExists",
            selector: ".drop-zone .draggable-item",
          },
        ],
        customExpectedResult: "<p>Item should be moved to drop zone</p>",
      },
      // Step 13: Press key - ALL assertions for pressKey
      {
        stepOrder: 13,
        actionType: "pressKey",
        actionParams: {
          key: "Escape",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#main-content",
          },
          {
            assertionType: "valueContains",
            selector: "#search-input",
            expectedValue: "",
          },
          {
            assertionType: "textContains",
            selector: "#status",
            expectedValue: "Ready",
          },
          {
            assertionType: "urlContains",
            expectedValue: "/dashboard",
          },
        ],
        customExpectedResult: "<p>Modal should close on Escape key</p>",
      },
      // Step 14: Clear input - ALL assertions for clear
      {
        stepOrder: 14,
        actionType: "clear",
        actionParams: {
          selector: "#search-input",
        },
        assertions: [
          {
            assertionType: "valueEquals",
            selector: "#search-input",
            expectedValue: "",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#search-input",
          },
        ],
        customExpectedResult: null,
      },
      // Step 15: Swipe (mobile) - ALL assertions for swipe
      {
        stepOrder: 15,
        actionType: "swipe",
        actionParams: {
          direction: "left",
          selector: ".carousel",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: ".carousel .slide-2",
          },
          {
            assertionType: "elementNotDisplayed",
            selector: ".carousel .slide-1",
          },
          {
            assertionType: "elementExists",
            selector: ".carousel .slide-2",
          },
        ],
        customExpectedResult: null,
      },
      // Step 16: Go back - ALL assertions for back
      {
        stepOrder: 16,
        actionType: "back",
        actionParams: {},
        assertions: [
          {
            assertionType: "urlContains",
            expectedValue: "/login",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#login-form",
          },
          {
            assertionType: "titleContains",
            expectedValue: "Login",
          },
        ],
        customExpectedResult: null,
      },
      // Step 17: Refresh page - ALL assertions for refresh
      {
        stepOrder: 17,
        actionType: "refresh",
        actionParams: {},
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#main-content",
          },
          {
            assertionType: "elementExists",
            selector: "#main-content",
          },
        ],
        customExpectedResult: "<p>Page should reload successfully</p>",
      },
    ],
  };

  const response = await fetch(`${API_URL}/test-cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testCase),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create test case: ${response.statusText}\n${error}`);
  }

  const data = await response.json();
  return data;
}

// Main execution
async function main() {
  try {
    console.log("🔐 Logging in...");
    const token = await login();
    console.log("✅ Login successful");

    console.log("\n📝 Creating comprehensive test case...");
    const result = await createFullTestCase(token);
    console.log("✅ Test case created successfully!");
    console.log("\n📊 Test Case Details:");
    console.log(`   ID: ${result.id}`);
    console.log(`   Title: ${result.title}`);
    console.log(`   Suite: ${result.suite}`);
    console.log(`   Steps: ${result.steps?.length || 0}`);
    console.log("\n🎉 Done! You can now view this test case in the UI.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
