import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class SShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.GREEN;
    this.setPieceWidth(3);
    this.setPieceHeight(2);
    this.piece = [
      [COLOR.BLACK, this.color, this.color],
      [this.color, this.color, COLOR.BLACK],
    ];
  }
}
