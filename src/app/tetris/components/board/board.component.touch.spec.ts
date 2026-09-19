import { TestBed } from '@angular/core/testing';
import { AlertController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { TShapeModel } from '../../models';
import { BoardInterface } from '../../models/board.interface';
import { TetrisService } from '../../services';
import { BoardComponent } from './board.component';

/**
 * Touch gestures: drag sideways moves, drag down soft drops, flick down
 * hard drops, tap rotates.
 * The handlers are driven directly so the test never needs a canvas or the
 * animation loop.
 */
describe('BoardComponent touch gestures', () => {
  let component: BoardComponent;
  let board: BoardInterface;

  const touchEvent = (x: number, y: number): TouchEvent =>
    ({
      touches: [{ clientX: x, clientY: y }],
      preventDefault: (): void => undefined,
    } as unknown as TouchEvent);

  const releaseEvent = (): TouchEvent =>
    ({
      touches: [],
      preventDefault: (): void => undefined,
    } as unknown as TouchEvent);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    // jsdom has no media playback, and rotating plays a sound effect.
    jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        TetrisService,
        { provide: Store, useValue: { select: () => of(0), dispatch: () => undefined } },
        { provide: AlertController, useValue: { create: () => Promise.resolve({}) } },
        { provide: Platform, useValue: { pause: of(), resume: of() } },
      ],
    });

    const tetrisService: TetrisService = TestBed.inject(TetrisService);
    board = tetrisService.buildBoard(15, 10, 40);

    component = TestBed.runInInjectionContext(
      () =>
        new BoardComponent(
          TestBed.inject(AlertController),
          TestBed.inject(Platform),
          TestBed.inject(Store)
        )
    );
    component.board = board;
    component.isPaused = false;
    component.shape = new TShapeModel();
    component.shape.setPosition({ x: 4, y: 0 });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('moves the shape sideways while the finger drags', () => {
    component.onTouchStart(touchEvent(100, 300));
    // Two blocks to the right (BLOCK_SIZE is 40).
    component.onTouchMove(touchEvent(180, 300));

    expect(component.shape!.getPosition().x).toBe(6);
  });

  it('follows the finger back when it drags the other way', () => {
    component.onTouchStart(touchEvent(100, 300));
    component.onTouchMove(touchEvent(180, 300));
    component.onTouchMove(touchEvent(20, 300));

    expect(component.shape!.getPosition().x).toBe(2);
  });

  it('stops at the wall instead of dragging past it', () => {
    component.onTouchStart(touchEvent(100, 300));
    component.onTouchMove(touchEvent(1000, 300));

    // Board is 10 wide and the T piece is 3 wide.
    expect(component.shape!.getPosition().x).toBe(7);
  });

  it('rotates on a single tap', () => {
    const before = component.shape!.getPiece();

    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPiece()).not.toBe(before);
    expect(component.shape!.getPieceWidth()).toBe(2);
  });

  it('does not rotate when the finger dragged', () => {
    const before = component.shape!.getPiece();

    component.onTouchStart(touchEvent(100, 300));
    component.onTouchMove(touchEvent(180, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPiece()).toBe(before);
  });

  it('does not rotate when the tap is held too long', () => {
    const before = component.shape!.getPiece();

    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(500);
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPiece()).toBe(before);
  });

  it('soft drops while the finger drags downwards', () => {
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(200);
    // Three blocks down, slowly enough not to be a flick.
    component.onTouchMove(touchEvent(100, 220));

    expect(component.shape!.getPosition().y).toBe(3);
  });

  it('does not pull the shape back up when the finger returns', () => {
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(200);
    component.onTouchMove(touchEvent(100, 220));
    jest.advanceTimersByTime(200);
    component.onTouchMove(touchEvent(100, 100));

    expect(component.shape!.getPosition().y).toBe(3);
  });

  it('hard drops on a downwards flick', () => {
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(20);
    component.onTouchMove(touchEvent(100, 200));
    jest.advanceTimersByTime(20);
    component.onTouchMove(touchEvent(100, 340));
    component.onTouchEnd(releaseEvent());

    // T piece is 2 rows tall on a 15 row board, so it lands on row 13.
    expect(component.shape!.getPosition().y).toBe(13);
  });

  it('does not hard drop on a slow downwards drag', () => {
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(400);
    component.onTouchMove(touchEvent(100, 180));
    jest.advanceTimersByTime(400);
    component.onTouchMove(touchEvent(100, 220));
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPosition().y).toBe(3);
  });

  it('does not hard drop on a fast sideways drag', () => {
    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(20);
    component.onTouchMove(touchEvent(240, 310));
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPosition().y).toBe(0);
    expect(component.shape!.getPosition().x).toBe(7);
  });

  it('keeps a sideways drag sideways even if the finger drifts down', () => {
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(100);
    component.onTouchMove(touchEvent(180, 130));
    jest.advanceTimersByTime(100);
    // Now mostly vertical, but the gesture already committed to sideways.
    component.onTouchMove(touchEvent(190, 300));

    expect(component.shape!.getPosition().y).toBe(0);
  });

  it('rotates twice on two quick taps instead of dropping', () => {
    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    jest.advanceTimersByTime(100);

    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPosition().y).toBe(0);
    // Two rotations of a 3x2 piece are back to 3 wide.
    expect(component.shape!.getPieceWidth()).toBe(3);
  });

  it('ignores the mouse events a browser replays after a touch', () => {
    component.onTouchStart(touchEvent(100, 300));
    component.onTouchMove(touchEvent(180, 300));
    component.onTouchEnd(releaseEvent());

    const x: number = component.shape!.getPosition().x;
    component.mousemove({ offsetX: 0, offsetY: 0 } as MouseEvent);

    expect(component.shape!.getPosition().x).toBe(x);
  });

  it('still honours the mouse once the touch has gone stale', () => {
    component.onTouchStart(touchEvent(100, 300));
    component.onTouchEnd(releaseEvent());

    jest.advanceTimersByTime(1000);
    component.mousemove({ offsetX: 40, offsetY: 0 } as MouseEvent);

    expect(component.shape!.getPosition().x).toBe(1);
  });

  it('does not drop the next piece when its own piece settles mid-gesture', () => {
    // The drag starts on one piece; it lands and is replaced before the
    // finger lifts. The release must not carry over to the newcomer.
    component.onTouchStart(touchEvent(100, 100));
    jest.advanceTimersByTime(20);
    component.onTouchMove(touchEvent(100, 200));

    const newcomer = new TShapeModel();
    newcomer.setPosition({ x: 4, y: 0 });
    component.shape = newcomer;

    jest.advanceTimersByTime(20);
    component.onTouchMove(touchEvent(100, 340));
    component.onTouchEnd(releaseEvent());

    expect(newcomer.getPosition().y).toBe(0);
    expect(newcomer.getPosition().x).toBe(4);
  });

  it('does not rotate the next piece when a tap lands between pieces', () => {
    component.onTouchStart(touchEvent(100, 300));

    const newcomer = new TShapeModel();
    newcomer.setPosition({ x: 4, y: 0 });
    const before = newcomer.getPiece();
    component.shape = newcomer;

    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(newcomer.getPiece()).toBe(before);
  });

  it('ignores a gesture that started while no piece was in play', () => {
    component.shape = undefined;
    component.onTouchStart(touchEvent(100, 300));

    const newcomer = new TShapeModel();
    newcomer.setPosition({ x: 4, y: 0 });
    component.shape = newcomer;

    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(newcomer.getPosition().y).toBe(0);
  });

  it('ignores gestures while the game is paused', () => {
    component.isPaused = true;

    component.onTouchStart(touchEvent(100, 300));
    component.onTouchMove(touchEvent(180, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    expect(component.shape!.getPosition().x).toBe(4);
    expect(component.shape!.getPosition().y).toBe(0);
  });
});
