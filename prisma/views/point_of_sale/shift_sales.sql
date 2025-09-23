SELECT
  `point_of_sale`.`orders`.`shiftId` AS `shiftId`,
  `point_of_sale`.`orders`.`waiter` AS `waiter`,
  sum(`point_of_sale`.`orders`.`net`) AS `waiterNetSales`,
  sum(
    (
      `point_of_sale`.`orders`.`net` * (`point_of_sale`.`orders`.`commission` / 100)
    )
  ) AS `waiterCommission`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'dine-in') THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `dineIn`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'dine-in') THEN `point_of_sale`.`orders`.`total`
        ELSE 0
      END
    )
  ) AS `grossDineIn`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'take-away') THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `takeAway`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'take-away') THEN `point_of_sale`.`orders`.`total`
        ELSE 0
      END
    )
  ) AS `grossTakeAway`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'delivery') THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `delivery`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'delivery') THEN `point_of_sale`.`orders`.`total`
        ELSE 0
      END
    )
  ) AS `grossDelivery`
FROM
  `point_of_sale`.`orders`
GROUP BY
  `point_of_sale`.`orders`.`waiter`,
  `point_of_sale`.`orders`.`shiftId`