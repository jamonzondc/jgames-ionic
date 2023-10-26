import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class OShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.YELLOW;
    this.setPieceWidth(2);
    this.setPieceHeight(2);
    this.piece = [
      [this.color, this.color],
      [this.color, this.color],
    ];
  }
}
