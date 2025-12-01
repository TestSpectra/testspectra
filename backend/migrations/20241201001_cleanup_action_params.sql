-- Migration: Cleanup action_params to remove irrelevant fields
-- This migration cleans up existing test_steps data by removing fields
-- that are not relevant for each action_type

-- Create a function to cleanup action_params based on action_type
CREATE OR REPLACE FUNCTION cleanup_action_params(
    p_action_type TEXT,
    p_params JSONB
) RETURNS JSONB AS $$
DECLARE
    v_cleaned JSONB := '{}'::JSONB;
BEGIN
    -- Return empty object if params is null or not an object
    IF p_params IS NULL OR jsonb_typeof(p_params) != 'object' THEN
        RETURN '{}'::JSONB;
    END IF;

    CASE p_action_type
        WHEN 'navigate' THEN
            IF p_params ? 'url' THEN
                v_cleaned := jsonb_set(v_cleaned, '{url}', p_params->'url');
            END IF;

        WHEN 'click', 'doubleClick', 'longPress' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;
            IF p_params ? 'text' THEN
                v_cleaned := jsonb_set(v_cleaned, '{text}', p_params->'text');
            END IF;

        WHEN 'type' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;
            IF p_params ? 'value' THEN
                v_cleaned := jsonb_set(v_cleaned, '{value}', p_params->'value');
            END IF;

        WHEN 'clear', 'hover' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;

        WHEN 'select' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;
            IF p_params ? 'value' THEN
                v_cleaned := jsonb_set(v_cleaned, '{value}', p_params->'value');
            END IF;

        WHEN 'scroll', 'swipe' THEN
            IF p_params ? 'direction' THEN
                v_cleaned := jsonb_set(v_cleaned, '{direction}', p_params->'direction');
            END IF;
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;

        WHEN 'wait' THEN
            IF p_params ? 'timeout' THEN
                v_cleaned := jsonb_set(v_cleaned, '{timeout}', p_params->'timeout');
            END IF;

        WHEN 'waitForElement' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;
            IF p_params ? 'timeout' THEN
                v_cleaned := jsonb_set(v_cleaned, '{timeout}', p_params->'timeout');
            END IF;

        WHEN 'pressKey' THEN
            IF p_params ? 'key' THEN
                v_cleaned := jsonb_set(v_cleaned, '{key}', p_params->'key');
            END IF;

        WHEN 'dragDrop' THEN
            IF p_params ? 'selector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{selector}', p_params->'selector');
            END IF;
            IF p_params ? 'targetSelector' THEN
                v_cleaned := jsonb_set(v_cleaned, '{targetSelector}', p_params->'targetSelector');
            END IF;

        WHEN 'back', 'refresh' THEN
            -- No params needed, return empty object
            v_cleaned := '{}'::JSONB;

        ELSE
            -- Unknown action type, keep all params
            RETURN p_params;
    END CASE;

    RETURN v_cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update all existing test_steps to cleanup their action_params
UPDATE test_steps
SET action_params = cleanup_action_params(action_type, action_params)
WHERE action_params IS NOT NULL 
  AND action_params != '{}'::JSONB;

-- Log the cleanup results
DO $$
DECLARE
    v_total_steps INTEGER;
    v_cleaned_steps INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_steps FROM test_steps;
    SELECT COUNT(*) INTO v_cleaned_steps 
    FROM test_steps 
    WHERE action_params IS NOT NULL AND action_params != '{}'::JSONB;
    
    RAISE NOTICE 'Action params cleanup completed:';
    RAISE NOTICE '  Total steps: %', v_total_steps;
    RAISE NOTICE '  Steps with params: %', v_cleaned_steps;
END $$;

-- Note: We keep the cleanup_action_params function for future use
-- It can be called manually if needed: SELECT cleanup_action_params('navigate', '{"url": "test", "selector": "old"}'::JSONB);
