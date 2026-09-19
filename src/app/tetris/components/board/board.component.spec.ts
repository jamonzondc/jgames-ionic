import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { TetrisService } from '../../services';
import { BoardComponent } from './board.component';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Standalone components are imported, never declared.
      imports: [BoardComponent, IonicModule.forRoot()],
      providers: [
        {
          provide: Store,
          useValue: { select: () => of(0), dispatch: () => undefined },
        },
      ],
    });

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    const tetrisService: TetrisService = TestBed.inject(TetrisService);
    // The queue of upcoming pieces has to exist before the component asks
    // for it.
    tetrisService.buildShapes();
    component.board = tetrisService.buildBoard(15, 10, 40);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
