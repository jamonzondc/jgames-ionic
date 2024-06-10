import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TetrisPage } from './tetris.page';

describe('TetrisPage', () => {
  let component: TetrisPage;
  let fixture: ComponentFixture<TetrisPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TetrisPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
