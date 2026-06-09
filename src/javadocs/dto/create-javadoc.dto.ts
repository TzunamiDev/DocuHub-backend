import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateJavadocDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @MaxLength(50)
  version: string;

  @IsString()
  @MaxLength(255)
  author: string;

  @IsString()
  tags: string; // Comma separated tags
}
