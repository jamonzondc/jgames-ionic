import {
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
} from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import {
  incrementLevel,
  incrementScore,
} from 'src/app/shared/store/app.actions';
import { selectLevel, selectScore } from 'src/app/shared/store/app.selectors';
import { AppState } from 'src/app/shared/store/app.state.interface';
import { COLOR, ShapeModel } from '../../models';
import { BlockTypeEnum } from '../../models/block-type.enum';
import { BoardInterface } from '../../models/board.interface';
import { DrawableComponent } from '../drawable.component';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    standalone: true,
})
export class BoardComponent extends DrawableComponent implements OnInit {
  @Output() public gameOverEmit: EventEmitter<void> = new EventEmitter<void>();
  shape!: ShapeModel | undefined;
  //aux = true; // TODO refactory

  private lastTime: number = 0;
  private dropCounter: number = 0;
  private audio: HTMLAudioElement = new Audio('assets/audio/game-music.mp3');
  private SHAPE_TIME_DOWN: number = 1000;
  private readonly GAME_WIN: number = 6;

  constructor(
    private alertController: AlertController,
    private platform: Platform,
    private store: Store<AppState>
  ) {
    super();
  }

  public async ngOnInit(): Promise<void> {
    this.startGame();
    this.increaseLevel();
    this.winGame();
    this.onPause();
  }

  public async startGame(): Promise<void> {
    this.canvas = document.querySelector('#tetrisBoardId');
    this.context = this.canvas?.getContext('2d');
    if (!this.canvas) return;

    this.canvas.width = this.board.BLOCK_SIZE * this.board.BOARD_WIDTH;
    this.canvas.height = this.board.BLOCK_SIZE * this.board.BOARD_HEIGHT;

    this.shape = this.tetrisService.getOneShape(this.board.BOARD_WIDTH);
    this.tetrisService.pushNextShape();
    //await this.startGameMusic();
    this.drawLoop();
  }

  //TODO refactory for get less code lines
  private async drawLoop(time: number = 0): Promise<void> {
    if (!this.isPaused) {
      this.calcTimeToRenderShape(time);
      if (
        this.shape &&
        this.tetrisService.checkCollition(
          this.shape.getPosition().y,
          this.shape.getPosition().x,
          this.shape.getPiece(),
          this.board,
          this.shape.getPieceWidth(),
          this.board.BOARD_WIDTH
        )
      ) {
        this.shape.getPosition().y--;

        this.SHAPE_TIME_DOWN = 1000;
        // await this.getShapeTimeToDown();

        this.tetrisService.solidifyPiece(this.shape, this.board.board);

        if (this.tetrisService.gameOver(this.board.board)) {
          this.finishGame();
          return;
        }
        this.tetrisService.removeCompletedRows(this.board);

        this.shape = this.tetrisService.getOneShape(this.board.BOARD_WIDTH);

        this.tetrisService.pushNextShape();
        // this.aux = true;
      }
      // this.aux = false;
      this.draw();
    }

    requestAnimationFrame((time: number = 0) => this.drawLoop(time));
  }

