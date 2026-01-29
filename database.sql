create sequence round_number_seq;

alter sequence round_number_seq owner to postgres;

grant select, update, usage on sequence round_number_seq to anon;

grant select, update, usage on sequence round_number_seq to authenticated;

grant select, update, usage on sequence round_number_seq to service_role;

create table shoes
(
    id                  text not null
        primary key,
    shoe_number         serial,
    deck_count          integer                  default 8,
    total_cards         integer                  default 416,
    first_card_suit     text,
    first_card_rank     text,
    burn_start_count    integer                  default 0,
    burn_end_count      integer                  default 15,
    usable_cards        integer                  default 401,
    rounds_played       integer                  default 0,
    shuffle_vrf_proof   text,
    started_at          timestamp with time zone default now(),
    started_at_unix     bigint,
    ended_at            timestamp with time zone,
    ended_at_unix       bigint,
    solana_signature    text,
    solana_explorer_url text,
    blockchain_status   text                     default 'confirmed'::text,
    created_at          timestamp with time zone default now(),
    updated_at          timestamp with time zone default now()
);

alter table shoes
    owner to postgres;

grant select, update, usage on sequence shoes_shoe_number_seq to anon;

grant select, update, usage on sequence shoes_shoe_number_seq to authenticated;

grant select, update, usage on sequence shoes_shoe_number_seq to service_role;

create index idx_shoes_started_at
    on shoes (started_at desc);

grant delete, insert, references, select, trigger, truncate, update on shoes to anon;

grant delete, insert, references, select, trigger, truncate, update on shoes to authenticated;

grant delete, insert, references, select, trigger, truncate, update on shoes to service_role;

create table rounds
(
    id                  text                     not null
        primary key,
    shoe_id             text
        references shoes
            on delete cascade,
    round_number        integer                  not null
        unique,
    result              text                     not null,
    player_total        integer                  not null,
    banker_total        integer                  not null,
    winning_total       integer,
    is_player_pair      boolean                  default false,
    is_banker_pair      boolean                  default false,
    vrf_proof           text,
    started_at          timestamp with time zone not null,
    started_at_unix     bigint,
    completed_at        timestamp with time zone not null,
    completed_at_unix   bigint,
    solana_signature    text,
    solana_explorer_url text,
    blockchain_status   text                     default 'confirmed'::text,
    created_at          timestamp with time zone default now()
);

alter table rounds
    owner to postgres;

create index idx_rounds_completed_at
    on rounds (completed_at desc);

create index idx_rounds_shoe_id
    on rounds (shoe_id);

create index idx_rounds_round_number
    on rounds (round_number);

grant delete, insert, references, select, trigger, truncate, update on rounds to anon;

grant delete, insert, references, select, trigger, truncate, update on rounds to authenticated;

grant delete, insert, references, select, trigger, truncate, update on rounds to service_role;

create table used_cards
(
    id         serial
        primary key,
    round_id   text
        references rounds
            on delete cascade,
    shoe_id    text
        references shoes
            on delete cascade,
    position   integer not null,
    dealt_to   text    not null,
    suit       text    not null,
    rank       text    not null,
    created_at timestamp with time zone default now()
);

alter table used_cards
    owner to postgres;

grant select, update, usage on sequence used_cards_id_seq to anon;

grant select, update, usage on sequence used_cards_id_seq to authenticated;

grant select, update, usage on sequence used_cards_id_seq to service_role;

create index idx_used_cards_round_id
    on used_cards (round_id);

create index idx_used_cards_shoe_id
    on used_cards (shoe_id);

grant delete, insert, references, select, trigger, truncate, update on used_cards to anon;

grant delete, insert, references, select, trigger, truncate, update on used_cards to authenticated;

grant delete, insert, references, select, trigger, truncate, update on used_cards to service_role;

create view current_shoe
            (id, shoe_number, deck_count, total_cards, first_card_suit, first_card_rank, burn_start_count,
             burn_end_count, usable_cards, rounds_played, started_at, started_at_unix, cards_used)
as
SELECT id,
       shoe_number,
       deck_count,
       total_cards,
       first_card_suit,
       first_card_rank,
       burn_start_count,
       burn_end_count,
       usable_cards,
       rounds_played,
       started_at,
       started_at_unix,
       COALESCE((SELECT count(*) AS count
                 FROM used_cards uc
                 WHERE uc.shoe_id = s.id), 0::bigint)::integer AS cards_used
