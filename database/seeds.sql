-- ==============================================================================
-- PROJECT: FitTrack – Smart Gym Management & Fitness Tracking System
-- MODULE: Realistic Dynamic Sample Data Seeding Script (seeds.sql)
-- NOTE: Dates are computed relative to CURRENT_DATE so the demo stays fresh and active.
-- ==============================================================================

USE fittrack_db;

-- Clear previous test data cleanly in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE gym_equipment;
TRUNCATE TABLE fitness_progress;
TRUNCATE TABLE payments;
TRUNCATE TABLE attendance;
TRUNCATE TABLE trainer_assignments;
TRUNCATE TABLE workout_exercises;
TRUNCATE TABLE workout_plans;
TRUNCATE TABLE exercises;
TRUNCATE TABLE memberships;
TRUNCATE TABLE membership_plans;
TRUNCATE TABLE trainers;
TRUNCATE TABLE members;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. SEED MEMBERSHIP PLANS (Catalog of packages)
-- ------------------------------------------------------------------------------
INSERT INTO membership_plans (plan_id, plan_name, description, duration_months, fee, status) VALUES
(1, 'Bronze Starter', 'Access to gym equipment during standard hours (10 AM - 5 PM). Ideal for beginners.', 1, 1500.00, 'Active'),
(2, 'Silver Fitness', 'All-day gym access, locker access, and 1 group fitness class per week.', 3, 3999.00, 'Active'),
(3, 'Gold Pro Athlete', 'Full gym & cardio access, sauna, shower, 3 personal training sessions, free locker.', 6, 7499.00, 'Active'),
(4, 'Platinum Elite Annual', 'Unlimited 24/7 access, unlimited group classes, steam room, diet consultation, 10 trainer sessions.', 12, 13999.00, 'Active'),
(5, 'Weekend Warrior', 'Saturday and Sunday unlimited access including all weekend conditioning batches.', 3, 2499.00, 'Active');

-- ------------------------------------------------------------------------------
-- 2. SEED TRAINERS
-- ------------------------------------------------------------------------------
INSERT INTO trainers (trainer_id, first_name, last_name, email, phone, specialization, experience_years, hourly_rate, hire_date, status) VALUES
(1, 'Vikram', 'Rathore', 'vikram.rathore@fittrack.com', '+91 98765 43210', 'Bodybuilding & Hypertrophy', 8, 800.00, DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR), 'Active'),
(2, 'Ananya', 'Sharma', 'ananya.sharma@fittrack.com', '+91 98765 43211', 'Weight Loss & Functional HIIT', 5, 650.00, DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Active'),
(3, 'Marcus', 'Fernandes', 'marcus.f@fittrack.com', '+91 98765 43212', 'Powerlifting & Strength Conditioning', 10, 1000.00, DATE_SUB(CURRENT_DATE, INTERVAL 3 YEAR), 'Active'),
(4, 'Priya', 'Nair', 'priya.nair@fittrack.com', '+91 98765 43213', 'Yoga, Mobility & Flexibility', 6, 600.00, DATE_SUB(CURRENT_DATE, INTERVAL 8 MONTH), 'Active'),
(5, 'Rohit', 'Verma', 'rohit.v@fittrack.com', '+91 98765 43214', 'Cardiovascular Endurance & Marathon Coaching', 4, 550.00, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'Active');

-- ------------------------------------------------------------------------------
-- 3. SEED MEMBERS
-- ------------------------------------------------------------------------------
INSERT INTO members (member_id, first_name, last_name, email, phone, gender, dob, emergency_contact, address, joined_date, status) VALUES
(1, 'Aarav', 'Patel', 'aarav.patel@gmail.com', '+91 91234 56780', 'Male', '1998-05-14', '+91 98111 22334', 'Flat 402, Sunshine Heights, Mumbai', DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), 'Active'),
(2, 'Sneha', 'Kulkarni', 'sneha.k@yahoo.com', '+91 91234 56781', 'Female', '2001-11-20', '+91 98222 33445', 'B-12, Green Glen Layout, Bengaluru', DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'Active'),
(3, 'Karan', 'Mehta', 'karan.mehta@outlook.com', '+91 91234 56782', 'Male', '1995-03-08', '+91 98333 44556', '74 Park View Apartments, New Delhi', DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 'Active'),
(4, 'Riya', 'Sen', 'riya.sen@gmail.com', '+91 91234 56783', 'Female', '1999-09-25', '+91 98444 55667', '18 Lake Road, South Kolkata', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'Active'),
(5, 'Arjun', 'Reddy', 'arjun.reddy@gmail.com', '+91 91234 56784', 'Male', '1992-07-12', '+91 98555 66778', 'Plot 88, Jubilee Hills, Hyderabad', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'Active'),
(6, 'Neha', 'Gupta', 'neha.gupta@hotmail.com', '+91 91234 56785', 'Female', '1997-12-04', '+91 98666 77889', 'Tower 3, Cyber City, Gurugram', DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), 'Active'),
(7, 'Dev', 'Malhotra', 'dev.m@gmail.com', '+91 91234 56786', 'Male', '2000-01-18', '+91 98777 88990', 'C-104, Koregaon Park, Pune', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'Active'),
(8, 'Tanvi', 'Deshmukh', 'tanvi.d@gmail.com', '+91 91234 56787', 'Female', '1996-08-30', '+91 98888 99001', 'Shivaji Nagar, Pune', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 'Active'),
(9, 'Kabir', 'Khan', 'kabir.khan@rediffmail.com', '+91 91234 56788', 'Male', '1991-04-16', '+91 98999 00112', 'Bandra West, Mumbai', DATE_SUB(CURRENT_DATE, INTERVAL 8 MONTH), 'Inactive'),
(10, 'Ishita', 'Bose', 'ishita.bose@gmail.com', '+91 91234 56789', 'Female', '2002-02-28', '+91 98000 11223', 'Salt Lake Sector 2, Kolkata', DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 'Active');

