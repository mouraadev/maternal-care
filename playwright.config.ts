import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.e2e.ts',workers:1,
  use:{baseURL:'http://localhost:5181',channel:'chrome',headless:true},
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 5181 --strictPort',url:'http://localhost:5181',reuseExistingServer:false,env:{VITE_FIREBASE_API_KEY:''}},
});
