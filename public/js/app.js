// ==============================================================================
// FitTrack - Frontend Application Controller & API Integration
// ==============================================================================

const App = {
    currentTab: 'overview',
    allMembers: [],
    allPlans: [],
    allTrainers: [],

    init() {
        this.setupNavigation();
        this.setupDateDisplay();
        this.setupModals();
        this.setupEventHandlers();

        // Initial Data Load
        this.loadDashboardData();
        this.loadMembersDropdownData();
    },

    // --------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // --------------------------------------------------------------------------
    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'error' ? 'fa-circle-xmark text-danger' : 'fa-circle-check text-success'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    // --------------------------------------------------------------------------
    // NAVIGATION & TAB SWITCHING
    // --------------------------------------------------------------------------
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-item');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Mobile drawer toggle
        const mobileToggle = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
    },

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update active nav button
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        const targetPane = document.getElementById(`pane-${tabName}`);
        if (targetPane) targetPane.classList.add('active');

        // Close mobile drawer if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');

        // Update header titles
        const titleMap = {
            'overview': { title: 'Gym Operations Overview', sub: 'Real-time statistics, member analytics, and operational metrics.' },
            'members': { title: 'Gym Members Directory', sub: 'Manage member records, active subscriptions, and contact dossiers.' },
            'trainers': { title: 'Trainers & Coaches', sub: 'Certified trainers, client workloads, and personal training assignments.' },
            'memberships': { title: 'Membership Plans & Subscriptions', sub: 'Package catalog, subscriptions history, and automated renewals.' },
            'attendance': { title: 'Daily Attendance Terminal', sub: 'Smart check-in/out logging and attendance analytics.' },
            'workouts': { title: 'Workouts & Exercise Bank', sub: 'Master workout routines, periodized splits, and exercise library.' },
            'progress': { title: 'Fitness Progress & Biometrics', sub: 'Weight tracking, body measurements, and trigger-calculated BMI.' },
            'equipment': { title: 'Gym Equipment Inventory', sub: 'Asset tracking, operational condition, and maintenance logs.' },
            'payments': { title: 'Payments & Financial Ledger', sub: 'Invoices, transaction history, and fee collections.' },
            'reports': { title: 'Advanced DBMS Analytics & Reports', sub: 'University capstone business intelligence reports and audit summaries.' },
            'dbms-showcase': { title: 'DBMS Capstone Showcase & SQL Console', sub: 'Live interactive demonstration of Joins, CTEs, Triggers, Views & UDFs.' }
        };

        const currentMeta = titleMap[tabName] || { title: 'FitTrack System', sub: '' };
        document.getElementById('pageTitle').textContent = currentMeta.title;
        document.getElementById('pageSubtitle').textContent = currentMeta.sub;

        // Trigger Tab Specific Data Load
        switch (tabName) {
            case 'overview': this.loadDashboardData(); break;
            case 'members': this.loadMembersTable(); break;
            case 'trainers': this.loadTrainersData(); break;
            case 'memberships': this.loadMembershipsData(); break;
            case 'attendance': this.loadAttendanceData(); break;
            case 'workouts': this.loadWorkoutsData(); break;
            case 'progress': this.loadProgressData(); break;
            case 'equipment': this.loadEquipmentData(); break;
            case 'payments': this.loadPaymentsData(); break;
            case 'reports': this.loadReport('revenue'); break;
            case 'dbms-showcase': this.initDBMSShowcase(); break;
        }
    },

    setupDateDisplay() {
        const dateEl = document.getElementById('currentDateDisplay');
        const now = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        if (dateEl) {
            dateEl.innerHTML = `<i class="fa-regular fa-calendar-check"></i> <span>${now.toLocaleDateString('en-US', options)}</span>`;
        }
    },

    // --------------------------------------------------------------------------
    // MODALS SETUP
    // --------------------------------------------------------------------------
    setupModals() {
        // Open Triggers
        document.getElementById('topRegisterBtn')?.addEventListener('click', () => this.openModal('addMemberModal'));
        document.getElementById('openAddMemberModalBtn')?.addEventListener('click', () => this.openModal('addMemberModal'));
        document.getElementById('openAddTrainerModalBtn')?.addEventListener('click', () => this.openModal('addTrainerModal'));
        document.getElementById('openAssignTrainerModalBtn')?.addEventListener('click', () => {
            this.populateAssignModalDropdowns();
            this.openModal('assignTrainerModal');
        });
        document.getElementById('openAddPlanModalBtn')?.addEventListener('click', () => this.openModal('addPlanModal'));
        document.getElementById('openRenewModalBtn')?.addEventListener('click', () => {
            this.populateRenewModalDropdowns();
            this.openModal('renewModal');
        });
        document.getElementById('openLogProgressModalBtn')?.addEventListener('click', () => {
            this.populateProgressModalDropdowns();
            this.openModal('logProgressModal');
        });
        document.getElementById('openAddExerciseModalBtn')?.addEventListener('click', () => this.openModal('addExerciseModal'));
        document.getElementById('openCreateWorkoutPlanModalBtn')?.addEventListener('click', () => {
            this.populateDropdown('workoutPlanTrainerSelect', this.allTrainers, 'trainer_id', 'trainer_name');
            this.openModal('createWorkoutPlanModal');
        });
        document.getElementById('openManualAttendanceModalBtn')?.addEventListener('click', () => {
            this.populateDropdown('manualAttendanceMemberSelect', this.allMembers, 'member_id', 'full_name');
            const dt = document.getElementById('manualAttendanceDateInput');
            if (dt) dt.value = new Date().toISOString().slice(0, 10);
            this.openModal('manualAttendanceModal');
        });
        document.getElementById('openAddEquipmentModalBtn')?.addEventListener('click', () => this.openModal('addEquipmentModal'));
        document.getElementById('openRecordPaymentModalBtn')?.addEventListener('click', () => this.openModal('addMemberModal'));

        // Close buttons
        document.querySelectorAll('.modal-close, [data-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.dataset.close || btn.closest('.modal-overlay').id;
                this.closeModal(targetId);
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    },

    // --------------------------------------------------------------------------
    // TAB 1: OVERVIEW & DASHBOARD
    // --------------------------------------------------------------------------
    async loadDashboardData() {
        try {
            const [summaryRes, chartsRes] = await Promise.all([
                fetch('/api/dashboard/summary').then(r => r.json()),
                fetch('/api/dashboard/charts').then(r => r.json())
            ]);

            if (summaryRes.success) {
                const s = summaryRes.data;
                document.getElementById('statTotalMembers').textContent = s.totalMembers;
                document.getElementById('statActiveMemberships').textContent = s.activeMemberships;
                document.getElementById('statExpiredMemberships').textContent = s.expiredMemberships;
                document.getElementById('statTotalTrainers').textContent = s.totalTrainers;
                document.getElementById('statTodayAttendance').textContent = s.todayAttendance;
                document.getElementById('statMonthlyRevenue').textContent = `₹${Number(s.monthlyRevenue).toLocaleString()}`;
                document.getElementById('statPendingPayments').textContent = `₹${Number(s.pendingPayments.total).toLocaleString()}`;
                document.getElementById('statPendingCount').textContent = `${s.pendingPayments.count} pending`;

                // Render Alerts
                this.renderUpcomingExpirations(s.alerts.expiringMemberships);
            }

            if (chartsRes.success) {
                const c = chartsRes.data;
                FitCharts.renderRevenueChart(c.monthlyRevenue);
                FitCharts.renderPlanChart(c.planDistribution);
                FitCharts.renderAttendanceChart(c.attendanceTrend);
                FitCharts.renderEquipmentChart(c.equipmentStatus);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    renderUpcomingExpirations(list) {
        const tbody = document.getElementById('upcomingExpirationsBody');
        if (!tbody) return;

        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No upcoming expirations in the next 10 days.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(item => `
            <tr>
                <td><strong>${item.member_name}</strong><br><small class="text-muted">${item.phone}</small></td>
                <td><span class="badge badge-emerald">${item.plan_name}</span></td>
                <td>${item.end_date}</td>
                <td><span class="badge badge-warning">${item.days_until_expiry} days</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="App.quickRenew(${item.member_id})">
                        <i class="fa-solid fa-arrows-rotate"></i> Renew
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // --------------------------------------------------------------------------
    // TAB 2: MEMBERS MANAGEMENT
    // --------------------------------------------------------------------------
    async loadMembersTable() {
        const search = document.getElementById('memberSearchInput')?.value || '';
        const status = document.getElementById('memberStatusFilter')?.value || 'All';

        try {
            const res = await fetch(`/api/members?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
            const data = await res.json();
            const tbody = document.getElementById('membersTableBody');

            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No members found matching query.</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(m => {
                const statusBadge = m.status === 'Active' ? 'badge-emerald' : (m.status === 'Suspended' ? 'badge-danger' : 'badge-secondary');
                const planBadge = m.active_plan ? `<span class="badge badge-cyan">${m.active_plan}</span>` : '<span class="text-muted text-sm">None</span>';
                const daysBadge = m.days_remaining !== null 
                    ? (m.days_remaining > 0 ? `<span class="text-emerald font-weight-bold">${m.days_remaining}d</span>` : `<span class="text-danger">Expired</span>`)
                    : '-';

                return `
                    <tr>
                        <td>#${m.member_id}</td>
                        <td>
                            <strong>${m.full_name}</strong><br>
                            <small class="text-muted">${m.email}</small>
                        </td>
                        <td>${m.phone}</td>
                        <td>${m.gender}</td>
                        <td>${planBadge}</td>
                        <td>${daysBadge}</td>
                        <td>${m.assigned_trainer || '<span class="text-muted">-</span>'}</td>
                        <td><span class="badge ${statusBadge}">${m.status}</span></td>
                        <td class="text-right">
                            <button class="btn btn-sm btn-secondary" onclick="App.viewMemberProfile(${m.member_id})" title="View Profile">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteMember(${m.member_id}, '${m.full_name}')" title="Delete Member">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading members:', error);
        }
    },

    async viewMemberProfile(memberId) {
        try {
            const res = await fetch(`/api/members/${memberId}`);
            const data = await res.json();
            if (!data.success) return this.showToast(data.error, 'error');

            const m = data.data.member;
            const memberships = data.data.memberships;
            const trainers = data.data.trainers;
            const attendance = data.data.attendance;
            const progress = data.data.progress;
            const payments = data.data.payments;

            const modalContent = document.getElementById('memberProfileContent');
            modalContent.innerHTML = `
                <div class="profile-hero mb-4" style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h2>${m.first_name} ${m.last_name}</h2>
                            <p class="text-muted"><i class="fa-solid fa-envelope"></i> ${m.email} &bull; <i class="fa-solid fa-phone"></i> ${m.phone}</p>
                            <p class="text-muted text-sm"><i class="fa-solid fa-location-dot"></i> ${m.address || 'Not specified'} &bull; Emergency Contact: ${m.emergency_contact}</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="badge ${m.status === 'Active' ? 'badge-emerald' : 'badge-secondary'}" style="font-size: 13px;">${m.status}</span>
                            <div style="margin-top: 8px;">
                                <small class="text-muted">Lifetime Gym Spend:</small>
                                <h3 class="text-emerald">₹${Number(m.total_spent || 0).toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs within dossier -->
                <div class="row">
                    <h4 class="mb-3 text-cyan"><i class="fa-solid fa-id-card"></i> Memberships History (${memberships.length})</h4>
                    <div class="table-responsive mb-4">
                        <table class="data-table">
                            <thead><tr><th>Plan</th><th>Start</th><th>End</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                ${memberships.map(ms => `
                                    <tr>
                                        <td><strong>${ms.plan_name}</strong> (${ms.duration_months} mo)</td>
                                        <td>${ms.start_date}</td>
                                        <td>${ms.end_date}</td>
                                        <td>₹${Number(ms.total_amount).toLocaleString()}</td>
                                        <td><span class="badge ${ms.status === 'Active' ? 'badge-emerald' : 'badge-secondary'}">${ms.status}</span></td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5">No past memberships.</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <h4 class="mb-3 text-emerald"><i class="fa-solid fa-ruler-combined"></i> Recent Biometric Progress (${progress.length})</h4>
                    <div class="table-responsive mb-4">
                        <table class="data-table">
                            <thead><tr><th>Date</th><th>Weight</th><th>Height</th><th>BMI</th><th>Body Fat</th><th>Notes</th></tr></thead>
                            <tbody>
                                ${progress.map(p => `
                                    <tr>
                                        <td>${p.recorded_date}</td>
                                        <td><strong>${p.weight_kg} kg</strong></td>
                                        <td>${p.height_cm} cm</td>
                                        <td><span class="badge badge-cyan">${p.bmi || '-'}</span></td>
                                        <td>${p.body_fat_percentage ? p.body_fat_percentage + '%' : '-'}</td>
                                        <td><small>${p.remarks || '-'}</small></td>
                                    </tr>
                                `).join('') || '<tr><td colspan="6">No biometrics recorded yet.</td></tr>'}
                            </tbody>
                        </table>
                    </div>

                    <h4 class="mb-3 text-purple"><i class="fa-solid fa-clipboard-user"></i> Recent Attendance (${attendance.length})</h4>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th></tr></thead>
                            <tbody>
                                ${attendance.map(a => `
                                    <tr>
                                        <td>${a.attendance_date}</td>
                                        <td>${a.check_in_time}</td>
                                        <td>${a.check_out_time || '<span class="badge badge-warning">Active Now</span>'}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="3">No attendance records.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            this.openModal('memberProfileModal');
        } catch (error) {
            console.error('Error fetching member profile:', error);
        }
    },

    async deleteMember(memberId, name) {
        if (!confirm(`Are you sure you want to delete member "${name}"? This will cascade and delete their memberships, attendance, payments, and biometrics.`)) return;

        try {
            const res = await fetch(`/api/members/${memberId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadMembersTable();
                this.loadDashboardData();
            } else {
                this.showToast(data.error, 'error');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 3: TRAINERS & COACHES
    // --------------------------------------------------------------------------
    async loadTrainersData() {
        try {
            const [trainersRes, assignmentsRes] = await Promise.all([
                fetch('/api/trainers').then(r => r.json()),
                fetch('/api/trainers/assignments/all').then(r => r.json())
            ]);

            // Render Trainer Cards
            const container = document.getElementById('trainerCardsContainer');
            if (trainersRes.success && container) {
                container.innerHTML = trainersRes.data.map(t => `
                    <div class="trainer-card">
                        <div>
                            <div class="trainer-header">
                                <div class="trainer-avatar">${t.trainer_name.charAt(0)}</div>
                                <span class="badge ${t.status === 'Active' ? 'badge-emerald' : 'badge-secondary'}">${t.status}</span>
                            </div>
                            <h3 style="font-size: 17px; margin-bottom: 4px;">${t.trainer_name}</h3>
                            <p class="text-cyan text-sm mb-3"><i class="fa-solid fa-award"></i> ${t.specialization}</p>
                            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                                <p><i class="fa-solid fa-briefcase"></i> <strong>${t.experience_years} years</strong> experience</p>
                                <p><i class="fa-solid fa-indian-rupee-sign"></i> <strong>₹${t.hourly_rate}</strong> / hourly session</p>
                            </div>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-top: 10px;">
                            <div style="display: flex; justify-content: space-between; font-size: 12.5px;">
                                <span class="text-muted">Active Clients:</span>
                                <strong class="text-emerald">${t.currently_active_members || 0} members</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-top: 4px;">
                                <span class="text-muted">Workouts Created:</span>
                                <strong>${t.workout_plans_authored || 0} plans</strong>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Render Assignments Table
            const tbody = document.getElementById('trainerAssignmentsTableBody');
            if (assignmentsRes.success && tbody) {
                tbody.innerHTML = assignmentsRes.data.map(a => `
                    <tr>
                        <td>#${a.assignment_id}</td>
                        <td><strong>${a.member_name}</strong><br><small class="text-muted">${a.member_phone}</small></td>
                        <td>${a.trainer_name}</td>
                        <td><small class="text-muted">${a.specialization}</small></td>
                        <td><span class="badge badge-purple">${a.session_time}</span></td>
                        <td>${a.assigned_date}</td>
                        <td><span class="badge ${a.status === 'Active' ? 'badge-emerald' : (a.status === 'Completed' ? 'badge-cyan' : 'badge-danger')}">${a.status}</span></td>
                        <td class="text-right">
                            ${a.status === 'Active' ? `
                                <button class="btn btn-sm btn-secondary" onclick="App.updateAssignmentStatus(${a.assignment_id}, 'Completed')">
                                    <i class="fa-solid fa-check"></i> Complete
                                </button>
                            ` : `<span class="text-muted text-sm">Archived</span>`}
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading trainers:', error);
        }
    },

    async updateAssignmentStatus(id, newStatus) {
        try {
            const res = await fetch(`/api/trainers/assignments/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadTrainersData();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 4: MEMBERSHIPS & PLANS
    // --------------------------------------------------------------------------
    async loadMembershipsData() {
        const filter = document.getElementById('membershipStatusFilter')?.value || 'All';
        try {
            const [plansRes, subsRes] = await Promise.all([
                fetch('/api/plans').then(r => r.json()),
                fetch(`/api/memberships?status=${encodeURIComponent(filter)}`).then(r => r.json())
            ]);

            // Plans Cards
            const container = document.getElementById('plansCardsContainer');
            if (plansRes.success && container) {
                container.innerHTML = plansRes.data.map(p => `
                    <div class="plan-card">
                        <div>
                            <div class="plan-header">
                                <span class="badge badge-emerald">${p.duration_months} Month${p.duration_months > 1 ? 's' : ''}</span>
                                <span class="badge ${p.status === 'Active' ? 'badge-cyan' : 'badge-secondary'}">${p.status}</span>
                            </div>
                            <h3 style="font-size: 18px; margin-bottom: 6px;">${p.plan_name}</h3>
                            <div class="plan-price-tag">₹${Number(p.fee).toLocaleString()} <span>/ package</span></div>
                            <p class="text-muted text-sm mb-3">${p.description || 'Standard gym equipment & facility access.'}</p>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                                <span class="text-muted">Active Subscribers:</span>
                                <strong class="text-emerald">${p.active_subscribers || 0}</strong>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Subscriptions Table
            const tbody = document.getElementById('membershipsTableBody');
            if (subsRes.success && tbody) {
                tbody.innerHTML = subsRes.data.map(s => {
                    const statusBadge = s.status === 'Active' ? 'badge-emerald' : (s.status === 'Expired' ? 'badge-danger' : 'badge-secondary');
                    return `
                        <tr>
                            <td>#${s.membership_id}</td>
                            <td><strong>${s.member_name}</strong><br><small class="text-muted">${s.member_phone}</small></td>
                            <td><span class="badge badge-purple">${s.plan_name}</span></td>
                            <td>${s.duration_months} mo</td>
                            <td>${s.start_date}</td>
                            <td>${s.end_date}</td>
                            <td>₹${Number(s.total_amount).toLocaleString()}</td>
                            <td><span class="badge ${statusBadge}">${s.status}</span></td>
                            <td class="text-right">
                                <button class="btn btn-sm btn-secondary" onclick="App.quickRenew(${s.member_id})" title="Renew Subscription">
                                    <i class="fa-solid fa-arrows-rotate"></i> Renew
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading memberships:', error);
        }
    },

    quickRenew(memberId) {
        this.populateRenewModalDropdowns();
        const sel = document.getElementById('renewMemberSelect');
        if (sel) sel.value = memberId;
        this.openModal('renewModal');
    },

    // --------------------------------------------------------------------------
    // TAB 5: ATTENDANCE TERMINAL
    // --------------------------------------------------------------------------
    async loadAttendanceData() {
        const dateFilter = document.getElementById('attendanceDateFilter')?.value;
        const url = dateFilter ? `/api/attendance?date=${encodeURIComponent(dateFilter)}` : '/api/attendance';

        try {
            const res = await fetch(url);
            const data = await res.json();
            const tbody = document.getElementById('attendanceTableBody');

            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No attendance logs found for this date.</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(a => `
                <tr>
                    <td>#${a.attendance_id}</td>
                    <td><strong>${a.member_name}</strong></td>
                    <td>${a.member_phone}</td>
                    <td>${a.attendance_date}</td>
                    <td><span class="text-emerald font-weight-bold"><i class="fa-solid fa-right-to-bracket"></i> ${a.check_in_time}</span></td>
                    <td>${a.check_out_time ? `<span class="text-cyan"><i class="fa-solid fa-right-from-bracket"></i> ${a.check_out_time}</span>` : '<span class="badge badge-warning">Currently In Gym</span>'}</td>
                    <td>${a.duration_minutes ? a.duration_minutes + ' mins' : '-'}</td>
                    <td><span class="badge ${a.check_out_time ? 'badge-secondary' : 'badge-emerald'}">${a.check_out_time ? 'Completed' : 'Working Out'}</span></td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading attendance:', error);
        }
    },

    // --------------------------------------------------------------------------
    // TAB 6: WORKOUTS & EXERCISES
    // --------------------------------------------------------------------------
    async loadWorkoutsData() {
        const muscle = document.getElementById('exerciseMuscleFilter')?.value || 'All';
        try {
            const [plansRes, exercisesRes] = await Promise.all([
                fetch('/api/workouts/plans').then(r => r.json()),
                fetch(`/api/workouts/exercises?muscle_group=${encodeURIComponent(muscle)}`).then(r => r.json())
            ]);

            // Plans Cards
            const container = document.getElementById('workoutPlansContainer');
            if (plansRes.success && container) {
                container.innerHTML = plansRes.data.map(wp => `
                    <div class="workout-card">
                        <div>
                            <div class="workout-header">
                                <span class="badge badge-emerald">${wp.goal}</span>
                                <span class="badge badge-purple">${wp.difficulty_level}</span>
                            </div>
                            <h3 style="font-size: 17px; margin-bottom: 6px;">${wp.plan_name}</h3>
                            <p class="text-muted text-sm mb-3">${wp.description || 'Structured gym exercise protocol.'}</p>
                            <p class="text-sm"><i class="fa-solid fa-user-ninja text-cyan"></i> Coach: <strong>${wp.trainer_name || 'FitTrack Team'}</strong></p>
                            <p class="text-sm"><i class="fa-regular fa-clock"></i> Duration: <strong>${wp.duration_weeks} Weeks</strong></p>
                        </div>
                        <div style="background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 8px; margin-top: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                                <span class="text-muted">Total Exercises:</span>
                                <strong class="text-cyan">${wp.exercise_count || 0} scheduled</strong>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // Exercises Table
            const tbody = document.getElementById('exercisesTableBody');
            if (exercisesRes.success && tbody) {
                tbody.innerHTML = exercisesRes.data.map(e => `
                    <tr>
                        <td>#${e.exercise_id}</td>
                        <td><strong>${e.exercise_name}</strong></td>
                        <td><span class="badge badge-cyan">${e.muscle_group}</span></td>
                        <td>${e.equipment_needed}</td>
                        <td><span class="badge ${e.difficulty_level === 'Beginner' ? 'badge-emerald' : (e.difficulty_level === 'Intermediate' ? 'badge-amber' : 'badge-danger')}">${e.difficulty_level}</span></td>
                        <td><small class="text-muted">${e.description || '-'}</small></td>
                        <td class="text-right">
                            <button class="btn btn-sm btn-danger" onclick="App.deleteExercise(${e.exercise_id})" title="Delete Exercise">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading workouts:', error);
        }
    },

    async deleteExercise(id) {
        if (!confirm('Are you sure you want to delete this exercise from the repository?')) return;
        try {
            const res = await fetch(`/api/workouts/exercises/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadWorkoutsData();
            } else {
                this.showToast(data.error, 'error');
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 7: FITNESS PROGRESS
    // --------------------------------------------------------------------------
    async loadProgressData() {
        const memberId = document.getElementById('progressMemberSelect')?.value;
        const url = memberId ? `/api/progress?member_id=${memberId}` : '/api/progress';

        try {
            const res = await fetch(url);
            const data = await res.json();
            const tbody = document.getElementById('progressTableBody');

            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">No progress entries recorded yet.</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(p => `
                <tr>
                    <td>#${p.progress_id}</td>
                    <td><strong>${p.member_name}</strong></td>
                    <td>${p.recorded_date}</td>
                    <td><strong>${p.weight_kg} kg</strong></td>
                    <td>${p.height_cm} cm</td>
                    <td><span class="badge badge-emerald" title="Calculated automatically by MySQL database trigger">${p.bmi || '-'}</span></td>
                    <td>${p.body_fat_percentage ? p.body_fat_percentage + '%' : '-'}</td>
                    <td><small>C: ${p.chest_cm || '-'} | W: ${p.waist_cm || '-'} | A: ${p.arms_cm || '-'}</small></td>
                    <td><small class="text-muted">${p.remarks || '-'}</small></td>
                    <td class="text-right">
                        <button class="btn btn-sm btn-danger" onclick="App.deleteProgress(${p.progress_id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            // If a specific member is selected, load timeline chart
            const chartCard = document.getElementById('memberProgressChartCard');
            if (memberId) {
                const chartRes = await fetch(`/api/progress/member/${memberId}/chart`).then(r => r.json());
                if (chartRes.success && chartRes.data.length > 0) {
                    chartCard.style.display = 'block';
                    const memberName = this.allMembers.find(m => m.member_id == memberId)?.full_name || 'Member';
                    FitCharts.renderMemberProgressChart(chartRes.data, memberName);
                } else {
                    chartCard.style.display = 'none';
                }
            } else {
                chartCard.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading progress:', error);
        }
    },

    async deleteProgress(id) {
        if (!confirm('Delete this progress record?')) return;
        try {
            const res = await fetch(`/api/progress/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadProgressData();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 8: EQUIPMENT INVENTORY
    // --------------------------------------------------------------------------
    async loadEquipmentData() {
        const condition = document.getElementById('equipConditionFilter')?.value || 'All';
        const category = document.getElementById('equipCategoryFilter')?.value || 'All';

        try {
            const res = await fetch(`/api/equipment?condition=${encodeURIComponent(condition)}&category=${encodeURIComponent(category)}`);
            const data = await res.json();
            const tbody = document.getElementById('equipmentTableBody');

            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No equipment found matching filter.</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(eq => {
                const badgeMap = {
                    'Operational': 'badge-emerald',
                    'Maintenance Needed': 'badge-amber',
                    'Under Repair': 'badge-danger',
                    'Decommissioned': 'badge-secondary'
                };
                return `
                    <tr>
                        <td>#${eq.equipment_id}</td>
                        <td><strong>${eq.equipment_name}</strong></td>
                        <td><span class="badge badge-cyan">${eq.category}</span></td>
                        <td>${eq.purchase_date}</td>
                        <td><span class="badge ${badgeMap[eq.condition_status]}">${eq.condition_status}</span></td>
                        <td>${eq.last_maintenance_date || '<span class="text-muted">None logged</span>'}</td>
                        <td>₹${Number(eq.cost).toLocaleString()}</td>
                        <td class="text-right">
                            <button class="btn btn-sm btn-secondary" onclick="App.toggleEquipmentMaintenance(${eq.equipment_id}, '${eq.condition_status}')">
                                <i class="fa-solid fa-screwdriver-wrench"></i> Toggle
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteEquipment(${eq.equipment_id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading equipment:', error);
        }
    },

    async toggleEquipmentMaintenance(id, currentStatus) {
        const nextStatus = currentStatus === 'Operational' ? 'Maintenance Needed' : 'Operational';
        try {
            const res = await fetch(`/api/equipment/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    condition_status: nextStatus,
                    last_maintenance_date: new Date().toISOString().slice(0, 10)
                })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(`Equipment marked as ${nextStatus}`);
                this.loadEquipmentData();
                this.loadDashboardData();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    async deleteEquipment(id) {
        if (!confirm('Remove this equipment from inventory?')) return;
        try {
            const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadEquipmentData();
                this.loadDashboardData();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 9: PAYMENTS & BILLING
    // --------------------------------------------------------------------------
    async loadPaymentsData() {
        const status = document.getElementById('paymentStatusFilter')?.value || 'All';
        const method = document.getElementById('paymentMethodFilter')?.value || 'All';

        try {
            const res = await fetch(`/api/payments?status=${encodeURIComponent(status)}&method=${encodeURIComponent(method)}`);
            const data = await res.json();
            const tbody = document.getElementById('paymentsTableBody');

            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No transactions found.</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(p => {
                const statusBadge = p.payment_status === 'Completed' ? 'badge-emerald' : (p.payment_status === 'Pending' ? 'badge-amber' : 'badge-danger');
                return `
                    <tr>
                        <td>#${p.payment_id}</td>
                        <td><code>${p.transaction_id}</code></td>
                        <td><strong>${p.member_name}</strong></td>
                        <td><span class="badge badge-purple">${p.plan_name}</span></td>
                        <td><strong>₹${Number(p.amount).toLocaleString()}</strong></td>
                        <td>${p.payment_date}</td>
                        <td><span class="badge badge-cyan">${p.payment_method}</span></td>
                        <td><span class="badge ${statusBadge}">${p.payment_status}</span></td>
                        <td class="text-right">
                            ${p.payment_status === 'Pending' ? `
                                <button class="btn btn-sm btn-primary" onclick="App.markPaymentCompleted(${p.payment_id})">
                                    <i class="fa-solid fa-check"></i> Collect
                                </button>
                            ` : `<span class="text-muted text-sm"><i class="fa-solid fa-circle-check text-success"></i> Settled</span>`}
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    },

    async markPaymentCompleted(paymentId) {
        try {
            const res = await fetch(`/api/payments/${paymentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_status: 'Completed' })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(data.message);
                this.loadPaymentsData();
                this.loadDashboardData();
            }
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    // --------------------------------------------------------------------------
    // TAB 10: ADVANCED REPORTS
    // --------------------------------------------------------------------------
    setupReportTabs() {
        document.querySelectorAll('.report-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadReport(btn.dataset.report);
            });
        });
    },

    async loadReport(reportName) {
        const container = document.getElementById('reportContainer');
        if (!container) return;
        container.innerHTML = '<div class="card p-4 text-center">Generating dynamic report from MySQL...</div>';

        try {
            if (reportName === 'revenue') {
                const res = await fetch('/api/analytics/revenue').then(r => r.json());
                if (!res.success) throw new Error(res.error);

                container.innerHTML = `
                    <div class="card mb-4">
                        <div class="card-header">
                            <div class="card-title">
                                <i class="fa-solid fa-receipt text-emerald"></i>
                                <h3>Monthly Gym Financial Collections</h3>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Month</th><th>Transactions</th><th>Net Collected</th><th>Pending</th><th>Failed</th><th>Avg Invoice</th></tr></thead>
                                    <tbody>
                                        ${res.data.monthlyBreakdown.map(r => `
                                            <tr>
                                                <td><strong>${r.period}</strong></td>
                                                <td>${r.total_invoices}</td>
                                                <td><strong class="text-emerald">₹${Number(r.net_revenue).toLocaleString()}</strong></td>
                                                <td>₹${Number(r.pending_amount).toLocaleString()}</td>
                                                <td>₹${Number(r.failed_amount).toLocaleString()}</td>
                                                <td>₹${Number(r.average_ticket_size).toLocaleString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'trainers') {
                const res = await fetch('/api/analytics/trainers').then(r => r.json());
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header"><div class="card-title"><i class="fa-solid fa-award text-cyan"></i><h3>Trainer Performance & Revenue Impact</h3></div></div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Trainer</th><th>Specialization</th><th>Hourly Rate</th><th>Active Clients</th><th>Total Trained</th><th>Routines Created</th></tr></thead>
                                    <tbody>
                                        ${res.data.map(t => `
                                            <tr>
                                                <td><strong>${t.trainer_name}</strong></td>
                                                <td>${t.specialization}</td>
                                                <td>₹${t.hourly_rate}</td>
                                                <td><span class="badge badge-emerald">${t.current_active_clients} clients</span></td>
                                                <td>${t.total_clients_trained} total</td>
                                                <td>${t.plans_designed} plans</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'popular-workouts') {
                const res = await fetch('/api/analytics/popular-workouts').then(r => r.json());
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header"><div class="card-title"><i class="fa-solid fa-dumbbell text-purple"></i><h3>Most Popular Workout Programs</h3></div></div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Program Name</th><th>Goal</th><th>Level</th><th>Duration</th><th>Designer</th><th>Total Exercises</th></tr></thead>
                                    <tbody>
                                        ${res.data.map(w => `
                                            <tr>
                                                <td><strong>${w.plan_name}</strong></td>
                                                <td><span class="badge badge-emerald">${w.goal}</span></td>
                                                <td>${w.difficulty_level}</td>
                                                <td>${w.duration_weeks} Weeks</td>
                                                <td>${w.designer_trainer || 'Gym Core'}</td>
                                                <td><strong>${w.total_exercises}</strong> exercises</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'attendance-analytics') {
                const res = await fetch('/api/analytics/attendance').then(r => r.json());
                container.innerHTML = `
                    <div class="split-grid">
                        <div class="card">
                            <div class="card-header"><div class="card-title"><h3>Member Visit Frequency Tiers</h3></div></div>
                            <div class="card-body p-0">
                                <table class="data-table">
                                    <thead><tr><th>Engagement Tier</th><th>Member Count</th></tr></thead>
                                    <tbody>
                                        ${res.data.frequencyTiers.map(t => `
                                            <tr><td><strong>${t.activity_tier}</strong></td><td><span class="badge badge-cyan">${t.member_count}</span></td></tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header"><div class="card-title"><h3>Peak Check-in Hours</h3></div></div>
                            <div class="card-body p-0">
                                <table class="data-table">
                                    <thead><tr><th>Hour of Day</th><th>Check-in Volume</th></tr></thead>
                                    <tbody>
                                        ${res.data.peakHours.map(h => `
                                            <tr><td>${h.hour_of_day}:00 - ${h.hour_of_day + 1}:00</td><td><span class="badge badge-emerald">${h.check_ins} visits</span></td></tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'pending-payments') {
                const res = await fetch('/api/analytics/pending-payments').then(r => r.json());
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header"><div class="card-title"><i class="fa-solid fa-hourglass-half text-amber"></i><h3>Pending Payment Invoices</h3></div></div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Tx ID</th><th>Member</th><th>Contact</th><th>Plan</th><th>Amount</th><th>Due Since</th></tr></thead>
                                    <tbody>
                                        ${res.data.map(p => `
                                            <tr>
                                                <td><code>${p.transaction_id}</code></td>
                                                <td><strong>${p.member_name}</strong></td>
                                                <td>${p.phone}</td>
                                                <td>${p.plan_name}</td>
                                                <td><strong class="text-amber">₹${Number(p.amount).toLocaleString()}</strong></td>
                                                <td><span class="badge badge-warning">${p.days_overdue} days</span></td>
                                            </tr>
                                        `).join('') || '<tr><td colspan="6" class="text-center">No pending payments! All accounts clear.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'progress-comparison') {
                const res = await fetch('/api/analytics/progress-comparison').then(r => r.json());
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header"><div class="card-title"><i class="fa-solid fa-chart-line text-emerald"></i><h3>Member Biometrics Progression (Baseline vs Latest Checkup)</h3></div></div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="data-table">
                                    <thead><tr><th>Member</th><th>Baseline Date</th><th>Start Weight</th><th>Current Date</th><th>Current Weight</th><th>Net Change</th><th>Outcome</th></tr></thead>
                                    <tbody>
                                        ${res.data.map(p => `
                                            <tr>
                                                <td><strong>${p.member_name}</strong></td>
                                                <td>${p.baseline_date}</td>
                                                <td>${p.baseline_weight} kg</td>
                                                <td>${p.latest_date}</td>
                                                <td><strong>${p.latest_weight} kg</strong></td>
                                                <td><strong class="${p.weight_net_change < 0 ? 'text-emerald' : 'text-cyan'}">${p.weight_net_change > 0 ? '+' : ''}${p.weight_net_change} kg</strong></td>
                                                <td><span class="badge ${p.weight_net_change < 0 ? 'badge-emerald' : 'badge-purple'}">${p.fitness_outcome}</span></td>
                                            </tr>
                                        `).join('') || '<tr><td colspan="7" class="text-center">Record at least 2 checkups for members to see comparative progression.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            } else if (reportName === 'active-inactive') {
                const res = await fetch('/api/analytics/active-vs-inactive').then(r => r.json());
                container.innerHTML = `
                    <div class="card mb-4">
                        <div class="card-header"><div class="card-title"><h3>Member Account Status Breakdown</h3></div></div>
                        <div class="card-body p-0">
                            <table class="data-table">
                                <thead><tr><th>Status</th><th>Members Count</th><th>Percentage of Base</th></tr></thead>
                                <tbody>
                                    ${res.data.summary.map(s => `
                                        <tr><td><strong>${s.status}</strong></td><td>${s.count}</td><td><span class="badge badge-cyan">${s.percentage}%</span></td></tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            container.innerHTML = `<div class="card p-4 text-danger">Failed to generate report: ${error.message}</div>`;
        }
    },

    // --------------------------------------------------------------------------
    // TAB 11: DBMS SHOWCASE & SQL CONSOLE
    // --------------------------------------------------------------------------
    initDBMSShowcase() {
        this.fetchDBMSDemosCatalog();
        this.fetchSchemaConstraints();

        // Concept Buttons
        document.querySelectorAll('.concept-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.concept-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectDBMSConcept(btn.dataset.concept);
            });
        });

        // Run Preset Button
        document.getElementById('runPresetSqlBtn')?.addEventListener('click', () => {
            const activeBtn = document.querySelector('.concept-btn.active');
            if (activeBtn) this.executeDBMSQuery(activeBtn.dataset.concept);
        });

        // Custom Query Button
        document.getElementById('executeCustomSqlBtn')?.addEventListener('click', () => {
            const sql = document.getElementById('customSqlInput')?.value;
            if (sql) this.executeCustomSQL(sql);
        });

        // Auto-run first concept (Joins)
        this.selectDBMSConcept('joins');
        this.executeDBMSQuery('joins');
    },

    async fetchDBMSDemosCatalog() {
        try {
            const res = await fetch('/api/dbms-demo/catalog');
            const data = await res.json();
            if (data.success) {
                this.dbmsCatalog = data.data;
            }
        } catch (e) {
            console.error(e);
        }
    },

    selectDBMSConcept(key) {
        if (!this.dbmsCatalog || !this.dbmsCatalog[key]) return;
        const concept = this.dbmsCatalog[key];
        document.getElementById('sqlBoxTitle').textContent = `${concept.title} - ${concept.description}`;
        document.getElementById('sqlCodeDisplay').textContent = concept.sql;
    },

    async executeDBMSQuery(key) {
        try {
            document.getElementById('sqlResultTbody').innerHTML = '<tr><td class="text-center">Executing on MySQL 8 engine...</td></tr>';
            const res = await fetch('/api/dbms-demo/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            this.renderSQLResultTable(data);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    async executeCustomSQL(sql) {
        try {
            document.getElementById('sqlResultTbody').innerHTML = '<tr><td class="text-center">Executing custom query...</td></tr>';
            const res = await fetch('/api/dbms-demo/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customQuery: sql })
            });
            const data = await res.json();
            this.renderSQLResultTable(data);
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    },

    renderSQLResultTable(res) {
        if (!res.success) {
            document.getElementById('sqlResultThead').innerHTML = '';
            document.getElementById('sqlResultTbody').innerHTML = `<tr><td class="text-danger p-4">SQL Error: ${res.error}</td></tr>`;
            return;
        }

        document.getElementById('sqlExecutionTime').textContent = res.executionTimeMs;
        document.getElementById('sqlRowCount').textContent = `${res.rowCount} rows`;

        const thead = document.getElementById('sqlResultThead');
        const tbody = document.getElementById('sqlResultTbody');

        if (res.columns.length === 0 || res.data.length === 0) {
            thead.innerHTML = '';
            tbody.innerHTML = '<tr><td class="text-center p-3 text-muted">Query executed successfully with 0 rows returned.</td></tr>';
            return;
        }

        thead.innerHTML = `<tr>${res.columns.map(col => `<th>${col}</th>`).join('')}</tr>`;
        tbody.innerHTML = res.data.map(row => `
            <tr>${res.columns.map(col => `<td>${row[col] !== null ? row[col] : '<span class="text-muted">NULL</span>'}</td>`).join('')}</tr>
        `).join('');
    },

    async fetchSchemaConstraints() {
        try {
            const res = await fetch('/api/dbms-demo/schema');
            const data = await res.json();
            const container = document.getElementById('schemaMetadataDisplay');
            if (data.success && container) {
                const s = data.data;
                container.innerHTML = `
                    <div class="mb-3">
                        <strong class="text-cyan">Base Tables (${s.tables.length})</strong>
                        ${s.tables.map(t => `
                            <div class="schema-row">
                                <span><i class="fa-solid fa-table"></i> ${t.TABLE_NAME}</span>
                                <span class="badge badge-secondary">${t.TABLE_ROWS} rows</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="mb-3">
                        <strong class="text-emerald">Foreign Key Constraints (${s.foreignKeys.length})</strong>
                        ${s.foreignKeys.map(fk => `
                            <div class="schema-row">
                                <span>${fk.TABLE_NAME}.${fk.COLUMN_NAME}</span>
                                <span class="text-muted">&rarr; ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="mb-3">
                        <strong class="text-amber">Active Database Triggers (${s.triggers.length})</strong>
                        ${s.triggers.map(trg => `
                            <div class="schema-row">
                                <span><i class="fa-solid fa-bolt"></i> ${trg.TRIGGER_NAME}</span>
                                <span class="badge badge-amber">${trg.ACTION_TIMING} ${trg.EVENT_MANIPULATION} on ${trg.EVENT_OBJECT_TABLE}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (e) {
            console.error('Schema metadata error:', e);
        }
    },

    // --------------------------------------------------------------------------
    // DROPDOWNS & FORMS SETUP
    // --------------------------------------------------------------------------
    async loadMembersDropdownData() {
        try {
            const [membersRes, plansRes, trainersRes] = await Promise.all([
                fetch('/api/members').then(r => r.json()),
                fetch('/api/plans').then(r => r.json()),
                fetch('/api/trainers').then(r => r.json())
            ]);

            if (membersRes.success) {
                this.allMembers = membersRes.data;
                this.populateDropdown('quickAttendanceMemberSelect', this.allMembers, 'member_id', 'full_name');
                this.populateDropdown('progressMemberSelect', this.allMembers, 'member_id', 'full_name');
            }

            if (plansRes.success) {
                this.allPlans = plansRes.data;
                this.populateDropdown('registerMemberPlanSelect', this.allPlans, 'plan_id', 'plan_name', 'fee');
            }

            if (trainersRes.success) {
                this.allTrainers = trainersRes.data;
            }
        } catch (e) {
            console.error(e);
        }
    },

    populateDropdown(id, items, valKey, labelKey, priceKey) {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = `<option value="">-- Choose Option --</option>` + items.map(i => {
            const priceText = priceKey && i[priceKey] ? ` (₹${Number(i[priceKey]).toLocaleString()})` : '';
            return `<option value="${i[valKey]}">${i[labelKey]}${priceText}</option>`;
        }).join('');
    },

    populateAssignModalDropdowns() {
        this.populateDropdown('assignModalMemberSelect', this.allMembers, 'member_id', 'full_name');
        this.populateDropdown('assignModalTrainerSelect', this.allTrainers, 'trainer_id', 'trainer_name');
    },

    populateRenewModalDropdowns() {
        this.populateDropdown('renewMemberSelect', this.allMembers, 'member_id', 'full_name');
        this.populateDropdown('renewPlanSelect', this.allPlans, 'plan_id', 'plan_name', 'fee');
    },

    populateProgressModalDropdowns() {
        this.populateDropdown('progressModalMemberSelect', this.allMembers, 'member_id', 'full_name');
        const dt = document.getElementById('progressDateInput');
        if (dt) dt.value = new Date().toISOString().slice(0, 10);
    },

    // --------------------------------------------------------------------------
    // FORM SUBMISSIONS & EVENT LISTENERS
    // --------------------------------------------------------------------------
    setupEventHandlers() {
        // Quick Attendance Check-in form
        document.getElementById('quickAttendanceForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberId = document.getElementById('quickAttendanceMemberSelect').value;
            const resultBox = document.getElementById('quickAttendanceResult');
            try {
                const res = await fetch('/api/attendance/quick-toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ member_id: memberId })
                });
                const data = await res.json();
                if (data.success) {
                    resultBox.innerHTML = `<div class="badge badge-emerald" style="font-size: 13px; padding: 8px 14px;"><i class="fa-solid fa-circle-check"></i> ${data.message} (${data.action})</div>`;
                    this.showToast(data.message);
                    this.loadDashboardData();
                } else {
                    resultBox.innerHTML = `<div class="badge badge-danger" style="font-size: 13px; padding: 8px 14px;"><i class="fa-solid fa-triangle-exclamation"></i> ${data.error}</div>`;
                }
            } catch (err) {
                resultBox.innerHTML = `<div class="badge badge-danger">${err.message}</div>`;
            }
        });

        // Add Member Form
        document.getElementById('addMemberForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());

            try {
                const res = await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('addMemberModal');
                    e.target.reset();
                    this.loadMembersDropdownData();
                    this.loadMembersTable();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Add Trainer Form
        document.getElementById('addTrainerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/trainers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('addTrainerModal');
                    e.target.reset();
                    this.loadTrainersData();
                    this.loadMembersDropdownData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Assign Trainer Form
        document.getElementById('assignTrainerForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/trainers/assign', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('assignTrainerModal');
                    e.target.reset();
                    this.loadTrainersData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Add Plan Form
        document.getElementById('addPlanForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('addPlanModal');
                    e.target.reset();
                    this.loadMembershipsData();
                    this.loadMembersDropdownData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Renew Membership Form (Stored Procedure)
        document.getElementById('renewMembershipForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/memberships/renew', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('renewModal');
                    e.target.reset();
                    this.loadMembershipsData();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Log Progress Form
        document.getElementById('logProgressForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('logProgressModal');
                    e.target.reset();
                    this.loadProgressData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Add Exercise Form
        document.getElementById('addExerciseForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/workouts/exercises', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('addExerciseModal');
                    e.target.reset();
                    this.loadWorkoutsData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Add Equipment Form
        document.getElementById('addEquipmentForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/equipment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('addEquipmentModal');
                    e.target.reset();
                    this.loadEquipmentData();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Create Workout Plan Form
        document.getElementById('createWorkoutPlanForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/workouts/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('createWorkoutPlanModal');
                    e.target.reset();
                    this.loadWorkoutsData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Manual Attendance Form
        document.getElementById('manualAttendanceForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = Object.fromEntries(new FormData(e.target).entries());
            try {
                const res = await fetch('/api/attendance/manual', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(data.message);
                    this.closeModal('manualAttendanceModal');
                    e.target.reset();
                    this.loadAttendanceData();
                    this.loadDashboardData();
                } else {
                    this.showToast(data.error, 'error');
                }
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        // Filters listeners
        document.getElementById('memberSearchInput')?.addEventListener('input', () => this.loadMembersTable());
        document.getElementById('memberStatusFilter')?.addEventListener('change', () => this.loadMembersTable());
        document.getElementById('membershipStatusFilter')?.addEventListener('change', () => this.loadMembershipsData());
        document.getElementById('attendanceDateFilter')?.addEventListener('change', () => this.loadAttendanceData());
        document.getElementById('resetAttendanceDateBtn')?.addEventListener('click', () => {
            document.getElementById('attendanceDateFilter').value = '';
            this.loadAttendanceData();
        });
        document.getElementById('exerciseMuscleFilter')?.addEventListener('change', () => this.loadWorkoutsData());
        document.getElementById('progressMemberSelect')?.addEventListener('change', () => this.loadProgressData());
        document.getElementById('equipConditionFilter')?.addEventListener('change', () => this.loadEquipmentData());
        document.getElementById('equipCategoryFilter')?.addEventListener('change', () => this.loadEquipmentData());
        document.getElementById('paymentStatusFilter')?.addEventListener('change', () => this.loadPaymentsData());
        document.getElementById('paymentMethodFilter')?.addEventListener('change', () => this.loadPaymentsData());

        this.setupReportTabs();
    }
};

// Initialize App on DOM Ready
document.addEventListener('DOMContentLoaded', () => App.init());