FROM shoes s
WHERE ended_at IS NULL
ORDER BY started_at DESC
LIMIT 1;

alter table current_shoe
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on current_shoe to anon;

grant delete, insert, references, select, trigger, truncate, update on current_shoe to authenticated;

grant delete, insert, references, select, trigger, truncate, update on current_shoe to service_role;

create view game_stats (total_rounds, banker_wins, player_wins, ties, banker_pairs, player_pairs) as
SELECT count(*)::integer                                            AS total_rounds,
       count(*) FILTER (WHERE result = 'banker_win'::text)::integer AS banker_wins,
       count(*) FILTER (WHERE result = 'player_win'::text)::integer AS player_wins,
       count(*) FILTER (WHERE result = 'tie'::text)::integer        AS ties,
       count(*) FILTER (WHERE is_banker_pair = true)::integer       AS banker_pairs,
       count(*) FILTER (WHERE is_player_pair = true)::integer       AS player_pairs
FROM rounds;

alter table game_stats
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on game_stats to anon;

grant delete, insert, references, select, trigger, truncate, update on game_stats to authenticated;

grant delete, insert, references, select, trigger, truncate, update on game_stats to service_role;

create view rounds_list
            (id, shoe_id, shoe_number, round_number, result, player_total, banker_total, winning_total, is_player_pair,
             is_banker_pair, started_at, started_at_unix, completed_at, completed_at_unix, solana_signature,
             solana_explorer_url, blockchain_status, player_cards, banker_cards)
as
SELECT r.id,
       r.shoe_id,
       s.shoe_number,
       r.round_number,
       r.result,
       r.player_total,
       r.banker_total,
       r.winning_total,
       r.is_player_pair,
       r.is_banker_pair,
       r.started_at,
       r.started_at_unix,
       r.completed_at,
       r.completed_at_unix,
       r.solana_signature,
       r.solana_explorer_url,
       r.blockchain_status,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('suit', uc.suit, 'rank', uc.rank)
                                  ORDER BY uc."position") AS jsonb_agg
                 FROM used_cards uc
                 WHERE uc.round_id = r.id
                   AND uc.dealt_to = 'player'::text), '[]'::jsonb) AS player_cards,
       COALESCE((SELECT jsonb_agg(jsonb_build_object('suit', uc.suit, 'rank', uc.rank)
                                  ORDER BY uc."position") AS jsonb_agg
                 FROM used_cards uc
                 WHERE uc.round_id = r.id
                   AND uc.dealt_to = 'banker'::text), '[]'::jsonb) AS banker_cards
FROM rounds r
         LEFT JOIN shoes s ON r.shoe_id = s.id
ORDER BY r.completed_at DESC;

alter table rounds_list
    owner to postgres;

grant delete, insert, references, select, trigger, truncate, update on rounds_list to anon;

grant delete, insert, references, select, trigger, truncate, update on rounds_list to authenticated;

grant delete, insert, references, select, trigger, truncate, update on rounds_list to service_role;

create function update_shoe_cards_used() returns trigger
    language plpgsql
as
$$
BEGIN
    IF NEW.dealt_to IN ('player', 'banker') THEN
        UPDATE shoes 
        SET 
            cards_used = cards_used + 1,
            updated_at = NOW()
        WHERE id = NEW.shoe_id;
    END IF;
    RETURN NEW;
END;
$$;

alter function update_shoe_cards_used() owner to postgres;

grant execute on function update_shoe_cards_used() to anon;

grant execute on function update_shoe_cards_used() to authenticated;

grant execute on function update_shoe_cards_used() to service_role;

create function update_updated_at_column() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

alter function update_updated_at_column() owner to postgres;

create trigger trigger_shoes_updated_at
    before update
    on shoes
    for each row
execute procedure update_updated_at_column();

grant execute on function update_updated_at_column() to anon;

grant execute on function update_updated_at_column() to authenticated;

grant execute on function update_updated_at_column() to service_role;

create function update_shoes_unix_timestamps() returns trigger
    language plpgsql
as
$$
BEGIN
    IF NEW.started_at IS NOT NULL THEN
        NEW.started_at_unix := (EXTRACT(EPOCH FROM NEW.started_at) * 1000)::BIGINT;
    END IF;
    IF NEW.ended_at IS NOT NULL THEN
        NEW.ended_at_unix := (EXTRACT(EPOCH FROM NEW.ended_at) * 1000)::BIGINT;
    ELSE
        NEW.ended_at_unix := NULL;
    END IF;
    RETURN NEW;
