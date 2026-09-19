import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectLevel, selectScore } from '../../store/app.selectors';
import { AppState } from '../../store/app.state.interface';
import { NgFor, AsyncPipe } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AudioService } from '../../services/audio.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: true,
    imports: [
        IonicModule,
        NgFor,
        AsyncPipe,
    ],
})
export class HeaderComponent implements OnInit {
  @Input({
    required: true,
  })
  title!: string;
  @Output() public onPauseGame: EventEmitter<void> = new EventEmitter<void>();
  score$!: Observable<number>;
  level: number = 0;
  levels: Array<number> = [];
  public isMuted: boolean = false;

  private audioService: AudioService = inject(AudioService);

  constructor(private store: Store<AppState>) {}

  public ngOnInit(): void {
    this.isMuted = this.audioService.isMuted();
    this.score$ = this.store.select(selectScore);
    this.store.select(selectLevel).subscribe({
      next: (level: number) => {
        this.level = level;
        this.levels = Array(level).fill(0);
      },
    });
  }

  public onPauseOrPlay(): void {
    this.onPauseGame.emit();
  }

  public onToggleSound(): void {
    this.isMuted = this.audioService.toggleMute();
  }
}
