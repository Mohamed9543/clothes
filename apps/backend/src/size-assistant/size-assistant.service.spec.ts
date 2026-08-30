import { SizeAssistantService } from './size-assistant.service';

describe('SizeAssistantService — recommend', () => {
  let service: SizeAssistantService;
  let findByIdUserMock: jest.Mock;
  let findByIdProductMock: jest.Mock;

  function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
    return { chestCm: null, fitPreference: null, ...overrides };
  }

  function makeProduct(sizes: { size: string; stock: number }[]) {
    return { variants: sizes.map((s) => ({ ...s, color: 'Noir', sku: 'x', priceOverride: null })) };
  }

  beforeEach(() => {
    findByIdUserMock = jest.fn();
    findByIdProductMock = jest.fn();
    service = new SizeAssistantService(
      { findById: findByIdProductMock } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      { findById: findByIdUserMock } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  });

  it('recommends the mid-bracket size with high confidence when in stock', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 92 })); // clean middle of M (90-95)
    findByIdProductMock.mockResolvedValue(
      makeProduct([
        { size: 'S', stock: 5 },
        { size: 'M', stock: 5 },
        { size: 'L', stock: 5 },
      ]),
    );

    const result = await service.recommend('user1', 'prod1');

    expect(result.recommendedSize).toBe('M');
    expect(result.confidence).toBe('high');
  });

  it('drops to medium confidence when the chest measurement is near a bracket boundary', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 90 })); // right at the M boundary
    findByIdProductMock.mockResolvedValue(makeProduct([{ size: 'M', stock: 5 }]));

    const result = await service.recommend('user1', 'prod1');

    expect(result.confidence).toBe('medium');
  });

  it('shifts one size down for a slim fit preference', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 92, fitPreference: 'slim' }));
    findByIdProductMock.mockResolvedValue(
      makeProduct([
        { size: 'S', stock: 5 },
        { size: 'M', stock: 5 },
      ]),
    );

    const result = await service.recommend('user1', 'prod1');

    expect(result.recommendedSize).toBe('S');
  });

  it('shifts one size up for an oversized fit preference', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 92, fitPreference: 'oversized' }));
    findByIdProductMock.mockResolvedValue(
      makeProduct([
        { size: 'M', stock: 5 },
        { size: 'L', stock: 5 },
      ]),
    );

    const result = await service.recommend('user1', 'prod1');

    expect(result.recommendedSize).toBe('L');
  });

  it('does not shift past XXL for an oversized preference at the top of the chart', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 115, fitPreference: 'oversized' })); // XXL bracket
    findByIdProductMock.mockResolvedValue(makeProduct([{ size: 'XXL', stock: 5 }]));

    const result = await service.recommend('user1', 'prod1');

    expect(result.recommendedSize).toBe('XXL');
  });

  it('falls back to the nearest available size when the recommended one does not exist on the product', async () => {
    findByIdUserMock.mockResolvedValue(makeUser({ chestCm: 92 })); // -> M
    findByIdProductMock.mockResolvedValue(
      makeProduct([
        { size: 'S', stock: 5 },
        { size: 'L', stock: 5 },
      ]),
    );

    const result = await service.recommend('user1', 'prod1');

    expect(['S', 'L']).toContain(result.recommendedSize);
    expect(result.confidence).toBe('medium');
  });

  it('returns confidence "none" with no recommendation when the user has no chest measurement', async () => {
    findByIdUserMock.mockResolvedValue(makeUser());
    findByIdProductMock.mockResolvedValue(makeProduct([{ size: 'M', stock: 5 }]));

    const result = await service.recommend('user1', 'prod1');

    expect(result.recommendedSize).toBeNull();
    expect(result.confidence).toBe('none');
  });
});
