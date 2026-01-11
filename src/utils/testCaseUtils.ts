import { TestStep, TestStepPayload } from "../services/test-case-service";

export const convertStepsFromBackend = (steps: TestStep[]): TestStep[] => {
  if (!steps || steps.length === 0) {
    return [];
  }

  return steps.map((step, index) => {
    if (step.stepType === "shared_reference") {
      return {
        id: step.id || `step-${index}`,
        stepOrder: step.stepOrder,
        stepType: "shared_reference",
        sharedStepName: step.sharedStepName,
        sharedStepId: step.sharedStepId,
        sharedStepDescription: step.sharedStepDescription,
        steps: step.steps,
      };
    } else {
      return {
        id: step.id || `step-${index}`,
        stepOrder: step.stepOrder,
        stepType: "regular",
        actionType: step.actionType,
        actionParams: step.actionParams || {},
        customExpectedResult: step.customExpectedResult || "",
        assertions: (step.assertions || []).map(
          (assertion: any, idx: number) => ({
            ...assertion,
            id: assertion.id || `assertion-${index}-${idx}`, // Add id for React keys
          })
        ),
      };
    }
  });
};

export const convertStepsForBackend = (steps: TestStep[]): TestStepPayload[] => {
  return steps.map((step, index) => {
    if (step.stepType === "shared_reference") {
      return {
        stepOrder: index + 1,
        stepType: "shared_reference",
        sharedStepId: step.sharedStepId,
      };
    } else {
      return {
        stepOrder: index + 1,
        stepType: "regular",
        actionType: step.actionType,
        actionParams: step.actionParams || {},
        assertions: (step.assertions || []).map(
          ({ id, ...assertion }) => assertion
        ), // Remove id field
        customExpectedResult: step.customExpectedResult || null,
      };
    }
  });
};
