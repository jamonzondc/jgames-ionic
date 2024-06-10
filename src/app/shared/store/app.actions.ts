import { createAction } from '@ngrx/store';

export const incrementScore = createAction('Increment Score');
export const incrementLevel = createAction('Increment Level');
export const reset = createAction('Reset');
