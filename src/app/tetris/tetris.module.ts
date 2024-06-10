import { NgModule } from '@angular/core';
import { TetrisPageRoutingModule } from './tetris-routing.module';

import { BoardComponent } from './components/board/board.component';
import { TetrisPage } from './tetris.page';
import { NextShapeComponent } from './components/next-shape/next-shape.component';
import { StoreModule } from '@ngrx/store';
import { appReducer } from '../shared/store/app.reducer';

@NgModule({
    imports: [
    StoreModule.forFeature('game', appReducer),
    TetrisPageRoutingModule,
    TetrisPage, BoardComponent, NextShapeComponent,
],
})
export class TetrisPageModule {}
