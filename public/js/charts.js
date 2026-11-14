// ==============================================================================
// FitTrack - Chart.js Visualizations & Dashboard Analytics
// ==============================================================================

const FitCharts = {
    revenueChartInstance: null,
    planChartInstance: null,
    attendanceChartInstance: null,
    equipmentChartInstance: null,
    memberProgressionInstance: null,

    // Common Chart.js dark theme options
    commonOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#94a3b8',
                    font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 }
                }
            },
            tooltip: {
                backgroundColor: '#141c2e',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: '#23304b',
                borderWidth: 1,
                padding: 10,
                boxPadding: 4,
                usePointStyle: true
            }
        }
    },

    // 1. Render Monthly Revenue Trends
    renderRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        if (this.revenueChartInstance) {
            this.revenueChartInstance.destroy();
        }

        const labels = data.map(item => item.revenue_month);
        const collected = data.map(item => Number(item.total_collected));
        const pending = data.map(item => Number(item.total_pending));

        this.revenueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Collected Revenue (₹)',
                        data: collected,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Pending Invoices (₹)',
                        data: pending,
                        backgroundColor: 'rgba(245, 158, 11, 0.75)',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...this.commonOptions,
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#64748b',
                            callback: value => '₹' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    },

    // 2. Render Membership Plan Popularity
    renderPlanChart(data) {
        const ctx = document.getElementById('planChart');
        if (!ctx) return;

        if (this.planChartInstance) {
            this.planChartInstance.destroy();
        }

        const labels = data.map(item => item.plan_name);
        const counts = data.map(item => Number(item.subscription_count));

        const palette = [
            '#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#3b82f6', '#ec4899'
        ];

        this.planChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: palette.slice(0, labels.length),
                    borderColor: '#141c2e',
                    borderWidth: 3
                }]
            },
            options: {
                ...this.commonOptions,
                cutout: '70%',
                plugins: {
                    ...this.commonOptions.plugins,
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { size: 11, weight: 600 } }
                    }
                }
            }
        });
    },

    // 3. Render 7-Day Attendance Trends
    renderAttendanceChart(data) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        if (this.attendanceChartInstance) {
            this.attendanceChartInstance.destroy();
        }

        const labels = data.map(item => item.label);
        const visits = data.map(item => Number(item.visits));

        this.attendanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Gym Visits',
                    data: visits,
                    borderColor: '#c084fc',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#c084fc',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                ...this.commonOptions,
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b', stepSize: 1 }
                    }
                }
            }
        });
    },

    // 4. Render Equipment Status
    renderEquipmentChart(data) {
        const ctx = document.getElementById('equipmentChart');
        if (!ctx) return;

        if (this.equipmentChartInstance) {
            this.equipmentChartInstance.destroy();
        }

        const labels = data.map(item => item.condition_status);
        const counts = data.map(item => Number(item.count));

        const colorMap = {
            'Operational': '#10b981',
            'Maintenance Needed': '#f59e0b',
            'Under Repair': '#ef4444',
            'Decommissioned': '#64748b'
        };

        const bgColors = labels.map(status => colorMap[status] || '#3b82f6');

        this.equipmentChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: bgColors,
                    borderColor: '#141c2e',
                    borderWidth: 3
                }]
            },
            options: {
                ...this.commonOptions,
                cutout: '70%',
                plugins: {
                    ...this.commonOptions.plugins,
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { size: 11, weight: 600 } }
                    }
                }
            }
        });
    },

    // 5. Render Member Fitness Progress Timeline (Weight & BMI Progression)
    renderMemberProgressChart(data, memberName) {
        const ctx = document.getElementById('memberProgressionChart');
        if (!ctx) return;

        if (this.memberProgressionInstance) {
            this.memberProgressionInstance.destroy();
        }

        const labels = data.map(item => {
            const d = new Date(item.recorded_date);
            return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
        });
        const weights = data.map(item => Number(item.weight_kg));
        const bmis = data.map(item => Number(item.bmi));

        this.memberProgressionInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: weights,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        tension: 0.3,
                        yAxisID: 'yWeight',
                        pointRadius: 5
                    },
                    {
                        label: 'BMI (kg/m²)',
                        data: bmis,
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        borderWidth: 3,
                        tension: 0.3,
                        yAxisID: 'yBMI',
                        pointRadius: 5
                    }
                ]
            },
            options: {
                ...this.commonOptions,
                plugins: {
                    ...this.commonOptions.plugins,
                    title: {
                        display: true,
                        text: `Fitness Progression for ${memberName}`,
                        color: '#f8fafc',
                        font: { family: 'Plus Jakarta Sans', size: 14, weight: 700 }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    yWeight: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Weight (kg)', color: '#10b981' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#10b981' }
                    },
                    yBMI: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'BMI (kg/m²)', color: '#06b6d4' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#06b6d4' }
                    }
                }
            }
        });
    }
};
