export interface AppState {
  score: number;
  level: number;
  lives: number;
  isGameOver: boolean;
}

export const initialState: AppState = {
  score: 0,
  level: 1,
  lives: 1,
  isGameOver: false,
};
