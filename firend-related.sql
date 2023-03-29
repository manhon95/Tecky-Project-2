insert into "friend_request" (sender_id, receiver_id, message)
values (4, 5, 'Hello World');
-- test case ivan adding trin friend accpeted 
insert into "friend_request" (sender_id, receiver_id, message, accept_time)
values (4, 6, 'This is accepted', NOW());
-- this is non-friend 
select *
from "friend_request"
where (
    (
      sender_id = 4
      AND receiver_id = 5
    )
    OR (
      sender_id = 5
      AND receiver_id = 4
    )
  )
  AND accept_time IS NOT NULL;
-- they are friend
select *
from "friend_request"
where (
    (
      sender_id = 4
      AND receiver_id = 6
    )
    OR (
      sender_id = 6
      AND receiver_id = 4
    )
  )
  AND accept_time IS NOT NULL;
-- listing all the friends from userId 4, should be showing userId 6
SELECT u.id,
  u.user_name,
  u.email,
  u.elo
FROM "user" u
  INNER JOIN (
    SELECT CASE
        WHEN sender_id = 4 THEN receiver_id
        ELSE sender_id
      END AS friend_id
    FROM friend_request
    WHERE (
        sender_id = 4
        OR receiver_id = 4
      )
      AND accept_time IS NOT NULL
  ) as f ON u.id = f.friend_id;
--select incoming request sent by ivan in admin social page
select fr.id,
  u.user_name as sender_name,
  fr.message
from friend_request fr
  INNER JOIN "user" u ON fr.sender_id = u.id
WHERE fr.receiver_id = 5
  AND fr.accept_time IS NULL;
-- trying to send request from 4 to 6
insert into "friend_request" (sender_id, receiver_id, message)
values (4, 6, 'trying to create request');
-- reject friend request query