-- ------------------------------------------------------------------------------
-- 4. SEED MEMBERSHIPS (Relative dates for realistic active & expiring states)
-- ------------------------------------------------------------------------------
INSERT INTO memberships (membership_id, member_id, plan_id, start_date, end_date, total_amount, status) VALUES
(1, 1, 4, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH), 13999.00, 'Active'),
(2, 2, 3, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 7499.00, 'Active'),
(3, 3, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 3999.00, 'Active'),
(4, 4, 3, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH), 7499.00, 'Active'),
(5, 5, 4, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 9 MONTH), 13999.00, 'Active'),
-- Neha's membership expires in 5 days (triggers upcoming expiry alert!)
(6, 6, 1, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 1500.00, 'Active'),
(7, 7, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 1 MONTH), 3999.00, 'Active'),
(8, 8, 3, DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 5 MONTH), 7499.00, 'Active'),
-- Kabir's membership is expired
(9, 9, 1, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 1500.00, 'Expired'),
(10, 10, 2, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 80 DAY), 3999.00, 'Active');

-- ------------------------------------------------------------------------------
-- 5. SEED EXERCISES
-- ------------------------------------------------------------------------------
INSERT INTO exercises (exercise_id, exercise_name, muscle_group, equipment_needed, difficulty_level, description) VALUES
(1, 'Barbell Back Squat', 'Quadriceps & Glutes', 'Barbell & Squat Rack', 'Intermediate', 'Compound lower body movement building foundational strength and power.'),
(2, 'Flat Barbell Bench Press', 'Chest & Triceps', 'Barbell & Flat Bench', 'Intermediate', 'Classic upper body horizontal push developing pectoral thickness.'),
(3, 'Conventional Deadlift', 'Hamstrings & Posterior Chain', 'Barbell & Weight Plates', 'Advanced', 'Full-body sovereign lift targeting back, hips, glutes, and traps.'),
(4, 'Pull-Up', 'Lats & Biceps', 'Pull-up Bar', 'Intermediate', 'Bodyweight vertical pulling exercise for upper back breadth and grip.'),
(5, 'Overhead Military Press', 'Deltoids & Core', 'Barbell', 'Intermediate', 'Vertical shoulder press for deltoid strength and scapular stability.'),
(6, 'Dumbbell Walking Lunges', 'Quads, Hamstrings & Glutes', 'Dumbbells', 'Beginner', 'Unilateral leg conditioning exercise improving balance and hypertrophy.'),
(7, 'Plank Hold', 'Core & Abdominals', 'Yoga Mat', 'Beginner', 'Isometric core stabilization strengthening the transverse abdominis.'),
(8, 'Incline Dumbbell Press', 'Upper Chest', 'Adjustable Bench & Dumbbells', 'Intermediate', 'Targets the clavicular head of the pectoralis major.'),
(9, 'Cable Lat Pulldown', 'Latissimus Dorsi', 'Cable Machine & Lat Bar', 'Beginner', 'Machine-guided vertical pull ideal for building back posture.'),
(10, 'Romanian Deadlift (RDL)', 'Hamstrings & Glutes', 'Barbell or Dumbbells', 'Intermediate', 'Hip hinge movement loaded eccentric stretch for hamstring flexibility.');

