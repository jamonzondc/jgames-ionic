import { test, expect } from '@playwright/test';
import { BOARD_COLUMNS, GameDriver, PIECE_CELLS } from './helpers';

const PIECE: number = PIECE_CELLS;

test.describe('gestos táctiles', () => {
  test('un deslizamiento hacia abajo asienta exactamente una pieza', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.flickDown();

    // The bug this guards: the release used to carry over to the piece that
    // replaced the one being played, costing the player two pieces per
    // gesture and filling the board in seconds.
    expect(await game.settledCells()).toBe(PIECE);
  });

  test('varios deslizamientos seguidos asientan una pieza cada uno', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    for (let i = 1; i <= 3; i++) {
      await game.flickDown();
      expect(await game.settledCells()).toBe(PIECE * i);
    }
  });

  test('deslizamientos encadenados sin pausa no arrastran piezas de más', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    // No breathing room between gestures: this is where a release could land
    // on the newcomer.
    await game.flickDown();
    await game.flickDown();

    expect(await game.settledCells()).toBe(PIECE * 2);
  });

  test('un arrastre lateral no asienta ninguna pieza', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.dragSideways(-3);

    expect(await game.settledCells()).toBe(0);
  });

  test('un toque no asienta ninguna pieza', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.tap();

    expect(await game.settledCells()).toBe(0);
  });

  test('una pulsación larga no cuenta como toque', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.longPress();

    expect(await game.settledCells()).toBe(0);
  });

  test('un arrastre lento hacia abajo no suelta la pieza de golpe', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.dragDown(3);

    // It descends, but it is still in play rather than settled at the floor.
    expect(await game.settledCellsAtBottom()).toBe(0);
  });
});

test.describe('límites del tablero', () => {
  test('arrastrar contra la pared no saca la pieza del tablero', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.dragSideways(-BOARD_COLUMNS * 2);
    await game.flickDown();

    const board: string[] = await game.readBoard();
    board.forEach((row: string): void => {
      expect(row).toHaveLength(BOARD_COLUMNS);
    });
    expect(await game.settledCells()).toBe(PIECE);
  });

  test('arrastrar a ambas paredes deja la pieza dentro', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.dragSideways(-BOARD_COLUMNS);
    await game.dragSideways(BOARD_COLUMNS * 2);
    await game.flickDown();

    expect(await game.settledCells()).toBe(PIECE);
  });

  test('rotar pegado a la pared no rompe la partida', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.dragSideways(BOARD_COLUMNS);
    for (let i = 0; i < 4; i++) await game.tap();
    await game.flickDown();

    expect(await game.isGameOverShowing()).toBe(false);
    expect(await game.settledCells()).toBe(PIECE);
  });
});

test.describe('fin de partida', () => {
  test('la partida sigue mientras quepan piezas', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    // Spread across the board, so the stack stays low and nothing tops out.
    for (const columns of [-BOARD_COLUMNS, BOARD_COLUMNS, -3, 3, 0]) {
      await game.dragSideways(columns);
      await game.flickDown();
    }

    expect(await game.isGameOverShowing()).toBe(false);
  });

  test('la pieza soltada llega hasta el fondo', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await game.flickDown();

    const board: string[] = await game.readBoard();
    expect(board[board.length - 1]).toContain('#');
  });

  test('los bloques asentados no se pierden ni se duplican', async ({
    page,
  }) => {
    const game: GameDriver = await GameDriver.open(page);

    // Stacked in one corner, so no row ever completes and the count is only
    // ever four more per piece.
    for (let i = 1; i <= 3; i++) {
      await game.dragSideways(-BOARD_COLUMNS);
      await game.flickDown();
      expect(await game.settledCells()).toBe(PIECE * i);
    }
  });
});

test.describe('pausa', () => {
  test('en pausa los gestos no asientan piezas', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);
    const before: number = await game.settledCells();

    await page.locator('[aria-label="Pausa"]').click();
    await expect(page.locator('ion-modal#tetrisMenuId')).toBeVisible();

    await game.flickDown();
    await game.flickDown();

    await page
      .locator('ion-modal#tetrisMenuId ion-button', { hasText: 'Resume' })
      .click();
    await expect(page.locator('ion-modal#tetrisMenuId')).toBeHidden();

    expect(await game.settledCells()).toBe(before);
  });

  test('tras reanudar el juego vuelve a responder', async ({ page }) => {
    const game: GameDriver = await GameDriver.open(page);

    await page.locator('[aria-label="Pausa"]').click();
    await expect(page.locator('ion-modal#tetrisMenuId')).toBeVisible();
    await page
      .locator('ion-modal#tetrisMenuId ion-button', { hasText: 'Resume' })
      .click();
    await expect(page.locator('ion-modal#tetrisMenuId')).toBeHidden();

    await game.flickDown();

    expect(await game.settledCells()).toBe(PIECE);
  });
});
