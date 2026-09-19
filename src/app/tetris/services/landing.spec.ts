import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { IShapeModel, TShapeModel } from '../models';
import { BlockTypeEnum } from '../models/block-type.enum';
import { BoardInterface } from '../models/board.interface';
import { COLOR } from '../models/color.enum';
import { TetrisService } from './tetris.service';

describe('TetrisService landing and fit', () => {
  let service: TetrisService;
  let board: BoardInterface;

  const solid = () => ({ color: COLOR.GREEN, type: BlockTypeEnum.COLOR_BLOCK });
  const empty = () => ({ color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TetrisService,
        { provide: Store, useValue: { select: () => of(0), dispatch: () => undefined } },
      ],
    });
    service = TestBed.inject(TetrisService);
    board = service.buildBoard(15, 10, 40);
    board.board = board.board.map((row) => row.map(empty));
  });

  describe('hasLanded', () => {
    it('is false while there is still room below', () => {
      const shape = new TShapeModel();
      shape.setPosition({ x: 4, y: 0 });

      expect(service.hasLanded(shape, board)).toBe(false);
    });

    it('is true on the floor', () => {
      const shape = new TShapeModel();
      shape.setPosition({ x: 4, y: 13 });

      expect(service.hasLanded(shape, board)).toBe(true);
    });

    it('is true resting on the stack', () => {
      board.board[10] = board.board[10].map(solid);
      const shape = new TShapeModel();
      shape.setPosition({ x: 4, y: 8 });

      expect(service.hasLanded(shape, board)).toBe(true);
    });

    it('is false for a piece against the right wall with room below', () => {
      // Touching a wall is not landing: the piece must keep falling.
      const shape = new TShapeModel();
      shape.setPosition({ x: 7, y: 2 });

      expect(service.hasLanded(shape, board)).toBe(false);
    });
  });

  describe('fits', () => {
    it('is true on an empty board', () => {
      const shape = new TShapeModel();
      shape.setPosition({ x: 4, y: 0 });

      expect(service.fits(shape, board)).toBe(true);
    });

    it('is false when the entry square is already taken', () => {
      board.board[0] = board.board[0].map(solid);
      const shape = new TShapeModel();
      shape.setPosition({ x: 4, y: 0 });

      expect(service.fits(shape, board)).toBe(false);
    });

    it('is true when a tall stack still leaves the entry square free', () => {
      // Eleven rows high in one column: an upright I landing on it reaches the
      // top row, but there is plenty of board left to keep playing.
      for (let y = 4; y < 15; y++) board.board[y][0] = solid();
      const shape = new TShapeModel();
      shape.setPosition({ x: 5, y: 0 });

      expect(service.fits(shape, board)).toBe(true);
    });
  });

  describe('rotate', () => {
    it('leaves the piece untouched when the rotation is only inspected', () => {
      const shape = new IShapeModel();
      const width: number = shape.getPieceWidth();
      const height: number = shape.getPieceHeight();

      shape.rotate();

      // Asking what a rotation looks like must not half-apply it: arrowUp
      // inspects the rotation before deciding whether it collides.
      expect(shape.getPieceWidth()).toBe(width);
      expect(shape.getPieceHeight()).toBe(height);
    });

    it('updates the dimensions when the rotation is applied', () => {
      const shape = new IShapeModel();
      const width: number = shape.getPieceWidth();

      shape.setPiece(shape.rotate());

      expect(shape.getPieceWidth()).not.toBe(width);
      expect(shape.getPieceWidth()).toBe(shape.getPiece()[0].length);
      expect(shape.getPieceHeight()).toBe(shape.getPiece().length);
    });

    it('keeps the declared width correct after a rotation is refused', () => {
      // An upright I hard against the right wall cannot rotate flat.
      const shape = new IShapeModel();
      shape.setPiece(shape.rotate());
      shape.setPosition({ x: 9, y: 5 });

      service.arrowUp(shape, board);

      expect(shape.getPieceWidth()).toBe(shape.getPiece()[0].length);
    });
  });
});
