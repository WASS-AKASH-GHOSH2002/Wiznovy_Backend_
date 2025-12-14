import { Account } from "src/account/entities/account.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class LoginHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid' })
    accountId: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    loginTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    logoutTime: Date;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ip: string;

    @ManyToOne(() => Account, (account) => account.loginHistory)
    account: Account;
}
