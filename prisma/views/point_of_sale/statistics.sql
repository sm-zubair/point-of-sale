SELECT
  `point_of_sale`.`orders`.`shiftId` AS `shiftId`,
  count(0) AS `totalOrders`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'dine-in') THEN 1
        ELSE 0
      END
    )
  ) AS `dineIn`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'take-away') THEN 1
        ELSE 0
      END
    )
  ) AS `takeAway`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`type` = 'delivery') THEN 1
        ELSE 0
      END
    )
  ) AS `delivery`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`payment` = 'cash') THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `cash`,
  sum(
    (
      CASE
        WHEN (`point_of_sale`.`orders`.`payment` = 'card') THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `bank`,
  sum(
    (
      CASE
        WHEN (
          (`point_of_sale`.`orders`.`payment` = 'online')
          AND (`point_of_sale`.`orders`.`status` = 'paid')
        ) THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `online`,
  sum(
    (
      CASE
        WHEN (
          (`point_of_sale`.`orders`.`payment` = 'online')
          AND (`point_of_sale`.`orders`.`status` = 'due')
        ) THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `onlineDue`,
  sum(
    (
      CASE
        WHEN (
          (`point_of_sale`.`orders`.`payment` = 'credit')
          AND (`point_of_sale`.`orders`.`status` = 'due')
        ) THEN `point_of_sale`.`orders`.`net`
        ELSE 0
      END
    )
  ) AS `credit`
FROM
  `point_of_sale`.`orders`
GROUP BY
  `point_of_sale`.`orders`.`shiftId`