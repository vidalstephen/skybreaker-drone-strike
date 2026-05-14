const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const url = process.env.SMOKE_URL ?? 'https://skybreaker.nsystems.live';
const screenshotsDir = process.env.SMOKE_SCREENSHOTS_DIR
  ? path.resolve(process.env.SMOKE_SCREENSHOTS_DIR)
  : null;

const progress = {
  unlockedMissionIds: ['signal-break', 'iron-veil'],
  completedMissionIds: ['signal-break'],
  bestMissionTimes: {},
  bestMissionScores: {},
  bestMissionRanks: {},
  earnedRewardIds: ['extraction-protocol'],
};

const settings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 80,
  graphicsQuality: 'LOW',
  reduceEffects: true,
  invertY: true,
};

async function clickByText(page, pattern) {
  await page.evaluate((source) => {
    const regex = new RegExp(source, 'i');
    const button = Array.from(document.querySelectorAll('button')).find((element) => regex.test(element.textContent || ''));
    if (!button) throw new Error(`Button not found: ${source}`);
    button.click();
  }, pattern.source);
}

async function clickTab(page, label) {
  await page.evaluate((labelSrc) => {
    const regex = new RegExp(labelSrc, 'i');
    const tab = Array.from(document.querySelectorAll('[role="tab"]')).find((element) => regex.test(element.textContent || ''));
    if (!tab) throw new Error(`Tab not found: ${labelSrc}`);
    tab.click();
  }, label);
  await page.waitForTimeout(150);
}

async function snapshot(page, name) {
  if (!screenshotsDir) return;
  await fs.promises.mkdir(screenshotsDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotsDir, `${name}.png`), fullPage: false });
}

