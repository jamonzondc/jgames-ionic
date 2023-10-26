import {
  ShapeModel,
  IShapeModel,
  JShapeModel,
  LShapeModel,
  OShapeModel,
  SShapeModel,
  TShapeModel,
  ZShapeModel,
} from './shape';

export class BoardModel {
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
  constructor(
    public BOARD_WIDTH: number,
    public BOARD_HEIGHT: number,
    public BLOCK_SIZE: number
  ) {}

  public getRamdonPiece(): ShapeModel {
    const nextPiece: ShapeModel =
      this.pieces[Math.floor(Math.random() * this.pieces.length)];
    //Rotar un numero random para que no salga siempre
    //de la misma forma
    this.rotatePiece(nextPiece);

    nextPiece.setPosition({
      x: Math.floor(
        Math.random() * (this.BOARD_WIDTH - nextPiece.getPieceWidth())
      ),
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
}
