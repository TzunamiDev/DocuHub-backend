import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateJavadocDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version: string;
}
