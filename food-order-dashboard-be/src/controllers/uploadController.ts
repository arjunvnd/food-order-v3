import { Request, Response, NextFunction } from 'express';

/** POST /api/uploads/menu-item-image */
export const uploadMenuItemImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    next(error);
  }
};
