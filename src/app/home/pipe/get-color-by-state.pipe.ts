import { Pipe, PipeTransform } from '@angular/core';
import { GAMES_STATE } from '../model/game-state.enum';

@Pipe({
    name: 'getColorByState',
    standalone: true,
})
export class GetColorByStatePipe implements PipeTransform {
  transform(value: string): string {
    if (value == GAMES_STATE.TODO) return 'medium';
    if (value == GAMES_STATE.IN_PROGRES) return 'tertiary';
    return 'success';
  }
}
