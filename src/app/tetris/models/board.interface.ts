import { BlockInterface } from './block.interface';

export interface BoardInterface {
  readonly BLOCK_SIZE: number;
  readonly BOARD_WIDTH: number;
  readonly BOARD_HEIGHT: number;
  board: Array<BlockInterface[]>;
}
