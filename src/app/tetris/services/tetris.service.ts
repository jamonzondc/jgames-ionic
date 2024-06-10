import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { incrementScore } from 'src/app/shared/store/app.actions';
import { AppState } from 'src/app/shared/store/app.state.interface';
import {
  IShapeModel,
  JShapeModel,
  LShapeModel,
  OShapeModel,
  SShapeModel,
  ShapeModel,
  TShapeModel,
  ZShapeModel,
} from '../models';
import { BlockTypeEnum } from '../models/block-type.enum';
import { BlockInterface } from '../models/block.interface';
import { BoardInterface } from '../models/board.interface';
import { COLOR } from '../models/color.enum';
import { TetrisInterface } from './tetris.interface';

@Injectable({
  providedIn: 'root',
})
export class TetrisService implements TetrisInterface {
  private shapes: Array<ShapeModel> = [];
  private _shapes!: BehaviorSubject<Array<ShapeModel>>;
  private shapes$!: Observable<Array<ShapeModel>>;
  private readonly numeberOfRotatationInPiece: number = 4;
  private readonly pieces: any[] = [
    //TODO ver algun Utility Type
    IShapeModel,
    JShapeModel,
    LShapeModel,
    OShapeModel,
    SShapeModel,
    TShapeModel,
    ZShapeModel,
  ];
  constructor(private store: Store<AppState>) {}

  public getShapes(): Observable<Array<ShapeModel>> {
    return this.shapes$;
  }

  private rotatePiece(piece: ShapeModel): void {
    const ramdom: number = Math.floor(
      Math.random() * this.numeberOfRotatationInPiece
    );
    for (let index = 0; index < ramdom; index++) {
      piece.setPiece(piece.rotate());
    }
  }

  public buildBoard(
    height: number,
    width: number,
    blockSize: number
  ): BoardInterface {
    const board: Array<BlockInterface[]> = [];
    for (let y: number = 0; y < height; y++) {
      board[y] = Array(width).fill({
        color: COLOR.BLACK,
        type: BlockTypeEnum.EMPTY_BLOCK,
      });
    }
    return {
      BOARD_HEIGHT: height,
      BOARD_WIDTH: width,
      BLOCK_SIZE: blockSize,
      board,
    };
  }

  public arrowActions(
    key: string,
    shape: ShapeModel,
    board: BoardInterface
  ): void {
    const actions: any = {
      ArrowUp: (): void => this.arrowUp(shape, board),
      ArrowDown: (): void => this.arrowDown(shape, board),
      ArrowLeft: (): void => this.arrowLeft(shape, board),
      ArrowRight: (): void => this.arrowRight(shape, board),
    };
    if (!actions[key]) return;
    actions[key]();
  }

