import { Component, Input, OnInit } from '@angular/core';
import { Game } from '../../model/game.type';
import { GetColorByStatePipe } from '../../pipe/get-color-by-state.pipe';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    standalone: true,
    imports: [
        IonicModule,
        RouterLink,
        GetColorByStatePipe,
    ],
})
export class GameCardComponent implements OnInit {
  @Input({ required: true }) public gameData!: Game;
  constructor() {}

  ngOnInit() {}
}
