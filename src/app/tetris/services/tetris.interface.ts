import { Observable } from 'rxjs';
import { ShapeModel } from '../models';
import { BlockInterface } from '../models/block.interface';
import { BoardInterface } from '../models/board.interface';

export interface TetrisInterface {
  buildBoard(height: number, width: number, blockSize: number): BoardInterface;
  getShapes(): Observable<Array<ShapeModel>>;
  gameOver(board: Array<BlockInterface[]>): boolean;
  getRamdonPiece(): ShapeModel;
  removeCompletedRows(board: BoardInterface): Promise<void>;
  checkCollition(
    yPiecePosition: number,
    xPiecePosition: number,
    piece: Array<BlockInterface[]>,
    board: BoardInterface,
    pieceWidth: number,
    boardWidth: number
  ): boolean;
  solidifyPiece(
    shape: ShapeModel | undefined,
    board: Array<BlockInterface[]>
  ): void;
  arrowActions(
    key: string,
    shape: ShapeModel | undefined,
    board: BoardInterface
  ): void;
  arrowUp(shape: ShapeModel | undefined, board: BoardInterface): void;
  arrowDown(shape: ShapeModel | undefined, board: BoardInterface): void;
  arrowLeft(shape: ShapeModel | undefined, board: BoardInterface): void;
  arrowRight(shape: ShapeModel | undefined, board: BoardInterface): void;
  forEachItem(
    target: Array<BlockInterface[]>,
    callBack: (cell: BlockInterface, x: number, y: number) => void
  ): void;
  getOneShape(width: number): ShapeModel | undefined;
  pushNextShape(): void;
  buildShapes(): void;
}
