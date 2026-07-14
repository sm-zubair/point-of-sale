SELECT
  `general_ledger`.`shiftId` AS `shiftId`,
  `general_ledger`.`account` AS `account`,
  sum(`general_ledger`.`credit`) AS `credit`,
  sum(`general_ledger`.`debit`) AS `debit`
FROM
  `general_ledger`
GROUP BY
  `general_ledger`.`account`,
  `general_ledger`.`shiftId`