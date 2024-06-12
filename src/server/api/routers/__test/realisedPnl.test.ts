// src/server/api/routers/__test__/realisedPnlRouter.test.ts
import { createTRPCRouter } from '../../trpc';
import { realisedPnlRouter } from '../realisedPnl';
import { db } from '~/server/db';
import { initTRPC } from '@trpc/server';

jest.mock('~/server/db');

const t = initTRPC.create();

const mockContext = async () => {
  return {
    headers: new Headers(),
    db,
    session: null,
  };
};

describe('realisedPnlRouter', () => {
  it('should return the correct data when valid input is provided', async () => {
    const mockData = [
      { fromDate: new Date('2023-01-01'), pnl: 100 },
      { fromDate: new Date('2023-01-02'), pnl: 200 },
    ];

    (db.realisedPnl.findMany as jest.Mock).mockResolvedValue(mockData);

    const caller = realisedPnlRouter.createCaller(await mockContext());
    const result = await caller.doJob({
      fromDate: '2023-01-01',
      toDate: '2023-01-02',
      email: 'test@example.com',
      entryType: 'FNO_INTRADAY',
    });

    expect(result).toEqual([
      { date: '2023-01-01', pnl: 100 },
      { date: '2023-01-02', pnl: 200 },
    ]);
  });

  it('should throw an error when input is invalid', async () => {
    const caller = realisedPnlRouter.createCaller(await mockContext());

    await expect(
      caller.doJob({
        fromDate: 'invalid-date',
        toDate: '2023-01-02',
        email: 'invalid-email',
        entryType: 'FNO_INTRADAY',
      })
    ).rejects.toThrowError();
  });

  it('should handle database errors gracefully', async () => {
    (db.realisedPnl.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const caller = realisedPnlRouter.createCaller(await mockContext());

    await expect(
      caller.doJob({
        fromDate: '2023-01-01',
        toDate: '2023-01-02',
        email: 'test@example.com',
        entryType: 'FNO_INTRADAY',
      })
    ).rejects.toThrowError('Internal Service Error');
  });
});
