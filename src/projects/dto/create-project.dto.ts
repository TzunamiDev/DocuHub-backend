import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  shortLink: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  tags?: string[] | string;

  @IsString()
  @IsNotEmpty()
  author: string;
}
