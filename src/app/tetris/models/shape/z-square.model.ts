import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class ZShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.RED;
    this.setPieceWidth(3);
    this.setPieceHeight(2);
    this.piece = [
      [this.color, this.color, COLOR.BLACK],
      [COLOR.BLACK, this.color, this.color],
    ];
  }
}
