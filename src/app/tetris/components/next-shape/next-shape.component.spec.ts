import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { TetrisService } from '../../services';
import { NextShapeComponent } from './next-shape.component';

describe('NextShapeComponent', () => {
  let component: NextShapeComponent;
  let fixture: ComponentFixture<NextShapeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Standalone components are imported, never declared.
      imports: [NextShapeComponent, IonicModule.forRoot()],
      providers: [
        {
          provide: Store,
          useValue: { select: () => of(0), dispatch: () => undefined },
        },
      ],
    });

    fixture = TestBed.createComponent(NextShapeComponent);
    component = fixture.componentInstance;
    const tetrisService: TetrisService = TestBed.inject(TetrisService);
    // The queue of upcoming pieces has to exist before the component asks
    // for it.
    tetrisService.buildShapes();
    component.board = tetrisService.buildBoard(4, 20, 20);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
