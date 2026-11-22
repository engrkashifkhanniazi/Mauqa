delete from job_files where job_id in (select j.id from jobs j join sources s on s.id = j.source_id where s.key = 'FPSC' and j.title not like 'GR – Consolidated%');
--> statement-breakpoint
delete from jobs where id in (select j.id from jobs j join sources s on s.id = j.source_id where s.key = 'FPSC' and j.title not like 'GR – Consolidated%');
--> statement-breakpoint
delete from raw_items where kind = 'pdf'
