import { getApiUrl } from "../lib/config";
import { logDebug } from "../lib/debug";

export interface Browser {
  id: string;
  type: string;
  mobileEmulation: boolean;
  deviceName?: string;
  width?: string;
  height?: string;
}

export interface LoadStage {
  id: string;
  duration: string;
  targetVUs: string;
}

export interface SuccessThreshold {
  id: string;
  metricType: string;
  maxValue: string;
}

export interface ConfigData {
  webConfig: {
    baseUrl: string;
    maxConcurrentSessions: string;
    headlessMode: boolean;
    implicitWait: string;
    pageLoadTimeout: string;
    scriptTimeout: string;
  };
  browsers: Browser[];
  androidConfig: {
    appiumServer: string;
    platformName: string;
    platformVersion: string;
    deviceName: string;
    automationName: string;
    appPackage: string;
    autoGrantPermissions: boolean;
    noReset: boolean;
    implicitWait: string;
  };
  iosConfig: {
    appiumServer: string;
    platformName: string;
    platformVersion: string;
    deviceName: string;
    automationName: string;
    bundleId: string;
    udid: string;
    xcodeOrgId: string;
    xcodeSigningId: string;
    autoAcceptAlerts: boolean;
    noReset: boolean;
    implicitWait: string;
  };
  loadConfig: {
    virtualUsers: string;
    duration: string;
  };
  loadStages: LoadStage[];
  thresholds: SuccessThreshold[];
}

export interface ProjectConfig {
  project_id: string;
  config_data: ConfigData;
  updated_at?: string;
}

export const projectConfigService = {
  async getConfig(projectId: string = "default"): Promise<ProjectConfig> {
    const apiUrl = await getApiUrl();
    const url = `${apiUrl}/config/${projectId}`;

    logDebug(`Fetching config from: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch configuration");
    }

    return response.json();
  },

  async updateConfig(
    projectId: string = "default",
    configData: ConfigData,
  ): Promise<ProjectConfig> {
    const apiUrl = await getApiUrl();
    const url = `${apiUrl}/config/${projectId}`;

    logDebug(`Updating config at: ${url}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ config_data: configData }),
    });

    if (!response.ok) {
      throw new Error("Failed to update configuration");
    }

    return response.json();
  },
};
