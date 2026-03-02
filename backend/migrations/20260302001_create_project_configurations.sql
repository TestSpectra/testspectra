-- Create project_configurations table
CREATE TABLE project_configurations (
    project_id TEXT PRIMARY KEY,
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration if it doesn't exist
-- Note: This is an example, the actual config_data will be updated from the frontend
INSERT INTO project_configurations (project_id, config_data)
VALUES ('default', '{
    "webConfig": {
        "baseUrl": "https://example.com",
        "maxConcurrentSessions": "5",
        "headlessMode": true,
        "implicitWait": "10000",
        "pageLoadTimeout": "30000",
        "scriptTimeout": "30000"
    },
    "browsers": [
        { "id": "1", "type": "chrome", "mobileEmulation": false }
    ],
    "androidConfig": {
        "appiumServer": "http://localhost:4723",
        "platformName": "Android",
        "platformVersion": "13.0",
        "deviceName": "Pixel 6",
        "automationName": "UiAutomator2",
        "appPackage": "com.example.app",
        "appActivity": ".MainActivity",
        "autoGrantPermissions": true,
        "noReset": false,
        "implicitWait": "10000"
    },
    "iosConfig": {
        "appiumServer": "http://localhost:4723",
        "platformName": "iOS",
        "platformVersion": "16.0",
        "deviceName": "iPhone 14",
        "automationName": "XCUITest",
        "bundleId": "com.example.app",
        "udid": "",
        "xcodeOrgId": "",
        "xcodeSigningId": "iPhone Developer",
        "autoAcceptAlerts": true,
        "noReset": false,
        "implicitWait": "10000"
    },
    "loadConfig": {
        "virtualUsers": "100",
        "duration": "5m"
    },
    "loadStages": [
        { "id": "1", "duration": "1m", "targetVUs": "50" },
        { "id": "2", "duration": "3m", "targetVUs": "100" },
        { "id": "3", "duration": "1m", "targetVUs": "0" }
    ],
    "thresholds": [
        { "id": "1", "metricType": "p95_response_time", "maxValue": "300" },
        { "id": "2", "metricType": "error_rate", "maxValue": "5" }
    ]
}'::jsonb)
ON CONFLICT (project_id) DO NOTHING;
