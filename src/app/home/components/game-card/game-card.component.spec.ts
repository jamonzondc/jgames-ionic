import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';

import { GAMES_STATE } from '../../model/game-state.enum';
import { GameCardComponent } from './game-card.component';

describe('GameCardComponent', () => {
  let component: GameCardComponent;
  let fixture: ComponentFixture<GameCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Standalone components are imported, never declared.
      imports: [GameCardComponent, IonicModule.forRoot(), RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCardComponent);
    component = fixture.componentInstance;
    component.gameData = {
      name: 'Tetris',
      description: 'Un clásico',
      image: 'assets/image/tetris.png',
      routerLink: '/tetris',
      state: GAMES_STATE.IN_PROGRES,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the game name', () => {
    const title: HTMLElement = fixture.nativeElement.querySelector(
      '.game-card__title'
    );

    expect(title.textContent).toContain('Tetris');
  });
});
