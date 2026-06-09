import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('javadocs')
export class Javadoc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  description: string;

  @Column({ length: 50 })
  version: string;

  @Column('simple-array')
  tags: string[];

  @CreateDateColumn()
  uploadDate: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ length: 255 })
  author: string;

  @Column({ length: 500 })
  storagePath: string;
}
