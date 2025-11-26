import { useState } from 'react';
import { Save, Plus, Trash2, Globe, Zap, Monitor, Smartphone, TabletSmartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface Browser {
  id: string;
  type: string;
  mobileEmulation: boolean;
  deviceName?: string;
  width?: string;
  height?: string;
}

interface LoadStage {
  id: string;
  duration: string;
  targetVUs: string;
}

interface SuccessThreshold {
  id: string;
  metricType: string;
  maxValue: string;
}

export function Configuration() {
  const [activeTab, setActiveTab] = useState('ui-automation');
  const [uiPlatformTab, setUiPlatformTab] = useState('web');

  // Web Automation Config (web-config.json)
  const [webConfig, setWebConfig] = useState({
    baseUrl: 'https://example.com',
    maxConcurrentSessions: '5',
    headlessMode: true,
    implicitWait: '10000',
    pageLoadTimeout: '30000',
    scriptTimeout: '30000',
  });

  const [browsers, setBrowsers] = useState<Browser[]>([
    { id: '1', type: 'chrome', mobileEmulation: false },
  ]);

  // Android Automation Config (android-config.json)
  const [androidConfig, setAndroidConfig] = useState({
    appiumServer: 'http://localhost:4723',
    platformName: 'Android',
    platformVersion: '13.0',
    deviceName: 'Pixel 6',
    automationName: 'UiAutomator2',
    appPackage: 'com.example.app',
    appActivity: '.MainActivity',
    autoGrantPermissions: true,
    noReset: false,
    implicitWait: '10000',
  });

  // iOS Automation Config (ios-config.json)
  const [iosConfig, setIosConfig] = useState({
    appiumServer: 'http://localhost:4723',
    platformName: 'iOS',
    platformVersion: '16.0',
    deviceName: 'iPhone 14',
    automationName: 'XCUITest',
    bundleId: 'com.example.app',
    udid: '',
    xcodeOrgId: '',
    xcodeSigningId: 'iPhone Developer',
    autoAcceptAlerts: true,
    noReset: false,
    implicitWait: '10000',
  });

  // API & Load Testing Config
  const [loadConfig, setLoadConfig] = useState({
    virtualUsers: '100',
    duration: '5m',
  });

  const [loadStages, setLoadStages] = useState<LoadStage[]>([
    { id: '1', duration: '1m', targetVUs: '50' },
    { id: '2', duration: '3m', targetVUs: '100' },
    { id: '3', duration: '1m', targetVUs: '0' },
  ]);

  const [thresholds, setThresholds] = useState<SuccessThreshold[]>([
    { id: '1', metricType: 'p95_response_time', maxValue: '300' },
    { id: '2', metricType: 'error_rate', maxValue: '5' },
  ]);

  const handleAddBrowser = () => {
    const newBrowser: Browser = {
      id: Date.now().toString(),
      type: 'chrome',
      mobileEmulation: false,
    };
    setBrowsers([...browsers, newBrowser]);
  };

  const handleRemoveBrowser = (id: string) => {
    if (browsers.length > 1) {
      setBrowsers(browsers.filter(b => b.id !== id));
    }
  };

  const handleUpdateBrowser = (id: string, updates: Partial<Browser>) => {
    setBrowsers(browsers.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
  };

  const handleAddLoadStage = () => {
    const newStage: LoadStage = {
      id: Date.now().toString(),
      duration: '1m',
      targetVUs: '50',
    };
    setLoadStages([...loadStages, newStage]);
  };

  const handleRemoveLoadStage = (id: string) => {
    if (loadStages.length > 1) {
      setLoadStages(loadStages.filter(s => s.id !== id));
    }
  };

  const handleUpdateLoadStage = (id: string, updates: Partial<LoadStage>) => {
    setLoadStages(loadStages.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const handleAddThreshold = () => {
    const newThreshold: SuccessThreshold = {
      id: Date.now().toString(),
      metricType: 'p95_response_time',
      maxValue: '500',
    };
    setThresholds([...thresholds, newThreshold]);
  };

  const handleRemoveThreshold = (id: string) => {
    if (thresholds.length > 1) {
      setThresholds(thresholds.filter(t => t.id !== id));
    }
  };

  const handleUpdateThreshold = (id: string, updates: Partial<SuccessThreshold>) => {
    setThresholds(thresholds.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const handleSaveConfig = () => {
    alert('Configuration saved successfully!');
  };

  return (
    <div className="p-8 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2">Configuration Manager</h1>
          <p className="text-slate-400">Kelola konfigurasi automation dan load testing</p>
        </div>
        <Button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save All Configuration
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800 mb-6">
          <TabsTrigger value="ui-automation" className="data-[state=active]:bg-slate-800 text-slate-400">
            <Globe className="w-4 h-4 mr-2" />
            UI Automation Configuration
          </TabsTrigger>
          <TabsTrigger value="api-load" className="data-[state=active]:bg-slate-800 text-slate-400">
            <Zap className="w-4 h-4 mr-2" />
            API & Load Testing Configuration
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: UI Automation Configuration */}
        <TabsContent value="ui-automation" className="space-y-6">
          {/* Platform Selection */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-6">Platform Selection</h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setUiPlatformTab('web')}
              >
                <Monitor className="w-4 h-4 mr-2" />
                <div>
                  <p className="text-sm text-slate-200">Web</p>
                  <p className="text-xs text-slate-500">Automate web applications</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setUiPlatformTab('android')}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                <div>
                  <p className="text-sm text-slate-200">Android</p>
                  <p className="text-xs text-slate-500">Automate Android applications</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setUiPlatformTab('ios')}
              >
                <TabletSmartphone className="w-4 h-4 mr-2" />
                <div>
                  <p className="text-sm text-slate-200">iOS</p>
                  <p className="text-xs text-slate-500">Automate iOS applications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Web Automation Config */}
          {uiPlatformTab === 'web' && (
            <>
              {/* Execution Settings */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Execution Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Base URL</label>
                    <input
                      type="text"
                      value={webConfig.baseUrl}
                      onChange={(e) => setWebConfig({ ...webConfig, baseUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Max Concurrent Sessions</label>
                    <input
                      type="number"
                      value={webConfig.maxConcurrentSessions}
                      onChange={(e) => setWebConfig({ ...webConfig, maxConcurrentSessions: e.target.value })}
                      placeholder="5"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={webConfig.headlessMode}
                        onChange={(e) => setWebConfig({ ...webConfig, headlessMode: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                      />
                      <div>
                        <p className="text-sm text-slate-200">Headless Mode</p>
                        <p className="text-xs text-slate-500">Run browsers without GUI for faster execution</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Timeouts */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Timeouts</h2>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Implicit Wait Timeout (ms)</label>
                    <input
                      type="number"
                      value={webConfig.implicitWait}
                      onChange={(e) => setWebConfig({ ...webConfig, implicitWait: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">Default wait for element presence</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Page Load Timeout (ms)</label>
                    <input
                      type="number"
                      value={webConfig.pageLoadTimeout}
                      onChange={(e) => setWebConfig({ ...webConfig, pageLoadTimeout: e.target.value })}
                      placeholder="30000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">Maximum page load wait time</p>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Script Timeout (ms)</label>
                    <input
                      type="number"
                      value={webConfig.scriptTimeout}
                      onChange={(e) => setWebConfig({ ...webConfig, scriptTimeout: e.target.value })}
                      placeholder="30000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">Maximum script execution time</p>
                  </div>
                </div>
              </div>

              {/* Session Management */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="mb-1">Session Management</h2>
                    <p className="text-sm text-slate-400">Define browsers and environments for testing</p>
                  </div>
                  <Button 
                    onClick={handleAddBrowser}
                    variant="outline"
                    className="bg-transparent border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white hover:text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Browser
                  </Button>
                </div>

                <div className="space-y-4">
                  {browsers.map((browser, index) => (
                    <div key={browser.id} className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-2">Browser Type</label>
                              <select
                                value={browser.type}
                                onChange={(e) => handleUpdateBrowser(browser.id, { type: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="chrome">Chrome</option>
                                <option value="firefox">Firefox</option>
                                <option value="safari">Safari</option>
                                <option value="edge">Edge</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors w-full">
                                <input
                                  type="checkbox"
                                  checked={browser.mobileEmulation}
                                  onChange={(e) => handleUpdateBrowser(browser.id, { mobileEmulation: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                                />
                                <span className="text-sm text-slate-200">Mobile Emulation</span>
                              </label>
                            </div>
                          </div>

                          {browser.mobileEmulation && (
                            <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-blue-500/30">
                              <div>
                                <label className="block text-sm text-slate-400 mb-2">Device Name</label>
                                <input
                                  type="text"
                                  value={browser.deviceName || ''}
                                  onChange={(e) => handleUpdateBrowser(browser.id, { deviceName: e.target.value })}
                                  placeholder="iPhone 12"
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-400 mb-2">Width (px)</label>
                                <input
                                  type="number"
                                  value={browser.width || ''}
                                  onChange={(e) => handleUpdateBrowser(browser.id, { width: e.target.value })}
                                  placeholder="390"
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-400 mb-2">Height (px)</label>
                                <input
                                  type="number"
                                  value={browser.height || ''}
                                  onChange={(e) => handleUpdateBrowser(browser.id, { height: e.target.value })}
                                  placeholder="844"
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveBrowser(browser.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors mt-6"
                          disabled={browsers.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Android Automation Config */}
          {uiPlatformTab === 'android' && (
            <>
              {/* Execution Settings */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Execution Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Appium Server</label>
                    <input
                      type="text"
                      value={androidConfig.appiumServer}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, appiumServer: e.target.value })}
                      placeholder="http://localhost:4723"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={androidConfig.platformName}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, platformName: e.target.value })}
                      placeholder="Android"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Platform Version</label>
                    <input
                      type="text"
                      value={androidConfig.platformVersion}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, platformVersion: e.target.value })}
                      placeholder="13.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Device Name</label>
                    <input
                      type="text"
                      value={androidConfig.deviceName}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, deviceName: e.target.value })}
                      placeholder="Pixel 6"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Automation Name</label>
                    <input
                      type="text"
                      value={androidConfig.automationName}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, automationName: e.target.value })}
                      placeholder="UiAutomator2"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">App Package</label>
                    <input
                      type="text"
                      value={androidConfig.appPackage}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, appPackage: e.target.value })}
                      placeholder="com.example.app"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">App Activity</label>
                    <input
                      type="text"
                      value={androidConfig.appActivity}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, appActivity: e.target.value })}
                      placeholder=".MainActivity"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={androidConfig.autoGrantPermissions}
                        onChange={(e) => setAndroidConfig({ ...androidConfig, autoGrantPermissions: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                      />
                      <div>
                        <p className="text-sm text-slate-200">Auto Grant Permissions</p>
                        <p className="text-xs text-slate-500">Automatically grant permissions to the app</p>
                      </div>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={androidConfig.noReset}
                        onChange={(e) => setAndroidConfig({ ...androidConfig, noReset: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                      />
                      <div>
                        <p className="text-sm text-slate-200">No Reset</p>
                        <p className="text-xs text-slate-500">Do not reset the app state between sessions</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Timeouts */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Timeouts</h2>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Implicit Wait Timeout (ms)</label>
                    <input
                      type="number"
                      value={androidConfig.implicitWait}
                      onChange={(e) => setAndroidConfig({ ...androidConfig, implicitWait: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">Default wait for element presence</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* iOS Automation Config */}
          {uiPlatformTab === 'ios' && (
            <>
              {/* Execution Settings */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Execution Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Appium Server</label>
                    <input
                      type="text"
                      value={iosConfig.appiumServer}
                      onChange={(e) => setIosConfig({ ...iosConfig, appiumServer: e.target.value })}
                      placeholder="http://localhost:4723"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Platform Name</label>
                    <input
                      type="text"
                      value={iosConfig.platformName}
                      onChange={(e) => setIosConfig({ ...iosConfig, platformName: e.target.value })}
                      placeholder="iOS"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Platform Version</label>
                    <input
                      type="text"
                      value={iosConfig.platformVersion}
                      onChange={(e) => setIosConfig({ ...iosConfig, platformVersion: e.target.value })}
                      placeholder="16.0"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Device Name</label>
                    <input
                      type="text"
                      value={iosConfig.deviceName}
                      onChange={(e) => setIosConfig({ ...iosConfig, deviceName: e.target.value })}
                      placeholder="iPhone 14"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Automation Name</label>
                    <input
                      type="text"
                      value={iosConfig.automationName}
                      onChange={(e) => setIosConfig({ ...iosConfig, automationName: e.target.value })}
                      placeholder="XCUITest"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Bundle ID</label>
                    <input
                      type="text"
                      value={iosConfig.bundleId}
                      onChange={(e) => setIosConfig({ ...iosConfig, bundleId: e.target.value })}
                      placeholder="com.example.app"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">UDID</label>
                    <input
                      type="text"
                      value={iosConfig.udid}
                      onChange={(e) => setIosConfig({ ...iosConfig, udid: e.target.value })}
                      placeholder=""
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Xcode Org ID</label>
                    <input
                      type="text"
                      value={iosConfig.xcodeOrgId}
                      onChange={(e) => setIosConfig({ ...iosConfig, xcodeOrgId: e.target.value })}
                      placeholder=""
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Xcode Signing ID</label>
                    <input
                      type="text"
                      value={iosConfig.xcodeSigningId}
                      onChange={(e) => setIosConfig({ ...iosConfig, xcodeSigningId: e.target.value })}
                      placeholder="iPhone Developer"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={iosConfig.autoAcceptAlerts}
                        onChange={(e) => setIosConfig({ ...iosConfig, autoAcceptAlerts: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                      />
                      <div>
                        <p className="text-sm text-slate-200">Auto Accept Alerts</p>
                        <p className="text-xs text-slate-500">Automatically accept alerts during testing</p>
                      </div>
                    </label>
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={iosConfig.noReset}
                        onChange={(e) => setIosConfig({ ...iosConfig, noReset: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2 rounded"
                      />
                      <div>
                        <p className="text-sm text-slate-200">No Reset</p>
                        <p className="text-xs text-slate-500">Do not reset the app state between sessions</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Timeouts */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="mb-6">Timeouts</h2>
                
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Implicit Wait Timeout (ms)</label>
                    <input
                      type="number"
                      value={iosConfig.implicitWait}
                      onChange={(e) => setIosConfig({ ...iosConfig, implicitWait: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-2">Default wait for element presence</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: API & Load Testing Configuration */}
        <TabsContent value="api-load" className="space-y-6">
          {/* Load Profile */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="mb-6">Load Profile</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Virtual Users (VUs)</label>
                <input
                  type="number"
                  value={loadConfig.virtualUsers}
                  onChange={(e) => setLoadConfig({ ...loadConfig, virtualUsers: e.target.value })}
                  placeholder="100"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">Maximum concurrent virtual users</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Total Duration</label>
                <input
                  type="text"
                  value={loadConfig.duration}
                  onChange={(e) => setLoadConfig({ ...loadConfig, duration: e.target.value })}
                  placeholder="5m"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">e.g., 5m, 30s, 1h</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm mb-1">Ramp-up Stages</h3>
                  <p className="text-xs text-slate-400">Define how load increases over time</p>
                </div>
                <Button 
                  onClick={handleAddLoadStage}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stage
                </Button>
              </div>

              <div className="space-y-3">
                {loadStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                    <Badge variant="outline" className="bg-teal-500/20 text-teal-400 border-teal-500/30 border">
                      Stage {index + 1}
                    </Badge>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={stage.duration}
                          onChange={(e) => handleUpdateLoadStage(stage.id, { duration: e.target.value })}
                          placeholder="Duration (e.g., 1m)"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={stage.targetVUs}
                          onChange={(e) => handleUpdateLoadStage(stage.id, { targetVUs: e.target.value })}
                          placeholder="Target VUs"
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLoadStage(stage.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                      disabled={loadStages.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Success Thresholds */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="mb-1">Success Thresholds</h2>
                <p className="text-sm text-slate-400">Define pass/fail criteria for load tests</p>
              </div>
              <Button 
                onClick={handleAddThreshold}
                variant="outline"
                className="border-slate-600 bg-transparent text-slate-100 hover:bg-slate-800 hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Threshold
              </Button>
            </div>

            <div className="space-y-3">
              {thresholds.map((threshold, index) => (
                <div key={threshold.id} className="flex items-center gap-3 bg-slate-800/50 p-4 rounded-lg">
                  <span className="text-sm text-slate-500 w-6">{index + 1}.</span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={threshold.metricType}
                        onChange={(e) => handleUpdateThreshold(threshold.id, { metricType: e.target.value })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="p95_response_time">P95 Response Time (ms)</option>
                        <option value="p99_response_time">P99 Response Time (ms)</option>
                        <option value="avg_response_time">Avg Response Time (ms)</option>
                        <option value="error_rate">Error Rate (%)</option>
                        <option value="http_req_failed">HTTP Req Failed (%)</option>
                        <option value="throughput">Throughput (req/s)</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={threshold.maxValue}
                        onChange={(e) => handleUpdateThreshold(threshold.id, { maxValue: e.target.value })}
                        placeholder="Max allowed value"
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveThreshold(threshold.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    disabled={thresholds.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 Test will pass only if all thresholds are met
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}