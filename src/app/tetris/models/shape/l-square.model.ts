import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class LShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.ORANGE;
    this.setPieceWidth(2);
    this.setPieceHeight(3);
    this.piece = [
      [this.color, COLOR.BLACK],
      [this.color, COLOR.BLACK],
      [this.color, this.color],
    ];
  }
}
