SELECT
  `orders`.`shiftId` AS `shiftId`,
  count(0) AS `totalOrders`,
  sum((CASE WHEN (`orders`.`type` = 'dine-in') THEN 1 ELSE 0 END)) AS `dineIn`,
  sum((CASE WHEN (`orders`.`type` = 'take-away') THEN 1 ELSE 0 END)) AS `takeAway`,
  sum((CASE WHEN (`orders`.`type` = 'delivery') THEN 1 ELSE 0 END)) AS `delivery`,
  sum((CASE WHEN (`orders`.`payment` = 'cash') THEN `orders`.`net` ELSE 0 END)) AS `cash`,
  sum((CASE WHEN (`orders`.`payment` = 'card') THEN `orders`.`net` ELSE 0 END)) AS `bank`,
  sum(
    (CASE WHEN ((`orders`.`payment` = 'online') AND (`orders`.`status` = 'paid')) THEN `orders`.`net` ELSE 0 END)
  ) AS `online`
FROM
  `orders`
GROUP BY
  `orders`.`shiftId`