import {
  Component,
  EventEmitter,
  HostListener,
  OnChanges,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { AlertController } from '@ionic/angular';
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
import { AudioService } from 'src/app/shared/services/audio.service';
import { DrawableComponent } from '../drawable.component';

@Component({
    selector: 'app-board',
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.scss'],
    standalone: true,
})
export class BoardComponent
  extends DrawableComponent
  implements OnInit, OnChanges
{
  @Output() public gameOverEmit: EventEmitter<void> = new EventEmitter<void>();
  shape!: ShapeModel | undefined;
  //aux = true; // TODO refactory

  private lastTime: number = 0;
  private dropCounter: number = 0;
  private audioService: AudioService = inject(AudioService);
  private SHAPE_TIME_DOWN: number = 1000;
  private isClearingRows: boolean = false;
  /** Set when the page comes back, to drop the elapsed background time. */
  private resumeTiming: boolean = false;
  private readonly GAME_WIN: number = 6;

  // Touch gesture state
  private touchStart: { x: number; y: number; time: number } | undefined;
  private touchMoved: boolean = false;
  private touchAxis: 'x' | 'y' | undefined;
  private shapeXOnTouchStart: number = 0;
  private shapeYOnTouchStart: number = 0;
  /**
   * The piece the gesture started on. A drag can outlive its piece — the piece
   * settles mid-gesture and the next one takes its place — and without this
   * the release would drop that new piece too, costing the player a piece
   * they never played.
   */
  private gestureShape: ShapeModel | undefined;
  private lastTouchTime: number = 0;
  private previousSample: { y: number; time: number } = { y: 0, time: 0 };
  private latestSample: { y: number; time: number } = { y: 0, time: 0 };

  /** A press longer than this is a hold, not a tap. */
  private readonly TAP_MAX_MS: number = 300;
  /** A finger wandering further than this is dragging, not tapping. */
  private readonly TAP_MAX_MOVE_PX: number = 12;
  /** Downwards speed at which a drag becomes a flick, in screen px per ms. */
  private readonly FLICK_SPEED_PX_PER_MS: number = 0.5;
  /** How long mouse events stay ignored after a touch. */
  private readonly MOUSE_AFTER_TOUCH_MS: number = 700;

  /** Fading streak left behind by a hard drop. */
  private dropTrail:
    | { columns: number[]; fromY: number; toY: number; color: string; start: number }
    | undefined;
  private readonly DROP_TRAIL_MS: number = 300;

  constructor(
    private alertController: AlertController,
    private store: Store<AppState>
  ) {
    super();
  }

  public ngOnChanges(): void {
    // isPaused is an input, so the pause menu opening reaches us as a change.
    this.audioService.setGameRunning(!this.isPaused);
  }

  public async ngOnInit(): Promise<void> {
    this.startGame();
    this.increaseLevel();
    this.winGame();
  }

  public async startGame(): Promise<void> {
    this.canvas = document.querySelector('#tetrisBoardId');
    this.context = this.canvas?.getContext('2d');
    if (!this.canvas) return;

    this.canvas.width = this.board.BLOCK_SIZE * this.board.BOARD_WIDTH;
    this.canvas.height = this.board.BLOCK_SIZE * this.board.BOARD_HEIGHT;

    this.isClearingRows = false;
    this.shape = this.tetrisService.getOneShape(this.board.BOARD_WIDTH);
    this.tetrisService.pushNextShape();
    // The soundtrack itself only starts once the player touches something.
    this.audioService.setGameRunning(true);
    this.drawLoop();
  }

  //TODO refactory for get less code lines
  private async drawLoop(time: number = 0): Promise<void> {
    // While rows are being cleared the board is mid-edit: no piece falls and
    // no new one appears, so a landing cannot start a second clear on top of
    // the first. Keep painting, though — the clear is animated.
    if (!this.isPaused && !this.isClearingRows) {
      this.calcTimeToRenderShape(time);
      if (this.shape && this.tetrisService.hasLanded(this.shape, this.board)) {
        this.SHAPE_TIME_DOWN = 1000;
        // await this.getShapeTimeToDown();

        this.tetrisService.solidifyPiece(this.shape, this.board.board);
        this.audioService.lock();

        this.clearRowsThenNextShape();
        // this.aux = true;
      }
      // this.aux = false;
    }

    if (!this.isPaused) this.draw();

    requestAnimationFrame((time: number = 0) => this.drawLoop(time));
  }

  /**
   * Clearing rows is animated, so it spans many frames. The piece is dropped
   * first and the next one only arrives once the board has settled.
   */
  private clearRowsThenNextShape(): void {
    this.shape = undefined;
    this.isClearingRows = true;

    this.tetrisService.removeCompletedRows(this.board).then((): void => {
      this.isClearingRows = false;

      const next: ShapeModel | undefined = this.tetrisService.getOneShape(
        this.board.BOARD_WIDTH
      );
      this.tetrisService.pushNextShape();

      // The game is over when the next piece has nowhere to appear — not
      // merely because some block reached the top row, which an upright piece
      // can do with most of the board still free.
      if (next && !this.tetrisService.fits(next, this.board)) {
        this.finishGame();
        return;
      }
      this.shape = next;
    });
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
    if (this.resumeTiming) {
      this.resumeTiming = false;
      this.lastTime = time;
      this.dropCounter = 0;
      return;
    }

    const deltaTime: number = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    if (this.dropCounter > this.SHAPE_TIME_DOWN && this.shape) {
      // Goes through arrowDown so the piece never steps into an occupied
      // square and has to be walked back out of it.
      this.tetrisService.arrowDown(this.shape, this.board);
      this.dropCounter = 0;
    }
  }

  private async finishGame(): Promise<void> {
    this.audioService.gameOver();
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
    this.drawDropTrail();
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
        this.audioService.levelUp();
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

  public pauseGame(): void {
    this.audioService.setGameRunning(false);
  }

  @HostListener('document:keydown', ['$event'])
  public keyEvent(event: KeyboardEvent) {
    console.log('------------->', event);
    this.audioService.unlock();
    this.tetrisService.arrowActions(event.key, this.shape, this.board);
    this.draw(true);
  }

  /**
   * Touch controls. They live next to the mouse/keyboard handlers instead of
   * replacing them, so a desktop keeps behaving exactly as before and a hybrid
   * laptop can use either input.
   *
   * - drag sideways   -> moves the shape, one column at a time
   * - drag down       -> soft drop, one row at a time
   * - flick down      -> hard drop
   * - tap             -> rotates
   *
   * A gesture commits to an axis as soon as it has moved far enough to tell
   * them apart, so a sloppy sideways drag never drops the shape by accident.
   */
  @HostListener('touchstart', ['$event'])
  public onTouchStart(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    if (this.isPaused || event.touches.length !== 1) return;
    event.preventDefault();
    this.audioService.unlock();

    const touch: Touch = event.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    this.touchMoved = false;
    this.touchAxis = undefined;
    this.gestureShape = this.shape;
    this.shapeXOnTouchStart = this.shape ? this.shape.getPosition().x : 0;
    this.shapeYOnTouchStart = this.shape ? this.shape.getPosition().y : 0;
    this.previousSample = { y: touch.clientY, time: Date.now() };
    this.latestSample = { y: touch.clientY, time: Date.now() };
  }

  @HostListener('touchmove', ['$event'])
  public onTouchMove(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    if (this.isPaused || !this.touchStart || event.touches.length !== 1) return;
    event.preventDefault();
    if (!this.gestureOwnsShape()) return;

    const touch: Touch = event.touches[0];
    const deltaX: number = touch.clientX - this.touchStart.x;
    const deltaY: number = touch.clientY - this.touchStart.y;

    // Anything past this is a drag, so it must not rotate on release.
    if (Math.hypot(deltaX, deltaY) > this.TAP_MAX_MOVE_PX) this.touchMoved = true;

    // Keep the last two samples so the release can measure how fast the finger
    // was actually moving, rather than averaging in any pause before it.
    this.previousSample = this.latestSample;
    this.latestSample = { y: touch.clientY, time: this.lastTouchTime };

    if (!this.touchAxis && this.touchMoved) {
      this.touchAxis = Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y';
    }

    if (this.touchAxis === 'x') {
      this.moveShapeToColumn(
        this.shapeXOnTouchStart + this.toBlocks(deltaX)
      );
    } else if (this.touchAxis === 'y' && deltaY > 0) {
      // Downwards only: dragging back up must not pull the shape up.
      this.moveShapeToRow(this.shapeYOnTouchStart + this.toBlocks(deltaY));
    }

    this.draw(true);
  }

  @HostListener('touchend', ['$event'])
  public onTouchEnd(event: TouchEvent): void {
    this.lastTouchTime = Date.now();
    const touchStart = this.touchStart;
    this.touchStart = undefined;
    if (this.isPaused || !touchStart) return;
    event.preventDefault();

    if (!this.gestureOwnsShape()) return;

    if (this.isTap(touchStart)) {
      this.rotateShape();
    } else if (this.touchAxis === 'y' && this.isDownwardsFlick()) {
      this.hardDrop();
    }

    this.draw(true);
  }

  @HostListener('touchcancel')
  public onTouchCancel(): void {
    this.lastTouchTime = Date.now();
    this.touchStart = undefined;
    this.touchAxis = undefined;
    this.gestureShape = undefined;
  }

  /** False once the piece the gesture began on has settled. */
  private gestureOwnsShape(): boolean {
    return !!this.shape && this.shape === this.gestureShape;
  }

  private isTap(touchStart: { time: number }): boolean {
    return !this.touchMoved && this.lastTouchTime - touchStart.time < this.TAP_MAX_MS;
  }

  /** A quick downwards flick, measured over the last stretch of the gesture. */
  private isDownwardsFlick(): boolean {
    const distance: number = this.latestSample.y - this.previousSample.y;
    const elapsed: number = this.latestSample.time - this.previousSample.time;
    if (distance <= 0 || elapsed <= 0) return false;
    return distance / elapsed > this.FLICK_SPEED_PX_PER_MS;
  }

  /** Finger travel in screen pixels -> whole board cells. */
  private toBlocks(distance: number): number {
    return Math.round((distance * this.getBoardScale()) / this.board.BLOCK_SIZE);
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

  private moveShapeToRow(targetY: number): void {
    if (!this.shape) return;
    while (this.shape.getPosition().y < targetY) {
      const currentY: number = this.shape.getPosition().y;
      this.tetrisService.arrowDown(this.shape, this.board);
      if (this.shape.getPosition().y === currentY) return;
    }
  }

  private rotateShape(): void {
    if (!this.shape) return;
    this.tetrisService.arrowUp(this.shape, this.board);
  }

  private hardDrop(): void {
    if (!this.shape) return;
    this.audioService.hardDrop();

    this.shape.getPosition().y += this.getLastYAfterCollition();

    // The streak covers the whole gesture, not just this last jump: the drag
    // itself already walked the piece most of the way down, so measuring from
    // here would leave a stub. Without it the piece simply vanishes from the
    // top and reappears at the bottom — worst on the first piece, where the
    // board is empty and the fall is longest.
    if (this.shape.getPosition().y > this.shapeYOnTouchStart) {
      this.startDropTrail(this.shapeYOnTouchStart);
    }

    // The next frame sees it has landed and settles it, rather than leaving it
    // there for a whole drop interval.
    this.dropCounter = this.SHAPE_TIME_DOWN + 1;
  }

  private startDropTrail(fromY: number): void {
    if (!this.shape) return;
    const shape: ShapeModel = this.shape;
    const columns: number[] = [];

    this.tetrisService.forEachItem(shape.getPiece(), (cell, x): void => {
      const column: number = x + shape.getPosition().x;
      if (cell.color !== COLOR.BLACK && !columns.includes(column)) {
        columns.push(column);
      }
    });

    this.dropTrail = {
      columns,
      fromY,
      toY: shape.getPosition().y,
      color: shape.getColor(),
      start: performance.now(),
    };
  }

  /** Vertical smear from where the piece was to where it landed. */
  private drawDropTrail(): void {
    if (!this.dropTrail || !this.context) return;

    const elapsed: number = performance.now() - this.dropTrail.start;
    if (elapsed > this.DROP_TRAIL_MS) {
      this.dropTrail = undefined;
      return;
    }

    const fade: number = 1 - elapsed / this.DROP_TRAIL_MS;
    const size: number = this.board.BLOCK_SIZE;
    const top: number = this.dropTrail.fromY * size;
    const bottom: number = this.dropTrail.toY * size;

    const gradient: CanvasGradient = this.context.createLinearGradient(
      0,
      top,
      0,
      bottom
    );
    gradient.addColorStop(0, this.trailColor(0));
    gradient.addColorStop(1, this.trailColor(0.5 * fade));

    this.context.fillStyle = gradient;
    this.dropTrail.columns.forEach((column: number): void => {
      this.context!.fillRect(column * size + 6, top, size - 12, bottom - top);
    });
  }

  private trailColor(alpha: number): string {
    const value: string = String(this.dropTrail?.color ?? '#94A3B8').slice(1);
    const red: number = parseInt(value.slice(0, 2), 16);
    const green: number = parseInt(value.slice(2, 4), 16);
    const blue: number = parseInt(value.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
    this.audioService.unlock();
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

  /**
   * Coming back from another app, the animation loop has been frozen the whole
   * time, so the first frame back reports every one of those seconds at once.
   * Without this the piece would lurch downwards on return.
   */
  @HostListener('document:visibilitychange')
  public onVisibilityChange(): void {
    if (!document.hidden) this.resumeTiming = true;
  }
}
