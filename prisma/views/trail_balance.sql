SELECT
  `general_ledger`.`account` AS `account`,
  sum(`general_ledger`.`debit`) AS `debit`,
  sum(`general_ledger`.`credit`) AS `credit`
FROM
  `general_ledger`
GROUP BY
  `general_ledger`.`account`