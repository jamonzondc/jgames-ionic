import {
  Component,
  Input,
  booleanAttribute,
  inject,
  numberAttribute,
} from '@angular/core';
import { BlockInterface } from '../models/block.interface';
import { TetrisService } from '../services';
import { TetrisInterface } from '../services/tetris.interface';
import { BlockTypeEnum } from '../models/block-type.enum';
import { COLOR, ShapeModel } from '../models';
import { BoardInterface } from '../models/board.interface';

@Component({
  template: '',
})
export abstract class DrawableComponent {
  @Input({ required: true })
  public board!: BoardInterface;
  @Input({ transform: booleanAttribute }) public isPaused!: boolean;
  protected canvas!: HTMLCanvasElement | null;
  protected context!: CanvasRenderingContext2D | null | undefined;
  protected readonly paddingBlock: number = 3.5;
  protected readonly borderRadiusBlock: number = 4;
  protected tetrisService: TetrisInterface = inject(TetrisService);

  protected abstract draw(updateHint?: boolean): void;

  protected drawBoard(board: Array<BlockInterface[]>): void {
    this.context!.fillStyle = '#000';
    this.context!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    this.tetrisService.forEachItem(board, (cell, x, y) => {
      this.drawBlock(cell, x, y);
    });
  }

  protected drawPiece(shape: ShapeModel | undefined): void {
    if (!shape) return;
    this.tetrisService.forEachItem(shape.getPiece(), (cell, x, y) => {
      if (cell.color !== COLOR.BLACK) {
        this.drawBlock(
          cell,
          x + shape.getPosition().x,
          y + shape.getPosition().y
        );
      }
    });
  }

  //TODO
  protected drawBlock(block: BlockInterface, x: number, y: number): void {
    if (block.type === BlockTypeEnum.HINT_BLOCK) {
      this.drawStrokeBlock(block, x, y, 3);
      this.drawFillBlock(COLOR.BLACK, x, y);
    } else if (block.type === BlockTypeEnum.EMPTY_BLOCK) {
      this.drawStrokeBlock(block, x, y);
      this.drawFillBlock(block.color, x, y);
    } else {
      this.drawFillBlock(block.color, x, y);
    }
  }

  private drawStrokeBlock(
    block: BlockInterface,
    x: number,
    y: number,
    lineWidth: number = 1
  ): void {
    this.context!.strokeStyle = block.color;
    this.context!.lineWidth = lineWidth;
    this.context!.beginPath();
    this.context!.roundRect(
      x * this.board.BLOCK_SIZE + this.paddingBlock,
      y * this.board.BLOCK_SIZE + this.paddingBlock,
      this.board.BLOCK_SIZE - this.paddingBlock * 2,
      this.board.BLOCK_SIZE - this.paddingBlock * 2,
      this.borderRadiusBlock
    );

    this.context!.stroke();
  }

  private drawFillBlock(color: COLOR | string, x: number, y: number): void {
    this.context!.fillStyle = color;
    this.context!.beginPath();
    this.context!.roundRect(
      x * this.board.BLOCK_SIZE + this.paddingBlock,
      y * this.board.BLOCK_SIZE + this.paddingBlock,
      this.board.BLOCK_SIZE - this.paddingBlock * 2,
      this.board.BLOCK_SIZE - this.paddingBlock * 2,
      this.borderRadiusBlock
    );
    this.context!.fill();
  }
}
