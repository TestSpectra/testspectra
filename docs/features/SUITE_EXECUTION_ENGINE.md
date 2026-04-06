# 📑 AI Agent Directive: Suite Execution Engine

## 📖 Context & Background (The "Why")

Currently, `TestSpectra` executes a single Test Case in an isolated environment wrapper containing its associated Suite Context (hooks and metadata). While this maintains clean separation, it lacks bulk execution capability when a user wants to run an entire test suite sequentially.

The goal is to support **"Suite Runs"** where all test cases within a suite are executed sequentially in a single WebdriverIO run block, natively supporting Mocha's nested `describe()` and `beforeEach/afterEach()` hook mechanics, ensuring the `execution_order` of test cases is strictly maintained.

Instead of writing new functions and endpoints, the existing engine functions will be refactored to treat every run as a "Suite Run". Running a single test case is simply treated as a Suite Run that contains exactly **one** test case.

---

## 🏗️ Phase 1: Engine Adjustments (The Rust Core)

### 1. Unified Payload & `RunnerContext`
The `run_test_local` Tauri command and `RunnerContext` structure will be updated to accept a list of test cases instead of a single ID:
- Change `test_case_id: String` and `test_case_title: String` to `test_cases: Vec<TestCaseTarget>`.
- `TestCaseTarget` will hold `{ id: String, title: String }`.
- In doing so, checking one test case or multiple test cases goes through the exact same flow. The frontend will be responsible for passing all ordered test cases when "Run Suite" is clicked.

### 2. Upgrading `ExecutionPreparer::prepare_execution`
We will re-use the existing `prepare_execution` method:
- Loop through `test_cases` to fetch their raw content concurrently using `ScriptProvider::get_test_case_content` (since the provider is the same, we simply call it for each `id`).
- Combine the raw contents of all test cases to scan for `PageObjects` and `Fixtures` dependencies collectively in one pass.
- Write the final wrapped output to `specs/{suite_id}.test.ts` instead of `specs/{test_case_id}.test.ts`.

### 3. Upgrading `build_suite_script`
- Update `build_suite_script` to accept a `SuiteContext` and a list of `(String, String)` tuples representing `[(tc_title, raw_content)]`.
- Iteratively build an `it()` block for each test case inside the primary `describe()` block.

### 4. Updating `ExecutionEngine::run_wdio`
- Point the WDIO `--spec` parameter to the generated `specs/{suite_id}.test.ts`.
- The existing log parsing will naturally handle the outputs of multiple sequential tests because each will emit its own "SUCCESSS"/"ERROR" based on the internal Mocha test names.

---

## 🚀 Phase 2: Building the Unified Spec File

`build_suite_script` will now output code structured as follows:

```ts
describe("Unified Suite Name", () => {
    // 1. Suite Lifecycle Hooks (Hooks inject here)
    before(async () => { /* Suite Setup */ });
    after(async () => { /* Suite Teardown */ });
    beforeEach(async () => { /* Per-Test Setup */ });
    afterEach(async () => { /* Per-Test Cleanup */ });

    // 2. Linear Test Cases defined by execution_order
    it("TC-0001 - First Test", async () => {
        // Raw content for TC 1
    });

    it("TC-0002 - Second Test", async () => {
        // Raw content for TC 2
    });
});
```

This guarantees `before()` and `after()` execute only once per suite run, while `beforeEach()` executes before every single test case inside the suite, fulfilling true Mocha native behavior without complex side-effects.

---

## 🔄 Phase 3: Integration Outline

1. Update `core/test-runner/src/lib.rs` (`RunnerContext`).
2. Update `core/test-runner/src/preparer.rs` (`prepare_execution` and `build_suite_script`).
3. Update `core/test-runner/src/executor.rs` (`run_wdio`).
4. Update `src-tauri/src/test_runner.rs` (`run_test_local` command args processing).
