import {test,expect} from '@playwright/test';

async function loaded(page){
  await page.goto('/');
  await expect(page.locator('#data-status')).toHaveText('Connected to the campus database.');
}
async function demo(page){
  await page.route('**/config.js',route=>route.fulfill({contentType:'text/javascript',body:'window.CAMPUS_CONFIG = {};'}));
  await page.goto('/');await expect(page.locator('#location-count')).toHaveText('31 places');
}
test('live campus data loads and the map is interactive',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await loaded(page);await expect(page.locator('#location-count')).toHaveText('31 places');
  expect(await page.locator('#campus-map [data-location]').count()).toBeGreaterThan(25);
  await page.locator('#campus-map [data-location="mechanical"]').click();
  await expect(page.locator('#building-card')).toBeVisible();await expect(page.locator('#building-card h2')).toContainText('Mechanical');
  await page.screenshot({path:'test-results/campus-desktop.png',fullPage:true});
  expect(errors).toEqual([]);
});
test('alias search highlights the building shared by CCF and Library',async({page})=>{
  await loaded(page);await page.getByRole('searchbox').fill('ccf');
  await expect(page.locator('#directory .location')).toHaveCount(1);
  await expect(page.locator('#directory')).toContainText('Central Computing Facility');
  await expect(page.locator('#campus-map [data-location="library"]')).not.toHaveClass(/map-dimmed/);
  await page.locator('#directory .location').click();await expect(page.locator('#building-card')).toContainText('Ground floor');
});
test('category filters update the directory and map',async({page})=>{
  await loaded(page);await page.locator('#categories').getByRole('button',{name:'Hostels',exact:true}).click();
  await expect(page.locator('#directory .location')).toHaveCount(5);
  await expect(page.locator('#campus-map [data-location="mechanical"]')).toHaveClass(/map-dimmed/);
  await expect(page.locator('#campus-map [data-location="hostel-a"]')).not.toHaveClass(/map-dimmed/);
});
test('building floors, saved places and recent views work across reloads',async({page})=>{
  await loaded(page);await page.locator('#directory').getByRole('button',{name:'Security Office',exact:false}).click();
  await expect(page.locator('.shared-building')).toContainText('Administration & Accounts');
  await page.getByRole('button',{name:'Save place',exact:true}).click();
  await page.getByRole('button',{name:'Saved places',exact:true}).click();
  await expect(page.locator('#directory .location')).toHaveCount(1);
  await page.reload();await expect(page.locator('#data-status')).toHaveText('Connected to the campus database.');
  await page.getByRole('button',{name:'Saved places',exact:true}).click();
  await expect(page.locator('#directory')).toContainText('Security Office');await expect(page.locator('#recent')).toContainText('Security Office');
});
test('BFS directions, swapping endpoints and clearing the route work',async({page})=>{
  await loaded(page);await page.getByRole('tab',{name:'Directions',exact:true}).click();
  await page.getByLabel('Starting point',{exact:true}).selectOption('gate');await page.getByLabel('Destination',{exact:true}).selectOption('library');
  await page.getByRole('button',{name:'Find route',exact:true}).click();
  await expect(page.locator('.selected-route')).toHaveCount(1);await expect(page.locator('.route-marker')).toHaveCount(2);
  await expect(page.locator('.route-steps')).toContainText('Library');await expect(page.locator('#route-result')).toContainText('Walking time unavailable');
  await expect(page.locator('#algorithm')).toHaveCount(0);
  await page.getByRole('button',{name:'Swap starting point and destination'}).click();
  await expect(page.locator('#start')).toHaveValue('library');await expect(page.locator('#destination')).toHaveValue('gate');
  await page.getByRole('button',{name:'Find route',exact:true}).click();await expect(page.locator('.route-steps li').first()).toHaveText('Library');
  await page.getByRole('button',{name:'Clear route',exact:true}).click();await expect(page.locator('.selected-route')).toHaveCount(0);
});
test('map zoom, pan and reset work',async({page})=>{
  await loaded(page);const map=page.locator('#campus-map');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect(map).not.toHaveAttribute('viewBox','0 0 1000 760');
  await page.getByRole('button',{name:'Reset map view'}).click();await expect(map).toHaveAttribute('viewBox','0 0 1000 760');
  const box=await page.locator('#map-viewport').boundingBox();await page.mouse.move(box.x+15,box.y+15);await page.mouse.down();await page.mouse.move(box.x+90,box.y+45,{steps:8});await page.mouse.up();
  await expect(map).not.toHaveAttribute('viewBox','0 0 1000 760');await page.getByRole('button',{name:'Reset map view'}).click();
});
test('live login form validates input and disables demo accounts',async({page})=>{
  await loaded(page);await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.locator('#login-dialog')).toBeVisible();await expect(page.locator('#demo-logins')).toBeHidden();
  await page.getByLabel('Email',{exact:true}).fill('invalid-email');await page.getByLabel('Password',{exact:true}).fill('not-a-real-password');
  await page.locator('#login-submit').click();expect(await page.locator('#login-email').evaluate(n=>n.validity.typeMismatch)).toBe(true);
  await expect(page.locator('#admin-open')).toBeHidden();await page.getByRole('button',{name:'Close sign in'}).click();
});
test('demo feedback form saves a report locally without writing to Supabase',async({page})=>{
  await demo(page);await page.getByRole('button',{name:'Report a problem',exact:true}).click();
  await page.getByLabel('Details',{exact:true}).fill('Browser test: please check the library opening hours.');
  await page.getByRole('button',{name:'Submit',exact:true}).click();await expect(page.locator('#feedback-result')).toContainText('Saved on this device');
  const reports=await page.evaluate(()=>JSON.parse(localStorage.getItem('vjti-feedback')));expect(reports.at(-1).message).toContain('Browser test');
});
test('demo admin can edit a location; demo student cannot access the editor',async({page})=>{
  await demo(page);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Fill admin login'}).click();await page.locator('#login-submit').click();
  await page.getByRole('button',{name:'Manage locations',exact:true}).click();await page.getByLabel('Location',{exact:true}).selectOption('library');
  await page.getByLabel('Name',{exact:true}).fill('Library Browser Check');await page.getByLabel('Opening hours',{exact:true}).fill('Monday–Friday, 9–5');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();await expect(page.locator('#admin-result')).toContainText('Saved in this browser');
  await page.getByRole('button',{name:'Close location management'}).click();await expect(page.locator('#directory')).toContainText('Library Browser Check');
  await expect(page.locator('#campus-map')).toContainText('Library Browser Check');await page.reload();await expect(page.locator('#directory')).toContainText('Library Browser Check');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Fill student login'}).click();await page.locator('#login-submit').click();
  await expect(page.locator('#account-label')).toHaveText('Demo student');await expect(page.locator('#admin-open')).toBeHidden();
});
test('mobile layout fits the viewport and the map still works',async({page})=>{
  await page.setViewportSize({width:390,height:844});await loaded(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('searchbox').fill('canteen');await expect(page.locator('#directory .location')).toHaveCount(1);
  await page.locator('#directory .location').click();await expect(page.locator('#building-card')).toBeVisible();
  await page.screenshot({path:'test-results/campus-mobile.png',fullPage:true});
});
