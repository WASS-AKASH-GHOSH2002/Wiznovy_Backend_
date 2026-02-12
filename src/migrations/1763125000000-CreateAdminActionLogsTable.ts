import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdminActionLogsTable1763125000000 implements MigrationInterface {
    name = 'CreateAdminActionLogsTable1763125000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`admin_action_logs\` (
                \`id\` varchar(36) NOT NULL,
                \`adminId\` varchar(255) NOT NULL,
                \`role\` varchar(255) NULL,
                \`actionType\` enum ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'COURSE_APPROVED', 'COURSE_REJECTED', 'COURSE_UPDATED', 'PAYOUT_PROCESSED', 'USER_UPDATED', 'USER_STATUS_CHANGED', 'TUTOR_UPDATED', 'TUTOR_STATUS_CHANGED', 'STAFF_CREATED', 'STAFF_UPDATED', 'SESSION_CANCELLED') NOT NULL,
                \`targetId\` varchar(255) NULL,
                \`targetType\` varchar(255) NULL,
                \`oldData\` json NULL,
                \`newData\` json NULL,
                \`ipAddress\` varchar(255) NULL,
                \`userAgent\` text NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

        await queryRunner.query(`
            ALTER TABLE \`admin_action_logs\` 
            ADD CONSTRAINT \`FK_admin_action_logs_adminId\` 
            FOREIGN KEY (\`adminId\`) REFERENCES \`account\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`admin_action_logs\` DROP FOREIGN KEY \`FK_admin_action_logs_adminId\``);
        await queryRunner.query(`DROP TABLE \`admin_action_logs\``);
    }
}