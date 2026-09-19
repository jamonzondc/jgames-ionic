import { BlockTypeEnum } from '../block-type.enum';
import { BlockInterface } from '../block.interface';
import { IShapeModel } from './i-square.model';
import { OShapeModel } from './o-square.model';
import { ShapeModel } from './shape.model';
import { TShapeModel } from './t-square.model';

/** The piece as a grid of "#" and ".", which is far easier to read. */
const render = (shape: ShapeModel): string[] =>
  shape
    .getPiece()
    .map((row: BlockInterface[]): string =>
      row
        .map((cell: BlockInterface): string =>
          cell.type === BlockTypeEnum.COLOR_BLOCK ? '#' : '.'
        )
        .join('')
    );

describe('ShapeModel', () => {
  describe('T piece', () => {
    it('turns a quarter at a time and comes back round', () => {
      const shape: TShapeModel = new TShapeModel();
      expect(render(shape)).toEqual(['###', '.#.']);

      shape.setPiece(shape.rotate());
      expect(render(shape)).toEqual(['.#', '##', '.#']);

      shape.setPiece(shape.rotate());
      expect(render(shape)).toEqual(['.#.', '###']);

      shape.setPiece(shape.rotate());
      expect(render(shape)).toEqual(['#.', '##', '#.']);

      shape.setPiece(shape.rotate());
      expect(render(shape)).toEqual(['###', '.#.']);
    });

    it('swaps its width and height as it turns', () => {
      const shape: TShapeModel = new TShapeModel();
      expect([shape.getPieceWidth(), shape.getPieceHeight()]).toEqual([3, 2]);

      shape.setPiece(shape.rotate());

      expect([shape.getPieceWidth(), shape.getPieceHeight()]).toEqual([2, 3]);
    });
  });

  describe('I piece', () => {
    it('lies flat and stands upright', () => {
      const shape: IShapeModel = new IShapeModel();
      expect(render(shape)).toEqual(['#', '#', '#', '#']);

      shape.setPiece(shape.rotate());

      expect(render(shape)).toEqual(['####']);
      expect(shape.getPieceWidth()).toBe(4);
      expect(shape.getPieceHeight()).toBe(1);
    });
  });

  describe('O piece', () => {
    it('is unchanged by rotation', () => {
      const shape: OShapeModel = new OShapeModel();
      const before: string[] = render(shape);

      shape.setPiece(shape.rotate());

      expect(render(shape)).toEqual(before);
    });
  });

  describe('rotate', () => {
    it('reports the rotation without applying it', () => {
      // arrowUp inspects a rotation before deciding whether it collides, so
      // asking must leave the piece exactly as it was.
      const shape: TShapeModel = new TShapeModel();
      const before: string[] = render(shape);
      const width: number = shape.getPieceWidth();

      shape.rotate();

      expect(render(shape)).toEqual(before);
      expect(shape.getPieceWidth()).toBe(width);
    });

    it('keeps the declared size in step with the matrix', () => {
      const shape: TShapeModel = new TShapeModel();

      for (let turn = 0; turn < 4; turn++) {
        shape.setPiece(shape.rotate());
        expect(shape.getPieceWidth()).toBe(shape.getPiece()[0].length);
        expect(shape.getPieceHeight()).toBe(shape.getPiece().length);
      }
    });
  });

  describe('position', () => {
    it('is read back as it was set', () => {
      const shape: TShapeModel = new TShapeModel();

      shape.setPosition({ x: 3, y: 7 });

      expect(shape.getPosition()).toEqual({ x: 3, y: 7 });
    });
  });
});
