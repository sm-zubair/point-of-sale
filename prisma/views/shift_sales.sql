SELECT
  `orders`.`shiftId` AS `shiftId`,
  `orders`.`waiter` AS `waiter`,
  sum(`orders`.`net`) AS `waiterNetSales`,
  sum((`orders`.`net` * (`orders`.`commission` / 100))) AS `waiterCommission`,
  sum((CASE WHEN (`orders`.`type` = 'dine-in') THEN `orders`.`net` ELSE 0 END)) AS `dineIn`,
  sum((CASE WHEN (`orders`.`type` = 'dine-in') THEN `orders`.`total` ELSE 0 END)) AS `grossDineIn`,
  sum((CASE WHEN (`orders`.`type` = 'take-away') THEN `orders`.`net` ELSE 0 END)) AS `takeAway`,
  sum((CASE WHEN (`orders`.`type` = 'take-away') THEN `orders`.`total` ELSE 0 END)) AS `grossTakeAway`,
  sum((CASE WHEN (`orders`.`type` = 'delivery') THEN `orders`.`net` ELSE 0 END)) AS `delivery`,
  sum((CASE WHEN (`orders`.`type` = 'delivery') THEN `orders`.`total` ELSE 0 END)) AS `grossDelivery`
FROM
  `orders`
GROUP BY
  `orders`.`waiter`,
  `orders`.`shiftId`