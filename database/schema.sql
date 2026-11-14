-- ==============================================================================
-- PROJECT: FitTrack – Smart Gym Management & Fitness Tracking System
-- MODULE: Database Definition & Schema Creation Script
-- RDBMS: MySQL 8.x / 8.4+
-- ARCHITECT: Senior Database Architect & Full-Stack Developer
-- NORMALIZATION: 1NF, 2NF, 3NF Certified
-- ==============================================================================

DROP DATABASE IF EXISTS fittrack_db;
CREATE DATABASE fittrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fittrack_db;

-- ==============================================================================
-- 1. MEMBERS TABLE
-- Stores profile and contact information for gym members.
-- ==============================================================================
CREATE TABLE members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    dob DATE NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    address VARCHAR(255) NULL,
    joined_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 2. TRAINERS TABLE
-- Stores certified gym trainers, coaches, and instructors.
-- ==============================================================================
CREATE TABLE trainers (
    trainer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL DEFAULT 1,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    hire_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trainer_exp CHECK (experience_years >= 0),
    CONSTRAINT chk_trainer_rate CHECK (hourly_rate >= 0.00)
) ENGINE=InnoDB;

-- ==============================================================================
-- 3. MEMBERSHIP PLANS TABLE
-- Defines catalog of available membership packages and durations.
-- ==============================================================================
CREATE TABLE membership_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    duration_months INT NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plan_duration CHECK (duration_months > 0),
    CONSTRAINT chk_plan_fee CHECK (fee >= 0.00)
) ENGINE=InnoDB;

-- ==============================================================================
-- 4. MEMBERSHIPS (SUBSCRIPTIONS) TABLE
-- Tracks active and past subscriptions linked to members and plans.
-- ==============================================================================
CREATE TABLE memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('Active', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memberships_member FOREIGN KEY (member_id) 
        REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) 
        REFERENCES membership_plans(plan_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_membership_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_membership_amount CHECK (total_amount >= 0.00)
) ENGINE=InnoDB;

