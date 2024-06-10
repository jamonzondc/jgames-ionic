import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState } from './app.state.interface';

export const selectAppState = createFeatureSelector<AppState>('game');
export const selectScore = createSelector(
  selectAppState,
  (state: AppState): number => state.score
);
export const selectLevel = createSelector(
  selectAppState,
  (state: AppState): number => state.level
);
