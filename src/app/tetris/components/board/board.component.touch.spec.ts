import { TestBed } from '@angular/core/testing';
import { AlertController, Platform } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { TShapeModel } from '../../models';
import { BoardInterface } from '../../models/board.interface';
import { TetrisService } from '../../services';
import { BoardComponent } from './board.component';

/**
 * Touch gestures: drag moves sideways, tap rotates, double tap hard drops.
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

  it('hard drops on a double tap and undoes the first tap rotation', () => {
    const before = component.shape!.getPiece();

    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    jest.advanceTimersByTime(100);

    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    // T piece is 2 rows tall on a 15 row board, so it lands on row 13.
    expect(component.shape!.getPosition().y).toBe(13);
    expect(component.shape!.getPiece()).toBe(before);
    expect(component.shape!.getPieceWidth()).toBe(3);
  });

  it('treats two slow taps as two rotations, not a drop', () => {
    component.onTouchStart(touchEvent(100, 300));
    jest.advanceTimersByTime(50);
    component.onTouchEnd(releaseEvent());

    jest.advanceTimersByTime(1000);

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
