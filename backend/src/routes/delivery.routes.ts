import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all deliveries
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name as created_by_name,
        ST_Y(d.delivery_location::geometry) as latitude,
        ST_X(d.delivery_location::geometry) as longitude
      FROM deliveries d
      LEFT JOIN users u ON d.created_by = u.id
      ORDER BY d.scheduled_date ASC`
    );
    res.json({ deliveries: result.rows });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single delivery
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT d.*, u.full_name as created_by_name,
        ST_Y(d.delivery_location::geometry) as latitude,
        ST_X(d.delivery_location::geometry) as longitude
      FROM deliveries d
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json({ delivery: result.rows[0] });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create delivery
router.post(
  '/',
  authenticate,
  authorize('delivery_creator', 'admin'),
  [
    body('customer_name').trim().notEmpty(),
    body('delivery_address').trim().notEmpty(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('scheduled_date').isISO8601(),
    body('weight').isFloat({ min: 0 }),
    body('volume').isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        customer_name,
        customer_phone,
        delivery_address,
        latitude,
        longitude,
        scheduled_date,
        weight,
        volume,
        notes,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO deliveries (
          customer_name, customer_phone, delivery_address, delivery_location,
          scheduled_date, weight, volume, notes, created_by
        ) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6, $7, $8, $9, $10)
        RETURNING *, ST_Y(delivery_location::geometry) as latitude, ST_X(delivery_location::geometry) as longitude`,
        [
          customer_name,
          customer_phone,
          delivery_address,
          longitude,
          latitude,
          scheduled_date,
          weight,
          volume,
          notes,
          req.user!.id,
        ]
      );

      res.status(201).json({
        message: 'Delivery created successfully',
        delivery: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update delivery
router.put(
  '/:id',
  authenticate,
  authorize('delivery_creator', 'trip_planner', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const {
        customer_name,
        customer_phone,
        delivery_address,
        latitude,
        longitude,
        scheduled_date,
        weight,
        volume,
        status,
        notes,
      } = req.body;

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (customer_name !== undefined) {
        fields.push(`customer_name = $${paramCount++}`);
        values.push(customer_name);
      }
      if (customer_phone !== undefined) {
        fields.push(`customer_phone = $${paramCount++}`);
        values.push(customer_phone);
      }
      if (delivery_address !== undefined) {
        fields.push(`delivery_address = $${paramCount++}`);
        values.push(delivery_address);
      }
      if (latitude !== undefined && longitude !== undefined) {
        fields.push(`delivery_location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)::geography`);
        values.push(longitude, latitude);
        paramCount += 2;
      }
      if (scheduled_date !== undefined) {
        fields.push(`scheduled_date = $${paramCount++}`);
        values.push(scheduled_date);
      }
      if (weight !== undefined) {
        fields.push(`weight = $${paramCount++}`);
        values.push(weight);
      }
      if (volume !== undefined) {
        fields.push(`volume = $${paramCount++}`);
        values.push(volume);
      }
      if (status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(status);
      }
      if (notes !== undefined) {
        fields.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);
      const result = await pool.query(
        `UPDATE deliveries SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *, ST_Y(delivery_location::geometry) as latitude, ST_X(delivery_location::geometry) as longitude`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Delivery not found' });
      }

      res.json({
        message: 'Delivery updated successfully',
        delivery: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating delivery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete delivery
router.delete(
  '/:id',
  authenticate,
  authorize('delivery_creator', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM deliveries WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Delivery not found' });
      }

      res.json({ message: 'Delivery deleted successfully' });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
