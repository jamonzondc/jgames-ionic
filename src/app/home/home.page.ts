import { Component } from '@angular/core';
import { Game } from './model/game.type';
import { GAMES_STATE } from './model/game-state.enum';
import { GameCardComponent } from './components/game-card/game-card.component';
import { NgFor } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    standalone: true,
    imports: [
        IonicModule,
        NgFor,
        GameCardComponent,
    ],
})
export class HomePage {
  public readonly games: Game[] = [
    {
      name: 'Tetris',
      description:
        'Tetris is a logic video game originally designed and programmed by Alexei Pázhitnov in the Soviet Union. It was published on June 6, 1984, while working for the Dorodnitsyn Computer Center of the Academy of Sciences of the Soviet Union in Moscow, RSFS of Russia.',
      image: 'assets/image/tetris.png',
      routerLink: '/tetris',
      state: GAMES_STATE.IN_PROGRES,
    },
    {
      name: 'Super Collapse',
      description:
        'In late 1998, Ben Exworthy and Garr Godfrey worked together to release the original Collapse! as a browser-based game. In 2001, GameHouse developed and released Super Collapse! Find rows and columns of three or more like-colored blocks; click them and they disappear, collapsing the rows and columns above.',
      image: 'assets/image/super-collapse.jpg',
      routerLink: '/supercollapse',
      state: GAMES_STATE.TODO,
    },
    {
      name: 'Othello',
      description:
        'Othello is a strategy game for two players (Black and White) that is played on an 8-for-eight board. The game traditionally begins with four discs in the center of the board as shown below. Black moves first.',
      image: 'assets/image/othello.jpg',
      routerLink: '/othello',
      state: GAMES_STATE.TODO,
    },
    {
      name: 'Super Mario',
      description:
        'Super Mario is a series of platform video games created by the developer company Nintendo and starring its mascot, Mario. Super Mario video games follow the adventures of the plumber Mario, usually in the fictional Mushroom Kingdom.',
      image: 'assets/image/super-mario.webp',
      routerLink: '/supermario',
      state: GAMES_STATE.TODO,
    },
  ];
  constructor() {}
}
