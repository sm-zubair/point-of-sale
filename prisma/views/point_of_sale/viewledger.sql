SELECT
  `point_of_sale`.`general_ledger`.`shiftId` AS `shiftId`,
  `point_of_sale`.`general_ledger`.`account` AS `account`,
  sum(`point_of_sale`.`general_ledger`.`credit`) AS `credit`,
  sum(`point_of_sale`.`general_ledger`.`debit`) AS `debit`
FROM
  `point_of_sale`.`general_ledger`
GROUP BY
  `point_of_sale`.`general_ledger`.`account`,
  `point_of_sale`.`general_ledger`.`shiftId`