const { validationResult } = require('express-validator');

// Put this AFTER a list of express-validator rules in a route.
// If any rule failed it answers 400 with the list of problems.
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({
    message: errors.array().map((e) => e.msg).join(', '),
    errors: errors.array(),
  });
};
