import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { GameCardComponent } from './components/game-card/game-card.component';
import { GetColorByStatePipe } from './pipe/get-color-by-state.pipe';

@NgModule({
    imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule, HomePage, GameCardComponent, GetColorByStatePipe],
})
export class HomePageModule {}
