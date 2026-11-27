import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateCustomerProfileDto } from './create-customer-profile.dto';

describe('CreateCustomerProfileDto', () => {
  const pipe = new ValidationPipe({ transform: true });
  const metadata = { type: 'body' as const, metatype: CreateCustomerProfileDto };
  const profile = {
    userId: 1,
    phoneNumber: '09123456789',
    serviceAddress: 'Example Street',
  };

  it.each(['phoneNumber', 'serviceAddress'] as const)(
    'rejects whitespace-only %s',
    async (field) => {
      await expect(
        pipe.transform({ ...profile, [field]: '   ' }, metadata),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('trims both fields before passing them to the controller', async () => {
    await expect(
      pipe.transform(
        {
          ...profile,
          phoneNumber: '  09123456789  ',
          serviceAddress: '  Example Street  ',
        },
        metadata,
      ),
    ).resolves.toMatchObject(profile);
  });
});
