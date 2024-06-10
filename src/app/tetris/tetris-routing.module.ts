import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TetrisPage } from './tetris.page';

const routes: Routes = [
  {
    path: '',
    component: TetrisPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TetrisPageRoutingModule {}
