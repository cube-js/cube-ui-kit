import { mergeProps } from './mergeProps';

describe('mergeProps', () => {
  describe('styles and *Styles keys', () => {
    it('merges `styles` from both sides', () => {
      expect(
        mergeProps({ styles: { padding: '1x' } }, { styles: { margin: '2x' } })
          .styles,
      ).toEqual({ padding: '1x', margin: '2x' });
    });

    it('merges a *Styles key when neither side passes `styles`', () => {
      expect(
        mergeProps(
          { innerStyles: { padding: '1x' } },
          { innerStyles: { margin: '2x' } },
        ).innerStyles,
      ).toEqual({ padding: '1x', margin: '2x' });
    });

    it('merges a *Styles key when only one side passes `styles`', () => {
      expect(
        mergeProps(
          { styles: { fill: '#white' }, inputStyles: { padding: '1x' } },
          { inputStyles: { margin: '2x' } },
        ).inputStyles,
      ).toEqual({ padding: '1x', margin: '2x' });

      expect(
        mergeProps(
          { inputStyles: { padding: '1x' } },
          { styles: { fill: '#white' }, inputStyles: { margin: '2x' } },
        ).inputStyles,
      ).toEqual({ padding: '1x', margin: '2x' });
    });

    it('merges a *Styles key when both sides pass `styles`', () => {
      const result = mergeProps(
        { styles: { fill: '#white' }, innerStyles: { padding: '1x' } },
        { styles: { color: '#dark' }, innerStyles: { margin: '2x' } },
      );

      expect(result.styles).toEqual({ fill: '#white', color: '#dark' });
      expect(result.innerStyles).toEqual({ padding: '1x', margin: '2x' });
    });

    it('lets the later side win a key both sides set', () => {
      expect(
        mergeProps(
          { innerStyles: { padding: '1x' } },
          { innerStyles: { padding: '2x' } },
        ).innerStyles,
      ).toEqual({ padding: '2x' });
    });

    it('keeps the side that holds the only *Styles object', () => {
      expect(
        mergeProps({ innerStyles: { padding: '1x' } }, {}).innerStyles,
      ).toEqual({ padding: '1x' });

      // Typed loosely: the literal types of these pairs don't intersect.
      const loose = (props: object): object => props;

      expect(
        mergeProps(
          loose({ innerStyles: undefined }),
          loose({ innerStyles: { margin: '2x' } }),
        ),
      ).toEqual({ innerStyles: { margin: '2x' } });
      expect(
        mergeProps(
          loose({ innerStyles: { padding: '1x' } }),
          loose({ innerStyles: null }),
        ),
      ).toEqual({ innerStyles: null });
    });
  });
});
