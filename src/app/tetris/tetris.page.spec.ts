import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { TetrisPage } from './tetris.page';

describe('TetrisPage', () => {
  let component: TetrisPage;
  let fixture: ComponentFixture<TetrisPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Standalone components are imported, never declared.
      imports: [TetrisPage, IonicModule.forRoot()],
      providers: [
        {
          provide: Store,
          useValue: { select: () => of(0), dispatch: () => undefined },
        },
      ],
    });

    fixture = TestBed.createComponent(TetrisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts with both boards built and the menu closed', () => {
    expect(component.mainBoard.BOARD_HEIGHT).toBe(15);
    expect(component.mainBoard.BOARD_WIDTH).toBe(10);
    expect(component.nextShapesBoard).toBeDefined();
    expect(component.isModalOpen).toBe(false);
    expect(component.isGameOver).toBe(false);
  });

  it('opens the menu when the game is paused', () => {
    component.onPauseGame();

    expect(component.isModalOpen).toBe(true);
  });

  it('opens the menu on game over', () => {
    component.gameOver();

    expect(component.isGameOver).toBe(true);
    expect(component.isModalOpen).toBe(true);
  });
});
