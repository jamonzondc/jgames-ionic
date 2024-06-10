import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { IonModal, NavController, IonicModule } from '@ionic/angular';
import { BlockInterface } from './models/block.interface';
import { TetrisService } from './services';
import { TetrisInterface } from './services/tetris.interface';
import { BoardInterface } from './models/board.interface';
import { BoardComponent } from './components/board/board.component';
import { Store } from '@ngrx/store';
import { AppState } from '../shared/store/app.state.interface';
import { reset } from '../shared/store/app.actions';
import { NextShapeComponent } from './components/next-shape/next-shape.component';
import { HeaderComponent } from '../shared/components/header/header.component';

@Component({
    selector: 'app-tetris',
    templateUrl: './tetris.page.html',
    styleUrls: ['./tetris.page.scss'],
    standalone: true,
    imports: [
        IonicModule,
        HeaderComponent,
        NextShapeComponent,
        BoardComponent,
    ],
})
export class TetrisPage implements OnInit {
  @ViewChild(IonModal) modal!: IonModal;
  @ViewChild(BoardComponent) boardComponent!: BoardComponent;
  public isModalOpen = false;
  public isGameOver = false;
  public mainBoard!: BoardInterface;
  public nextShapesBoard!: BoardInterface;

  protected tetrisService: TetrisInterface = inject(TetrisService);
  constructor(
    private navController: NavController,
    private store: Store<AppState>
  ) {}

  ngOnInit() {
    this.initGame();
  }

  private initGame(): void {
    this.mainBoard = this.tetrisService.buildBoard(15, 10, 40);
    this.nextShapesBoard = this.tetrisService.buildBoard(4, 20, 20);
    this.tetrisService.buildShapes();
    this.store.dispatch(reset());
  }

  public async cancel(): Promise<void> {
    this.isModalOpen = false;
    await this.modal.dismiss();
    this.navController.navigateBack('/home');
  }

  public onPauseGame(): void {
    this.isModalOpen = !this.isModalOpen;
  }

  public async restart(): Promise<void> {
    this.isModalOpen = false;
    this.isGameOver = false;

    this.initGame();
    this.boardComponent.ngOnInit();
  }

  public gameOver(): void {
    this.isGameOver = true;
    this.isModalOpen = true;
  }
}
