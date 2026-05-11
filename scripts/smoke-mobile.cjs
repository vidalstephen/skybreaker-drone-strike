const { chromium } = require('playwright');

const url = process.env.SMOKE_URL ?? 'https://skybreaker.nsystems.live';

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
  await page.waitForFunction(() => document.body.textContent?.includes('HANGAR') || document.body.textContent?.includes('Next Sortie'));
  const menu = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasShellActions: ['Campaign', 'Loadout', 'Pilot Record', 'Settings', 'Controls'].every(label => (document.body.textContent || '').includes(label)),
  }));

  await clickByText(page, /Settings/);
  await page.waitForFunction(() => document.body.textContent?.includes('CONFIGURATION'));
  await clickByText(page, /Video/);
  const settingsCheck = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasControls: ['Audio', 'Video', 'Controls', 'System', 'LOW', 'Reduced Effects', 'Telemetry'].every(label => (document.body.textContent || '').includes(label)),
  }));

  await clickByText(page, /Back/);
  await page.waitForFunction(() => document.body.textContent?.includes('Campaign'));
  await clickByText(page, /Campaign/);
  await page.waitForFunction(() => document.body.textContent?.includes('MISSION SELECT'));
  const campaign = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasMissionList: (document.body.textContent || '').includes('SIGNAL BREAK') && (document.body.textContent || '').includes('Mission 01'),
  }));
  await clickByText(page, /Briefing/);
  await page.waitForFunction(() => document.body.textContent?.includes('Mission Briefing'));
  const briefing = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasNightGrid: (document.body.textContent || '').includes('Night Grid'),
    hasDetails: (document.body.textContent || '').includes('Par Time') && (document.body.textContent || '').includes('Reward'),
  }));

  await clickByText(page, /Loadout/);
  await page.waitForFunction(() => document.body.textContent?.includes('LOADOUT REVIEW'));
  const loadout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    hasWeapons: (document.body.textContent || '').includes('Pulse Cannon') && (document.body.textContent || '').includes('Ion Missile'),
  }));
  await clickByText(page, /Launch/);
  await page.waitForFunction(() => document.body.textContent?.includes('DESTROY RADAR TOWERS: 0 / 3'));
  await page.waitForTimeout(900);
  const mission = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const touch = document.querySelector('.touch-controls');
    const text = document.body.textContent || '';
    return {
      viewport: { width: innerWidth, height: innerHeight },
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      canvas: canvas ? { width: canvas.clientWidth, height: canvas.clientHeight } : null,
      touchDisplay: touch ? getComputedStyle(touch).display : null,
      hasTouchLabels: text.includes('FIRE') && text.includes('BOOST') && text.includes('MSL') && text.includes('BRK') && text.includes('LOCK') && text.includes('LEVEL') && text.includes('VIEW'),
      hasHud: text.includes('LOW //') && text.includes('DESTROY RADAR TOWERS: 0 / 3') && text.includes('Operational Objectives'),
      hasRadarCompass: text.includes('N') && text.includes('E') && text.includes('W'),
    };
  });

  await context.close();
  return { requested: { width, height }, menu, settingsCheck, campaign, briefing, loadout, mission, pageErrors };
}

function assertViewport(entry) {
  const checks = [
    entry.menu.viewport.width === entry.requested.width,
    entry.menu.viewport.height === entry.requested.height,
    entry.menu.hasShellActions,
    !entry.menu.overflow,
    entry.settingsCheck.hasControls,
    !entry.settingsCheck.overflow,
    entry.campaign.hasMissionList,
    !entry.campaign.overflow,
    entry.briefing.hasNightGrid,
    entry.briefing.hasDetails,
    !entry.briefing.overflow,
    entry.loadout.hasWeapons,
    !entry.loadout.overflow,
    entry.mission.canvas?.width === entry.requested.width,
    entry.mission.canvas?.height === entry.requested.height,
    entry.mission.touchDisplay === 'flex',
    entry.mission.hasTouchLabels,
    entry.mission.hasHud,
    entry.mission.hasRadarCompass,
    !entry.mission.overflow,
    entry.pageErrors.length === 0,
  ];

  return checks.every(Boolean);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const portrait = await smokeViewport(browser, 390, 844);
  const landscape = await smokeViewport(browser, 844, 390);
  await browser.close();

  const result = { portrait, landscape };
  console.log(JSON.stringify(result, null, 2));

  if (!assertViewport(portrait) || !assertViewport(landscape)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
