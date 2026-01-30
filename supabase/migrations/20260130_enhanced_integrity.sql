-- ============================================
-- Migration: 增强数据完整性保证
-- 1. 为 create_next_shoe 添加重试逻辑
-- 2. 添加数据库级约束确保只有一个活动牌靴
-- 3. 添加局号与牌靴关联性检查
-- ============================================

-- ============================
-- 1. 强制只有一个活动牌靴（数据库级约束）
-- 使用 partial unique index 确保只有一个 ended_at IS NULL 的牌靴
-- ============================
DROP INDEX IF EXISTS idx_single_active_shoe;
CREATE UNIQUE INDEX idx_single_active_shoe ON shoes ((1)) WHERE ended_at IS NULL;

-- ============================
-- 2. 升级 create_next_shoe 函数（添加重试逻辑）
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
    retry_count INTEGER := 0;
    max_retries INTEGER := 5;
BEGIN
    -- 先关闭所有活动牌靴（确保只有一个活动牌靴）
    UPDATE shoes 
    SET ended_at = NOW(), ended_at_unix = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
    WHERE ended_at IS NULL;
    
    -- 带重试的创建逻辑
    LOOP
        -- 获取下一个牌靴号（原子性：MAX+1）
        SELECT COALESCE(MAX(s.shoe_number), 0) + 1 INTO next_shoe_number FROM shoes s;
        
        BEGIN
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
            
            -- 成功插入，返回结果
            RETURN QUERY SELECT p_id, next_shoe_number;
            RETURN;
            
        EXCEPTION WHEN unique_violation THEN
            -- 并发冲突，重试
            retry_count := retry_count + 1;
            IF retry_count >= max_retries THEN
                RAISE EXCEPTION '创建牌靴失败：重试 % 次后仍有并发冲突', max_retries;
            END IF;
            -- 短暂等待后重试
            PERFORM pg_sleep(0.01 * retry_count);
        END;
    END LOOP;
END;
$$;

-- ============================
-- 3. 升级 create_round_atomic 函数（增强重试逻辑）
-- ============================
CREATE OR REPLACE FUNCTION create_round_atomic(
    p_id TEXT, 
    p_shoe_id TEXT, 
    p_result TEXT, 
    p_player_total INTEGER, 
    p_banker_total INTEGER, 
    p_winning_total INTEGER, 
    p_is_player_pair BOOLEAN, 
    p_is_banker_pair BOOLEAN, 
    p_started_at TIMESTAMP WITH TIME ZONE, 
    p_started_at_unix BIGINT, 
    p_completed_at TIMESTAMP WITH TIME ZONE, 
    p_completed_at_unix BIGINT, 
    p_solana_signature TEXT, 
    p_blockchain_status TEXT
) RETURNS TABLE(id TEXT, round_number INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    next_round_number INTEGER;
    retry_count INTEGER := 0;
    max_retries INTEGER := 10;  -- 增加到 10 次重试
BEGIN
    LOOP
        -- 获取下一个局号（原子性：MAX+1）
        SELECT COALESCE(MAX(r.round_number), 0) + 1 INTO next_round_number FROM rounds r;
        
        BEGIN
            INSERT INTO rounds (
                id, shoe_id, round_number, result,
                player_total, banker_total, winning_total,
                is_player_pair, is_banker_pair,
                started_at, started_at_unix,
                completed_at, completed_at_unix,
                solana_signature, blockchain_status
            ) VALUES (
                p_id, p_shoe_id, next_round_number, p_result,
                p_player_total, p_banker_total, p_winning_total,
                p_is_player_pair, p_is_banker_pair,
                p_started_at, p_started_at_unix,
                p_completed_at, p_completed_at_unix,
                p_solana_signature, p_blockchain_status
            );
            
            -- 成功插入，返回结果
            RETURN QUERY SELECT p_id, next_round_number;
            RETURN;
            
        EXCEPTION WHEN unique_violation THEN
            -- 并发冲突，重试
            retry_count := retry_count + 1;
            IF retry_count >= max_retries THEN
                RAISE EXCEPTION '创建回合失败：重试 % 次后仍有并发冲突', max_retries;
            END IF;
            -- 短暂等待后重试（指数退避）
            PERFORM pg_sleep(0.01 * retry_count);
        END;
    END LOOP;
END;
$$;

-- ============================
-- 4. 添加检查：每个局必须属于一个有效牌靴
-- ============================
CREATE OR REPLACE FUNCTION check_round_shoe_integrity()
RETURNS TABLE(
    round_id TEXT,
    round_number INTEGER,
    shoe_id TEXT,
    issue TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 检查没有关联牌靴的局
    RETURN QUERY
    SELECT r.id, r.round_number, r.shoe_id, '局没有关联牌靴'::TEXT
    FROM rounds r
    WHERE r.shoe_id IS NULL;
    
    -- 检查关联到不存在牌靴的局
    RETURN QUERY
    SELECT r.id, r.round_number, r.shoe_id, '局关联的牌靴不存在'::TEXT
    FROM rounds r
    LEFT JOIN shoes s ON r.shoe_id = s.id
    WHERE r.shoe_id IS NOT NULL AND s.id IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION check_round_shoe_integrity() TO anon, authenticated, service_role;

-- ============================
-- 5. 更新数据完整性检查视图（添加更多检查）
-- ============================
CREATE OR REPLACE VIEW data_integrity_check AS
-- 局号跳号检查
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

-- 牌靴号跳号检查
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

-- 活动牌靴数量检查（应该只有 0 或 1）
SELECT 
    'active_shoes' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(shoe_number ORDER BY shoe_number) AS details
FROM shoes
WHERE ended_at IS NULL

UNION ALL

-- 局号重复检查
SELECT 
    'round_duplicates' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(round_number ORDER BY round_number) AS details
FROM (
    SELECT round_number FROM rounds GROUP BY round_number HAVING COUNT(*) > 1
) dups

UNION ALL

-- 牌靴号重复检查
SELECT 
    'shoe_duplicates' AS check_type,
    COUNT(*) AS issue_count,
    ARRAY_AGG(shoe_number ORDER BY shoe_number) AS details
FROM (
    SELECT shoe_number FROM shoes GROUP BY shoe_number HAVING COUNT(*) > 1
) dups;

-- ============================
-- 完成
-- ============================
DO $$ BEGIN RAISE NOTICE '🎉 增强数据完整性迁移完成！'; END; $$;