async function smokeViewport(browser, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  await context.addInitScript(({ progress: savedProgress, settings: savedSettings }) => {
    localStorage.setItem('skybreaker.progress.v1', JSON.stringify(savedProgress));
    localStorage.setItem('skybreaker.settings.v1', JSON.stringify(savedSettings));
  }, { progress, settings });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // SplashScreen waits for a user gesture before transitioning to Main Menu.
  await page.waitForFunction(() => document.body.textContent?.includes('Press Any Key') || document.body.textContent?.includes('Next Sortie'), null, { timeout: 15000 });
  if (await page.evaluate(() => (document.body.textContent || '').includes('Press Any Key'))) {
    await page.mouse.click(width / 2, height / 2);
  }
  await page.waitForFunction(() => document.body.textContent?.includes('HANGAR') || document.body.textContent?.includes('Next Sortie'));
  const sizeLabel = `${width}x${height}`;
  const isLandscape = width > height;

  // --- Main Menu (default = Command tab) ---
  await snapshot(page, `${sizeLabel}-mainmenu-command`);
  const menuCommand = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    tablist: document.querySelector('[data-menu="main"] [role="tablist"]') !== null,
    tabCount: document.querySelectorAll('[data-menu="main"] [role="tab"]').length,
    hasNextSortie: (document.body.textContent || '').includes('Next Sortie'),
  }));

  await clickTab(page, 'Career');
  await snapshot(page, `${sizeLabel}-mainmenu-career`);
  const menuCareer = await page.evaluate(() => ({
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    hasArcs: (document.body.textContent || '').includes('Campaign') && (document.body.textContent || '').includes('Rewards'),
  }));

  await clickTab(page, 'System');
  await snapshot(page, `${sizeLabel}-mainmenu-system`);
  const menuSystem = await page.evaluate(() => ({
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    hasShellActions: ['Settings', 'Controls', 'Credits'].every(label => (document.body.textContent || '').includes(label)),
  }));

  await clickByText(page, /Settings/);
  await page.waitForFunction(() => document.body.textContent?.includes('CONFIGURATION'));
  await clickTab(page, 'Video');
  await snapshot(page, `${sizeLabel}-settings-video`);
  const settingsCheck = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    hasControls: ['Audio', 'Video', 'Controls', 'System', 'LOW', 'Reduced Effects', 'Telemetry'].every(label => (document.body.textContent || '').includes(label)),
  }));

  await clickByText(page, /Back/);
  await page.waitForFunction(() => document.body.textContent?.includes('Next Sortie') || document.body.textContent?.includes('SKYBREAKER'));
  // Back to MainMenu — make sure System tab is selected then go to Command for Campaign launch.
  await clickTab(page, 'Command');
  await clickByText(page, /Campaign$/);
  await page.waitForFunction(() => document.body.textContent?.includes('MISSION SELECT'));
  const campaign = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    hasMissionList: (document.body.textContent || '').includes('SIGNAL BREAK') && (document.body.textContent || '').includes('Mission 01'),
  }));

  await clickByText(page, /Briefing/);
  await page.waitForFunction(() => document.body.textContent?.includes('Mission Briefing'));
  await snapshot(page, `${sizeLabel}-briefing-objective`);
  const briefingObjective = await page.evaluate(() => ({
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    tablist: document.querySelector('[data-menu="briefing"] [role="tablist"]') !== null,
    hasNightGrid: (document.body.textContent || '').includes('Night Grid'),
  }));
  // Details tab carries Par Time + Reward labels on mobile (sidebar hidden < md).
  await clickTab(page, 'Details');
  await snapshot(page, `${sizeLabel}-briefing-details`);
  const briefingDetails = await page.evaluate(() => ({
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    hasDetails: (document.body.textContent || '').includes('Par Time') && (document.body.textContent || '').includes('Reward'),
  }));

  await clickByText(page, /^Loadout$/);
  await page.waitForFunction(() => document.body.textContent?.includes('LOADOUT REVIEW'));
  await snapshot(page, `${sizeLabel}-loadout-ordnance`);
  const loadoutOrdnance = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
    tablist: document.querySelector('[data-menu="loadout"] [role="tablist"]') !== null,
    carousel: (() => {
      const region = document.querySelector('[data-menu="loadout"] [role="region"][aria-roledescription="carousel"]');
      if (!region) return null;
      const scroller = region.firstElementChild;
      return { scrollable: scroller && scroller.scrollWidth > scroller.clientWidth };
    })(),
    hasWeapons: (document.body.textContent || '').includes('Pulse Cannon') && (document.body.textContent || '').includes('Ion Missile'),
  }));

  // Launch via Sortie tab (mobile) or visible sidebar (desktop). Both expose a "Launch" button.
  await clickTab(page, 'Sortie').catch(() => { /* sortie tab not interactable when collapsed on desktop */ });
  await snapshot(page, `${sizeLabel}-loadout-sortie`);
  await clickByText(page, /Launch/);
  await page.waitForFunction(() => document.body.textContent?.includes('DESTROY RADAR TOWERS: 0 / 3'));
  await page.waitForTimeout(900);
  await snapshot(page, `${sizeLabel}-hud`);
  const mission = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const touch = document.querySelector('.touch-controls');
    const text = document.body.textContent || '';
    return {
      viewport: { width: innerWidth, height: innerHeight },
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      canvas: canvas ? { width: canvas.clientWidth, height: canvas.clientHeight } : null,
      touchDisplay: touch ? getComputedStyle(touch).display : null,
      hasTouchLabels: text.includes('FIRE') && text.includes('BOOST') && text.includes('MSL') && text.includes('BRK') && text.includes('LOCK') && text.includes('LEVEL') && text.includes('VIEW'),
      hasJoystick: document.querySelector('.touch-joystick') !== null,
      hasDragZone: document.querySelector('.touch-drag-zone') !== null,
      hasHud: text.includes('LOW //') && text.includes('DESTROY RADAR TOWERS: 0 / 3'),
      hudRegions: Array.from(document.querySelectorAll('[data-hud-region]')).map(el => el.getAttribute('data-hud-region')),
      vitalsPresent: document.querySelector('[data-hud-region="vitals"]') !== null,
      objectivesPresent: document.querySelector('[data-hud-region="objectives"]') !== null,
      hasRadarCompass: text.includes('N') && text.includes('E') && text.includes('W'),
    };
  });

  await context.close();
  return {
    requested: { width, height, landscape: isLandscape },
    menuCommand, menuCareer, menuSystem,
    settingsCheck, campaign,
    briefingObjective, briefingDetails,
    loadoutOrdnance,
    mission, pageErrors,
  };
}

