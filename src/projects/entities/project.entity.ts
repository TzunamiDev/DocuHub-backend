import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Javadoc } from '../../javadocs/entities/javadoc.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shortLink: string;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  tags: string[];

  @Column({ length: 255 })
  author: string;

  @Column({ default: false })
  jsonDocsRequireAuth: boolean;

  @Column({ default: false })
  isPrivate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @OneToMany(() => Javadoc, javadoc => javadoc.project, { cascade: true })
  versions: Javadoc[];
}
