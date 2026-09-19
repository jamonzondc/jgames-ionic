import { test, expect, Page } from '@playwright/test';
import { GameDriver } from './helpers';

/**
 * Records what the page does with its audio elements. Instrumenting the
 * browser rather than the game keeps the game itself free of test hooks.
 */
const recordAudio = (page: Page): Promise<void> =>
  page.addInitScript(() => {
    const log: string[] = [];
    (window as unknown as { __audio: string[] }).__audio = log;

    const play = HTMLMediaElement.prototype.play;
    const pause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if ((this.src || '').includes('game-music')) log.push('play');
      return play.call(this);
    };
    HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
      if ((this.src || '').includes('game-music')) log.push('pause');
      return pause.call(this);
    };
  });

const audioLog = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as { __audio: string[] }).__audio);

/**
 * Drives the page into and out of the background, as switching apps does.
 * Note this fakes the visibility state only: a really hidden tab also has its
 * animation frames frozen, which cannot be emulated here, so the game's own
 * catch-up-on-return handling is covered by the unit tests instead.
 */
const setPageHidden = (page: Page, hidden: boolean): Promise<void> =>
  page.evaluate((isHidden: boolean) => {
    Object.defineProperty(document, 'hidden', {
      value: isHidden,
      configurable: true,
    });
    Object.defineProperty(document, 'visibilityState', {
      value: isHidden ? 'hidden' : 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

test.describe('música', () => {
  test('no suena antes de que el jugador toque nada', async ({ page }) => {
    await recordAudio(page);
    await GameDriver.open(page);

    expect(await audioLog(page)).toEqual([]);
  });

  test('arranca con el primer gesto', async ({ page }) => {
    await recordAudio(page);
    const game: GameDriver = await GameDriver.open(page);

    await game.tap();

    expect(await audioLog(page)).toContain('play');
  });

  test('se para al pasar a segundo plano', async ({ page }) => {
    await recordAudio(page);
    const game: GameDriver = await GameDriver.open(page);
    await game.tap();

    await setPageHidden(page, true);

    // Switching to another app leaves the page alive in the background, so
    // without this the soundtrack plays on over whatever comes next.
    expect(await audioLog(page)).toContain('pause');
  });

  test('vuelve a sonar al regresar a la app', async ({ page }) => {
    await recordAudio(page);
    const game: GameDriver = await GameDriver.open(page);
    await game.tap();
    await setPageHidden(page, true);

    await setPageHidden(page, false);

    const log: string[] = await audioLog(page);
    expect(log.lastIndexOf('play')).toBeGreaterThan(log.indexOf('pause'));
  });

  test('sigue callada al volver si está silenciada', async ({ page }) => {
    await recordAudio(page);
    const game: GameDriver = await GameDriver.open(page);
    await game.tap();
    await page.locator('[aria-label="Silenciar"]').click();

    await setPageHidden(page, true);
    const before: number = (await audioLog(page)).filter(
      (entry: string): boolean => entry === 'play'
    ).length;
    await setPageHidden(page, false);

    const after: number = (await audioLog(page)).filter(
      (entry: string): boolean => entry === 'play'
    ).length;
    expect(after).toBe(before);
  });

  test('el botón de silencio recuerda la elección al recargar', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);
    await game.tap();
    await page.locator('[aria-label="Silenciar"]').click();

    await page.reload({ waitUntil: 'networkidle' });

    await expect(page.locator('[aria-label="Activar sonido"]')).toBeVisible();
  });
});
