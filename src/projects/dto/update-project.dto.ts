import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  shortLink?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[] | string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsBoolean()
  jsonDocsRequireAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

