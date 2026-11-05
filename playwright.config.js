import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:30000,expect:{timeout:15000},workers:1,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://localhost:5173',channel:'msedge',headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:true,timeout:30000}
});
