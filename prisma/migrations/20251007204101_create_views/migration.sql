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


CREATE 
	OR REPLACE VIEW `category_stats` AS SELECT
	`point_of_sale`.`order_details`.`category` AS `category`,
	SUM( `point_of_sale`.`order_details`.`quantity` ) AS `qty`,
	SUM( `point_of_sale`.`order_details`.`totalAmount` ) AS `total` 
FROM
	`point_of_sale`.`order_details` 
GROUP BY
	`point_of_sale`.`order_details`.`category`;


CREATE 
	OR REPLACE VIEW `general_ledger` AS SELECT
	`s`.`openAt` AS `shiftDate`,
	`l`.`date` AS `ledgerDate`,
	`l`.`shiftId` AS `shiftId`,
	`l`.`from` AS `account`,
	`l`.`description` AS `description`,
	NULL AS `debit`,
	`l`.`amount` AS `credit` 
FROM
	`point_of_sale`.`ledger` AS `l` 
	INNER JOIN `point_of_sale`.`shifts` AS `s` ON `l`.`shiftId` = `s`.`id` 
UNION ALL
SELECT
	`s`.`openAt` AS `shiftDate`,
	`l`.`date` AS `ledgerDate`,
	`l`.`shiftId` AS `shiftId`,
	`l`.`to` AS `account`,
	`l`.`description` AS `description`,
	`l`.`amount` AS `debit`,
	NULL AS `credit` 
FROM
	`point_of_sale`.`ledger` AS `l` 
	INNER JOIN `point_of_sale`.`shifts` AS `s` ON `l`.`shiftId` = `s`.`id` 
ORDER BY
	`shiftDate` ASC,
	`ledgerDate` ASC,
	`shiftId` ASC,
	`account` ASC;


CREATE 
	OR REPLACE VIEW `item_stats` AS SELECT
	`point_of_sale`.`order_details`.`category` AS `category`,
	`point_of_sale`.`order_details`.`name` AS `name`,
	SUM( `point_of_sale`.`order_details`.`quantity` ) AS `qty`,
	SUM( `point_of_sale`.`order_details`.`totalAmount` ) AS `total` 
FROM
	`point_of_sale`.`order_details` 
GROUP BY
	`point_of_sale`.`order_details`.`category`,
	`point_of_sale`.`order_details`.`name` 
ORDER BY
	`qty` DESC;


CREATE 
	OR REPLACE VIEW `item_stats_by_shift` AS SELECT
	`point_of_sale`.`shifts`.`openAt` AS `openAt`,
	`point_of_sale`.`order_details`.`category` AS `category`,
	`point_of_sale`.`order_details`.`name` AS `name`,
	SUM( `point_of_sale`.`order_details`.`quantity` ) AS `qty`,
	SUM( `point_of_sale`.`order_details`.`totalAmount` ) AS `total` 
FROM
	( ( `point_of_sale`.`order_details` JOIN `point_of_sale`.`orders` ON ( ( `point_of_sale`.`order_details`.`orderId` = `point_of_sale`.`orders`.`id` ) ) ) JOIN `point_of_sale`.`shifts` ON ( ( `point_of_sale`.`orders`.`shiftId` = `point_of_sale`.`shifts`.`id` ) ) ) 
GROUP BY
	`point_of_sale`.`shifts`.`openAt`,
	`point_of_sale`.`order_details`.`category`,
	`point_of_sale`.`order_details`.`name`;


CREATE 
	OR REPLACE VIEW `trail_balance` AS SELECT
	`point_of_sale`.`general_ledger`.`account` AS `account`,
	SUM( `point_of_sale`.`general_ledger`.`debit` ) AS `debit`,
	SUM( `point_of_sale`.`general_ledger`.`credit` ) AS `credit` 
FROM
	`point_of_sale`.`general_ledger` 
GROUP BY
	`point_of_sale`.`general_ledger`.`account`;


CREATE 
	OR REPLACE VIEW `viewledger` AS SELECT
	`point_of_sale`.`general_ledger`.`shiftId` AS `shiftId`,
	`point_of_sale`.`general_ledger`.`account` AS `account`,
	SUM( `point_of_sale`.`general_ledger`.`credit` ) AS `credit`,
	SUM( `point_of_sale`.`general_ledger`.`debit` ) AS `debit` 
FROM
	`point_of_sale`.`general_ledger` 
GROUP BY
	`point_of_sale`.`general_ledger`.`account`,
	`point_of_sale`.`general_ledger`.`shiftId`;


CREATE 
	OR REPLACE VIEW `waiter_stats` AS SELECT
	`point_of_sale`.`orders`.`waiter` AS `waiter`,
	`point_of_sale`.`order_details`.`name` AS `name`,
	`point_of_sale`.`order_details`.`quantity` AS `quantity`,
	`point_of_sale`.`order_details`.`price` AS `price`,
	`point_of_sale`.`orders`.`status` AS `status` 
FROM
	( ( `point_of_sale`.`order_details` JOIN `point_of_sale`.`orders` ON ( ( `point_of_sale`.`order_details`.`orderId` = `point_of_sale`.`orders`.`id` ) ) ) JOIN `point_of_sale`.`shifts` ON ( ( `point_of_sale`.`orders`.`shiftId` = `point_of_sale`.`shifts`.`id` ) ) ) 
WHERE
	( `point_of_sale`.`shifts`.`closeAt` IS NULL ) 
ORDER BY
	`point_of_sale`.`orders`.`waiter`,
	`point_of_sale`.`orders`.`status`;
