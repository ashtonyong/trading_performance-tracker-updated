export class ChartManager {
    constructor() {
        this.performanceChart = null;
        this.distributionChart = null;
        this.initCharts();
    }

    initCharts() {
        this.createPerformanceChart();
        this.createDistributionChart();
    }

    createPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        this.performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Cumulative P&L',
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#1e293b',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#475569',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `P&L: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#334155',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: '#334155',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#3b82f6'
                    }
                }
            }
        });
    }

    createDistributionChart() {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        this.distributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Winning Trades', 'Losing Trades'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#059669', '#dc2626'],
                    borderColor: ['#047857', '#b91c1c'],
                    borderWidth: 2,
                    hoverBackgroundColor: ['#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#475569',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updatePerformanceChart(trades) {
        if (trades.length === 0) {
            this.performanceChart.data.labels = [];
            this.performanceChart.data.datasets[0].data = [];
            this.performanceChart.update();
            return;
        }

        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate cumulative P&L
        let cumulativePnL = 0;
        const chartData = sortedTrades.map(trade => {
            cumulativePnL += trade.pnl;
            return {
                x: this.formatChartDate(trade.date),
                y: cumulativePnL
            };
        });

        this.performanceChart.data.labels = chartData.map(point => point.x);
        this.performanceChart.data.datasets[0].data = chartData.map(point => point.y);
        
        // Update line color based on final P&L
        const finalPnL = chartData[chartData.length - 1]?.y || 0;
        const lineColor = finalPnL >= 0 ? '#059669' : '#dc2626';
        const fillColor = finalPnL >= 0 ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)';
        
        this.performanceChart.data.datasets[0].borderColor = lineColor;
        this.performanceChart.data.datasets[0].backgroundColor = fillColor;
        this.performanceChart.data.datasets[0].pointBackgroundColor = lineColor;
        
        this.performanceChart.update();
    }

    updateDistributionChart(trades) {
        const winningTrades = trades.filter(trade => trade.pnl > 0).length;
        const losingTrades = trades.filter(trade => trade.pnl <= 0).length;
        
        this.distributionChart.data.datasets[0].data = [winningTrades, losingTrades];
        this.distributionChart.update();
    }

    formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    destroy() {
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
        if (this.distributionChart) {
            this.distributionChart.destroy();
        }
    }

    // Method to create additional chart types for future enhancements
    createSymbolPerformanceChart(symbolData) {
        // Future implementation for symbol-specific performance charts
        console.log('Symbol performance chart data:', symbolData);
    }

    createMonthlyPerformanceChart(monthlyData) {
        // Future implementation for monthly performance breakdown
        console.log('Monthly performance chart data:', monthlyData);
    }
}