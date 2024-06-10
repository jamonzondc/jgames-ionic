import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BlockInterface } from '../../models/block.interface';
import { DrawableComponent } from '../drawable.component';
import { ShapeModel } from '../../models';

@Component({
    selector: 'app-next-shape',
    templateUrl: './next-shape.component.html',
    styleUrls: ['./next-shape.component.scss'],
    standalone: true,
})
export class NextShapeComponent extends DrawableComponent implements OnInit {
  private shapes: Array<ShapeModel> = [];
  constructor() {
    super();
  }

  public ngOnInit(): void {
    this.canvas = document.querySelector('#tetrisNextShapeId');
    this.context = this.canvas?.getContext('2d');
    if (!this.canvas) return;

    this.canvas.width = this.board.BLOCK_SIZE * this.board.BOARD_WIDTH;
    this.canvas.height = this.board.BLOCK_SIZE * this.board.BOARD_HEIGHT;
    this.tetrisService.getShapes().subscribe({
      next: (shapes: Array<ShapeModel>): void => {
        this.shapes = shapes;
        this.locatedShape(shapes);
        this.draw();
      },
    });
  }

  protected draw(): void {
    if (!this.canvas || !this.context) return;

    this.drawBoard(this.board.board);
    this.shapes.forEach((shape: ShapeModel): void => {
      this.drawPiece(shape);
    });
  }

  private locatedShape(shapes: Array<ShapeModel>): void {
    const spiceBetweenShape: number = this.getSpiceBetweenShape(shapes);
    const [shape1, shape2, shape3] = this.shapes;
    shape1.getPosition().x = spiceBetweenShape;
    shape2.getPosition().x =
      shape1.getPosition().x + shape1.getPieceWidth() + spiceBetweenShape;
    shape3.getPosition().x =
      shape2.getPosition().x + shape2.getPieceWidth() + spiceBetweenShape;
  }
  private getSpiceBetweenShape(shapes: Array<ShapeModel>): number {
    const accShapeWidth: number = shapes
      .map((shape: ShapeModel): number => shape.getPieceWidth())
      .reduce(
        (previousValue: number, currentValue: number): number =>
          previousValue + currentValue,
        0
      );

    const spiceBetweenShape: number = Math.floor(
      (this.board.BOARD_WIDTH - accShapeWidth) / 4
    );
    return spiceBetweenShape;
  }
}
