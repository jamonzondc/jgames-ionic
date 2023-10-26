import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';

export abstract class ShapeModel {
  protected piece: COLOR[][] = [];
  protected color: COLOR = COLOR.BLACK;
  protected pieceHeight: number = 0;
  protected pieceWidth: number = 0;
  protected position: PositionInterfaces = { y: 0, x: 5 };

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

  public getPiece(): COLOR[][] {
    return this.piece;
  }

  public setPiece(piece: COLOR[][]): COLOR[][] {
    return (this.piece = piece);
  }

  public rotate(): COLOR[][] {
    return this.rotateImpl(this.piece);
  }

  private rotateImpl(piece: COLOR[][]): COLOR[][] {
    //Rotate matrix of nxm
    const n: number = piece.length;
    const m: number = piece[0].length;
    const rotatedMatrix: COLOR[][] = [];
    for (let i: number = 0; i < m; i++) {
      rotatedMatrix.push([]);
      for (let j = n - 1; j >= 0; j--) {
        rotatedMatrix[i].push(piece[j][i]);
      }
      if (this.pieceWidth < rotatedMatrix[i].length)
        this.pieceWidth = rotatedMatrix[i].length;
    }

    this.pieceHeight = rotatedMatrix.length;
    return rotatedMatrix;
  }
}
