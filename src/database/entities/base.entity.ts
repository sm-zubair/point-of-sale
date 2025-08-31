import { BeforeInsert, BeforeUpdate, Column } from 'typeorm';

export default abstract class BaseEntity {
  @Column({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp', select: false })
  updatedAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @BeforeUpdate()
  setUpdatedAt() {
    this.updatedAt = new Date();
  }
}
