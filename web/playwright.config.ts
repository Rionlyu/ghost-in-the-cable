import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',fullyParallel:false,timeout:30000,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:5173',viewport:{width:Number(process.env.PLAYWRIGHT_VIEWPORT_WIDTH??1440),height:Number(process.env.PLAYWRIGHT_VIEWPORT_WIDTH??1440)<760?844:1000},trace:'retain-on-failure'},reporter:'list'});
