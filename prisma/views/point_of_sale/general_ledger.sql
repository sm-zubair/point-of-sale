SELECT
    s.openAt                AS shiftDate,
    l.date                  AS ledgerDate,
    l.shiftId               AS shiftId,
    l.`from`                AS account,
    l.description           AS description,
    NULL                    AS debit,
    l.amount                AS credit
FROM ledger AS l
INNER JOIN shifts AS s 
    ON l.shiftId = s.id

UNION ALL

SELECT
    s.openAt                AS shiftDate,
    l.date                  AS ledgerDate,
    l.shiftId               AS shiftId,
    l.`to`                  AS account,
    l.description           AS description,
    l.amount                AS debit,
    NULL                    AS credit
FROM ledger AS l
INNER JOIN shifts AS s 
    ON l.shiftId = s.id

ORDER BY 
    shiftDate ASC,
    ledgerDate ASC,
    shiftId ASC,
    account ASC;