-- ==============================================================================
-- 5. EXERCISES TABLE
-- Repository of individual fitness exercises and target muscle groups.
-- ==============================================================================
CREATE TABLE exercises (
    exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    exercise_name VARCHAR(100) NOT NULL UNIQUE,
    muscle_group VARCHAR(50) NOT NULL,
    equipment_needed VARCHAR(100) NOT NULL DEFAULT 'Bodyweight',
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==============================================================================
-- 6. WORKOUT PLANS TABLE
-- Master workout routine plans created by trainers.
-- ==============================================================================
CREATE TABLE workout_plans (
    workout_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    trainer_id INT NULL,
    plan_name VARCHAR(100) NOT NULL,
    goal ENUM('Weight Loss', 'Muscle Gain', 'Endurance', 'General Fitness', 'Flexibility') NOT NULL,
    difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
    duration_weeks INT NOT NULL DEFAULT 4,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workout_plans_trainer FOREIGN KEY (trainer_id) 
        REFERENCES trainers(trainer_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_workout_duration CHECK (duration_weeks > 0)
) ENGINE=InnoDB;

-- ==============================================================================
-- 7. WORKOUT EXERCISES (JUNCTION TABLE)
-- Connects workout plans to specific exercises, specifying sets and reps.
-- ==============================================================================
CREATE TABLE workout_exercises (
    workout_exercise_id INT AUTO_INCREMENT PRIMARY KEY,
    workout_plan_id INT NOT NULL,
    exercise_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps INT NOT NULL DEFAULT 12,
    rest_seconds INT NOT NULL DEFAULT 60,
    CONSTRAINT fk_we_plan FOREIGN KEY (workout_plan_id) 
        REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_we_exercise FOREIGN KEY (exercise_id) 
        REFERENCES exercises(exercise_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_plan_exercise_day UNIQUE (workout_plan_id, exercise_id, day_of_week),
    CONSTRAINT chk_we_sets CHECK (sets > 0),
    CONSTRAINT chk_we_reps CHECK (reps > 0),
    CONSTRAINT chk_we_rest CHECK (rest_seconds >= 0)
) ENGINE=InnoDB;

-- ==============================================================================
-- 8. TRAINER ASSIGNMENTS TABLE
-- Tracks one-on-one personal trainer assignments to gym members.
-- ==============================================================================
CREATE TABLE trainer_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    trainer_id INT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    session_time VARCHAR(50) NOT NULL DEFAULT 'Morning (07:00 - 08:00)',
    status ENUM('Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ta_member FOREIGN KEY (member_id) 
        REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ta_trainer FOREIGN KEY (trainer_id) 
        REFERENCES trainers(trainer_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 9. ATTENDANCE TABLE
-- Records daily member check-ins and check-outs for analytics and tracking.
-- ==============================================================================
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    attendance_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    check_in_time TIME NOT NULL,
    check_out_time TIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) 
        REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ==============================================================================
-- 10. PAYMENTS TABLE
-- Financial ledger recording fee transactions, payment modes and statuses.
-- ==============================================================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    membership_id INT NOT NULL,
    member_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking') NOT NULL,
    payment_status ENUM('Completed', 'Pending', 'Failed') NOT NULL DEFAULT 'Completed',
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_membership FOREIGN KEY (membership_id) 
        REFERENCES memberships(membership_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payments_member FOREIGN KEY (member_id) 
        REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount > 0.00)
) ENGINE=InnoDB;

-- ==============================================================================
-- 11. FITNESS PROGRESS TABLE
-- Biometric logs capturing weight, body measurements and calculated BMI.
-- ==============================================================================
CREATE TABLE fitness_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    recorded_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    weight_kg DECIMAL(5, 2) NOT NULL,
    height_cm DECIMAL(5, 2) NOT NULL,
    bmi DECIMAL(5, 2) NULL,
    body_fat_percentage DECIMAL(4, 1) NULL,
    chest_cm DECIMAL(5, 2) NULL,
    waist_cm DECIMAL(5, 2) NULL,
    arms_cm DECIMAL(5, 2) NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_progress_member FOREIGN KEY (member_id) 
        REFERENCES members(member_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_progress_weight CHECK (weight_kg > 0.00),
    CONSTRAINT chk_progress_height CHECK (height_cm > 0.00),
    CONSTRAINT chk_progress_fat CHECK (body_fat_percentage IS NULL OR (body_fat_percentage >= 0.0 AND body_fat_percentage <= 100.0))
) ENGINE=InnoDB;

-- ==============================================================================
-- 12. GYM EQUIPMENT TABLE
-- Asset inventory tracking equipment condition, warranty, and maintenance.
-- ==============================================================================
CREATE TABLE gym_equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    category ENUM('Cardio', 'Strength', 'Free Weights', 'Functional') NOT NULL,
    purchase_date DATE NOT NULL,
    condition_status ENUM('Operational', 'Maintenance Needed', 'Under Repair', 'Decommissioned') NOT NULL DEFAULT 'Operational',
    last_maintenance_date DATE NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_equip_cost CHECK (cost >= 0.00)
) ENGINE=InnoDB;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- Designed for frequently queried columns in joins, filters, and aggregations.
-- ==============================================================================
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_trainers_status ON trainers(status);
CREATE INDEX idx_memberships_dates ON memberships(start_date, end_date);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, attendance_date);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_progress_member_date ON fitness_progress(member_id, recorded_date);
CREATE INDEX idx_equipment_status ON gym_equipment(condition_status);

-- ==============================================================================
-- USER-DEFINED FUNCTIONS (UDF)
-- ==============================================================================
DELIMITER $$

-- 1. Calculate Body Mass Index (BMI)
CREATE FUNCTION fn_calculate_bmi(p_weight_kg DECIMAL(5,2), p_height_cm DECIMAL(5,2))
RETURNS DECIMAL(5,2)
DETERMINISTIC
NO SQL
BEGIN
    IF p_weight_kg IS NULL OR p_height_cm IS NULL OR p_height_cm <= 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(p_weight_kg / POWER(p_height_cm / 100.0, 2), 2);
END$$

-- 2. Dynamic Membership Status Checker based on current date
CREATE FUNCTION fn_get_membership_status(p_end_date DATE)
RETURNS VARCHAR(20)
DETERMINISTIC
NO SQL
BEGIN
    IF p_end_date >= CURRENT_DATE THEN
        RETURN 'Active';
    ELSE
        RETURN 'Expired';
    END IF;
END$$

-- 3. Calculate Total Amount Spent by a Member
CREATE FUNCTION fn_get_member_total_spent(p_member_id INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE total_spent DECIMAL(10,2);
    SELECT IFNULL(SUM(amount), 0.00) INTO total_spent
    FROM payments
    WHERE member_id = p_member_id AND payment_status = 'Completed';
    RETURN total_spent;
END$$

DELIMITER ;

-- ==============================================================================
-- DATABASE VIEWS
-- Abstracting complex joins for reporting and business logic
-- ==============================================================================

-- View 1: Active Member Directory (Member + Plan + Active Trainer)
CREATE OR REPLACE VIEW vw_active_member_directory AS
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS full_name,
    m.email,
    m.phone,
    m.gender,
    m.joined_date,
    m.status AS member_status,
    ms.membership_id,
    mp.plan_name,
    ms.start_date AS membership_start,
    ms.end_date AS membership_end,
    DATEDIFF(ms.end_date, CURRENT_DATE) AS days_remaining,
    CONCAT(t.first_name, ' ', t.last_name) AS assigned_trainer,
    t.specialization AS trainer_specialization
FROM members m
LEFT JOIN memberships ms ON m.member_id = ms.member_id AND ms.status = 'Active'
LEFT JOIN membership_plans mp ON ms.plan_id = mp.plan_id
LEFT JOIN trainer_assignments ta ON m.member_id = ta.member_id AND ta.status = 'Active'
LEFT JOIN trainers t ON ta.trainer_id = t.trainer_id;

-- View 2: Monthly Revenue Summary
CREATE OR REPLACE VIEW vw_monthly_revenue_summary AS
SELECT 
    DATE_FORMAT(payment_date, '%Y-%m') AS revenue_month,
    COUNT(payment_id) AS total_transactions,
    SUM(CASE WHEN payment_status = 'Completed' THEN amount ELSE 0 END) AS total_collected,
    SUM(CASE WHEN payment_status = 'Pending' THEN amount ELSE 0 END) AS total_pending,
    SUM(CASE WHEN payment_status = 'Failed' THEN amount ELSE 0 END) AS total_failed
FROM payments
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY revenue_month DESC;

-- View 3: Trainer Performance and Workload Analytics
CREATE OR REPLACE VIEW vw_trainer_performance_analytics AS
SELECT 
    t.trainer_id,
    CONCAT(t.first_name, ' ', t.last_name) AS trainer_name,
    t.specialization,
    t.experience_years,
    t.hourly_rate,
    t.status,
    COUNT(DISTINCT ta.member_id) AS total_assigned_members,
    SUM(CASE WHEN ta.status = 'Active' THEN 1 ELSE 0 END) AS currently_active_members,
    COUNT(DISTINCT wp.workout_plan_id) AS workout_plans_authored
FROM trainers t
LEFT JOIN trainer_assignments ta ON t.trainer_id = ta.trainer_id
LEFT JOIN workout_plans wp ON t.trainer_id = wp.trainer_id
GROUP BY t.trainer_id, t.first_name, t.last_name, t.specialization, t.experience_years, t.hourly_rate, t.status;

-- View 4: Expiring Memberships (Upcoming in next 10 days or expired recently)
CREATE OR REPLACE VIEW vw_expiring_memberships AS
SELECT 
    ms.membership_id,
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.email,
    m.phone,
    mp.plan_name,
    ms.start_date,
    ms.end_date,
    DATEDIFF(ms.end_date, CURRENT_DATE) AS days_until_expiry,
    ms.status
FROM memberships ms
JOIN members m ON ms.member_id = m.member_id
JOIN membership_plans mp ON ms.plan_id = mp.plan_id
WHERE ms.status = 'Active' AND ms.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY)
ORDER BY ms.end_date ASC;

-- View 5: Member Attendance Analytics
CREATE OR REPLACE VIEW vw_member_attendance_summary AS
SELECT 
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    COUNT(a.attendance_id) AS total_gym_visits,
    MAX(a.attendance_date) AS last_visit_date,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.check_in_time, IFNULL(a.check_out_time, a.check_in_time))), 0) AS avg_duration_minutes
