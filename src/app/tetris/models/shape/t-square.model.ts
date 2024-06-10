import { PositionInterfaces } from '../../interfaces';
import { BlockTypeEnum } from '../block-type.enum';
import { COLOR } from '../color.enum';
import { ShapeModel } from './shape.model';

export class TShapeModel extends ShapeModel {
  constructor() {
    super();
    this.color = COLOR.PINK;
    this.setPieceWidth(3);
    this.setPieceHeight(2);
    this.piece = [
      [
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },

        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
      ],
      [
        { color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK },
        { color: this.color, type: BlockTypeEnum.COLOR_BLOCK },
        { color: COLOR.BLACK, type: BlockTypeEnum.EMPTY_BLOCK },
      ],
    ];
  }
}
