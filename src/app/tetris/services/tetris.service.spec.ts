import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { BlockTypeEnum } from '../models/block-type.enum';
import { BoardInterface } from '../models/board.interface';
import { TShapeModel } from '../models';
import { TetrisService } from './tetris.service';

describe('TetrisService', () => {
  let service: TetrisService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TetrisService,
        {
          provide: Store,
          useValue: { select: () => of(0), dispatch: () => undefined },
        },
      ],
    });
    service = TestBed.inject(TetrisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds an empty board of the requested size', () => {
    const board: BoardInterface = service.buildBoard(15, 10, 40);

    expect(board.BOARD_HEIGHT).toBe(15);
    expect(board.BOARD_WIDTH).toBe(10);
    expect(board.BLOCK_SIZE).toBe(40);
    expect(board.board).toHaveLength(15);
    board.board.forEach((row) => {
      expect(row).toHaveLength(10);
      row.forEach((cell) =>
        expect(cell.type).toBe(BlockTypeEnum.EMPTY_BLOCK)
      );
    });
  });

  it('moves a piece sideways within the board', () => {
    const board: BoardInterface = service.buildBoard(15, 10, 40);
    const shape = new TShapeModel();
    shape.setPosition({ x: 4, y: 0 });

    service.arrowRight(shape, board);
    expect(shape.getPosition().x).toBe(5);

    service.arrowLeft(shape, board);
    expect(shape.getPosition().x).toBe(4);
  });

  it('refuses to move a piece past the left wall', () => {
    const board: BoardInterface = service.buildBoard(15, 10, 40);
    const shape = new TShapeModel();
    shape.setPosition({ x: 0, y: 0 });

    service.arrowLeft(shape, board);

    expect(shape.getPosition().x).toBe(0);
  });

  it('writes a settled piece into the board', () => {
    const board: BoardInterface = service.buildBoard(15, 10, 40);
    const shape = new TShapeModel();
    shape.setPosition({ x: 4, y: 13 });

    service.solidifyPiece(shape, board.board);

    expect(board.board[13][4].type).toBe(BlockTypeEnum.COLOR_BLOCK);
    expect(board.board[13][5].type).toBe(BlockTypeEnum.COLOR_BLOCK);
    expect(board.board[13][6].type).toBe(BlockTypeEnum.COLOR_BLOCK);
    expect(board.board[14][5].type).toBe(BlockTypeEnum.COLOR_BLOCK);
  });

  it('hands out the queued pieces one at a time', () => {
    service.buildShapes();

    const first = service.getOneShape(10);
    service.pushNextShape();
    const second = service.getOneShape(10);

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
  });
});