FROM members m
LEFT JOIN attendance a ON m.member_id = a.member_id
GROUP BY m.member_id, m.first_name, m.last_name;

-- View 6: Equipment Maintenance Alert
CREATE OR REPLACE VIEW vw_equipment_maintenance_alert AS
SELECT 
    equipment_id,
    equipment_name,
    category,
    condition_status,
    last_maintenance_date,
    DATEDIFF(CURRENT_DATE, IFNULL(last_maintenance_date, purchase_date)) AS days_since_last_service
FROM gym_equipment
WHERE condition_status IN ('Maintenance Needed', 'Under Repair') 
   OR DATEDIFF(CURRENT_DATE, IFNULL(last_maintenance_date, purchase_date)) > 90
ORDER BY days_since_last_service DESC;

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================
DELIMITER $$

-- Trigger 1: Automatically compute BMI on fitness progress insertion
CREATE TRIGGER trg_before_insert_fitness_progress
BEFORE INSERT ON fitness_progress
FOR EACH ROW
BEGIN
    IF NEW.height_cm > 0 AND NEW.weight_kg > 0 THEN
        SET NEW.bmi = ROUND(NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2), 2);
    END IF;
END$$

-- Trigger 2: Automatically re-compute BMI on fitness progress update
CREATE TRIGGER trg_before_update_fitness_progress
BEFORE UPDATE ON fitness_progress
FOR EACH ROW
BEGIN
    IF NEW.height_cm > 0 AND NEW.weight_kg > 0 THEN
        SET NEW.bmi = ROUND(NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2), 2);
    END IF;
