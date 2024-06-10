import { PositionInterfaces } from '../../interfaces';
import { BlockTypeEnum } from '../block-type.enum';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class IShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.CYAN;
    this.setPieceWidth(1);
    this.setPieceHeight(4);
    this.piece = [
      [{ color: this.color, type: BlockTypeEnum.COLOR_BLOCK }],
      [{ color: this.color, type: BlockTypeEnum.COLOR_BLOCK }],
      [{ color: this.color, type: BlockTypeEnum.COLOR_BLOCK }],
      [{ color: this.color, type: BlockTypeEnum.COLOR_BLOCK }],
    ];
  }
}
