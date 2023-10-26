import { Component, HostListener, OnInit, inject } from '@angular/core';
import { ShapeModel } from './models';
import { COLOR } from './models/color.enum';
import { TetrisService } from './services';
import { TetrisInterface } from './services/tetris.interface';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tetris',
  templateUrl: './tetris.page.html',
  styleUrls: ['./tetris.page.scss'],
})
export class TetrisPage implements OnInit {
  BLOCK_SIZE: number = 40;
  BOARD_WIDTH: number = 10;
  BOARD_HEIGHT: number = 15;

  constructor(private alertController: AlertController) {}

  ngOnInit() {}
}
