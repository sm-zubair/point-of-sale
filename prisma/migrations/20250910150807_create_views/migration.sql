-- This is an empty migration.
CREATE 
	OR REPLACE VIEW shift_sales AS SELECT
	`point_of_sale`.`orders`.`shiftId` AS `shiftId`,
	`point_of_sale`.`orders`.`waiter` AS `waiter`,
	SUM( `point_of_sale`.`orders`.`net` ) AS `waiterNetSales`,
	SUM( ( `point_of_sale`.`orders`.`net` * ( `point_of_sale`.`orders`.`commission` / 100 ) ) ) AS `waiterCommission`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'dine-in' ) THEN `point_of_sale`.`orders`.`net` ELSE 0 END ) ) AS `dineIn`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'dine-in' ) THEN `point_of_sale`.`orders`.`total` ELSE 0 END ) ) AS `grossDineIn`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'take-away' ) THEN `point_of_sale`.`orders`.`net` ELSE 0 END ) ) AS `takeAway`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'take-away' ) THEN `point_of_sale`.`orders`.`total` ELSE 0 END ) ) AS `grossTakeAway`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'delivery' ) THEN `point_of_sale`.`orders`.`net` ELSE 0 END ) ) AS `delivery`,
	SUM( ( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'delivery' ) THEN `point_of_sale`.`orders`.`total` ELSE 0 END ) ) AS `grossDelivery` 
FROM
	`point_of_sale`.`orders` 
GROUP BY
	`point_of_sale`.`orders`.`waiter`,
	`point_of_sale`.`orders`.`shiftId`;


CREATE 
	OR REPLACE VIEW `statistics` AS SELECT
	`point_of_sale`.`orders`.`shiftId` AS `shiftId`,
	COUNT( 0 ) AS `totalOrders`,
	SUM( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'dine-in' ) THEN 1 ELSE 0 END ) AS `dineIn`,
	SUM( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'take-away' ) THEN 1 ELSE 0 END ) AS `takeAway`,
	SUM( CASE WHEN ( `point_of_sale`.`orders`.`type` = 'delivery' ) THEN 1 ELSE 0 END ) AS `delivery`,
	SUM( CASE WHEN ( `point_of_sale`.`orders`.`payment` = 'cash' ) THEN `point_of_sale`.`orders`.`net` ELSE 0 END ) AS `cash`,
	SUM( CASE WHEN ( `point_of_sale`.`orders`.`payment` = 'card' ) THEN `point_of_sale`.`orders`.`net` ELSE 0 END ) AS `bank`,
	SUM(
	CASE
			
			WHEN ( `point_of_sale`.`orders`.`payment` = 'online' AND `point_of_sale`.`orders`.`status` = 'paid' ) THEN
			`point_of_sale`.`orders`.`net` ELSE 0 
		END 
		) AS `online`,
		SUM(
		CASE
				
				WHEN ( `point_of_sale`.`orders`.`payment` = 'online' AND `point_of_sale`.`orders`.`status` = 'due' ) THEN
				`point_of_sale`.`orders`.`net` ELSE 0 
			END 
			) AS `onlineDue`,
			SUM(
			CASE
					
					WHEN ( `point_of_sale`.`orders`.`payment` = 'credit' AND `point_of_sale`.`orders`.`status` = 'due' ) THEN
					`point_of_sale`.`orders`.`net` ELSE 0 
				END 
				) AS `credit` 
			FROM
				`point_of_sale`.`orders` 
		GROUP BY
	`point_of_sale`.`orders`.`shiftId`;