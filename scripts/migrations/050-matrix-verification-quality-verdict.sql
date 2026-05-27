-- Migration 050: Extend matrix verifier verdict ENUM with source-quality-rejected.
--
-- Adds a new verdict that lets a verifier reject an accessible cited source
-- when it is irrelevant, insufficient, quote-less, or otherwise outside the
-- preferred source classes (official docs, project source repository,
-- security whitepapers, standards documents, audited public documentation,
-- reputable third-party documentation as fallback). The verifier may only
-- reject; substituting a different source URL into a supports verdict is
-- explicitly forbidden by the source quality policy (issue #470).
--
-- Pure additive ENUM extension: existing rows are unaffected because their
-- current verdict values remain in the value set.

ALTER TABLE `matrix_fact_verifications`
  MODIFY COLUMN `verdict` ENUM(
    'supports',
    'contradicts',
    'inconclusive',
    'source-inaccessible',
    'source-quality-rejected',
    'not-applicable'
  ) NOT NULL;
