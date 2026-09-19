import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { BlockTypeEnum } from '../models/block-type.enum';
import { BoardInterface } from '../models/board.interface';
import { COLOR } from '../models/color.enum';
import { TetrisService } from './tetris.service';

/**
 * Clearing a row is animated: cells are blanked one at a time with a wait in
 * between, and only then is the row spliced out. That makes the call long
 * lived, so what else runs during it matters.
 */
describe('TetrisService row clearing', () => {
  let service: TetrisService;
  let board: BoardInterface;

  const solid = () => ({ color: COLOR.GREEN, type: BlockTypeEnum.COLOR_BLOCK });
  const empty = () => ({ color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK });

  /** Rows as strings, "#" for a filled cell, "." for an empty one. */
  const render = (b: BoardInterface): string[] =>
    b.board.map((row) =>
      row
        .map((cell) => (cell.type === BlockTypeEnum.COLOR_BLOCK ? '#' : '.'))
        .join('')
    );

  const fillRow = (y: number): void => {
    board.board[y] = board.board[y].map(solid);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        TetrisService,
        { provide: Store, useValue: { select: () => of(0), dispatch: () => undefined } },
      ],
    });
    service = TestBed.inject(TetrisService);
    board = service.buildBoard(5, 4, 20);
    board.board = board.board.map((row) => row.map(empty));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clears one full row and drops what was above it', async () => {
    fillRow(4);
    board.board[2][0] = solid();

    const clearing = service.removeCompletedRows(board);
    await jest.advanceTimersByTimeAsync(2000);
    await clearing;

    expect(render(board)).toEqual(['....', '....', '....', '#...', '....']);
  });

  it('keeps the board consistent when a second clear starts mid-animation', async () => {
    // Two full rows with a lone block resting on top of them.
    fillRow(3);
    fillRow(4);
    board.board[2][0] = solid();

    // The game loop fires this and does not await it.
    const first = service.removeCompletedRows(board);
    // A piece landing during the animation triggers a second, overlapping run.
    await jest.advanceTimersByTimeAsync(50);
    const second = service.removeCompletedRows(board);

    await jest.advanceTimersByTimeAsync(4000);
    await Promise.all([first, second]);

    // Both rows go, and the lone block ends up resting on the floor.
    expect(render(board)).toEqual(['....', '....', '....', '....', '#...']);
  });
});
