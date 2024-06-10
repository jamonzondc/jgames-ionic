import { PositionInterfaces } from '../../interfaces';
import { BlockTypeEnum } from '../block-type.enum';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class JShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.BLUE;
    this.setPieceWidth(2);
    this.setPieceHeight(3);
    this.piece = [
      [
        { color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
      [
        { color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
      [
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
    ];
  }
}