-- ------------------------------------------------------------------------------
-- 6. SEED WORKOUT PLANS
-- ------------------------------------------------------------------------------
INSERT INTO workout_plans (workout_plan_id, trainer_id, plan_name, goal, difficulty_level, duration_weeks, description) VALUES
(1, 1, 'Hypertrophy Beast 4-Day Split', 'Muscle Gain', 'Intermediate', 8, 'High volume push-pull-legs and upper/lower hypertrophy progression.'),
(2, 2, 'Shred & Tone Fat Furnace', 'Weight Loss', 'Beginner', 6, 'Dynamic supersets and metabolic conditioning tailored for sustainable fat loss.'),
(3, 3, 'Iron Strong Power 5x5', 'Muscle Gain', 'Advanced', 12, 'Heavy compound barbell focus inspired by classic strength periodization.'),
(4, 4, 'Functional Mobility & Core Flow', 'Flexibility', 'Beginner', 4, 'Full-body joint mobility, core stability, and posture restoration program.'),
(5, 5, 'Cardio Blast & Athletic Stamina', 'Endurance', 'Intermediate', 6, 'VO2 max conditioning, plyometrics, and aerobic threshold training.');

-- ------------------------------------------------------------------------------
-- 7. SEED WORKOUT EXERCISES (Junction table mappings)
-- ------------------------------------------------------------------------------
INSERT INTO workout_exercises (workout_exercise_id, workout_plan_id, exercise_id, day_of_week, sets, reps, rest_seconds) VALUES
(1, 1, 2, 'Monday', 4, 10, 90),
(2, 1, 8, 'Monday', 3, 12, 60),
(3, 1, 5, 'Monday', 3, 10, 75),
(4, 1, 4, 'Wednesday', 4, 8, 90),
(5, 1, 9, 'Wednesday', 3, 12, 60),
(6, 1, 1, 'Friday', 4, 10, 120),
(7, 1, 10, 'Friday', 3, 12, 90),
(8, 2, 6, 'Tuesday', 3, 15, 45),
(9, 2, 7, 'Tuesday', 4, 60, 45),
(10, 2, 4, 'Thursday', 3, 10, 60),
(11, 3, 1, 'Monday', 5, 5, 180),
(12, 3, 2, 'Wednesday', 5, 5, 180),
(13, 3, 3, 'Friday', 5, 5, 240);

-- ------------------------------------------------------------------------------
-- 8. SEED TRAINER ASSIGNMENTS
-- ------------------------------------------------------------------------------
INSERT INTO trainer_assignments (assignment_id, member_id, trainer_id, assigned_date, session_time, status) VALUES
(1, 1, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'Morning (06:30 - 07:30)', 'Active'),
(2, 2, 2, DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 'Evening (18:00 - 19:00)', 'Active'),
(3, 3, 3, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'Morning (08:00 - 09:00)', 'Active'),
(4, 4, 4, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'Evening (17:00 - 18:00)', 'Active'),
(5, 5, 1, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'Morning (07:30 - 08:30)', 'Active'),
(6, 7, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'Evening (19:00 - 20:00)', 'Active'),
(7, 9, 3, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), 'Morning (09:00 - 10:00)', 'Completed');

-- ------------------------------------------------------------------------------
-- 9. SEED ATTENDANCE
-- ------------------------------------------------------------------------------
INSERT INTO attendance (attendance_id, member_id, attendance_date, check_in_time, check_out_time) VALUES
(1, 1, CURRENT_DATE, '06:45:00', '08:15:00'),
(2, 2, CURRENT_DATE, '07:10:00', '08:20:00'),
(3, 3, CURRENT_DATE, '08:00:00', '09:30:00'),
(4, 5, CURRENT_DATE, '07:30:00', NULL),
(5, 7, CURRENT_DATE, '08:15:00', NULL),
(6, 1, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '06:50:00', '08:10:00'),
(7, 2, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '07:05:00', '08:25:00'),
(8, 4, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '17:15:00', '18:30:00'),
(9, 6, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '18:00:00', '19:15:00'),
(10, 8, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '09:00:00', '10:15:00'),
(11, 1, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '06:40:00', '08:00:00'),
(12, 3, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '08:05:00', '09:25:00'),
(13, 5, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '07:35:00', '08:50:00'),
(14, 7, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '19:00:00', '20:15:00'),
(15, 10, DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '10:00:00', '11:15:00');

