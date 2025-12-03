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
      // Step 1: Navigate
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
            assertionType: "titleContains",
            expectedValue: "Login",
          },
        ],
        customExpectedResult: "<p>Login page should be displayed</p>",
      },
      // Step 2: Type email
      {
        stepOrder: 2,
        actionType: "type",
        actionParams: {
          selector: "#email",
          value: "user@example.com",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#email",
          },
          {
            assertionType: "valueEquals",
            selector: "#email",
            expectedValue: "user@example.com",
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
            assertionType: "elementDisplayed",
            selector: "#password",
          },
          {
            assertionType: "hasAttribute",
            selector: "#password",
            attributeName: "type",
            attributeValue: "password",
          },
        ],
        customExpectedResult: null,
      },
      // Step 4: Click submit button
      {
        stepOrder: 4,
        actionType: "click",
        actionParams: {
          selector: "#submit-btn",
          text: "Login",
        },
        assertions: [
          {
            assertionType: "elementClickable",
            selector: "#submit-btn",
          },
          {
            assertionType: "isEnabled",
            selector: "#submit-btn",
          },
        ],
        customExpectedResult: "<p>Login button should be clickable and enabled</p>",
      },
      // Step 5: Wait for dashboard
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
            assertionType: "elementInViewport",
            selector: "#dashboard",
          },
        ],
        customExpectedResult: null,
      },
      // Step 6: Verify URL changed
      {
        stepOrder: 6,
        actionType: "wait",
        actionParams: {
          timeout: "1000",
        },
        assertions: [
          {
            assertionType: "urlEquals",
            expectedValue: "https://example.com/dashboard",
          },
          {
            assertionType: "titleEquals",
            expectedValue: "Dashboard - Example App",
          },
        ],
        customExpectedResult: null,
      },
      // Step 7: Hover over profile menu
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
        ],
        customExpectedResult: "<p>Profile menu should expand on hover</p>",
      },
      // Step 8: Select dropdown option
      {
        stepOrder: 8,
        actionType: "select",
        actionParams: {
          selector: "#language-select",
          value: "en",
        },
        assertions: [
          {
            assertionType: "elementDisplayed",
            selector: "#language-select",
          },
          {
            assertionType: "valueEquals",
            selector: "#language-select",
            expectedValue: "en",
          },
        ],
        customExpectedResult: null,
      },
      // Step 9: Scroll to footer
      {
        stepOrder: 9,
        actionType: "scroll",
        actionParams: {
          direction: "down",
          selector: "#footer",
        },
        assertions: [
          {
            assertionType: "elementInViewport",
            selector: "#footer",
          },
          {
            assertionType: "elementDisplayed",
            selector: "#footer",
          },
        ],
        customExpectedResult: null,
      },
      // Step 10: Double click on item
      {
        stepOrder: 10,
        actionType: "doubleClick",
        actionParams: {
          selector: ".item-card:first-child",
        },
        assertions: [
          {
            assertionType: "elementExists",
            selector: ".item-detail-modal",
          },
          {
            assertionType: "elementDisplayed",
            selector: ".item-detail-modal",
          },
        ],
        customExpectedResult: "<p>Item detail modal should open</p>",
      },
      // Step 11: Long press on element
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
        ],
        customExpectedResult: null,
      },
      // Step 12: Drag and drop
      {
        stepOrder: 12,
        actionType: "dragDrop",
        actionParams: {
          selector: ".draggable-item",
          targetSelector: ".drop-zone",
        },
        assertions: [
          {
            assertionType: "elementExists",
            selector: ".drop-zone .draggable-item",
          },
          {
            assertionType: "textContains",
            selector: ".drop-zone",
            expectedValue: "Item dropped",
          },
        ],
        customExpectedResult: "<p>Item should be moved to drop zone</p>",
      },
      // Step 13: Press key
      {
        stepOrder: 13,
        actionType: "pressKey",
        actionParams: {
          key: "Escape",
        },
        assertions: [
          {
            assertionType: "elementNotDisplayed",
            selector: ".modal",
          },
        ],
        customExpectedResult: "<p>Modal should close on Escape key</p>",
      },
      // Step 14: Clear input
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
        ],
        customExpectedResult: null,
      },
      // Step 15: Swipe (mobile)
      {
        stepOrder: 15,
        actionType: "swipe",
        actionParams: {
          direction: "left",
          selector: ".carousel",
        },
        assertions: [
          {
            assertionType: "hasClass",
            selector: ".carousel",
            expectedValue: "swiped",
          },
        ],
        customExpectedResult: null,
      },
      // Step 16: Go back
      {
        stepOrder: 16,
        actionType: "back",
        actionParams: {},
        assertions: [
          {
            assertionType: "urlContains",
            expectedValue: "/previous-page",
          },
        ],
        customExpectedResult: null,
      },
      // Step 17: Refresh page
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
            assertionType: "isEnabled",
            selector: "#refresh-btn",
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
