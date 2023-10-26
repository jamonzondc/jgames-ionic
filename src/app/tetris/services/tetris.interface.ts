import { ShapeModel } from '../models';
import { COLOR } from '../models/color.enum';

//D of SOLID
export interface TetrisInterface {
  initBoard(height: number, width: number): Array<COLOR[]>;
  gameOver(board: Array<COLOR[]>): boolean;
  getRamdonPiece(width: number): ShapeModel;
  removeCompletedRows(board: Array<COLOR[]>): void;
  checkCollition(
    yPiecePosition: number,
    xPiecePosition: number,
    piece: COLOR[][],
    board: Array<COLOR[]>
  ): boolean;
  solidifyPiece(shape: ShapeModel, board: Array<COLOR[]>): void;
  arrowActions(key: string, shape: ShapeModel, board: Array<COLOR[]>): void;
  arrowUp(shape: ShapeModel, board: Array<COLOR[]>): void;
  arrowDown(shape: ShapeModel, board: Array<COLOR[]>): void;
  arrowLeft(shape: ShapeModel, board: Array<COLOR[]>): void;
  arrowRight(shape: ShapeModel, board: Array<COLOR[]>): void;
}
