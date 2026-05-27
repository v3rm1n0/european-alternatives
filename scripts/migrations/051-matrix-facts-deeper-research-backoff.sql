-- Migration 051: Add backoff bookkeeping columns to matrix_facts for the
-- deeper-research retry queue (issue #471).
--
-- A fact that fails verification settles into status='needs-deeper-research'.
-- Without backoff the loop runner immediately re-picks the same fact every
-- iteration, monopolizing the queue. The two new columns track:
--   - deeper_research_attempt_count    : how many deeper-research cycles have
--                                        completed for this fact.
--   - deeper_research_next_eligible_at : the earliest moment the fact may be
--                                        picked by --mode=deeper-research again.
--
-- The schedule applied by the persister is: 1 day after the 1st failure,
-- 3 days after the 2nd, 7 days after the 3rd, then 30 days indefinitely.
-- A successful settle (status='verified') resets both columns.
--
-- Pure additive migration. Existing rows get count=0 and next_eligible_at=NULL,
-- which is identical to a fact that has never been settled to deeper-research.

ALTER TABLE `matrix_facts`
  ADD COLUMN `deeper_research_attempt_count` INT NOT NULL DEFAULT 0
    AFTER `selected_attempt_id`,
  ADD COLUMN `deeper_research_next_eligible_at` DATETIME DEFAULT NULL
    AFTER `deeper_research_attempt_count`,
  ADD KEY `ix_mf_deeper_research_next_eligible_at`
    (`status`, `deeper_research_next_eligible_at`);
