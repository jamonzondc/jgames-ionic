import { PositionInterfaces } from '../../interfaces';
import { BlockTypeEnum } from '../block-type.enum';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class OShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.YELLOW;
    this.setPieceWidth(2);
    this.setPieceHeight(2);
    this.piece = [
      [
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
      [
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
    ];
  }
}
