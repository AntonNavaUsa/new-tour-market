import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateGpxFileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Слаг может содержать только строчные буквы, цифры и дефисы' })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;
}
