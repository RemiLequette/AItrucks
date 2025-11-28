import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.patch(
  '/:id/role',
  authenticate,
  authorize('admin'),
  [body('role').isIn(['viewer', 'delivery_creator', 'trip_planner', 'admin'])],
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const result = await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
        [role, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User role updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Toggle user active status (admin only)
router.patch(
  '/:id/active',
  authenticate,
  authorize('admin'),
  [body('is_active').isBoolean()],
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const result = await pool.query(
        'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, full_name, is_active',
        [is_active, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User status updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
