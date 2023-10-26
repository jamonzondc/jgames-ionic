import {
  Component,
  HostListener,
  Input,
  OnInit,
  inject,
  numberAttribute,
} from '@angular/core';
import { COLOR, ShapeModel } from '../../models';
import { AlertController } from '@ionic/angular';
import { TetrisInterface } from '../../services/tetris.interface';
import { TetrisService } from '../../services';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit {
  @Input({ required: true, transform: numberAttribute })
  public BLOCK_SIZE!: number;
  @Input({ required: true, transform: numberAttribute })
  public BOARD_WIDTH!: number;
  @Input({ required: true, transform: numberAttribute })
  public BOARD_HEIGHT!: number;
  canvas!: HTMLCanvasElement | null;
  context!: CanvasRenderingContext2D | null | undefined;
  board: Array<COLOR[]> = [];
  shape!: ShapeModel;
  private paddingBlock: number = 2.5;
  private borderRadiusBlock: number = 4;

  private tetrisService: TetrisInterface = inject(TetrisService);
  private lastTime: number = 0;
  private dropCounter: number = 0;

  constructor(private alertController: AlertController) {}

  ngOnInit() {
    const nextShapeBoard: HTMLCanvasElement | null =
      document.querySelector('#tetrisNextShapeId');
    this.canvas = document.querySelector('#tetrisBoardId');
    this.context = this.canvas?.getContext('2d');
    if (!this.canvas) return;
    nextShapeBoard!.width = this.BLOCK_SIZE * this.BOARD_WIDTH;
    this.canvas.width = this.BLOCK_SIZE * this.BOARD_WIDTH;
    this.canvas.height = this.BLOCK_SIZE * this.BOARD_HEIGHT;

    this.board = this.tetrisService.initBoard(
      this.BOARD_HEIGHT,
      this.BOARD_WIDTH
    );
    this.shape = this.tetrisService.getRamdonPiece(this.BOARD_WIDTH);
    this.gameLoop();
  }

  private async gameLoop(time: number = 0): Promise<void> {
    const deltaTime: number = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    if (this.dropCounter > 1000) {
      this.shape.getPosition().y++;
      this.dropCounter = 0;
    }
    if (
      this.tetrisService.checkCollition(
        this.shape.getPosition().y,
        this.shape.getPosition().x,
        this.shape.getPiece(),
        this.board
      )
    ) {
      this.shape.getPosition().y--;

      this.tetrisService.solidifyPiece(this.shape, this.board);

      if (this.tetrisService.gameOver(this.board))
        return await this.finishGame();
      this.tetrisService.removeCompletedRows(this.board);
      this.shape = this.tetrisService.getRamdonPiece(this.BOARD_WIDTH);
    }
    this.draw();
    requestAnimationFrame((time: number = 0) => this.gameLoop(time));
  }

  private async finishGame(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Game over',
      message: 'Try again!!!',
      buttons: ['OK'],
    });

    await alert.present();
    await alert.onDidDismiss();
    this.ngOnInit();
  }

  private draw(): void {
    if (!this.canvas || !this.context) return;
    this.drawBoard(this.board);
    this.drawPiece(this.shape);
  }
  private drawBoard(board: Array<COLOR[]>): void {
    this.context!.fillStyle = '#000';
    this.context!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    board.forEach((row: COLOR[], y: number): void => {
      row.forEach((cell: COLOR, x: number): void => {
        /* this.context!.strokeStyle = '#a2a2a2';
        this.context!.strokeRect(
          x * this.BLOCK_SIZE,
          y * this.BLOCK_SIZE,
          this.BLOCK_SIZE,
          this.BLOCK_SIZE
        );
*/

        //gradient with 3D efect for block

        this.context!.fillStyle = cell === COLOR.BLACK ? '#181818' : cell;
        this.context!.strokeStyle = cell === COLOR.BLACK ? '#181818' : cell;
        this.context!.beginPath();
        this.context!.roundRect(
          x * this.BLOCK_SIZE + this.paddingBlock,
          y * this.BLOCK_SIZE + this.paddingBlock,
          this.BLOCK_SIZE - this.paddingBlock * 2,
          this.BLOCK_SIZE - this.paddingBlock * 2,
          this.borderRadiusBlock
        );
        this.context!.fill();
        this.context!.stroke();
      });
    });
  }

  private drawPiece(shape: ShapeModel): void {
    shape?.getPiece()?.forEach((row, y: number): void => {
      row.forEach((cell, x: number): void => {
        /*  if (
          this.board[y + shape.getPosition().y][x + shape.getPosition().x] ===
          COLOR.BLACK
        ) {
          this.context!.strokeRect(
            (x + shape.getPosition().x) * this.BLOCK_SIZE,
            (y + shape.getPosition().y) * this.BLOCK_SIZE,
            this.BLOCK_SIZE,
            this.BLOCK_SIZE
          ); 
          this.context!.strokeRect(
            (x + shape.getPosition().x) * this.BLOCK_SIZE,
            (y + shape.getPosition().y) * this.BLOCK_SIZE,
            this.BLOCK_SIZE,
            this.BLOCK_SIZE
          );
        }
        */

        if (cell !== COLOR.BLACK) {
          this.context!.fillStyle = cell;
          this.context!.strokeStyle = cell;
          this.context!.beginPath();
          this.context!.roundRect(
            (x + shape.getPosition().x) * this.BLOCK_SIZE + this.paddingBlock,
            (y + shape.getPosition().y) * this.BLOCK_SIZE + this.paddingBlock,
            this.BLOCK_SIZE - this.paddingBlock * 2,
            this.BLOCK_SIZE - this.paddingBlock * 2,
            this.borderRadiusBlock
          );

          this.context!.fill();
          this.context!.stroke();
        }
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  public keyEvent(event: KeyboardEvent) {
    console.log('------------->', event);
    this.tetrisService.arrowActions(event.key, this.shape, this.board);
    this.draw();
  }

  //HostListener for touch screen

  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:touchend', ['$event'])
  public touchEvent(event: TouchEvent) {
    console.log('------------->', event);
  }
}