END;
$$;

alter function update_shoes_unix_timestamps() owner to postgres;

create trigger trigger_shoes_unix_timestamps
    before insert or update
    on shoes
    for each row
execute procedure update_shoes_unix_timestamps();

grant execute on function update_shoes_unix_timestamps() to anon;

grant execute on function update_shoes_unix_timestamps() to authenticated;

grant execute on function update_shoes_unix_timestamps() to service_role;

create function update_rounds_unix_timestamps() returns trigger
    language plpgsql
as
$$
BEGIN
    IF NEW.started_at IS NOT NULL THEN
        NEW.started_at_unix := (EXTRACT(EPOCH FROM NEW.started_at) * 1000)::BIGINT;
    END IF;
    IF NEW.completed_at IS NOT NULL THEN
        NEW.completed_at_unix := (EXTRACT(EPOCH FROM NEW.completed_at) * 1000)::BIGINT;
    END IF;
    RETURN NEW;
END;
$$;

alter function update_rounds_unix_timestamps() owner to postgres;

create trigger trigger_rounds_unix_timestamps
    before insert or update
    on rounds
    for each row
execute procedure update_rounds_unix_timestamps();

grant execute on function update_rounds_unix_timestamps() to anon;

grant execute on function update_rounds_unix_timestamps() to authenticated;

grant execute on function update_rounds_unix_timestamps() to service_role;

create function update_shoe_stats() returns trigger
    language plpgsql
as
$$
BEGIN
    UPDATE shoes 
    SET rounds_played = rounds_played + 1, updated_at = NOW()
    WHERE id = NEW.shoe_id;
    RETURN NEW;
END;
$$;

alter function update_shoe_stats() owner to postgres;

create trigger trigger_update_shoe_stats
    after insert
    on rounds
    for each row
execute procedure update_shoe_stats();

grant execute on function update_shoe_stats() to anon;

grant execute on function update_shoe_stats() to authenticated;

grant execute on function update_shoe_stats() to service_role;

create function get_next_round_number() returns integer
    language plpgsql
as
$$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT NEXTVAL('round_number_seq') INTO next_num;
    RETURN next_num;
END;
$$;

alter function get_next_round_number() owner to postgres;

grant execute on function get_next_round_number() to anon;

grant execute on function get_next_round_number() to authenticated;

grant execute on function get_next_round_number() to service_role;

create function sync_round_number_seq() returns void
    language plpgsql
as
$$
DECLARE
    max_round INTEGER;
BEGIN
    SELECT COALESCE(MAX(round_number), 0) INTO max_round FROM rounds;
    -- 如果数据库为空，重置序列到1；否则设置为当前最大值
    IF max_round = 0 THEN
        PERFORM SETVAL('round_number_seq', 1, FALSE);  -- FALSE 表示下次 nextval 返回 1
    ELSE
        PERFORM SETVAL('round_number_seq', max_round, TRUE);  -- TRUE 表示下次 nextval 返回 max_round + 1
    END IF;
END;
$$;

alter function sync_round_number_seq() owner to postgres;

grant execute on function sync_round_number_seq() to anon;

grant execute on function sync_round_number_seq() to authenticated;

grant execute on function sync_round_number_seq() to service_role;

create function check_round_duplicates()
    returns TABLE(round_number integer, count bigint)
    language plpgsql
as
$$
BEGIN
    RETURN QUERY
    SELECT r.round_number, COUNT(*) AS count
    FROM rounds r
    GROUP BY r.round_number
    HAVING COUNT(*) > 1
    ORDER BY r.round_number;
END;
$$;

alter function check_round_duplicates() owner to postgres;

grant execute on function check_round_duplicates() to anon;

grant execute on function check_round_duplicates() to authenticated;

grant execute on function check_round_duplicates() to service_role;

create function check_round_gaps()
    returns TABLE(missing_round integer)
    language plpgsql
as
$$
DECLARE
    min_round INTEGER;
    max_round INTEGER;
BEGIN
    SELECT MIN(r.round_number), MAX(r.round_number) INTO min_round, max_round FROM rounds r;
    
    IF min_round IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT generate_series(min_round, max_round) AS missing_round
    EXCEPT
    SELECT r.round_number FROM rounds r
    ORDER BY missing_round;
END;
$$;

alter function check_round_gaps() owner to postgres;

grant execute on function check_round_gaps() to anon;

grant execute on function check_round_gaps() to authenticated;

grant execute on function check_round_gaps() to service_role;