END$$

-- Trigger 3: Ensure member status becomes 'Active' whenever an Active membership is added
CREATE TRIGGER trg_after_membership_insert
AFTER INSERT ON memberships
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE members 
        SET status = 'Active' 
        WHERE member_id = NEW.member_id;
    END IF;
END$$

-- Trigger 4: Update membership status when a payment is completed
CREATE TRIGGER trg_after_payment_status_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'Completed' AND OLD.payment_status <> 'Completed' THEN
        UPDATE memberships
        SET status = 'Active'
        WHERE membership_id = NEW.membership_id AND end_date >= CURRENT_DATE;
    END IF;
END$$

DELIMITER ;

-- ==============================================================================
-- STORED PROCEDURES (ACID TRANSACTIONS)
-- ==============================================================================
DELIMITER $$

-- Procedure 1: Register New Member with Membership Plan and Payment (Atomic Transaction)
CREATE PROCEDURE sp_register_member_with_membership(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_gender ENUM('Male', 'Female', 'Other'),
    IN p_dob DATE,
    IN p_emergency_contact VARCHAR(20),
    IN p_address VARCHAR(255),
    IN p_plan_id INT,
    IN p_payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'),
    OUT p_out_member_id INT,
    OUT p_out_membership_id INT,
    OUT p_out_status VARCHAR(100)
)
proc_body: BEGIN
    DECLARE v_plan_fee DECIMAL(10,2);
    DECLARE v_duration_months INT;
    DECLARE v_end_date DATE;
    DECLARE v_tx_id VARCHAR(100);

    -- Transaction error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_member_id = NULL;
        SET p_out_membership_id = NULL;
        SET p_out_status = 'ERROR: Registration transaction rolled back due to SQL exception';
    END;

    START TRANSACTION;

    -- Validate membership plan exists and is active
    SELECT fee, duration_months INTO v_plan_fee, v_duration_months
    FROM membership_plans
    WHERE plan_id = p_plan_id AND status = 'Active';

    IF v_plan_fee IS NULL THEN
        ROLLBACK;
        SET p_out_status = 'ERROR: Invalid or Inactive Membership Plan ID';
        LEAVE proc_body;
    END IF;

    -- 1. Insert Member
    INSERT INTO members (first_name, last_name, email, phone, gender, dob, emergency_contact, address, joined_date, status)
    VALUES (p_first_name, p_last_name, p_email, p_phone, p_gender, p_dob, p_emergency_contact, p_address, CURRENT_DATE, 'Active');
    SET p_out_member_id = LAST_INSERT_ID();

    -- Calculate membership end date
    SET v_end_date = DATE_ADD(CURRENT_DATE, INTERVAL v_duration_months MONTH);

    -- 2. Insert Membership
    INSERT INTO memberships (member_id, plan_id, start_date, end_date, total_amount, status)
    VALUES (p_out_member_id, p_plan_id, CURRENT_DATE, v_end_date, v_plan_fee, 'Active');
    SET p_out_membership_id = LAST_INSERT_ID();

    -- Generate Unique Transaction ID
    SET v_tx_id = CONCAT('TXN-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', FLOOR(RAND() * 8999 + 1000));

    -- 3. Record Payment
    INSERT INTO payments (membership_id, member_id, amount, payment_date, payment_method, payment_status, transaction_id)
    VALUES (p_out_membership_id, p_out_member_id, v_plan_fee, CURRENT_DATE, p_payment_method, 'Completed', v_tx_id);

    COMMIT;
    SET p_out_status = 'SUCCESS: Member registered, membership activated, payment recorded.';
