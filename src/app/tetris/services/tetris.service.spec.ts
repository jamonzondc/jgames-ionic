import { TestBed, fakeAsync } from '@angular/core/testing';

import { TetrisService } from './tetris.service';

describe('TetrisService', () => {
  let service: TetrisService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TetrisService] });
    service = TestBed.inject(TetrisService);
  });

  it('should be created', fakeAsync(() => {
    expect(service.getA()).toBe(10);
  }));
});
