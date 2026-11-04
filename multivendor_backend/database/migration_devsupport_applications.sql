-- ============================================================================
-- Dev support: the full application list. SAFE, RE-RUNNABLE.
--
-- `dev_support_tickets.application` documented only three surfaces
-- (1 public app, 2 dashboard, 5 dynamic website), so the Partner App could not be
-- selected when raising a ticket. Code 3 is assigned to it here.
--
-- Codes 1, 2 and 5 already exist in ticket data and are deliberately NOT
-- renumbered. Code 5's label is "Static Website" to match the dashboards.
-- ============================================================================

ALTER TABLE `dev_support_tickets`
  MODIFY COLUMN `application` int(11) DEFAULT NULL
  COMMENT '1 public app,2 dashboard,3 partner app,5 static website';
