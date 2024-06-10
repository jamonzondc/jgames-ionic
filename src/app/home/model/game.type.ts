import { GAMES_STATE } from './game-state.enum';

export type Game = {
  name: string;
  description: string;
  image: string;
  routerLink: string;
  state: GAMES_STATE;
};
