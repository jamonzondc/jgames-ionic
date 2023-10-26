import { Injectable } from '@angular/core';
import { TetrisInterface } from './tetris.interface';
import {
  IShapeModel,
  LShapeModel,
  OShapeModel,
  ShapeModel,
  TShapeModel,
  ZShapeModel,
} from '../models';
import { COLOR } from '../models/color.enum';
import { JShapeModel } from '../models/shape/j-square.model';
import { SShapeModel } from '../models/shape/s-square.model';

@Injectable({
  providedIn: 'root',
})
export class TetrisService implements TetrisInterface {
  private readonly numeberOfRotatationInPiece: number = 4;
  private readonly pieces: ShapeModel[] = [
    new IShapeModel(),
    new JShapeModel(),
    new LShapeModel(),
    new OShapeModel(),
    new SShapeModel(),
    new TShapeModel(),
    new ZShapeModel(),
  ];
  constructor() {}

  public getRamdonPiece(width: number): ShapeModel {
    const nextPiece: ShapeModel =
      this.pieces[Math.floor(Math.random() * this.pieces.length)];
    //Rotar un numero random para que no salga siempre
    //de la misma forma
    this.rotatePiece(nextPiece);

    nextPiece.setPosition({
      x: Math.floor(Math.random() * (width - nextPiece.getPieceWidth())),
      y: 0,
    });
    return nextPiece;
  }

  private rotatePiece(piece: ShapeModel): void {
    for (
      let index = 0;
      index < Math.floor(Math.random() * this.numeberOfRotatationInPiece);
      index++
    ) {
      piece.setPiece(piece.rotate());
    }
  }

  public initBoard(height: number, width: number): Array<COLOR[]> {
    const board: Array<COLOR[]> = [];
    for (let y: number = 0; y < height; y++) {
      board[y] = [];
      for (let x: number = 0; x < width; x++) {
        board[y][x] = COLOR.BLACK;
      }
    }
    return board;
  }

  public arrowActions(
    key: string,
    shape: ShapeModel,
    board: Array<COLOR[]>
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

  public arrowUp(shape: ShapeModel, board: Array<COLOR[]>): void {
    if (
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x,
        shape.rotate(),
        board
      )
    )
      shape.setPiece(shape.rotate());
  }

  public arrowDown(shape: ShapeModel, board: Array<COLOR[]>): void {
    if (
      !this.checkCollition(
        shape.getPosition().y + 1,
        shape.getPosition().x,
        shape.getPiece(),
        board
      )
    )
      shape.getPosition().y++;
  }

  public arrowLeft(shape: ShapeModel, board: Array<COLOR[]>): void {
    if (
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x - 1,
        shape.getPiece(),
        board
      )
    )
      shape.getPosition().x--;
  }

  public arrowRight(shape: ShapeModel, board: Array<COLOR[]>): void {
    if (
      !this.checkCollition(
        shape.getPosition().y,
        shape.getPosition().x + 1,
        shape.getPiece(),
        board
      )
    )
      shape.getPosition().x++;
  }

  public checkCollition(
    yPiecePosition: number,
    xPiecePosition: number,
    piece: COLOR[][],
    board: Array<COLOR[]>
  ): boolean {
    if (yPiecePosition + piece.length - 1 === board.length) return true;
    return piece.some((row: COLOR[], y: number): boolean =>
      row.some(
        (cell: COLOR, x: number): boolean =>
          cell !== COLOR.BLACK &&
          board[y + yPiecePosition][x + xPiecePosition] !== COLOR.BLACK
      )
    );
  }

  public solidifyPiece(shape: ShapeModel, board: Array<COLOR[]>): void {
    shape.getPiece().forEach((row, y: number): void => {
      row.forEach((value, x: number): void => {
        if (value !== COLOR.BLACK)
          board[y + shape.getPosition().y][x + shape.getPosition().x] =
            shape.getColor();
      });
    });
  }

  public gameOver(board: Array<COLOR[]>): boolean {
    return board[0].some((cell: COLOR): boolean => cell !== COLOR.BLACK);
  }

  public removeCompletedRows(board: Array<COLOR[]>): void {
    for (let y = board.length - 1; y >= 0; y--) {
      const row: COLOR[] = board[y];
      if (row.every((cell: COLOR): boolean => cell !== COLOR.BLACK)) {
        board.splice(y, 1);
        board.unshift(Array(board[0].length).fill(COLOR.BLACK));
        y++;
        //Increase score
      }
    }
  }
}
