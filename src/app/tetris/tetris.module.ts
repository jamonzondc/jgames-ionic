import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TetrisPageRoutingModule } from './tetris-routing.module';

import { TetrisPage } from './tetris.page';
import { BoardComponent } from './components/board/board.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TetrisPageRoutingModule],
  declarations: [TetrisPage, BoardComponent],
})
export class TetrisPageModule {}