function assertViewport(entry) {
  const checks = [
    ['menu.viewport.w', entry.menuCommand.viewport.width === entry.requested.width],
    ['menu.viewport.h', entry.menuCommand.viewport.height === entry.requested.height],
    ['menu.tablist', entry.menuCommand.tablist],
    ['menu.tabCount=3', entry.menuCommand.tabCount === 3],
    ['menu.hasNextSortie', entry.menuCommand.hasNextSortie],
    ['menu.command.noOverflowX', !entry.menuCommand.overflowX],
    ['menu.command.noOverflowY', !entry.menuCommand.overflowY],
    ['menu.career.noOverflowY', !entry.menuCareer.overflowY],
    ['menu.system.noOverflowY', !entry.menuSystem.overflowY],
    ['menu.system.hasShellActions', entry.menuSystem.hasShellActions],
    ['settings.hasControls', entry.settingsCheck.hasControls],
    ['settings.noOverflowX', !entry.settingsCheck.overflowX],
    ['settings.noOverflowY', !entry.settingsCheck.overflowY],
    ['campaign.hasMissionList', entry.campaign.hasMissionList],
    ['campaign.noOverflowX', !entry.campaign.overflowX],
    ['briefing.tablist', entry.briefingObjective.tablist],
    ['briefing.hasNightGrid', entry.briefingObjective.hasNightGrid],
    ['briefing.objective.noOverflowY', !entry.briefingObjective.overflowY],
    ['briefing.details.hasDetails', entry.briefingDetails.hasDetails],
    ['briefing.details.noOverflowY', !entry.briefingDetails.overflowY],
    ['loadout.tablist', entry.loadoutOrdnance.tablist],
    ['loadout.carousel.scrollable', entry.loadoutOrdnance.carousel && entry.loadoutOrdnance.carousel.scrollable],
    ['loadout.hasWeapons', entry.loadoutOrdnance.hasWeapons],
    ['loadout.noOverflowX', !entry.loadoutOrdnance.overflowX],
    ['mission.canvas.w', entry.mission.canvas?.width === entry.requested.width],
    ['mission.canvas.h', entry.mission.canvas?.height === entry.requested.height],
    ['mission.touchDisplay', entry.mission.touchDisplay === 'flex'],
    ['mission.hasTouchLabels', entry.mission.hasTouchLabels],
    ['mission.noJoystick', !entry.mission.hasJoystick],
    ['mission.hasDragZone', entry.mission.hasDragZone],
    ['mission.hasHud', entry.mission.hasHud],
    ['mission.vitalsRegion', entry.mission.vitalsPresent],
    ['mission.objectivesRegion', entry.mission.objectivesPresent],
    ['mission.hasRadarCompass', entry.mission.hasRadarCompass],
    ['mission.noOverflowX', !entry.mission.overflowX],
    ['pageErrors=0', entry.pageErrors.length === 0],
  ];

  const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return { ok: failures.length === 0, failures };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const portrait = await smokeViewport(browser, 390, 844);
  const landscape = await smokeViewport(browser, 844, 390);
  await browser.close();

  const portraitResult = assertViewport(portrait);
  const landscapeResult = assertViewport(landscape);
  const result = {
    portrait: { ...portrait, _result: portraitResult },
    landscape: { ...landscape, _result: landscapeResult },
  };
  console.log(JSON.stringify(result, null, 2));

  if (!portraitResult.ok || !landscapeResult.ok) {
    console.error('PORTRAIT failures:', portraitResult.failures);
    console.error('LANDSCAPE failures:', landscapeResult.failures);
    process.exit(1);
  }
  console.log('SMOKE: PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
