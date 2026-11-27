import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { User } from '../entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService login tracking', () => {
  const credentials = { email: 'customer@example.test', password: 'test-only-password' };
  const getOne = jest.fn();
  const query = { addSelect: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getOne };
  const update = jest.fn();
  const repository = { createQueryBuilder: jest.fn().mockReturnValue(query), update };
  const signAsync = jest.fn();
  const service = new AuthService(
    repository as unknown as Repository<User>,
    { signAsync } as unknown as JwtService,
  );

  beforeEach(async () => {
    jest.clearAllMocks();
    signAsync.mockResolvedValue('test-token');
    update.mockResolvedValue({ affected: 1 });
    getOne.mockResolvedValue({
      userId: 7,
      fullName: 'Test Customer',
      email: credentials.email,
      role: 'Customer',
      passwordHash: await bcrypt.hash(credentials.password, 4),
    });
  });

  it('records the timestamp for the account that signed in', async () => {
    await expect(service.login(credentials)).resolves.toMatchObject({
      access_token: 'test-token',
      user: { userId: 7 },
    });
    expect(update).toHaveBeenCalledWith(7, { lastLoginAt: expect.any(Function) });
    const { lastLoginAt } = update.mock.calls[0][1];
    expect(lastLoginAt()).toBe('CURRENT_TIMESTAMP(3)');
  });

  it('leaves the timestamp untouched if the password is incorrect', async () => {
    await expect(
      service.login({ ...credentials, password: 'incorrect' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(update).not.toHaveBeenCalled();
  });

  it('leaves the timestamp untouched if token signing fails', async () => {
    signAsync.mockRejectedValueOnce(new Error('Signing failed'));
    await expect(service.login(credentials)).rejects.toThrow('Signing failed');
    expect(update).not.toHaveBeenCalled();
  });
});