  private a(time: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), time);
    });
  }

  private getShapeTimeToDown(): Promise<number> {
    return new Promise<number>((resolve: (time: number) => void): void => {
      this.store.select(selectLevel).subscribe((level: number): void => {
        if (level === this.GAME_WIN) {
        } else {
          const time: number = 1000 - level * 100;
          resolve(time);
        }
      });
    });
  }

  private calcTimeToRenderShape(time: number): void {
    const deltaTime: number = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    if (this.dropCounter > this.SHAPE_TIME_DOWN && this.shape) {
      this.shape.getPosition().y++;
      this.dropCounter = 0;
    }
  }

  private async finishGame(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Game over',
      message: 'Try again!!!',
      buttons: ['OK'],
    });

    await alert.present();
    await alert.onDidDismiss();
    this.pauseGame();
    this.gameOverEmit.emit();
  }

  protected draw(updateHint?: boolean): void {
    if (!this.canvas || !this.context) return;
    this.drawBoard(this.board.board);
    this.drawPiece(this.shape);
    this.drawHint(this.shape, this.board);
  }

  private drawHint(shape: ShapeModel | undefined, board: BoardInterface): void {
    this.removeHintBlocks();
    const yForHint: number = this.getLastYAfterCollition();
    if (!shape) return;
    this.tetrisService.forEachItem(shape.getPiece(), (cell, x, y) => {
      try {
        if (cell.color !== COLOR.BLACK)
          board.board[yForHint + y + shape.getPosition().y][
            x + shape.getPosition().x
          ] = {
            color: shape.getColor(),
            type: BlockTypeEnum.HINT_BLOCK,
          };
      } catch (e) {
        console.error('------Error--->', {
          index1: {
            y,
            y2: shape.getPosition().y,
            yForHint,
          },
          index2: {
            x,
            x2: shape.getPosition().x,
          },
        });
      }
    });
  }

  private getLastYAfterCollition(): number {
    let yForHint = 1;
    while (yForHint <= this.board.BOARD_HEIGHT) {
      if (
        this.shape &&
        this.tetrisService.checkCollition(
          this.shape.getPosition().y + yForHint,
          this.shape.getPosition().x,
          this.shape.getPiece(),
          this.board,
          this.shape.getPieceWidth(),
          this.board.BOARD_WIDTH
        )
      ) {
        yForHint--;
        break;
      }
      yForHint++;
    }
    return yForHint;
  }
  private removeHintBlocks(): void {
    this.tetrisService.forEachItem(this.board.board, (cell, x, y) => {
      if (cell.type === BlockTypeEnum.HINT_BLOCK)
        this.board.board[y][x] = {
          color: COLOR.BLACK,
          type: BlockTypeEnum.EMPTY_BLOCK,
        };
    });
  }

  private increaseLevel(): void {
    this.store.select(selectScore).subscribe((score: number): void => {
      if (score > 0 && score % 1000 === 0) {
        this.store.dispatch(incrementLevel());
      }
    });
  }

  private winGame(): void {
    this.store.select(selectLevel).subscribe((level: number): void => {
      if (level === this.GAME_WIN) {
      } else {
        this.SHAPE_TIME_DOWN -= level * 100;
      }
    });
  }

  private async startGameMusic(): Promise<void> {
    this.audio.load();
    this.audio.loop = true;
    await this.audio.play();
  }

  public pauseGame(): void {
    this.audio.pause();
  }

  @HostListener('document:keydown', ['$event'])
  public keyEvent(event: KeyboardEvent) {
    console.log('------------->', event);
    this.tetrisService.arrowActions(event.key, this.shape, this.board);
    this.draw(true);
  }

  @HostListener('mouseup', ['$event'])
  public mouseup(event: MouseEvent) {
    const newY: number = this.getCoordinate(event.offsetY);
    this.SHAPE_TIME_DOWN = 10;
  }

  @HostListener('mousemove', ['$event'])
  public mousemove(event: MouseEvent) {
    const newX: number = this.getCoordinate(event.offsetX);
    if (
      this.shape &&
      !this.tetrisService.checkCollition(
        this.shape.getPosition().y,
        newX,
        this.shape.getPiece(),
        this.board,
        this.shape.getPieceWidth(),
        this.board.BOARD_WIDTH
      )
    ) {
      this.shape.getPosition().x = newX;
      this.draw(true);
    }
  }

  @HostListener('blur')
  public onBlur() {
    //get canvas by id
    const canvas: HTMLCanvasElement = document.getElementById(
      'tetrisBoardId'
    ) as HTMLCanvasElement;
    //listening blur event
    canvas.addEventListener('blur', () => {
      //pause game
      this.pauseGame();
    });
  }

  private getCoordinate(mouse: number): number {
    return Math.floor(mouse / this.board.BLOCK_SIZE);
  }

  @HostListener('load')
  public onResume() {
    this.platform.resume.subscribe(async () => {
      alert('Pause event detected');
    });
  }

  @HostListener('load')
  public onPause() {
    this.platform.pause.subscribe(async () => {
      alert('Pause event detected');
    });
  }
}
