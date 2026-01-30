-- ============================================
-- Migration: 游戏实例锁 + 数据完整性保证
-- 确保只有一个游戏实例运行，牌靴和局号严格顺序
-- ============================================

-- ============================
-- 1. 创建游戏实例锁表
-- 确保同一时间只有一个游戏实例在运行
-- ============================
CREATE TABLE IF NOT EXISTS game_instance (
    id TEXT PRIMARY KEY DEFAULT 'singleton',  -- 只允许一行
    instance_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    hostname TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT singleton_check CHECK (id = 'singleton')
);

-- 授权
GRANT SELECT, INSERT, UPDATE, DELETE ON game_instance TO anon, authenticated, service_role;

-- ============================
-- 2. 获取或创建游戏实例锁
-- 返回: 是否成功获取锁
-- ============================
CREATE OR REPLACE FUNCTION acquire_game_lock(
    p_instance_id TEXT,
    p_hostname TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    existing_instance RECORD;
    lock_timeout_seconds INTEGER := 120;  -- 2分钟无心跳视为死锁
BEGIN
    -- 检查是否有活动实例
    SELECT * INTO existing_instance 
    FROM game_instance 
    WHERE id = 'singleton' AND is_active = TRUE;
    
    IF existing_instance IS NOT NULL THEN
        -- 检查是否超时（无心跳超过 2 分钟）
        IF existing_instance.last_heartbeat < NOW() - (lock_timeout_seconds || ' seconds')::INTERVAL THEN
            -- 旧实例已死，接管锁
            UPDATE game_instance 
            SET instance_id = p_instance_id,
                started_at = NOW(),
                last_heartbeat = NOW(),
                hostname = p_hostname,
                is_active = TRUE
            WHERE id = 'singleton';
            RETURN TRUE;
        ELSE
            -- 如果是同一个实例，允许
            IF existing_instance.instance_id = p_instance_id THEN
                UPDATE game_instance SET last_heartbeat = NOW() WHERE id = 'singleton';
                RETURN TRUE;
            END IF;
            -- 有其他活动实例，拒绝
            RETURN FALSE;
        END IF;
    END IF;
    
    -- 没有活动实例，创建新锁
    INSERT INTO game_instance (id, instance_id, hostname, started_at, last_heartbeat, is_active)
    VALUES ('singleton', p_instance_id, p_hostname, NOW(), NOW(), TRUE)
    ON CONFLICT (id) DO UPDATE SET
        instance_id = p_instance_id,
        hostname = p_hostname,
        started_at = NOW(),
        last_heartbeat = NOW(),
        is_active = TRUE;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION acquire_game_lock(TEXT, TEXT) TO anon, authenticated, service_role;

-- ============================
-- 3. 更新心跳（保持锁活跃）
-- ============================
CREATE OR REPLACE FUNCTION update_game_heartbeat(p_instance_id TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE game_instance 
    SET last_heartbeat = NOW()
    WHERE id = 'singleton' AND instance_id = p_instance_id AND is_active = TRUE;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION update_game_heartbeat(TEXT) TO anon, authenticated, service_role;

-- ============================
-- 4. 释放游戏锁
-- ============================
CREATE OR REPLACE FUNCTION release_game_lock(p_instance_id TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE game_instance 
    SET is_active = FALSE
    WHERE id = 'singleton' AND instance_id = p_instance_id;
    
    RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION release_game_lock(TEXT) TO anon, authenticated, service_role;

-- ============================
-- 5. 获取当前活动牌靴（强制只有一个）
-- ============================
CREATE OR REPLACE FUNCTION get_active_shoe() 
RETURNS TABLE(
    id TEXT,
    shoe_number INTEGER,
    rounds_played INTEGER,
    usable_cards INTEGER,
    cards_used BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.shoe_number,
        s.rounds_played,
        s.usable_cards,
        COALESCE((SELECT COUNT(*) FROM used_cards uc WHERE uc.shoe_id = s.id), 0) AS cards_used
    FROM shoes s
    WHERE s.ended_at IS NULL
    ORDER BY s.started_at DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_active_shoe() TO anon, authenticated, service_role;

-- ============================
-- 6. 确保只有一个活动牌靴
-- 关闭所有其他活动牌靴
-- ============================
CREATE OR REPLACE FUNCTION ensure_single_active_shoe(p_keep_shoe_id TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    closed_count INTEGER;
BEGIN
    -- 关闭所有活动牌靴（除了指定的）
    UPDATE shoes 
    SET ended_at = NOW(), ended_at_unix = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    WHERE ended_at IS NULL 
      AND (p_keep_shoe_id IS NULL OR id != p_keep_shoe_id);
    
    GET DIAGNOSTICS closed_count = ROW_COUNT;
    RETURN closed_count;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_single_active_shoe(TEXT) TO anon, authenticated, service_role;

-- ============================
-- 7. 创建下一个牌靴（原子操作）
-- 强制关闭所有旧牌靴，创建新牌靴
-- ============================
CREATE OR REPLACE FUNCTION create_next_shoe(
    p_id TEXT,
    p_deck_count INTEGER,
    p_total_cards INTEGER,
    p_first_card_suit TEXT,
    p_first_card_rank TEXT,
    p_burn_start_count INTEGER,
    p_burn_end_count INTEGER,
    p_shuffle_vrf_proof TEXT,
    p_solana_signature TEXT,
    p_blockchain_status TEXT
) RETURNS TABLE(id TEXT, shoe_number INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    next_shoe_number INTEGER;
BEGIN
    -- 先关闭所有活动牌靴
    UPDATE shoes 
    SET ended_at = NOW(), ended_at_unix = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    WHERE ended_at IS NULL;
    
    -- 获取下一个牌靴号
    SELECT COALESCE(MAX(s.shoe_number), 0) + 1 INTO next_shoe_number FROM shoes s;
    
    -- 创建新牌靴
    INSERT INTO shoes (
        id, shoe_number, deck_count, total_cards, 
        first_card_suit, first_card_rank, 
        burn_start_count, burn_end_count,
        shuffle_vrf_proof, started_at,
        solana_signature, blockchain_status
    ) VALUES (
        p_id, next_shoe_number, p_deck_count, p_total_cards,
        p_first_card_suit, p_first_card_rank,
        p_burn_start_count, p_burn_end_count,
        p_shuffle_vrf_proof, NOW(),
        p_solana_signature, p_blockchain_status
    );
    
    RETURN QUERY SELECT p_id, next_shoe_number;
END;
$$;

GRANT EXECUTE ON FUNCTION create_next_shoe(TEXT, INTEGER, INTEGER, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ============================
-- 8. 数据完整性检查视图
-- ============================
CREATE OR REPLACE VIEW data_integrity_check AS
SELECT 
    'round_gaps' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(missing_num ORDER BY missing_num) AS details
FROM (
    SELECT generate_series(
        (SELECT MIN(round_number) FROM rounds),
        (SELECT MAX(round_number) FROM rounds)
    ) AS missing_num
    EXCEPT
    SELECT round_number FROM rounds
) gaps

UNION ALL

SELECT 
    'shoe_gaps' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(missing_num ORDER BY missing_num) AS details
FROM (
    SELECT generate_series(
        (SELECT MIN(shoe_number) FROM shoes),
        (SELECT MAX(shoe_number) FROM shoes)
    ) AS missing_num
    EXCEPT
    SELECT shoe_number FROM shoes
) gaps

UNION ALL

SELECT 
    'active_shoes' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(shoe_number ORDER BY shoe_number) AS details
FROM shoes
WHERE ended_at IS NULL;

GRANT SELECT ON data_integrity_check TO anon, authenticated, service_role;

-- ============================
-- 完成
-- ============================
DO $$ BEGIN RAISE NOTICE '🎉 游戏实例锁迁移完成！'; END; $$;
