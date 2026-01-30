-- ============================================
-- Migration: 修复现有数据
-- 清理混乱的牌靴和局号数据
-- ============================================

-- ⚠️ 警告：此脚本会修改现有数据！
-- 建议先备份数据库再执行

-- ============================
-- 1. 关闭所有活动牌靴（只保留最新的一个）
-- ============================
DO $$
DECLARE
    latest_shoe_id TEXT;
    closed_count INTEGER;
BEGIN
    -- 找到最新的活动牌靴
    SELECT id INTO latest_shoe_id 
    FROM shoes 
    WHERE ended_at IS NULL 
    ORDER BY started_at DESC 
    LIMIT 1;
    
    IF latest_shoe_id IS NOT NULL THEN
        -- 关闭除了最新牌靴之外的所有活动牌靴
        UPDATE shoes 
        SET ended_at = NOW(), ended_at_unix = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE ended_at IS NULL AND id != latest_shoe_id;
        
        GET DIAGNOSTICS closed_count = ROW_COUNT;
        
        IF closed_count > 0 THEN
            RAISE NOTICE '✅ 已关闭 % 个多余的活动牌靴', closed_count;
        ELSE
            RAISE NOTICE '✅ 没有需要关闭的多余牌靴';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ 没有找到活动牌靴';
    END IF;
END;
$$;

-- ============================
-- 2. 检查并报告数据问题
-- ============================
DO $$
DECLARE
    round_gap_count INTEGER;
    shoe_gap_count INTEGER;
    round_dup_count INTEGER;
    shoe_dup_count INTEGER;
BEGIN
    -- 检查局号跳号
    SELECT COUNT(*) INTO round_gap_count FROM (
        SELECT generate_series(
            (SELECT MIN(round_number) FROM rounds),
            (SELECT MAX(round_number) FROM rounds)
        ) AS num
        EXCEPT SELECT round_number FROM rounds
    ) gaps;
    
    -- 检查牌靴号跳号
    SELECT COUNT(*) INTO shoe_gap_count FROM (
        SELECT generate_series(
            (SELECT MIN(shoe_number) FROM shoes),
            (SELECT MAX(shoe_number) FROM shoes)
        ) AS num
        EXCEPT SELECT shoe_number FROM shoes
    ) gaps;
    
    -- 检查局号重复
    SELECT COUNT(*) INTO round_dup_count FROM (
        SELECT round_number FROM rounds GROUP BY round_number HAVING COUNT(*) > 1
    ) dups;
    
    -- 检查牌靴号重复
    SELECT COUNT(*) INTO shoe_dup_count FROM (
        SELECT shoe_number FROM shoes GROUP BY shoe_number HAVING COUNT(*) > 1
    ) dups;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '数据完整性检查报告';
    RAISE NOTICE '========================================';
    RAISE NOTICE '局号跳号数量: %', round_gap_count;
    RAISE NOTICE '牌靴号跳号数量: %', shoe_gap_count;
    RAISE NOTICE '局号重复数量: %', round_dup_count;
    RAISE NOTICE '牌靴号重复数量: %', shoe_dup_count;
    
    IF round_gap_count > 0 OR shoe_gap_count > 0 OR round_dup_count > 0 OR shoe_dup_count > 0 THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '⚠️ 存在数据问题，需要手动处理！';
        RAISE NOTICE '建议：可以选择以下方案之一：';
        RAISE NOTICE '1. 保留现有数据，接受历史缺口（新数据会连续）';
        RAISE NOTICE '2. 清空所有数据重新开始';
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ 数据完整性检查通过！';
        RAISE NOTICE '========================================';
    END IF;
END;
$$;

-- ============================
-- 3. 可选：清空所有数据重新开始
-- 取消下面的注释来执行
-- ============================
/*
TRUNCATE TABLE used_cards CASCADE;
TRUNCATE TABLE rounds CASCADE;
TRUNCATE TABLE shoes CASCADE;
TRUNCATE TABLE game_instance;

-- 重置序列
ALTER SEQUENCE shoes_shoe_number_seq RESTART WITH 1;
ALTER SEQUENCE round_number_seq RESTART WITH 1;

RAISE NOTICE '🗑️ 所有数据已清空，序列已重置';
*/

-- ============================
-- 完成
-- ============================
DO $$ BEGIN RAISE NOTICE '🎉 数据修复脚本执行完成！'; END; $$;