END$$

-- Procedure 2: Renew Membership with ACID Transaction
CREATE PROCEDURE sp_renew_membership(
    IN p_member_id INT,
    IN p_plan_id INT,
    IN p_payment_method ENUM('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'),
    OUT p_out_membership_id INT,
    OUT p_out_status VARCHAR(100)
)
proc_body: BEGIN
    DECLARE v_plan_fee DECIMAL(10,2);
    DECLARE v_duration_months INT;
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_latest_end_date DATE;
    DECLARE v_tx_id VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_out_status = 'ERROR: Membership renewal failed and rolled back.';
    END;

    START TRANSACTION;

    -- Fetch plan details
    SELECT fee, duration_months INTO v_plan_fee, v_duration_months
    FROM membership_plans
    WHERE plan_id = p_plan_id AND status = 'Active';

    IF v_plan_fee IS NULL THEN
        ROLLBACK;
        SET p_out_status = 'ERROR: Selected plan does not exist or is inactive.';
        LEAVE proc_body;
    END IF;

    -- Determine start date based on any existing active membership
    SELECT MAX(end_date) INTO v_latest_end_date
    FROM memberships
    WHERE member_id = p_member_id;

    IF v_latest_end_date IS NOT NULL AND v_latest_end_date >= CURRENT_DATE THEN
        SET v_start_date = DATE_ADD(v_latest_end_date, INTERVAL 1 DAY);
    ELSE
        SET v_start_date = CURRENT_DATE;
    END IF;

    SET v_end_date = DATE_ADD(v_start_date, INTERVAL v_duration_months MONTH);

    -- Insert new membership renewal
    INSERT INTO memberships (member_id, plan_id, start_date, end_date, total_amount, status)
    VALUES (p_member_id, p_plan_id, v_start_date, v_end_date, v_plan_fee, 'Active');
    SET p_out_membership_id = LAST_INSERT_ID();

    -- Generate Transaction ID
    SET v_tx_id = CONCAT('RNW-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', FLOOR(RAND() * 8999 + 1000));

    -- Record Payment
    INSERT INTO payments (membership_id, member_id, amount, payment_date, payment_method, payment_status, transaction_id)
    VALUES (p_out_membership_id, p_member_id, v_plan_fee, CURRENT_DATE, p_payment_method, 'Completed', v_tx_id);

    -- Ensure member status is active
    UPDATE members SET status = 'Active' WHERE member_id = p_member_id;

    COMMIT;
    SET p_out_status = 'SUCCESS: Membership renewed successfully.';