-- ------------------------------------------------------------------------------
-- 10. SEED PAYMENTS
-- ------------------------------------------------------------------------------
INSERT INTO payments (payment_id, membership_id, member_id, amount, payment_date, payment_method, payment_status, transaction_id) VALUES
(1, 1, 1, 13999.00, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), 'UPI', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1001')),
(2, 2, 2, 7499.00, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 'Credit Card', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1002')),
(3, 3, 3, 3999.00, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'Debit Card', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1003')),
(4, 4, 4, 7499.00, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'Net Banking', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1004')),
(5, 5, 5, 13999.00, DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 'UPI', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1005')),
(6, 6, 6, 1500.00, DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), 'Cash', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1006')),
(7, 7, 7, 3999.00, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 'UPI', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1007')),
(8, 8, 8, 7499.00, DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 'Credit Card', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1008')),
(9, 9, 9, 1500.00, DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH), 'Cash', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1009')),
(10, 10, 10, 3999.00, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 'UPI', 'Completed', CONCAT('TXN-', UNIX_TIMESTAMP(), '-1010')),
(11, 6, 6, 1500.00, CURRENT_DATE, 'UPI', 'Pending', CONCAT('TXN-', UNIX_TIMESTAMP(), '-PEND1'));

-- ------------------------------------------------------------------------------
-- 11. SEED FITNESS PROGRESS
-- ------------------------------------------------------------------------------
INSERT INTO fitness_progress (progress_id, member_id, recorded_date, weight_kg, height_cm, bmi, body_fat_percentage, chest_cm, waist_cm, arms_cm, remarks) VALUES
(1, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 82.50, 178.00, 26.04, 21.5, 102.00, 88.00, 35.00, 'Baseline fitness intake assessment. Good muscle mass foundation.'),
(2, 1, DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 80.20, 178.00, 25.31, 19.8, 103.50, 85.00, 36.00, 'Down 2.3kg, lost 3cm off waist. Clean diet adherence.'),
(3, 1, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 78.50, 178.00, 24.78, 18.0, 104.50, 82.50, 36.50, 'Achieved target normal BMI range. Noticeable arm definition.'),
(4, 1, CURRENT_DATE, 77.00, 178.00, 24.30, 16.5, 105.00, 80.50, 37.00, 'Excellent strength-to-weight ratio milestone.'),
(5, 2, DATE_SUB(CURRENT_DATE, INTERVAL 4 MONTH), 68.00, 162.00, 25.91, 28.5, 92.00, 78.00, 28.00, 'Initial assessment for HIIT and conditioning program.'),
(6, 2, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 65.50, 162.00, 24.96, 26.2, 90.00, 74.50, 27.50, 'Lost 2.5kg. Cardiovascular stamina improved considerably.'),
(7, 2, CURRENT_DATE, 63.80, 162.00, 24.31, 24.8, 89.00, 72.00, 27.00, 'Consistent 4 days/week attendance. Core stability high.'),
(8, 3, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 88.00, 182.00, 26.57, 22.0, 106.00, 91.00, 37.00, 'Starting 5x5 power program with coach Marcus.'),
(9, 3, CURRENT_DATE, 89.20, 182.00, 26.93, 20.5, 109.00, 90.00, 38.50, 'Muscle mass gain phase. Bench press increased to 100kg.'),
(10, 5, DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 75.00, 175.00, 24.49, 17.5, 100.00, 81.00, 34.00, 'New enrollment fitness assessment.');

-- ------------------------------------------------------------------------------
-- 12. SEED GYM EQUIPMENT
-- ------------------------------------------------------------------------------
INSERT INTO gym_equipment (equipment_id, equipment_name, category, purchase_date, condition_status, last_maintenance_date, cost) VALUES
(1, 'LifeFitness Commercial Treadmill T5', 'Cardio', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 185000.00),
(2, 'Matrix Fitness Rower ERG-01', 'Cardio', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 95000.00),
(3, 'Hammer Strength Olympic Power Rack', 'Strength', DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH), 120000.00),
(4, 'Eleiko Olympic Barbell Set (20kg + 150kg)', 'Free Weights', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 85000.00),
(5, 'LifeFitness Dual Adjustable Pulley Cable Machine', 'Strength', DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR), 'Maintenance Needed', DATE_SUB(CURRENT_DATE, INTERVAL 5 MONTH), 240000.00),
(6, 'Assault AirBike Pro', 'Cardio', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 68000.00),
(7, 'Rubber Hex Dumbbell Set (2.5kg - 35kg)', 'Free Weights', DATE_SUB(CURRENT_DATE, INTERVAL 2 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 110000.00),
(8, 'Precor Elliptical Cross Trainer EFX', 'Cardio', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Under Repair', DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), 175000.00),
(9, 'Leg Press & Hack Squat Combo 45-degree', 'Strength', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), 145000.00),
(10, 'Concept2 SkiErg with Floor Stand', 'Functional', DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR), 'Operational', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), 92000.00);
