-- Fix shifts.terminal_id: varchar(100) → uuid with FK to terminals
-- Safe while shifts table has no data

ALTER TABLE "shifts" DROP COLUMN "terminal_id";
ALTER TABLE "shifts" ADD COLUMN "terminal_id" uuid;
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_terminal_id_terminals_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "terminals"("id") ON DELETE SET NULL;
