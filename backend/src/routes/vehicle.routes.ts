import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all vehicles
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*,
        ST_Y(v.current_location::geometry) as latitude,
        ST_X(v.current_location::geometry) as longitude
      FROM vehicles v
      ORDER BY v.name ASC`
    );
    res.json({ vehicles: result.rows });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single vehicle
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.*,
        ST_Y(v.current_location::geometry) as latitude,
        ST_X(v.current_location::geometry) as longitude
      FROM vehicles v
      WHERE v.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ vehicle: result.rows[0] });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vehicle
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('license_plate').trim().notEmpty(),
    body('capacity_weight').isFloat({ min: 0 }),
    body('capacity_volume').isFloat({ min: 0 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, license_plate, capacity_weight, capacity_volume, latitude, longitude } = req.body;

      let locationQuery = '';
      const values: any[] = [name, license_plate, capacity_weight, capacity_volume];

      if (latitude !== undefined && longitude !== undefined) {
        locationQuery = ', current_location';
        values.push(longitude, latitude);
      }

      const result = await pool.query(
        `INSERT INTO vehicles (name, license_plate, capacity_weight, capacity_volume${locationQuery})
        VALUES ($1, $2, $3, $4${latitude !== undefined && longitude !== undefined ? ', ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography' : ''})
        RETURNING *, ST_Y(current_location::geometry) as latitude, ST_X(current_location::geometry) as longitude`,
        values
      );

      res.status(201).json({
        message: 'Vehicle created successfully',
        vehicle: result.rows[0],
      });
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update vehicle
router.put('/:id', authenticate, authorize('trip_planner', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, license_plate, capacity_weight, capacity_volume, latitude, longitude, status } = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (license_plate !== undefined) {
      fields.push(`license_plate = $${paramCount++}`);
      values.push(license_plate);
    }
    if (capacity_weight !== undefined) {
      fields.push(`capacity_weight = $${paramCount++}`);
      values.push(capacity_weight);
    }
    if (capacity_volume !== undefined) {
      fields.push(`capacity_volume = $${paramCount++}`);
      values.push(capacity_volume);
    }
    if (latitude !== undefined && longitude !== undefined) {
      fields.push(`current_location = ST_SetSRID(ST_MakePoint($${paramCount}, $${paramCount + 1}), 4326)::geography`);
      values.push(longitude, latitude);
      paramCount += 2;
    }
    if (status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE vehicles SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *, ST_Y(current_location::geometry) as latitude, ST_X(current_location::geometry) as longitude`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({
      message: 'Vehicle updated successfully',
      vehicle: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vehicle
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
