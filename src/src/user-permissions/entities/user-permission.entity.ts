import { Account } from 'src/account/entities/account.entity';
import { Menu } from 'src/menus/entities/menu.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UserPermission {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid', nullable: true })
  accountId: string;

  @Column({ type: 'int', nullable: true })
  menuId: number;

  @Column({ type: 'int', nullable: true })
  permissionId: number;

  @Column({ type: 'boolean', default: false })
  status: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Account, (account) => account.userPermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  account: Account[];

  @ManyToOne(() => Menu, (menu) => menu.userPermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  menu: Menu[];

  @ManyToOne(() => Permission, (permission) => permission.userPermission, {
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  permission: Permission[];
}
