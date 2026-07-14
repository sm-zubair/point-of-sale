SELECT
  `shifts`.`openAt` AS `openAt`,
  `order_details`.`category` AS `category`,
  `order_details`.`name` AS `name`,
  sum(`order_details`.`quantity`) AS `qty`,
  sum(`order_details`.`totalAmount`) AS `total`
FROM
  (
    (`order_details` JOIN `orders` ON ((`order_details`.`orderId` = `orders`.`id`)))
    JOIN `shifts` ON ((`orders`.`shiftId` = `shifts`.`id`))
  )
GROUP BY
  `shifts`.`openAt`,
  `order_details`.`category`,
  `order_details`.`name`