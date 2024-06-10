import { PositionInterfaces } from '../../interfaces';
import { BlockInterface } from '../block.interface';
import { COLOR } from '../color.enum';

export abstract class ShapeModel {
  protected piece: Array<BlockInterface[]> = [];
  protected color: COLOR = COLOR.BLACK;
  protected pieceHeight: number = 0;
  protected pieceWidth: number = 0;
  protected position: PositionInterfaces = { y: 0, x: 0 };

  public getPosition(): PositionInterfaces {
    return this.position;
  }

  public setPosition(position: PositionInterfaces): void {
    this.position = position;
  }

  public getColor(): COLOR {
    return this.color;
  }

  public setColor(color: COLOR): void {
    this.color = color;
  }

  public getPieceHeight(): number {
    return this.pieceHeight;
  }
  public getPieceWidth(): number {
    return this.pieceWidth;
  }
  public setPieceHeight(pieceHeight: number): void {
    this.pieceHeight = pieceHeight;
  }
  public setPieceWidth(pieceWidth: number): void {
    this.pieceWidth = pieceWidth;
  }

  public getPiece(): Array<BlockInterface[]> {
    return this.piece;
  }

  public setPiece(piece: Array<BlockInterface[]>): Array<BlockInterface[]> {
    return (this.piece = piece);
  }

  public rotate(): Array<BlockInterface[]> {
    return this.rotateImpl(this.piece);
  }

  private rotateImpl(piece: Array<BlockInterface[]>): Array<BlockInterface[]> {
    //Rotate matrix of nxm
    const n: number = piece.length;
    const m: number = piece[0].length;
    const rotatedMatrix: Array<BlockInterface[]> = [];
    for (let i: number = 0; i < m; i++) {
      rotatedMatrix.push([]);
      for (let j = n - 1; j >= 0; j--) {
        rotatedMatrix[i].push(piece[j][i]);
      }
    }

    this.pieceWidth = rotatedMatrix[0].length;
    this.pieceHeight = rotatedMatrix.length;
    return rotatedMatrix;
  }
}
