import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all trips
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, v.name as vehicle_name, v.license_plate,
        u.full_name as created_by_name,
        COUNT(td.id) as delivery_count
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN trip_deliveries td ON t.id = td.trip_id
      GROUP BY t.id, v.name, v.license_plate, u.full_name
      ORDER BY t.planned_start_time DESC`
    );
    res.json({ trips: result.rows });
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single trip with deliveries
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const tripResult = await pool.query(
      `SELECT t.*, v.name as vehicle_name, v.license_plate,
        v.capacity_weight, v.capacity_volume,
        u.full_name as created_by_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const deliveriesResult = await pool.query(
      `SELECT d.*, td.sequence_order, td.estimated_arrival, td.actual_arrival,
        ST_Y(d.delivery_location::geometry) as latitude,
        ST_X(d.delivery_location::geometry) as longitude
      FROM trip_deliveries td
      JOIN deliveries d ON td.delivery_id = d.id
      WHERE td.trip_id = $1
      ORDER BY td.sequence_order ASC`,
      [id]
    );

    res.json({
      trip: tripResult.rows[0],
      deliveries: deliveriesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create trip
router.post(
  '/',
  authenticate,
  authorize('trip_planner', 'admin'),
  [
    body('name').trim().notEmpty(),
    body('vehicle_id').isUUID(),
    body('planned_start_time').isISO8601(),
    body('deliveries').isArray({ min: 1 }),
    body('deliveries.*.delivery_id').isUUID(),
    body('deliveries.*.sequence_order').isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res) => {
    const client = await pool.connect();
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, vehicle_id, planned_start_time, planned_end_time, deliveries } = req.body;

      await client.query('BEGIN');

      // Check vehicle capacity
      const vehicleResult = await client.query(
        'SELECT capacity_weight, capacity_volume FROM vehicles WHERE id = $1',
        [vehicle_id]
      );

      if (vehicleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      const vehicle = vehicleResult.rows[0];

      // Get delivery details and calculate totals
      const deliveryIds = deliveries.map((d: any) => d.delivery_id);
      const deliveryDetailsResult = await client.query(
        'SELECT id, weight, volume, status FROM deliveries WHERE id = ANY($1::uuid[])',
        [deliveryIds]
      );

      const deliveryMap = new Map(deliveryDetailsResult.rows.map(d => [d.id, d]));

      let total_weight = 0;
      let total_volume = 0;

      for (const delivery of deliveries) {
        const details = deliveryMap.get(delivery.delivery_id);
        if (!details) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Delivery ${delivery.delivery_id} not found` });
        }
        if (details.status === 'delivered' || details.status === 'in_transit') {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Delivery ${delivery.delivery_id} is already ${details.status}` 
          });
        }
        total_weight += parseFloat(details.weight);
        total_volume += parseFloat(details.volume);
      }

      // Check capacity
      if (total_weight > vehicle.capacity_weight) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Total weight exceeds vehicle capacity',
          total_weight,
          capacity: vehicle.capacity_weight,
        });
      }

      if (total_volume > vehicle.capacity_volume) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Total volume exceeds vehicle capacity',
          total_volume,
          capacity: vehicle.capacity_volume,
        });
      }

      // Create trip
      const tripResult = await client.query(
        `INSERT INTO trips (
          name, vehicle_id, planned_start_time, planned_end_time,
          total_weight, total_volume, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [name, vehicle_id, planned_start_time, planned_end_time, total_weight, total_volume, req.user!.id]
      );

      const trip = tripResult.rows[0];

      // Add deliveries to trip
      for (const delivery of deliveries) {
        await client.query(
          `INSERT INTO trip_deliveries (trip_id, delivery_id, sequence_order, estimated_arrival)
          VALUES ($1, $2, $3, $4)`,
          [trip.id, delivery.delivery_id, delivery.sequence_order, delivery.estimated_arrival]
        );

        // Update delivery status
        await client.query(
          'UPDATE deliveries SET status = $1 WHERE id = $2',
          ['assigned', delivery.delivery_id]
        );
      }

      // Update vehicle status
      await client.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2',
        ['in_use', vehicle_id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Trip created successfully',
        trip,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating trip:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// Update trip status
router.patch(
  '/:id/status',
  authenticate,
  authorize('trip_planner', 'admin'),
  [body('status').isIn(['planned', 'in_progress', 'completed', 'cancelled'])],
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await pool.query(
        'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }

      res.json({
        message: 'Trip status updated successfully',
        trip: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating trip status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete trip
router.delete('/:id', authenticate, authorize('trip_planner', 'admin'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get deliveries in trip
    const deliveriesResult = await client.query(
      'SELECT delivery_id FROM trip_deliveries WHERE trip_id = $1',
      [id]
    );

    // Reset delivery status
    for (const row of deliveriesResult.rows) {
      await client.query(
        'UPDATE deliveries SET status = $1 WHERE id = $2',
        ['pending', row.delivery_id]
      );
    }

    // Delete trip (cascades to trip_deliveries)
    const result = await client.query('DELETE FROM trips WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }

    await client.query('COMMIT');

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;
