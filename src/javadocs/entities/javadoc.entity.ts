import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('javadocs')
export class Javadoc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  version: string;

  @CreateDateColumn()
  uploadDate: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ length: 500 })
  storagePath: string;

  @Column({ length: 500, nullable: true })
  jsonDocsPath: string | null;

  @ManyToOne(() => Project, project => project.versions, { onDelete: 'CASCADE' })
  project: Project;
}
