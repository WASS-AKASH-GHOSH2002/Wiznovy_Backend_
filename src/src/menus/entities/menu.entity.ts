import { UserPermission } from 'src/user-permissions/entities/user-permission.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  title: string;

  @OneToMany(() => UserPermission, (userPermission) => userPermission.menu)
  userPermission: UserPermission[];
}