END$$

-- Procedure 3: Smart Gym Attendance Check-In / Check-Out
CREATE PROCEDURE sp_record_attendance(
    IN p_member_id INT,
    OUT p_action_taken VARCHAR(50),
    OUT p_out_status VARCHAR(100)
)
proc_body: BEGIN
    DECLARE v_member_status VARCHAR(20);
    DECLARE v_active_membership_count INT;
    DECLARE v_existing_attendance_id INT;
    DECLARE v_check_out_time TIME;

    -- Verify member exists and is active
    SELECT status INTO v_member_status FROM members WHERE member_id = p_member_id;

    IF v_member_status IS NULL THEN
        SET p_action_taken = 'NONE';
        SET p_out_status = 'ERROR: Member not found.';
        LEAVE proc_body;
    END IF;

    IF v_member_status <> 'Active' THEN
        SET p_action_taken = 'REJECTED';
        SET p_out_status = 'ERROR: Member account is not active.';
        LEAVE proc_body;
    END IF;

    -- Verify active membership
    SELECT COUNT(*) INTO v_active_membership_count
    FROM memberships
    WHERE member_id = p_member_id 
      AND status = 'Active' 
      AND CURRENT_DATE BETWEEN start_date AND end_date;

    IF v_active_membership_count = 0 THEN
        SET p_action_taken = 'REJECTED';
        SET p_out_status = 'WARNING: No active valid membership found for today.';
        LEAVE proc_body;
    END IF;

    -- Check if member already checked in today without check out
    SELECT attendance_id, check_out_time INTO v_existing_attendance_id, v_check_out_time
    FROM attendance
    WHERE member_id = p_member_id AND attendance_date = CURRENT_DATE
    ORDER BY attendance_id DESC LIMIT 1;

    IF v_existing_attendance_id IS NOT NULL AND v_check_out_time IS NULL THEN
        -- Perform Check-out
        UPDATE attendance 
        SET check_out_time = CURRENT_TIME() 
        WHERE attendance_id = v_existing_attendance_id;
        SET p_action_taken = 'CHECK_OUT';
        SET p_out_status = 'SUCCESS: Member successfully checked out.';
    ELSE
        -- Perform Check-in
        INSERT INTO attendance (member_id, attendance_date, check_in_time, check_out_time)
        VALUES (p_member_id, CURRENT_DATE, CURRENT_TIME(), NULL);
        SET p_action_taken = 'CHECK_IN';
        SET p_out_status = 'SUCCESS: Member successfully checked in.';
    END IF;
END$$

-- Procedure 4: Batch Daily Expiry Status Updater
CREATE PROCEDURE sp_update_expired_memberships()
BEGIN
    UPDATE memberships
    SET status = 'Expired'
    WHERE end_date < CURRENT_DATE AND status = 'Active';

    -- Set members without any active membership to Inactive
    UPDATE members m
    SET m.status = 'Inactive'
    WHERE m.status = 'Active' 
      AND NOT EXISTS (
          SELECT 1 FROM memberships ms 
          WHERE ms.member_id = m.member_id 
            AND ms.status = 'Active' 
            AND ms.end_date >= CURRENT_DATE
      );
END$$

DELIMITER ;
