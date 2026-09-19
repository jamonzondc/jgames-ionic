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
  protected readonly paddingBlock: number = 2;
  protected readonly borderRadiusBlock: number = 6;
  protected tetrisService: TetrisInterface = inject(TetrisService);

  /** The next-shape preview is small enough that a grid is just noise. */
  protected showGrid: boolean = true;

  /** Backdrop gradient, rebuilt only when the canvas is resized. */
  private backdrop: CanvasGradient | undefined;
  private backdropHeight: number = 0;

  protected abstract draw(updateHint?: boolean): void;

  protected drawBoard(board: Array<BlockInterface[]>): void {
    this.drawBackdrop();
    if (this.showGrid) this.drawGrid();
    this.tetrisService.forEachItem(board, (cell, x, y) => {
      this.drawBlock(cell, x, y);
    });
  }

  /** Deep blue wash, lighter at the top so pieces read against it. */
  private drawBackdrop(): void {
    const height: number = this.canvas!.height;
    if (!this.backdrop || this.backdropHeight !== height) {
      const gradient: CanvasGradient = this.context!.createLinearGradient(
        0,
        0,
        0,
        height
      );
      gradient.addColorStop(0, '#141C33');
      gradient.addColorStop(1, '#070B16');
      this.backdrop = gradient;
      this.backdropHeight = height;
    }
    this.context!.fillStyle = this.backdrop;
    this.context!.fillRect(0, 0, this.canvas!.width, height);
  }

  /** Faint lattice so the empty board still reads as a grid. */
  private drawGrid(): void {
    const size: number = this.board.BLOCK_SIZE;
    this.context!.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    this.context!.lineWidth = 1;
    this.context!.beginPath();
    for (let x: number = size; x < this.canvas!.width; x += size) {
      this.context!.moveTo(x + 0.5, 0);
      this.context!.lineTo(x + 0.5, this.canvas!.height);
    }
    for (let y: number = size; y < this.canvas!.height; y += size) {
      this.context!.moveTo(0, y + 0.5);
      this.context!.lineTo(this.canvas!.width, y + 0.5);
    }
    this.context!.stroke();
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

  protected drawBlock(block: BlockInterface, x: number, y: number): void {
    if (block.type === BlockTypeEnum.HINT_BLOCK) {
      this.drawGhostBlock(block, x, y);
    } else if (block.type !== BlockTypeEnum.EMPTY_BLOCK) {
      this.drawSolidBlock(block.color, x, y);
    }
  }

  /**
   * A solid tile: a vertical gradient for volume, a bright top edge for the
   * light, and a soft glow underneath so it lifts off the board.
   */
  private drawSolidBlock(color: COLOR | string, x: number, y: number): void {
    const { left, top, size } = this.blockBox(x, y);

    this.context!.save();
    this.context!.shadowColor = this.withAlpha(color, 0.45);
    this.context!.shadowBlur = 12;
    this.context!.shadowOffsetY = 2;

    const gradient: CanvasGradient = this.context!.createLinearGradient(
      left,
      top,
      left,
      top + size
    );
    gradient.addColorStop(0, this.lighten(color, 0.32));
    gradient.addColorStop(0.55, color as string);
    gradient.addColorStop(1, this.darken(color, 0.28));

    this.context!.fillStyle = gradient;
    this.roundedPath(left, top, size, size, this.borderRadiusBlock);
    this.context!.fill();
    this.context!.restore();

    // Glass highlight across the top half.
    const highlight: CanvasGradient = this.context!.createLinearGradient(
      left,
      top,
      left,
      top + size * 0.5
    );
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.context!.fillStyle = highlight;
    this.roundedPath(
      left + size * 0.12,
      top + size * 0.1,
      size * 0.76,
      size * 0.4,
      this.borderRadiusBlock * 0.6
    );
    this.context!.fill();

    this.context!.strokeStyle = this.withAlpha(this.lighten(color, 0.5), 0.55);
    this.context!.lineWidth = 1;
    this.roundedPath(left, top, size, size, this.borderRadiusBlock);
    this.context!.stroke();
  }

  /** Landing preview: an outline with just enough fill to be readable. */
  private drawGhostBlock(block: BlockInterface, x: number, y: number): void {
    const { left, top, size } = this.blockBox(x, y);

    this.context!.fillStyle = this.withAlpha(block.color, 0.12);
    this.roundedPath(left, top, size, size, this.borderRadiusBlock);
    this.context!.fill();

    this.context!.strokeStyle = this.withAlpha(block.color, 0.7);
    this.context!.lineWidth = 2;
    this.context!.setLineDash([size * 0.18, size * 0.12]);
    this.roundedPath(left, top, size, size, this.borderRadiusBlock);
    this.context!.stroke();
    this.context!.setLineDash([]);
  }

  private blockBox(
    x: number,
    y: number
  ): { left: number; top: number; size: number } {
    return {
      left: x * this.board.BLOCK_SIZE + this.paddingBlock,
      top: y * this.board.BLOCK_SIZE + this.paddingBlock,
      size: this.board.BLOCK_SIZE - this.paddingBlock * 2,
    };
  }

  private roundedPath(
    left: number,
    top: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.context!.beginPath();
    this.context!.roundRect(left, top, width, height, radius);
  }

  private lighten(color: COLOR | string, amount: number): string {
    return this.mix(color, 255, amount);
  }

  private darken(color: COLOR | string, amount: number): string {
    return this.mix(color, 0, amount);
  }

  /** Blends each channel towards `target` (0 for black, 255 for white). */
  private mix(color: COLOR | string, target: number, amount: number): string {
    const [red, green, blue] = this.toRgb(color);
    const channel = (value: number): number =>
      Math.round(value + (target - value) * amount);
    return `rgb(${channel(red)}, ${channel(green)}, ${channel(blue)})`;
  }

  private withAlpha(color: COLOR | string, alpha: number): string {
    const [red, green, blue] = this.toRgb(color);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  /** Parses the "#rrggbb" palette, and passes "rgb(r, g, b)" straight back. */
  private toRgb(color: COLOR | string): [number, number, number] {
    const value: string = String(color).trim();
    if (value.startsWith('#')) {
      const hex: string =
        value.length === 4
          ? value
              .slice(1)
              .split('')
              .map((char: string): string => char + char)
              .join('')
          : value.slice(1);
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
    const parts: RegExpMatchArray | null = value.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
    }
    return [148, 163, 184];
  }
}
