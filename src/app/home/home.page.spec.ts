import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';

import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Standalone components are imported, never declared.
      imports: [HomePage, IonicModule.forRoot(), RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists the games, with Tetris playable', () => {
    expect(component.games.length).toBeGreaterThan(0);

    const tetris = component.games.find((game) => game.name === 'Tetris');
    expect(tetris?.routerLink).toBe('/tetris');
  });
});
