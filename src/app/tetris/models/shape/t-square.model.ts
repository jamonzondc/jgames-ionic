import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class TShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.PINK;
    this.setPieceWidth(3);
    this.setPieceHeight(2);
    this.piece = [
      [this.color, this.color, this.color],
      [COLOR.BLACK, this.color, COLOR.BLACK],
    ];
  }
}
