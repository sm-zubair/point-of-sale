SELECT
  `orders`.`waiter` AS `waiter`,
  `order_details`.`name` AS `name`,
  `order_details`.`quantity` AS `quantity`,
  `order_details`.`price` AS `price`,
  `orders`.`status` AS `status`
FROM
  (
    (`order_details` JOIN `orders` ON ((`order_details`.`orderId` = `orders`.`id`)))
    JOIN `shifts` ON ((`orders`.`shiftId` = `shifts`.`id`))
  )
WHERE
  (`shifts`.`closeAt` IS NULL)
ORDER BY
  `orders`.`waiter`,
  `orders`.`status`