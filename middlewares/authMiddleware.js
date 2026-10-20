import jwt from 'jsonwebtoken';

function protect(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'سجّل دخولك الأول.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'جلسة الدخول غير صالحة.' });
  }
}

export default protect;
