import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class JShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.BLUE;
    this.setPieceWidth(2);
    this.setPieceHeight(3);
    this.piece = [
      [COLOR.BLACK, this.color],
      [COLOR.BLACK, this.color],
      [this.color, this.color],
    ];
  }
}
