import { BlockTypeEnum } from './block-type.enum';
import { COLOR } from './color.enum';

export interface BlockInterface {
  color: COLOR;
  type: BlockTypeEnum;
}
