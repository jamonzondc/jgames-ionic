import { createReducer, on } from '@ngrx/store';
import { incrementScore, incrementLevel, reset } from './app.actions';
import { AppState, initialState } from './app.state.interface';

export const appReducer = createReducer(
  initialState,
  on(
    incrementScore,
    (state: AppState): AppState => ({ ...state, score: state.score + 200 })
  ),
  on(
    incrementLevel,
    (state: AppState): AppState => ({ ...state, level: state.level + 1 })
  ),
  on(reset, (state: AppState) => initialState)
);
