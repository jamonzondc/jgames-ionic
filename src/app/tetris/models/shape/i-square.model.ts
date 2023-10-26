import { PositionInterfaces } from '../../interfaces';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class IShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.CYAN;
    this.setPieceWidth(1);
    this.setPieceHeight(4);
    this.piece = [[this.color], [this.color], [this.color], [this.color]];
  }
}