  public arrowUp(shape: ShapeModel, board: BoardInterface): void {
    if (
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x,
        shape.rotate(),
        board,
        shape.getPieceWidth(),
        board.BOARD_WIDTH
      )
    )
      shape.setPiece(shape.rotate());
    const sound = new Audio('assets/audio/rotate-1.mp3');
    sound.play();
  }

  public arrowDown(shape: ShapeModel | undefined, board: BoardInterface): void {
    if (
      shape &&
      !this.checkCollition(
        shape.getPosition().y + 1,
        shape.getPosition().x,
        shape.getPiece(),
        board,
        shape.getPieceWidth(),
        board.BOARD_WIDTH
      )
    )
      shape.getPosition().y++;
  }

  public arrowLeft(shape: ShapeModel | undefined, board: BoardInterface): void {
    if (
      shape &&
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x - 1,
        shape.getPiece(),
        board,
        shape.getPieceWidth(),
        board.BOARD_WIDTH
      )
    )
      shape.getPosition().x--;
  }

  public arrowRight(
    shape: ShapeModel | undefined,
    board: BoardInterface
  ): void {
    if (
      shape &&
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x + 1,
        shape.getPiece(),
        board,
        shape.getPieceWidth(),
        board.BOARD_WIDTH
      )
    )
      shape.getPosition().x++;
  }

  //TODO si hay colicion solidifica revisar esto, al intentar rotar como hay colicion
  // o al ester pegado a la derecha si hay colicion solidifica y esto no es correcto
  public checkCollition(
    yPiecePosition: number,
    xPiecePosition: number,
    piece: Array<BlockInterface[]>,
    board: BoardInterface,
    pieceWidth: number,
    boardWidth: number
  ): boolean {
    const boardHeight = board.board.length;
    return piece.some((row: BlockInterface[], y: number): boolean =>
      row.some(
        (cell: BlockInterface, x: number): boolean =>
          y + yPiecePosition === boardHeight ||
          x + xPiecePosition === boardWidth ||
          x + xPiecePosition < 0 ||
          (cell.type === BlockTypeEnum.COLOR_BLOCK &&
            board.board[y + yPiecePosition] &&
            board.board[y + yPiecePosition][x + xPiecePosition] &&
            board.board[y + yPiecePosition][x + xPiecePosition].type ===
              BlockTypeEnum.COLOR_BLOCK)
      )
    );
  }

  public solidifyPiece(
    shape: ShapeModel | undefined,
    board: Array<BlockInterface[]>
  ): void {
    shape?.getPiece().forEach((row, y: number): void => {
      row.forEach((cell: BlockInterface, x: number): void => {
        if (
          cell.type === BlockTypeEnum.COLOR_BLOCK &&
          board[y + shape.getPosition().y] &&
          board[y + shape.getPosition().y][x + shape.getPosition().x]
        )
          board[y + shape.getPosition().y][x + shape.getPosition().x] = {
            color: shape.getColor(),
            type: BlockTypeEnum.COLOR_BLOCK,
          };
      });
    });
  }

  public gameOver(board: Array<BlockInterface[]>): boolean {
    return board[0].some(
      (cell: BlockInterface): boolean => cell.type === BlockTypeEnum.COLOR_BLOCK
    );
  }

  private async wait(time: number = 0): Promise<void> {
    return new Promise<void>((resolve: () => void): void => {
      setTimeout((): void => resolve(), time);
    });
  }

  //TODO refactorizar menos lineas y hacer split
  public async removeCompletedRows(board: BoardInterface): Promise<void> {
    for (let y = board.board.length - 1; y >= 0; y--) {
      const row: BlockInterface[] = board.board[y];
      if (
        row.every(
          (cell: BlockInterface): boolean =>
            cell.type === BlockTypeEnum.COLOR_BLOCK
        )
      ) {
        let timeToWait: number = board.BOARD_WIDTH * 10;
        for (let index = 0; index < board.board[y].length; index++) {
          board.board[y][index] = {
            type: BlockTypeEnum.EMPTY_BLOCK,
            color: COLOR.BLACK,
          };
          await this.wait(timeToWait);
          timeToWait -= board.BOARD_WIDTH;
        }

        this.store.dispatch(incrementScore());

        board.board.splice(y, 1);
        board.board.unshift(
          Array(board.board[0].length).fill({
            type: BlockTypeEnum.EMPTY_BLOCK,
            color: COLOR.BLACK,
          })
        );
        y++;
        //Increase score
      }
    }
  }

  public forEachItem(
    target: Array<BlockInterface[]>,
    callBack: (cell: BlockInterface, x: number, y: number) => void
  ): void {
    target.forEach((row: BlockInterface[], y: number): void => {
      row.forEach((cell: BlockInterface, x: number): void => {
        callBack(cell, x, y);
      });
    });
  }

  public getOneShape(width: number): ShapeModel | undefined {
    const shape: ShapeModel | undefined = this.shapes?.shift();
    if (!shape) return undefined;
    console.info('---------SHAPE/s----->', {
      shape: shape.getPosition(),
      shapes: this.shapes.map((i) => i.getPosition()),
    });
    shape.getPosition().x = Math.floor(
      Math.random() * (width - shape.getPieceWidth())
    );
    return shape;
  }

  public pushNextShape(): void {
    const nextShape: ShapeModel = this.getRamdonPiece();
    this.shapes = [...this.shapes, nextShape];
    this._shapes.next(this.shapes);
  }

  public buildShapes(): void {
    const shape1: ShapeModel = this.getRamdonPiece();
    const shape2: ShapeModel = this.getRamdonPiece();
    const shape3: ShapeModel | undefined = this.getRamdonPiece();
    this.shapes = [shape1, shape2, shape3];
    this._shapes = new BehaviorSubject<Array<ShapeModel>>(this.shapes);
    this.shapes$ = this._shapes.asObservable();
  }

  public getRamdonPiece(): ShapeModel {
    const shapeType: any =
      this.pieces[Math.floor(Math.random() * this.pieces.length)];

    const shape: ShapeModel = new shapeType();
    this.rotatePiece(shape);

    return shape;
  }
}
