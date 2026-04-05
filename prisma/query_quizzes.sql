SELECT q.level, q.level_order, COUNT(qq.id) as total, q.title
FROM "Quiz" q
LEFT JOIN "QuizQuestion" qq ON qq.quiz_id = q.id
GROUP BY q.id, q.level, q.level_order, q.title
ORDER BY q.level, q.level_order;
