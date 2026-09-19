import { Page, Locator, CDPSession } from '@playwright/test';

export const BOARD_COLUMNS: number = 10;
export const BOARD_ROWS: number = 15;
/** Every tetromino is four cells. */
export const PIECE_CELLS: number = 4;

/**
 * Drives the game the way a finger does. Playwright's touchscreen only taps,
 * so drags go through CDP, which is what lets a gesture emit several moves
 * before it is released.
 */
export class GameDriver {
  private constructor(
    private readonly page: Page,
    private readonly canvas: Locator,
    private readonly cdp: CDPSession,
    private readonly box: { x: number; y: number; width: number; height: number }
  ) {}

  static async open(page: Page): Promise<GameDriver> {
    await page.goto('/tetris', { waitUntil: 'networkidle' });
    const canvas: Locator = page.locator('#tetrisBoardId');
    await canvas.waitFor();
    // Long enough for the first piece to be painted, short enough that it has
    // not drifted down into the rows the assertions treat as settled.
    await page.waitForTimeout(400);

    const box = await canvas.boundingBox();
    if (!box) throw new Error('el tablero no es visible');
    const cdp: CDPSession = await page.context().newCDPSession(page);
    return new GameDriver(page, canvas, cdp, box);
  }

  private async touch(
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    x: number,
    y: number
  ): Promise<void> {
    await this.cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
    });
  }

  private point(column: number, row: number): { x: number; y: number } {
    return {
      x: this.box.x + ((column + 0.5) * this.box.width) / BOARD_COLUMNS,
      y: this.box.y + ((row + 0.5) * this.box.height) / BOARD_ROWS,
    };
  }

  async tap(): Promise<void> {
    const { x, y } = this.point(5, 1);
    await this.touch('touchStart', x, y);
    await this.touch('touchEnd', x, y);
    await this.page.waitForTimeout(80);
  }

  /** Holds too long to count as a tap. */
  async longPress(): Promise<void> {
    const { x, y } = this.point(5, 1);
    await this.touch('touchStart', x, y);
    await this.page.waitForTimeout(450);
    await this.touch('touchEnd', x, y);
    await this.page.waitForTimeout(80);
  }

  async dragSideways(columns: number): Promise<void> {
    const start = this.point(5, 1);
    const step: number = this.box.width / BOARD_COLUMNS;
    await this.touch('touchStart', start.x, start.y);
    for (let i = 1; i <= Math.abs(columns); i++) {
      const dx: number = Math.sign(columns) * i * step;
      await this.touch('touchMove', start.x + dx, start.y + 2);
      await this.page.waitForTimeout(16);
    }
    const dx: number = Math.sign(columns) * Math.abs(columns) * step;
    await this.touch('touchEnd', start.x + dx, start.y + 2);
    await this.page.waitForTimeout(120);
  }

  /** Quick downwards flick: the hard drop. */
  async flickDown(): Promise<void> {
    const start = this.point(5, 1);
    await this.touch('touchStart', start.x, start.y);
    await this.touch('touchMove', start.x, start.y + this.box.height * 0.3);
    await this.touch('touchMove', start.x, start.y + this.box.height * 0.8);
    await this.touch('touchEnd', start.x, start.y + this.box.height * 0.8);
    await this.page.waitForTimeout(250);
  }

  /** Slow downwards drag: the soft drop, never a hard drop. */
  async dragDown(rows: number): Promise<void> {
    const start = this.point(5, 1);
    const step: number = this.box.height / BOARD_ROWS;
    await this.touch('touchStart', start.x, start.y);
    for (let i = 1; i <= rows; i++) {
      await this.touch('touchMove', start.x + 1, start.y + i * step);
      await this.page.waitForTimeout(90);
    }
    await this.touch('touchEnd', start.x + 1, start.y + rows * step);
    await this.page.waitForTimeout(120);
  }

  /** The board as strings, "#" for a settled block. */
  async readBoard(): Promise<string[]> {
    return this.page.evaluate(
      ({ columns, rows }) => {
        const canvas = document.querySelector(
          '#tetrisBoardId'
        ) as HTMLCanvasElement;
        const context = canvas.getContext('2d')!;
        const size: number = canvas.width / columns;
        const output: string[] = [];
        for (let y = 0; y < rows; y++) {
          let line = '';
          for (let x = 0; x < columns; x++) {
            const pixel = context.getImageData(
              x * size + size / 2,
              y * size + size / 2,
              1,
              1
            ).data;
            // Solid blocks are bright at their centre; the landing ghost is
            // only a dim outline.
            line += pixel[0] + pixel[1] + pixel[2] > 330 ? '#' : '.';
          }
          output.push(line);
        }
        return output;
      },
      { columns: BOARD_COLUMNS, rows: BOARD_ROWS }
    );
  }

  async filledCells(): Promise<number> {
    const board: string[] = await this.readBoard();
    return board.join('').split('#').length - 1;
  }

  /**
   * Blocks that have settled, which is everything painted minus the four
   * cells of the piece still in play. Counting the whole board rather than
   * only its lower rows keeps this honest once the stack grows tall.
   */
  async settledCells(): Promise<number> {
    return Math.max(0, (await this.filledCells()) - PIECE_CELLS);
  }

  /** Blocks resting in the last three rows. */
  async settledCellsAtBottom(): Promise<number> {
    const board: string[] = await this.readBoard();
    return board.slice(BOARD_ROWS - 3).join('').split('#').length - 1;
  }

  /** Lowest row holding a block, or -1 when the board is empty. */
  async stackTop(): Promise<number> {
    const board: string[] = await this.readBoard();
    return board.findIndex((row: string): boolean => row.includes('#'));
  }

  async isGameOverShowing(): Promise<boolean> {
    return (await this.page.locator('ion-alert').count()) > 0;
  }
}
