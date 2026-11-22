update jobs set status = 'rejected' where title like 'GR – Consolidated Advertisement%' and status = 'quarantined';
--> statement-breakpoint
delete from review_queue where job_id in (select id from jobs where title like 'GR – Consolidated Advertisement%' and status = 'rejected');
--> statement-breakpoint
delete from raw_items where kind = 'pdf'
