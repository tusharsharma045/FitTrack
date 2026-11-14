const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/equipment - List gym equipment
router.get('/', async (req, res) => {
    try {
        const { condition, category } = req.query;
        let query = 'SELECT * FROM gym_equipment WHERE 1=1';
        const params = [];

        if (condition && condition !== 'All') {
            query += ' AND condition_status = ?';
            params.push(condition);
        }

        if (category && category !== 'All') {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY equipment_id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch equipment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/equipment - Add equipment
router.post('/', async (req, res) => {
    try {
        const { equipment_name, category, purchase_date, condition_status, cost, last_maintenance_date } = req.body;
        if (!equipment_name || !category || !purchase_date) {
            return res.status(400).json({ success: false, error: 'Equipment name, category, and purchase date are required.' });
        }

        const [result] = await db.query(`
            INSERT INTO gym_equipment (equipment_name, category, purchase_date, condition_status, cost, last_maintenance_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [equipment_name, category, purchase_date, condition_status || 'Operational', cost || 0.00, last_maintenance_date || null]);

        res.json({ success: true, message: 'Equipment recorded in inventory.', equipment_id: result.insertId });
    } catch (error) {
        console.error('Add equipment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/equipment/:id - Update condition or maintenance
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { equipment_name, category, condition_status, last_maintenance_date, cost } = req.body;

        await db.query(`
            UPDATE gym_equipment
            SET equipment_name = ?, category = ?, condition_status = ?, last_maintenance_date = ?, cost = ?
            WHERE equipment_id = ?
        `, [equipment_name, category, condition_status, last_maintenance_date || null, cost, id]);

        res.json({ success: true, message: 'Equipment updated successfully.' });
    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/equipment/:id - Remove equipment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM gym_equipment WHERE equipment_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Equipment not found.' });
        }
        res.json({ success: true, message: 'Equipment removed from inventory.' });
    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
