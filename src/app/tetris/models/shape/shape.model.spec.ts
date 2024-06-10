import { describe, expect, test } from '@jest/globals';
import { TShapeModel } from './t-square.model';
import { ShapeModel } from './shape.model';
import { IShapeModel } from './i-square.model';
import { LShapeModel } from './l-square.model';
import { OShapeModel } from './o-square.model';
import { ZShapeModel } from './z-square.model';

describe('ShapeModel', () => {
  function executeAssert(
    shapeModel: ShapeModel,
    rotatedShape: Array<string[][]>
  ): void {
    rotatedShape.forEach((shapeRotated: string[][]): void => {
      shapeModel.rotate();
      expect(shapeModel.getPiece()).toEqual(shapeRotated);
    });
  }

  test('should rote the t shape', async () => {
    const tShapeModel: TShapeModel = new TShapeModel({ x: 0, y: 0 });
    const rotatedShape: Array<string[][]> = [
      [
        ['0', '1'],
        ['1', '1'],
        ['0', '1'],
      ],
      [
        ['0', '1', '0'],
        ['1', '1', '1'],
      ],
      [
        ['1', '0'],
        ['1', '1'],
        ['1', '0'],
      ],
      [
        ['1', '1', '1'],
        ['0', '1', '0'],
      ],
    ];

    executeAssert(tShapeModel, rotatedShape);
  });

  test('should rote the i shape', async () => {
    const iShapeModel: IShapeModel = new IShapeModel({ x: 0, y: 0 });
    const rotatedShape: Array<string[][]> = [
      [['1', '1', '1', '1']],
      [['1'], ['1'], ['1'], ['1']],
      [['1', '1', '1', '1']],
      [['1'], ['1'], ['1'], ['1']],
    ];

    executeAssert(iShapeModel, rotatedShape);
  });

  test('should rote the l shape', async () => {
    const lShapeModel: LShapeModel = new LShapeModel({ x: 0, y: 0 });
    const rotatedShape: Array<string[][]> = [
      [
        ['1', '1', '1'],
        ['1', '0', '0'],
      ],
    ];

    executeAssert(lShapeModel, rotatedShape);
  });

  test('should rote the o shape', async () => {
    const oShapeModel: OShapeModel = new OShapeModel({ x: 0, y: 0 });
    const rotatedShape: Array<string[][]> = [
      [
        ['1', '1'],
        ['1', '1'],
      ],
      [
        ['1', '1'],
        ['1', '1'],
      ],
      [
        ['1', '1'],
        ['1', '1'],
      ],
      [
        ['1', '1'],
        ['1', '1'],
      ],
    ];

    executeAssert(oShapeModel, rotatedShape);
  });

  test('should rote the z shape', async () => {
    const zShapeModel: ZShapeModel = new ZShapeModel({ x: 0, y: 0 });
    const rotatedShape: Array<string[][]> = [
      [
        ['0', '1'],
        ['1', '1'],
        ['1', '0'],
      ],
      [
        ['1', '1', '0'],
        ['0', '1', '1'],
      ],
      [
        ['0', '1'],
        ['1', '1'],
        ['1', '0'],
      ],
      [
        ['1', '1', '0'],
        ['0', '1', '1'],
      ],
    ];

    executeAssert(zShapeModel, rotatedShape);
  });
});
