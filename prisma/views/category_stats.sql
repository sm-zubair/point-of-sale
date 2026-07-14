SELECT
  `order_details`.`category` AS `category`,
  sum(`order_details`.`quantity`) AS `qty`,
  sum(`order_details`.`totalAmount`) AS `total`
FROM
  `order_details`
GROUP BY
  `order_details`.`category`