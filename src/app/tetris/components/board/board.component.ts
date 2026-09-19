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
import { BlockInterface } from '../../models/block.interface';
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

  // Touch gesture state
  private touchStart: { x: number; y: number; time: number } | undefined;
  private touchMoved: boolean = false;
  private shapeXOnTouchStart: number = 0;
  private lastTapTime: number = 0;
  private lastTouchTime: number = 0;
  private lastRotation:
    | { piece: Array<BlockInterface[]>; width: number; height: number }
    | undefined;

  /** A press longer than this is a hold, not a tap. */
  private readonly TAP_MAX_MS: number = 300;
  /** A finger wandering further than this is dragging, not tapping. */
  private readonly TAP_MAX_MOVE_PX: number = 12;
  /** Gap below which a second tap counts as a double tap. */
  private readonly DOUBLE_TAP_MS: number = 280;
  /** How long mouse events stay ignored after a touch. */
  private readonly MOUSE_AFTER_TOUCH_MS: number = 700;

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

  /**
   * Touch controls. They live next to the mouse/keyboard handlers instead of
   * replacing them, so a desktop keeps behaving exactly as before and a hybrid
   * laptop can use either input.
   *
   * - drag         -> moves the shape sideways, one column at a time
   * - tap          -> rotates
   * - double tap   -> hard drop
   */
  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    if (this.isPaused || event.touches.length !== 1) return;
    event.preventDefault();

    const touch: Touch = event.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    this.touchMoved = false;
    this.shapeXOnTouchStart = this.shape ? this.shape.getPosition().x : 0;
  }

  @HostListener('touchmove', ['$event'])
  public onTouchMove(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    if (this.isPaused || !this.touchStart || event.touches.length !== 1) return;
    event.preventDefault();

    const touch: Touch = event.touches[0];
    const deltaX: number = touch.clientX - this.touchStart.x;
    const deltaY: number = touch.clientY - this.touchStart.y;

    // Anything past this is a drag, so it must not rotate on release.
    if (Math.hypot(deltaX, deltaY) > this.TAP_MAX_MOVE_PX) this.touchMoved = true;

    const columns: number = Math.round(
      (deltaX * this.getBoardScale()) / this.board.BLOCK_SIZE
    );
    this.moveShapeToColumn(this.shapeXOnTouchStart + columns);
    this.draw(true);
  }

  @HostListener('touchend', ['$event'])
  public onTouchEnd(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    const touchStart = this.touchStart;
    this.touchStart = undefined;
    if (this.isPaused || !touchStart) return;
    event.preventDefault();

    const isTap: boolean =
      !this.touchMoved && this.lastTouchTime - touchStart.time < this.TAP_MAX_MS;
    if (!isTap) return;

    const isDoubleTap: boolean =
      this.lastTapTime > 0 &&
      this.lastTouchTime - this.lastTapTime < this.DOUBLE_TAP_MS;

    if (isDoubleTap) {
      // The first tap already rotated, so undo it before dropping: that keeps
      // a single tap instant instead of making every rotation wait to see
      // whether a second tap is coming.
      this.undoLastRotation();
      this.hardDrop();
      this.lastTapTime = 0;
    } else {
      this.rotateShape();
      this.lastTapTime = this.lastTouchTime;
    }

    this.draw(true);
  }

  @HostListener('touchcancel')
  public onTouchCancel(): void {
    this.lastTouchTime = Date.now();
    this.touchStart = undefined;
  }

  private moveShapeToColumn(targetX: number): void {
    if (!this.shape) return;
    // Step column by column so collisions still block the shape instead of
    // letting a fast drag jump over a stack.
    while (this.shape.getPosition().x < targetX) {
      const currentX: number = this.shape.getPosition().x;
      this.tetrisService.arrowRight(this.shape, this.board);
      if (this.shape.getPosition().x === currentX) return;
    }
    while (this.shape.getPosition().x > targetX) {
      const currentX: number = this.shape.getPosition().x;
      this.tetrisService.arrowLeft(this.shape, this.board);
      if (this.shape.getPosition().x === currentX) return;
    }
  }

  private rotateShape(): void {
    if (!this.shape) return;
    this.lastRotation = {
      piece: this.shape.getPiece(),
      width: this.shape.getPieceWidth(),
      height: this.shape.getPieceHeight(),
    };
    this.tetrisService.arrowUp(this.shape, this.board);
  }

  private undoLastRotation(): void {
    if (!this.shape || !this.lastRotation) return;
    this.shape.setPiece(this.lastRotation.piece);
    this.shape.setPieceWidth(this.lastRotation.width);
    this.shape.setPieceHeight(this.lastRotation.height);
    this.lastRotation = undefined;
  }

  private hardDrop(): void {
    if (!this.shape) return;
    this.shape.getPosition().y += this.getLastYAfterCollition();
    // Let the next frame push it one row further so it collides and solidifies
    // right away instead of hanging there for a whole drop interval.
    this.dropCounter = this.SHAPE_TIME_DOWN + 1;
  }

  /**
   * Ratio between the canvas' internal size and the size it is painted at, so
   * drag distances stay correct when CSS scales the board down on a phone.
   */
  private getBoardScale(): number {
    if (!this.canvas) return 1;
    const width: number = this.canvas.getBoundingClientRect().width;
    return width > 0 ? this.canvas.width / width : 1;
  }

  /**
   * Browsers replay a touch as mouse events. Those would fight the touch
   * handlers, so they are dropped while a touch is still in play.
   */
  private isSyntheticMouseEvent(): boolean {
    return Date.now() - this.lastTouchTime < this.MOUSE_AFTER_TOUCH_MS;
  }

  @HostListener('mouseup', ['$event'])
  public mouseup(event: MouseEvent) {
    if (this.isSyntheticMouseEvent()) return;
    const newY: number = this.getCoordinate(event.offsetY);
    this.SHAPE_TIME_DOWN = 10;
  }

  @HostListener('mousemove', ['$event'])
  public mousemove(event: MouseEvent) {
    if (this.isSyntheticMouseEvent()) return;
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
