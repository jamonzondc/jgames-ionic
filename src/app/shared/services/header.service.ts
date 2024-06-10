import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private _isPlayed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private isPlayed$: Observable<boolean> = this._isPlayed.asObservable();

  public isPlayed(): Observable<boolean> {
    return this.isPlayed$;
  }
  public dispashActionForPlayedGame(isPlayed: boolean) {
    this._isPlayed.next(isPlayed);
  }
}
