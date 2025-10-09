SELECT
  `point_of_sale`.`ledger`.`date` AS `date`,
  `point_of_sale`.`ledger`.`shiftId` AS `shiftId`,
  `point_of_sale`.`ledger`.`from` AS `account`,
  `point_of_sale`.`ledger`.`description` AS `description`,
  NULL AS `debit`,
  `point_of_sale`.`ledger`.`amount` AS `credit`
FROM
  `point_of_sale`.`ledger`
UNION
ALL
SELECT
  `point_of_sale`.`ledger`.`date` AS `date`,
  `point_of_sale`.`ledger`.`shiftId` AS `shiftId`,
  `point_of_sale`.`ledger`.`to` AS `account`,
  `point_of_sale`.`ledger`.`description` AS `description`,
  `point_of_sale`.`ledger`.`amount` AS `debit`,
  NULL AS `credit`
FROM
  `point_of_sale`.`ledger`
ORDER BY
  `date`